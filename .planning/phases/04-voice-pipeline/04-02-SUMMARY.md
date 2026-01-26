---
phase: 04-voice-pipeline
plan: 02
subsystem: agent
tags: [i18n, stt, tts, piper, whisper, wake-greetings, voice-pipeline]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: language setting in settings.json
  - phase: 04-voice-pipeline
    plan: 01
    provides: per-language prompts and language-aware prompt loading
provides:
  - Language-aware STT with Whisper language parameter
  - Language-aware TTS with per-language Piper voice selection
  - Auto-switch from Kokoro to Piper for non-English languages
  - Per-language wake greetings with user override support
  - Language-aware prompt loading in voice agent
affects: [future language additions, TTS provider configuration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PIPER_VOICE_MAP dict for per-language Piper voice model IDs"
    - "DEFAULT_WAKE_GREETINGS dict for per-language wake greeting lists"
    - "Auto-switch TTS provider when current provider lacks language support"
    - "Language parameter threaded from settings through STT/TTS/prompts"

key-files:
  created: []
  modified:
    - voice_agent.py

key-decisions:
  - "PIPER_VOICE_MAP dict in voice_agent.py (not in settings) to keep mapping close to usage"
  - "Auto-switch from Kokoro to Piper for non-English with log warning (not user prompt)"
  - "User custom wake_greetings override per-language defaults"
  - "import random moved to top-level module imports for webhook wake action accessibility"

patterns-established:
  - "Language extracted once from runtime settings, threaded to all consumers"
  - "Per-language defaults with user override pattern for wake greetings"
  - "TTS provider auto-switching based on language support capabilities"

# Metrics
duration: 3min
completed: 2026-01-26
---

# Phase 4 Plan 2: Voice Pipeline Language Wiring Summary

**Language-aware STT/TTS/greetings/prompts in voice_agent.py with Piper voice mapping and Kokoro auto-switch**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-26T08:09:31Z
- **Completed:** 2026-01-26T08:12:56Z
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments
- STT constructors (Groq and Speaches) now pass language parameter from settings
- TTS auto-switches from Kokoro to Piper for non-English languages with per-language voice selection
- Wake greetings select per-language defaults with user override support
- Webhook wake action uses language-aware greeting selection (fixed pre-existing undefined name bug)
- VoiceAssistant loads language-specific system prompts via load_prompt(language=...)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add language constants and runtime settings** - `3bbc53d` (feat)
2. **Task 2: Wire language to STT and TTS constructors** - `cefd922` (feat)
3. **Task 3: Wire language-aware wake greetings and webhook updates** - `e596bfb` (feat)

## Files Created/Modified
- `voice_agent.py` - Added PIPER_VOICE_MAP, DEFAULT_WAKE_GREETINGS, language in get_runtime_settings(), updated load_prompt() signature, wired language to STT/TTS constructors, language-aware wake greetings, fixed webhook wake action

## Decisions Made
- PIPER_VOICE_MAP is a module-level dict in voice_agent.py rather than in settings.py, keeping the mapping close to where it's used
- Kokoro auto-switches to Piper for non-English languages with a log warning (no user prompt needed)
- User custom wake_greetings in settings.json override per-language defaults
- import random moved to top-level so both wake word callback and webhook handler can use it

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed undefined get_setting in webhook wake handler**
- **Found during:** Task 3
- **Issue:** Webhook wake action used `get_setting("wake_greetings")` but `get_setting` was never imported (pre-existing bug)
- **Fix:** Replaced with `settings_module.load_user_settings()` + `settings_module.get_setting()` pattern matching the language-aware greeting logic
- **Files modified:** voice_agent.py
- **Verification:** F821 ruff error for `get_setting` no longer appears
- **Committed in:** e596bfb (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Bug fix was necessary for webhook wake action to function. No scope creep.

## Issues Encountered
None - plan executed as written with one pre-existing bug fix.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Full i18n pipeline is complete across all phases
- A French-speaking user can interact with CAAL entirely in French:
  - STT transcribes French speech correctly (Whisper with language=fr)
  - Agent responds in French with natural TTS voice (Piper siwis-medium)
  - Wake greeting plays in French
  - System prompt is loaded in French
  - English installations continue working without changes

---
*Phase: 04-voice-pipeline*
*Completed: 2026-01-26*
