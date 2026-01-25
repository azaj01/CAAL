# CAAL Multilingual Support (i18n)

## What This Is

Adding full multilingual support to CAAL voice assistant. A global language setting controls the entire experience: UI, agent responses, speech-to-text, and text-to-speech. The first supported languages are English (reference) and French (complete implementation).

## Core Value

A French-speaking user can interact with CAAL entirely in French — from the setup wizard to voice conversations — with no English friction.

## Requirements

### Validated

<!-- Existing CAAL capabilities (from codebase) -->

- ✓ Voice assistant with LiveKit WebRTC — existing
- ✓ Multi-provider LLM (Ollama, Groq) — existing
- ✓ Multi-provider STT (Speaches/Whisper, Groq) — existing
- ✓ Multi-provider TTS (Kokoro, Piper) — existing
- ✓ Tool integrations (n8n, Home Assistant, web search) — existing
- ✓ Settings-driven configuration with JSON persistence — existing
- ✓ Next.js frontend with setup wizard — existing
- ✓ Flutter mobile app — existing

### Active

<!-- i18n milestone scope -->

- [ ] Global language setting in settings.json
- [ ] Frontend i18n infrastructure (next-intl)
- [ ] Frontend EN translations (reference)
- [ ] Frontend FR translations (complete)
- [ ] Mobile i18n infrastructure (Flutter intl)
- [ ] Mobile EN translations
- [ ] Mobile FR translations
- [ ] Agent prompt files per language (prompt/default_en.md, prompt/default_fr.md)
- [ ] STT language configuration (Whisper language parameter)
- [ ] TTS voice mapping per language (FR voices for Kokoro/Piper)
- [ ] Agent reformulates tool responses in configured language
- [ ] Language selector in settings panel
- [ ] Contributor documentation for adding new languages

### Out of Scope

- Auto-detection from browser/system — explicit setting preferred for voice assistant
- Real-time language switching mid-conversation — requires session restart
- Translation of n8n workflow names/descriptions — kept as-is
- Home Assistant entity names translation — kept as-is
- More than EN/FR in this milestone — infrastructure supports it, content later

## Context

**Existing architecture supports this well:**
- Settings system already handles runtime configuration
- Provider pattern allows language-specific voice selection
- Prompt system already has default/custom split
- Whisper natively supports French transcription

**Technical considerations:**
- Kokoro TTS French voice availability needs verification
- Piper has French voices (speaches-ai/piper-fr_FR-*)
- next-intl works well with Next.js 15 App Router
- Flutter has built-in intl support

**Contribution target:**
- PR to CoreWorxLab/CAAL main repository
- Must maintain backward compatibility (EN default)

## Constraints

- **Compatibility**: Must not break existing EN-only installations
- **Default**: English remains default language for new installations
- **Tech stack**: Use next-intl for frontend (not react-i18next)
- **File structure**: Prompt files named `prompt/default_{lang}.md`

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Global language setting | Simpler UX than separate UI/voice settings | — Pending |
| Separate prompt files per language | Allows full localization including personality | — Pending |
| next-intl for frontend | Best App Router integration, popular | — Pending |
| Agent reformulates tool responses | Better UX than mixed-language responses | — Pending |

---
*Last updated: 2026-01-25 after initialization*
