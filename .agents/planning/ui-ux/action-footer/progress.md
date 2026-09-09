# Progress: Action Footer (Path B)

Session log + error table. Update after EVERY subphase (mandatory).

## Session Log

### 2026-09-09 — Batch 2 complete (Core Implementation)
- 2.1 Core: `page-actions.tsx` (PageActionsProvider + usePageActions + PageActions) + `action-footer.tsx` (ActionFooter) + exports; recipe footer slot (absolute, off-screen, `data-state`, safe-area, `--footer-height` scrollPaddingBottom, removed `footerVariant: 'fixed'`); AppShell wraps in provider + renders `<Page.Footer><ActionFooter /></Page.Footer>`; `index.html` viewport meta; `page.tsx` doc comment
- 2.2 Migrated `ChurchInformationPage` + `EditPersonPage` (deleted inline `<Page.Footer>`, register actions)
- 2.3 Migrated `PersonForm`/`CreatePersonPage`, `FormBuilderPage`, `AccountPage` (register actions, removed inline buttons)
- 2.4 Extended `lint-pages.mjs` to 4 checks (scaffold ×2 + footer-ownership + form-actions); allowlisted `action-footer.tsx` + test harness
- **Design fix:** added `useRegisterPageActions` helper (ref-based, stable effect deps) to prevent infinite re-registration loop
- Gates: typecheck ✅, lint:pages ✅ (4 checks), build ✅ (exit 0), test ✅ (19 files / 177 tests)
- Next: Batch 3.1 Unit coverage

### 2026-09-09 — Batch 3.1 complete (Unit Coverage)
- Created `page-actions.test.tsx` (provider contract, register/clear, stale-clear-guard, `useRegisterPageActions` re-register-on-isDirty, disabled-no-op) — 5 tests
- Created `action-footer.test.tsx` (render when dirty, applyLabel, hidden+inert when clean, disabled stays hidden, click handlers, disable-while-saving) — 6 tests
- Root-cause: "multiple Cancel buttons" was missing `cleanup()` in `afterEach` (renders accumulated across tests w/o vitest globals) — added `cleanup()`
- Fixed incorrect disabled assertion: footer ALWAYS renders with `data-state="hidden"` (never removed from DOM) — asserted hidden+inert+no-button instead
- Temporary `debug-footer.test.tsx` created+dumped DOM (confirmed single footer) then DELETED
- Gates: `pnpm test` → 190 tests / 63 files?? -> 21 files / 191 tests GREEN
- Next: Batch 3.2 Integration

### 2026-09-09 — Batch 1 complete (Setup & Foundation)
- Baseline green: typecheck ✅ (fixed 5 pre-existing errors: 2 unused consts in `elvanto-sync/sync/transforms.ts`, 3 invalid `variant="ghost"` → `plain` in `JourneySettingsManager.tsx`), lint:pages ✅, build ✅, test ✅ (19 files / 177 tests)
- Branch: NONE — user decision: implement on current branch `feat/people-module`
- Arch decisions locked → `findings.md#ADR`
- Next: Batch 2.1 Core mechanism

### 2026-09-09 — Plan authored (concise-planning refactor)
- Status: planning
- Authored `plan.md` (concise format), `findings.md`, `task_plan.md`, `progress.md`
- Next: Phase 1.1 Env Init

## Errors
| Error | Fix Attempted | Resolution |
|-------|---------------|------------|
| Infinite re-registration loop (register → provider re-render → page re-render → new fn → re-register) | Added `useRegisterPageActions` helper (ref-based, stable effect deps) | Resolved — tests pass, no hang |
| Hooks-order violation in `FormBuilderPage` (`usePageActions` after early return) | Moved `save` + registration before `if (!loaded) return` | Resolved — typecheck + tests green |
| lint check 4 false-positive on `CreatePersonPage` (`onSubmit` prop-passing to PersonForm) | Refined regex to match actual `<form>` elements only | Resolved — lint green |
| lint check 4 missed `useRegisterPageActions` | Regex `/use(?:Register)?PageActions/` | Resolved — lint green |
| lint flagged test harness (`form-reorder.test.tsx`) rendering Page.* slots | Added to `FILES_ALLOW_RAW` | Resolved — lint green |
| typecheck: 2 unused consts (`ARCHIVED_STAGE_UUID`, `DELETED_PRIVACY_DATA_UUID`) in `transforms.ts` | Removed both (verified zero usages) | Resolved — typecheck green |
| typecheck: 3× `variant="ghost"` invalid on Button in `JourneySettingsManager.tsx` | Changed to `variant="plain"` (matches sibling delete button) | Resolved — typecheck green |
| action-footer tests: "found multiple elements with role 'button' name 'Cancel'" | Missing `cleanup()` in `afterEach` (no vitest globals ⇒ renders accumulate across tests) | Resolved — added `cleanup(); vi.restoreAllMocks()` |
| action-footer disabled test asserting `[data-state]` absent | Wrong assumption — footer ALWAYS renders with `data-state="hidden"` (only inert/aria-hidden toggle) | Resolved — assert hidden+inert+no accessible button |