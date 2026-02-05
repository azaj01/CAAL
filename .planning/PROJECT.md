# CAAL (Cal AI Assistant for LiveKit)

## What This Is

CAAL is a local-first voice assistant built on LiveKit Agents with n8n workflow integrations and Home Assistant control. It supports multiple deployment modes (GPU, CPU, Apple Silicon) and is multilingual (English, French, Italian).

## Core Value

Users can have natural voice conversations with an AI assistant that controls their smart home and executes custom workflows — all running locally for privacy.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Voice conversation via LiveKit WebRTC — v1.0
- ✓ Multiple LLM providers (Ollama, Groq) — v1.0
- ✓ Multiple TTS providers (Kokoro, Piper) — v1.0
- ✓ Multiple STT providers (Speaches, Groq Whisper) — v1.0
- ✓ Home Assistant integration — v1.0
- ✓ n8n MCP workflow integration — v1.0
- ✓ Wake word detection (OpenWakeWord) — v1.0
- ✓ Web UI with settings panel — v1.0
- ✓ Mobile app (Flutter) — v1.0
- ✓ Multilingual support (EN, FR, IT) — v1.0
- ✓ Tool Registry with i18n — v1.1

### Active

<!-- Current scope. Building toward these. -->

- [ ] OpenAI-compatible LLM provider (LM Studio, vLLM, LocalAI, etc.)
- [ ] OpenRouter LLM provider with model discovery
- [ ] Settings panel updates for new providers
- [ ] Setup wizard integration for new providers

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Real-time video processing — complexity, not core to voice assistant
- Mobile-only features — web-first approach

## Context

**Architecture:**
- Frontend: Next.js 15, React 19, TailwindCSS
- Agent: Python with LiveKit Agents SDK
- LLM abstraction: `src/caal/llm/providers/` with base class pattern
- Settings: JSON persistence with hot-reload

**Existing providers pattern:**
- `OllamaProvider` — local inference
- `GroqProvider` — cloud API with model listing

## Constraints

- **Tech stack**: Must use existing provider abstraction pattern in `src/caal/llm/providers/`
- **API compatibility**: New providers must implement `LLMProvider` base class
- **UI consistency**: Settings panel follows existing Ollama/Groq pattern

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Provider abstraction pattern | Enables swappable LLM backends | ✓ Good |
| Settings in JSON not .env | Runtime configurable via UI | ✓ Good |
| Separate OpenRouter provider | Specific model discovery API | — Pending |

---
*Last updated: 2025-02-05 after milestone v1.2 initialization*
