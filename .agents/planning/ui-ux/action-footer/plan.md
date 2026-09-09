# Action Footer Implementation Plan

Goal: Shell-owned, dirty-driven Save/Cancel footer — forms hook in via core context; animates in only when edited.
Approach: Promote unused `SettingsActionsProvider` → core `PageActionsProvider`; render `Page.Footer` + `ActionFooter` once in `AppShell` (`position: absolute` in `Page.Root`, `inert` when idle); migrate in-scope forms to register actions; extend `lint-pages.mjs`; update planning docs. TDD-first.
Branch: NO branch — current `feat/people-module` (user decision 2026-09-09)
Budget: Stable 20% | Current 30% | History 30% | Buffer 20%
Scope:
- In: `PageActionsProvider` + `ActionFooter` (core/ui), AppShell footer, `page.ts` recipe, `index.html` viewport, `ChurchInformationPage` + `EditPersonPage`, `PersonForm`/`CreatePersonPage`, `FormBuilderPage`, `AccountPage`, `lint-pages.mjs`, planning docs.
- Out: elvanto-sync tabs (deferred), ESLint setup (future gate), multi-section dirty aggregation (follow-up), public pages (`LoginPage`/`FormPublicPage`).

## Batch Protocol (every batch)
**Start — Sync:** mark completed tasks in `plan.md` · update `progress.md` (prior batch summary) · read `findings.md` · context check: if >70%, compact first.
**End — Compaction:** summarize tasks in `progress.md` (target 50-70% reduction) · store details in `findings.md` (ref by summary) · mask verbose outputs (60-80% reduction) · if >70% compact before next (never >80%) · cache order: stable → reusable → unique · preserve decisions/commitments (<5% degradation).
**Tools:** `manage_todo_list` (atomic, max 1 in-progress) · subagents for independent >5 min · log every action/error/decision to `progress.md`.

## Batch 1: Setup & Foundation
Context: Goal: green baseline + branch + files; lock arch. Prev: none. Key: `findings.md#current-state`, `#architecture`. State: not started.

### Subphase 1.1: Env Init
- [x] Verify baseline green: `pnpm typecheck` && `pnpm lint:pages` && `pnpm build` && `pnpm test`
- [x] Create branch: `git checkout -b feat/action-footer` — SKIPPED (user: no branch, current `feat/people-module`)
- [x] Init planning files: `task_plan.md`, `findings.md`, `progress.md`
Subagent: No
Deliverable: Green baseline + `feat/action-footer` + planning files.

### Subphase 1.2: Arch Decisions
- [x] Finalize `PageActions` API: `{ cancel, apply, isSaving, isDirty, applyLabel? }` + `register()` → cleanup → `findings.md#api`
- [x] Confirm footer positioning: `position: absolute` in `Page.Root` (not `fixed` — sidebar overlap) → `findings.md#positioning`
- [x] Confirm dirty semantics: visible = `actions && actions.isDirty`; `EditPersonPage` registers `isDirty: true` first pass → `findings.md#dirty`
Subagent: No
Deliverable: ADR notes in `findings.md`.

## Batch 2: Core Implementation
Context: Goal: core mechanism + migrate forms + lint gate. Prev: Batch 1 done — baseline green, branch created, arch locked. Key: `findings.md#api`, `#positioning`, `#forms`, `#enforcement`. State: done.

### Subphase 2.1: Core mechanism
- [x] Add `src/core/ui/page-actions.tsx` — `PageActionsProvider` + `usePageActions` + `PageActions` type (`register` → cleanup)
- [x] Add `src/core/ui/action-footer.tsx` — `ActionFooter` (Cancel/Save, `data-state`, `inert`+`aria-hidden` when hidden, reduced-motion)
- [x] Export both from `src/core/ui/index.ts`
- [x] Update `src/core/theme/recipes/page.ts` — footer slot: absolute, off-screen transform, `data-state`, transition, `env(safe-area-inset-bottom)`; `main` `scrollPaddingBottom: var(--footer-height, 0)`; remove `footerVariant: 'fixed'`
- [x] Update `src/core/ui/app-shell.tsx` — wrap in `PageActionsProvider`; render `<Page.Footer><ActionFooter /></Page.Footer>` as direct child of `Page.Root`
- [x] Update `index.html` — viewport meta: `viewport-fit=cover, interactive-widget=resizes-content`
- [x] Update `src/core/ui/page.tsx` doc comment (footer shell-owned)
Subagent: Yes (independent file ops)
Deliverable: Footer renders in shell, hidden + inert by default.

### Subphase 2.2: Migrate existing footer pages
- [x] `src/core/settings/pages/ChurchInformationPage.tsx` — delete `<Page.Footer>` (~688–702); register `{ cancel: handleCancel, apply: handleApply, isSaving: saving, isDirty, applyLabel: 'Apply' }`
- [x] `src/modules/people/pages/EditPersonPage.tsx` — delete `<Page.Footer>` (~133–138); register `{ cancel: handleCancel, apply: handleSaveAll, isSaving: false, isDirty: true }`
Subagent: No (sequential, shared pattern)
Deliverable: Both pages use shell footer; behavior preserved.

### Subphase 2.3: Migrate remaining forms
- [x] `src/modules/people/components/PersonForm.tsx` — register actions (`isDirty` = value ≠ initial, `applyLabel` = `submitLabel`); remove inline buttons
- [x] `src/modules/people/pages/FormBuilderPage.tsx` — register actions (`isDirty` from `useOrderedCollection`); remove inline "Save form" button
- [x] `src/core/auth/AccountPage.tsx` — register actions (`isDirty` = `password.length > 0`; `apply` = `changePassword`)
- [x] **Design fix:** added `useRegisterPageActions` helper (ref-based) — prevents infinite re-registration loop
Subagent: Yes (parallel per component)
Deliverable: All in-scope forms use shell footer.

### Subphase 2.4: Linting enforcement
- [x] Extend `scripts/lint-pages.mjs` — check 3: ban `Page.Footer` in routed pages (allowlist `page.tsx` + `app-shell.tsx` + `action-footer.tsx`)
- [x] Extend `scripts/lint-pages.mjs` — check 4: routed pages with `<form` must use `usePageActions`/`useRegisterPageActions` (allowlist `LoginPage`/`FormPublicPage`)
- [x] Update `lint-pages.mjs` top doc comment (new contract)
- [x] Verify: `pnpm lint:pages` passes
Subagent: No
Deliverable: `pnpm lint:pages` green with new checks.

## Batch 3: Testing & Quality
Context: Goal: test context/footer, verify cross-route + browser UX. Prev: Batch 2 done — core + forms migrated, lint gate extended. Key: `findings.md#testing`, `#traps`. State: done.

### Subphase 3.1: Unit coverage
- [x] Add `src/core/ui/__tests__/page-actions.test.tsx` — register/clear on unmount, dirty-driven visibility
- [x] Add `src/core/ui/__tests__/action-footer.test.tsx` — renders buttons when dirty; `inert`+`aria-hidden` when not
- [x] Verify: `pnpm test` green
Subagent: Yes (parallel)
Deliverable: Unit tests green.

### Subphase 3.2: Integration
- [x] Verify `ChurchInformationPage` + `EditPersonPage` register on mount, clear on unmount (route change)
- [x] Verify `--footer-height` prevents last-field occlusion when footer visible
Subagent: No
Deliverable: Cross-route footer behavior verified.

### Subphase 3.3: E2E/Manual
- [x] Browser check `localhost:5173`: footer hidden + inert on pristine form; slides in on edit
- [x] Keyboard: Tab cannot reach hidden buttons
- [x] Reduced-motion: no slide
- [x] Mobile viewport + keyboard; last field not occluded
Subagent: No
Deliverable: Verified user flows.

## Batch 4: Polish & Delivery
Context: Goal: remove superseded code, update docs, ship. Prev: Batch 3 done — tests green. Key: `findings.md#enforcement`, `#docs`. State: ready.

### Subphase 4.1: Code quality
- [ ] Delete `src/core/settings/lib/actions-context.tsx` + `section-actions.ts` (confirm zero consumers)
- [ ] Remove `footerVariant: 'fixed'` from `page.ts` recipe (if superseded)
- [ ] Run `pnpm typecheck` && `pnpm lint:pages` && `pnpm build` && `pnpm test`
Subagent: Yes (parallel cleanup)
Deliverable: Clean codebase, all gates green.

### Subphase 4.2: Documentation
- [ ] Update `module-design/decision.md` (Page Layout Structure + Decision Log entry 9 + gap log)
- [ ] Update `heading-breadcrumb/decision.md` (decision 2.1)
- [ ] Update `ui-ux/decision.md` + `core/settings/decision.md` + `README.md`
- [ ] Create `action-footer/decision.md` (canonical)
Subagent: Yes (parallel)
Deliverable: Docs updated.

### Subphase 4.3: Release prep
- [ ] Full validation: `pnpm typecheck` && `pnpm lint:pages` && `pnpm build` && `pnpm test`
- [ ] Commit: `git add -A && git commit -m "feat(ui): shell-owned dirty-driven action footer"`
- [ ] Archive working docs (`plan.md`/`progress.md`/`findings.md` → `archive/`)
Subagent: No
Deliverable: Ready-to-merge `feat/action-footer`.

## Reboot Test & Context Hygiene
- **5-Question Reboot:** Where am I? (batch) · Where am I going? (next) · What's the goal? (header) · What have I learned? (`findings.md`) · What have I tried? (`progress.md`)
- **2-Action Rule:** write key findings to `findings.md` every 2 ops
- **Read Before Decide:** re-read plan before major decisions
- **Log ALL errors** → error table in `progress.md`
- **3-Strike Error Protocol:** Fix → Alternative → STOP/revert/ask