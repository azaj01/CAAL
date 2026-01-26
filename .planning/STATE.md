# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-25)

**Core value:** A French-speaking user can interact with CAAL entirely in French with no English friction
**Current focus:** All phases complete

## Current Position

Phase: 4 of 4 (Voice Pipeline)
Plan: 2 of 2 in current phase
Status: Complete
Last activity: 2026-01-26 - Completed 04-02-PLAN.md

Progress: [##########] 100% (7/7 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 7
- Average duration: 4.9 min
- Total execution time: 34 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 1/1 | 4 min | 4 min |
| 2. Frontend i18n | 2/2 | 10 min | 5 min |
| 3. Mobile i18n | 2/2 | 13 min | 6.5 min |
| 4. Voice Pipeline | 2/2 | 7 min | 3.5 min |

**Recent Trend:**
- Last 5 plans: 6 min, 6 min, 7 min, 4 min, 3 min
- Trend: Accelerating toward end

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
All decisions from project execution:

- Global language setting (single setting controls all components)
- Piper TTS for French (Kokoro has limited French support)
- next-intl for frontend (best App Router integration)
- Language uses ISO 639-1 codes ("en", "fr") - from 01-01
- Language field in SetupCompleteRequest is optional for backward compatibility - from 01-01
- Cookie-based locale (CAAL_LOCALE) instead of URL routing - from 02-01
- English messages as base with locale overlay for fallback - from 02-01
- Technical terms stay in English: Ollama, Groq, Kokoro, Piper, STT, TTS, LLM, API, n8n - from 02-02
- Language selector in Agent tab with save/cookie/reload flow - from 02-02
- Output l10n to lib/l10n instead of deprecated synthetic-package - from 03-01
- Relative imports for AppLocalizations (package:flutter_gen deprecated) - from 03-01
- Enum-based status messages in setup_screen for context-free localization - from 03-02
- Language selector visible in settings even without server connection - from 03-02
- Per-language prompt dirs: prompt/{lang}/default.md with fallback to prompt/default.md - from 04-01
- Custom prompts remain language-neutral (prompt/custom.md always wins) - from 04-01
- French dates use cardinal numbers except "premier" for 1st - from 04-01
- French prompt uses informal tu/toi register - from 04-01
- PIPER_VOICE_MAP dict in voice_agent.py (not in settings) to keep mapping close to usage - from 04-02
- Auto-switch from Kokoro to Piper for non-English languages with log warning - from 04-02
- User custom wake_greetings override per-language defaults - from 04-02
- import random moved to top-level for webhook wake action accessibility - from 04-02

### Pending Todos

None.

### Blockers/Concerns

- [Resolved] livekit-plugins-openai passes language parameter to Speaches via openai.STT(language=...)
- [Resolved] Piper French voice: speaches-ai/piper-fr_FR-siwis-medium

## Session Continuity

Last session: 2026-01-26
Stopped at: Completed 04-02-PLAN.md -- ALL PLANS COMPLETE
Resume file: None
