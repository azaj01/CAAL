'use client';

import { useEffect, useState } from 'react';
import { RoomEvent } from 'livekit-client';
import { useRoomContext } from '@livekit/components-react';

export type WakeWordState = 'listening' | 'active' | null;

/**
 * Hook to track server-side wake word detection state.
 * Listens for data packets with topic "wakeword_state" from the backend.
 *
 * States:
 * - 'listening': Agent is waiting for wake word
 * - 'active': Wake word detected, agent is processing conversation
 * - null: Wake word detection is disabled or state unknown
 */
export function useWakeWordState() {
  const room = useRoomContext();
  const [state, setState] = useState<WakeWordState>(null);

  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (
      payload: Uint8Array,
      participant: unknown,
      kind: unknown,
      topic?: string
    ) => {
      // Only handle wakeword_state messages
      if (topic !== 'wakeword_state') return;

      try {
        const decoder = new TextDecoder();
        const data = JSON.parse(decoder.decode(payload));

        if (data.type === 'wakeword_state' && data.state) {
          setState(data.state as WakeWordState);
        }
      } catch (error) {
        console.error('[useWakeWordState] Failed to parse wake word state:', error);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);

  return state;
}
