---
phase: 05-extract-en-keys
plan: 01
subsystem: ui
tags: [next-intl, i18n, react, typescript]

# Dependency graph
requires:
  - phase: 01-foundation (v1.0)
    provides: next-intl infrastructure, Tools namespace in en.json
provides:
  - Tools.share.* message keys (12 keys)
  - Tools.workflow.* message keys (10 keys)
  - Internationalized workflow-submission-dialog component
  - Internationalized workflow-detail-modal component
affects: [06-add-fr-translations, 07-add-it-translations]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useTranslations('Tools') for Tool Registry components"
    - "tCommon('key') for shared Common namespace strings"

key-files:
  created: []
  modified:
    - frontend/components/tools/workflow-submission-dialog.tsx
    - frontend/components/tools/workflow-detail-modal.tsx
    - frontend/messages/en.json
    - frontend/eslint.config.mjs

key-decisions:
  - "Used Tools.share.* namespace for submission dialog strings"
  - "Used Tools.workflow.* namespace for detail modal strings"
  - "Arrow symbol in variable hints kept as UI formatting, not translatable"

patterns-established:
  - "Tool Registry i18n: t('share.*') for sharing, t('workflow.*') for workflow details"

# Metrics
duration: 5min
completed: 2026-02-05
---

# Phase 05 Plan 01: Tool Registry i18n Summary

**Internationalized workflow-submission-dialog and workflow-detail-modal components with 22 new EN message keys under Tools.share.* and Tools.workflow.* namespaces**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-05T03:59:12Z
- **Completed:** 2026-02-05T04:03:56Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Extracted 12 hardcoded strings from workflow-submission-dialog.tsx to Tools.share.* keys
- Extracted 10 hardcoded strings from workflow-detail-modal.tsx to Tools.workflow.* keys
- Fixed ESLint import resolver config for pnpm module resolution (blocking build issue)

## Task Commits

Each task was committed atomically:

1. **Task 1: Internationalize workflow-submission-dialog.tsx** - `4d732c5` (feat)
2. **Task 2: Internationalize workflow-detail-modal.tsx** - `dc2223f` (feat)

## Files Created/Modified
- `frontend/components/tools/workflow-submission-dialog.tsx` - Added useTranslations hooks, replaced hardcoded strings
- `frontend/components/tools/workflow-detail-modal.tsx` - Added useTranslations hook, replaced hardcoded strings
- `frontend/messages/en.json` - Added Tools.share.* and Tools.workflow.* namespaces
- `frontend/eslint.config.mjs` - Fixed import resolver settings for pnpm

## Decisions Made
- Tools.share.* namespace for submission dialog (security info, detected items, buttons)
- Tools.workflow.* namespace for detail modal (status, labels, info text)
- Used existing Common.close and Common.cancel for shared button text in submission dialog

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed ESLint import resolver configuration**
- **Found during:** Task 1 (build verification)
- **Issue:** ESLint import/no-unresolved error on @radix-ui/react-dialog in dialog.tsx (pre-existing issue)
- **Fix:** Added import resolver settings for typescript and node to eslint.config.mjs
- **Files modified:** frontend/eslint.config.mjs
- **Verification:** `pnpm build` succeeds
- **Committed in:** 4d732c5 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** ESLint config fix was necessary to unblock build verification. No scope creep.

## Issues Encountered
None - plan executed smoothly after ESLint fix.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- EN message keys complete for Tool Registry components
- Ready for Phase 06 (FR translations) and Phase 07 (IT translations)
- No blockers or concerns

---
*Phase: 05-extract-en-keys*
*Completed: 2026-02-05*
