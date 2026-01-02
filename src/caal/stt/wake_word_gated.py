"""Wake word gated STT wrapper using OpenWakeWord."""

from __future__ import annotations

import asyncio
import logging
import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from enum import Enum
from typing import Any

import numpy as np
from livekit import rtc
from livekit.agents.stt import (
    RecognizeStream,
    SpeechEvent,
    SpeechEventType,
    STT,
    STTCapabilities,
)
from livekit.agents.types import (
    DEFAULT_API_CONNECT_OPTIONS,
    NOT_GIVEN,
    APIConnectOptions,
    NotGivenOr,
)
from livekit.agents.utils import AudioBuffer, aio
from openwakeword.model import Model as OWWModel

logger = logging.getLogger(__name__)


class WakeWordState(str, Enum):
    """State of wake word detection."""

    LISTENING = "listening"
    ACTIVE = "active"


@dataclass
class WakeWordEvent:
    """Event emitted when wake word state changes."""

    state: WakeWordState
    model_name: str | None = None
    score: float | None = None


class WakeWordGatedSTT(STT):
    """STT wrapper that gates audio through OpenWakeWord detection.

    Audio is only forwarded to the inner STT when the wake word is detected.
    After a configurable silence timeout, returns to wake word listening mode.
    """

    def __init__(
        self,
        *,
        inner_stt: STT,
        model_path: str,
        threshold: float = 0.5,
        silence_timeout: float = 3.0,
        on_wake_detected: Callable[[], Awaitable[None]] | None = None,
        on_state_changed: Callable[[WakeWordState], Awaitable[None]] | None = None,
    ) -> None:
        """Initialize the wake word gated STT.

        Args:
            inner_stt: The actual STT to forward audio to after wake word detection.
            model_path: Path to the OpenWakeWord .onnx model file.
            threshold: Wake word detection threshold (0-1). Higher = more strict.
            silence_timeout: Seconds of silence before returning to listening mode.
            on_wake_detected: Callback when wake word is detected (e.g., trigger greeting).
            on_state_changed: Callback when state changes (for publishing to clients).
        """
        super().__init__(capabilities=inner_stt.capabilities)
        self._inner = inner_stt
        self._model_path = model_path
        self._threshold = threshold
        self._silence_timeout = silence_timeout
        self._on_wake_detected = on_wake_detected
        self._on_state_changed = on_state_changed
        self._oww: OWWModel | None = None

    @property
    def model(self) -> str:
        return self._inner.model

    @property
    def provider(self) -> str:
        return self._inner.provider

    def _ensure_model(self) -> OWWModel:
        """Lazy-load the OpenWakeWord model."""
        if self._oww is None:
            logger.info(f"Loading OpenWakeWord model from {self._model_path}")
            self._oww = OWWModel(wakeword_models=[self._model_path])
            logger.info("OpenWakeWord model loaded")
        return self._oww

    async def _recognize_impl(
        self,
        buffer: AudioBuffer,
        *,
        language: NotGivenOr[str] = NOT_GIVEN,
        conn_options: APIConnectOptions,
    ) -> SpeechEvent:
        # For non-streaming recognition, just pass through
        # Wake word gating only makes sense for streaming
        return await self._inner.recognize(
            buffer, language=language, conn_options=conn_options
        )

    def stream(
        self,
        *,
        language: NotGivenOr[str] = NOT_GIVEN,
        conn_options: APIConnectOptions = DEFAULT_API_CONNECT_OPTIONS,
    ) -> RecognizeStream:
        return WakeWordGatedStream(
            stt=self,
            inner_stt=self._inner,
            oww=self._ensure_model(),
            threshold=self._threshold,
            silence_timeout=self._silence_timeout,
            on_wake_detected=self._on_wake_detected,
            on_state_changed=self._on_state_changed,
            language=language,
            conn_options=conn_options,
        )

    async def aclose(self) -> None:
        await self._inner.aclose()


class WakeWordGatedStream(RecognizeStream):
    """Streaming STT that gates audio through wake word detection."""

    # OpenWakeWord expects 16kHz mono audio, 80ms chunks (1280 samples)
    OWW_SAMPLE_RATE = 16000
    OWW_CHUNK_SAMPLES = 1280  # 80ms at 16kHz

    def __init__(
        self,
        stt: WakeWordGatedSTT,
        *,
        inner_stt: STT,
        oww: OWWModel,
        threshold: float,
        silence_timeout: float,
        on_wake_detected: Callable[[], Awaitable[None]] | None,
        on_state_changed: Callable[[WakeWordState], Awaitable[None]] | None,
        language: NotGivenOr[str],
        conn_options: APIConnectOptions,
    ) -> None:
        # Request 16kHz resampling for OpenWakeWord
        super().__init__(
            stt=stt,
            conn_options=conn_options,
            sample_rate=self.OWW_SAMPLE_RATE,
        )
        self._inner_stt = inner_stt
        self._oww = oww
        self._threshold = threshold
        self._silence_timeout = silence_timeout
        self._on_wake_detected = on_wake_detected
        self._on_state_changed = on_state_changed
        self._language = language

        self._state = WakeWordState.LISTENING
        self._audio_buffer: list[np.ndarray] = []
        self._last_speech_time: float = 0.0

    async def _set_state(self, state: WakeWordState) -> None:
        """Update state and notify callback."""
        if self._state != state:
            self._state = state
            logger.debug(f"Wake word state changed to: {state.value}")
            if self._on_state_changed:
                try:
                    await self._on_state_changed(state)
                except Exception as e:
                    logger.warning(f"Error in on_state_changed callback: {e}")

    async def _run(self) -> None:
        """Main processing loop."""
        inner_stream: RecognizeStream | None = None
        forward_task: asyncio.Task[None] | None = None

        async def _forward_to_inner() -> None:
            """Forward audio frames to inner STT when active."""
            nonlocal inner_stream
            assert inner_stream is not None

            async for data in self._input_ch:
                if isinstance(data, self._FlushSentinel):
                    inner_stream.flush()
                    continue

                frame: rtc.AudioFrame = data

                # Check for wake word or process active conversation
                if self._state == WakeWordState.LISTENING:
                    await self._process_wake_word(frame)
                else:
                    # Active mode - forward to inner STT
                    inner_stream.push_frame(frame)
                    self._last_speech_time = time.time()

            inner_stream.end_input()

        async def _read_inner_events() -> None:
            """Read events from inner STT and forward them."""
            nonlocal inner_stream
            assert inner_stream is not None

            async for event in inner_stream:
                self._event_ch.send_nowait(event)

                # Check for end of speech to potentially return to listening
                if event.type == SpeechEventType.FINAL_TRANSCRIPT:
                    # After final transcript, check if we should return to listening
                    # This happens after the timeout in _monitor_silence
                    pass

        async def _monitor_silence() -> None:
            """Monitor for silence timeout to return to listening mode."""
            while True:
                await asyncio.sleep(0.5)  # Check every 500ms

                if self._state == WakeWordState.ACTIVE:
                    elapsed = time.time() - self._last_speech_time
                    if elapsed >= self._silence_timeout:
                        logger.debug(
                            f"Silence timeout ({self._silence_timeout}s), "
                            "returning to wake word listening"
                        )
                        await self._set_state(WakeWordState.LISTENING)
                        # Reset OpenWakeWord model state for fresh detection
                        self._oww.reset()

        # Create inner stream
        inner_stream = self._inner_stt.stream(
            language=self._language,
            conn_options=self._conn_options,
        )

        # Set initial state
        await self._set_state(WakeWordState.LISTENING)

        tasks = [
            asyncio.create_task(_forward_to_inner(), name="forward_to_inner"),
            asyncio.create_task(_read_inner_events(), name="read_inner_events"),
            asyncio.create_task(_monitor_silence(), name="monitor_silence"),
        ]

        try:
            await asyncio.gather(*tasks)
        finally:
            await aio.cancel_and_wait(*tasks)
            if inner_stream:
                await inner_stream.aclose()

    async def _process_wake_word(self, frame: rtc.AudioFrame) -> None:
        """Process audio frame for wake word detection."""
        # Convert frame to numpy array (int16)
        audio_data = np.frombuffer(frame.data, dtype=np.int16)

        # Handle multi-channel by taking first channel
        if frame.num_channels > 1:
            audio_data = audio_data[::frame.num_channels]

        # Accumulate audio until we have enough for OpenWakeWord
        self._audio_buffer.append(audio_data)
        total_samples = sum(len(chunk) for chunk in self._audio_buffer)

        # Process when we have enough samples (80ms chunks)
        while total_samples >= self.OWW_CHUNK_SAMPLES:
            # Concatenate and take exactly what we need
            combined = np.concatenate(self._audio_buffer)
            chunk = combined[: self.OWW_CHUNK_SAMPLES]

            # Keep remainder for next iteration
            remainder = combined[self.OWW_CHUNK_SAMPLES :]
            self._audio_buffer = [remainder] if len(remainder) > 0 else []
            total_samples = len(remainder)

            # Run wake word detection
            predictions = self._oww.predict(chunk)

            for model_name, score in predictions.items():
                if score >= self._threshold:
                    logger.info(
                        f"Wake word detected! model={model_name}, score={score:.3f}"
                    )

                    # Switch to active mode
                    await self._set_state(WakeWordState.ACTIVE)
                    self._last_speech_time = time.time()

                    # Trigger wake callback (e.g., greeting)
                    if self._on_wake_detected:
                        try:
                            await self._on_wake_detected()
                        except Exception as e:
                            logger.warning(f"Error in on_wake_detected callback: {e}")

                    # Emit start of speech event
                    self._event_ch.send_nowait(
                        SpeechEvent(type=SpeechEventType.START_OF_SPEECH)
                    )

                    return
