# Implementation Plan: Forms Module â€” MainList Remediation

Grounding: `findings.md` (verified bug ledger), `ui-ux/main-lists/decision.md`, `forms-module/decision.md`, `module-design/decision.md`, ParkUI/ArkUI/PandaCSS best practice.

**Git:** Work on `main` only â€” NO feature/custom branch. Each batch = one commit directly on `main`.

Ordering: recipes/types first (styling + type foundation), then component behavior (state/animation/a11y), then consumer integration, then dedup, then tests. Each batch = one commit. Run gates after each.

Quality gates (must pass per batch): `pnpm typecheck`, `pnpm lint`, `pnpm test`.

**Global Goal:** Remediate MainList so it matches the locked decisions + ParkUI/ArkUI/Panda best practice, with the forms dashboard as the single consumer.

---

## Batch 1 â€” Recipe & types foundation (styling source of truth)
Files: `src/core/theme/recipes/main-list.ts`, `src/core/ui/main-list/main-list.css.ts`, `src/core/ui/main-list/main-list.types.ts`

### Batch 1 Start: Sync
- [x] Mark completed tasks in `plan.md`
- [x] Read `findings.md` (#8 inline styles, #9 no-op variants, #11 type drift)

### Batch 1 Context
- Goal: Remediate MainList to match locked decisions + ParkUI/ArkUI/Panda best practice.
- This Batch: Make the `mainList` recipe the single styling source of truth; align types.
- Prev: none (first batch).
- Key: `findings.md` #8, #9, #11.

- [x] Add `variants` to `mainList` recipe: `size:{sm|md|lg}`, `rowHeader.interactive`, `rowHeader.selectMode`, `rowSelect.visible` (width 0â†’48px via transition), `rowButton.variant`, `rowButton.size`. Move `--main-list-select-width` + `--main-list-row-toolbar-duration` into recipe base/variants (remove inline custom props).
- [x] Keep animation driven by `data-*` attribute selectors already in recipe (`&[data-open="true"]`, `&[data-visible="true"]`); select-column width uses the `rowSelect.visible` variant. Document the chosen mechanism.
- [x] Update `main-list.types.ts`: `MainListRowButtonProps.onClick:(e:MouseEvent)=>void`; add `variant?`/`size?` to button/select/toolbar types; add `selection.allFilteredKeys?: string[]`; ensure `massManage.deleting` present; drop `RowSelect.duration` unless wired to a token.
- [x] Commit: `refactor(main-list): recipe variants + type alignment for select/animation` â†’ **fc9f4f5**

## Batch 2 â€” Row: single managed-toolbar, a11y, animation attributes
Files: `src/core/ui/main-list/main-list-row.tsx`, `main-list-row-toolbar.tsx`, `main-list-row-button.tsx`, `main-list-row-select.tsx`, `main-list-row-content.tsx`, `main-list-row-header.tsx`

### Batch 2 Start: Sync
- [x] Mark completed tasks in `plan.md`
- [x] Read `findings.md` (#6 dup toolbar, #7 button-in-div, #1 data-open, #8/#9 slots)

### Batch 2 Context
- Goal: Match locked decisions + best practice; each batch one commit on main.
- This Batch: One toolbar per row, real trigger + a11y, set `data-open`/recipe variants for animation.
- Prev: Batch 1 â€” recipe variants + types landed.
- Key: `findings.md` #1, #6, #7, #8, #9.

- [x] Remove duplicate `toolbar` rendering path (the `open={false}` RowToolbar built in Root, finding #6) â€” Row renders ONE toolbar controlled by its own state; expose `open`/`onClose` cleanly.
- [x] Replace `<div onClick={handleManageClick}><RowButton/></div>` with a real trigger: `RowButton` carries `aria-expanded={open}` + `aria-controls={toolbarId}`; overlay `role="presentation"`; add Escape-to-close + focus move into toolbar; clean up `document` mousedown listener on unmount.
- [x] RowToolbar: set `data-open={open}` on the element so recipe transition fires. Wire `duration`â†’token or remove inline var.
- [x] RowSelect: drive `visible` from recipe variant (parent-controlled `selectMode`); remove inline `--main-list-select-width`.
- [x] RowHeader: move fontWeight/color/bg/padding/width/textOverflow into recipe variants; remove inline styles; accept + pass `selectMode`/`interactive`.
- [x] RowContent: move `meta` marginTop into recipe; remove inline style.
- [x] Commit: `fix(main-list): single row toolbar, a11y, recipe-driven row slots`

## Batch 3 â€” Root: own selection/massManage (controlled); drop search
Files: `src/core/ui/main-list/main-list.tsx`, `main-list-toolbar.tsx`

### Batch 3 Start: Sync
- [x] Mark completed tasks in `plan.md`
- [x] Read `findings.md` (#3 split-brain, #4 select-all==visible, #5 stubbed search, #2 data-visible, #12 footer)

### Batch 3 Context
- Goal: Match locked decisions + best practice; each batch one commit on main.
- This Batch: Root becomes the controlled owner of selection/massManage; remove the `search` prop.
- Prev: Batch 2 â€” row toolbar/a11y/animation done.
- Key: `findings.md` #2, #3, #4, #5, #9, #12.

- [x] Selection becomes controlled: use `selection.selectedKeys`/`onSelectionChange` as source of truth; drop internal `selectedKeys` state (fixes split-brain, #3). Derive `selectMode = selectedKeys.size > 0` unless overridden.
- [x] True Select-All via `selection.allFilteredKeys` (fallback `items.map(getKey)`) vs Select-Visible (`items.map(getKey)`), distinct handlers (#4).
- [x] REMOVE the `search` prop + stubbed SearchInput from MainList.Root entirely â€” search is owned by `Page.HeaderBottom`, not MainList (per forms-module #2, module-design page-layout, and the locked main-lists decision which has no `search` prop) (#5). Also remove `search` from `main-list.types.ts`.
- [x] Remove inline RowToolbar + dead-RowButton construction inside the rows loop; pass selection state + render callbacks to Row (#6, #7).
- [x] MassManage: set `data-visible={visible}` on element; drop no-op `mainListSlotClassNames.massManage({visible})` (#2).
- [x] Toolbar: move inline styles (bg/padding) to recipe; keep only Primary/Secondary/MassManage slots (decision #3).
- [x] Footer: simplify `count` to derive from `total`+`page`+`pageSize` without fragile `key` remount (#12).
- [x] Commit: `refactor(main-list): Root owns selection/massManage; remove search prop`

## Batch 4 â€” Consumer integration (dashboard)
Files: `src/modules/forms/dashboard.tsx`, `src/modules/forms/routes.tsx`, `src/modules/forms/pages/PublicPage.tsx`

### Batch 4 Start: Sync
- [x] Mark completed tasks in `plan.md`
- [x] Read `findings.md` (#5 header search, #13 missing view route, #14 SearchInput contract)

### Batch 4 Context
- Goal: Match locked decisions + best practice; each batch one commit on main.
- This Batch: Wire dashboard to controlled MainList; keep header search; route the public view page (D8).
- Prev: Batch 3 - Root controlled + `search` prop removed.
- Key: `findings.md` #5, #13, #14; decisions D5, D8.

- [x] Remove consumer-owned selection logic; pass `selection={{ selectedKeys (controlled source of truth per Batch 3), onSelectionChange, allFilteredKeys }}` so MainList owns select-all/select-visible. Consumer's `handleSelectAll`/`handleSelectVisible` deleted (MainList computes the union and notifies via `onSelectionChange`; `onSelectAll`/`onSelectVisible` are optional notifications and are intentionally omitted to avoid double-applying).
- [x] KEEP the single `SearchInput` in `Page.HeaderBottom` (canonical search location per forms-module #2 + module-design page-layout + People reference). Do NOT add search to MainList (D5). Confirmed `SearchInput` prop contract (`search` callback returns results) and wired instant `onChange` per #23 (#14) — debounced `search` is now inert (local filter), `ariaLabel` added.
- [x] Move row actions (View/Edit/Duplicate/Delete) into the managed row toolbar via `renderRowToolbar` (`renderRow` is content-only); removed the standalone `<MainList.RowToolbar open={false}>` block and the manual "Select"/close buttons. Added `onRowClick` → `/forms/${form.id}`.
- [x] Provide `massManage.onDeleteSelected` async + pass `deleting` state; mass-delete confirm now settles a promise (confirm → delete → resolve → MainList clears selection; cancel/Escape → reject → selection kept; `main-list.tsx` treats rejection as cancel). Confirm dialogs wired to Ark UI Dialog (`dialog.tsx` parts: Backdrop/Positioner/Content/Title/Footer/ActionTrigger). Single source of truth for delete/duplicate confirmations. NOTE: discovered + fixed pre-existing `Dialog.ActionTrigger` bug (it dropped consumer `onClick` — confirm buttons only dismissed the dialog); fixed in `985b197`.
- [x] Add the View destination route: `{ path: ':id', element: <FormPublicPage/> }` in `routes.tsx` (React Router ranking keeps `new`/`:id/edit`/`:id/submissions` winning), reconciled `PublicPage`'s `useParams()` to the router's `:id` (aliased `id: formId`) (D8). Row-click + the View toolbar button point to `/forms/${form.id}`.
- [x] Verify no duplicate filtering: dashboard computes `filteredForms`/`paginatedForms`; the `Page.HeaderBottom` SearchInput drives `handleSearch` (search lives outside MainList per D5). No filtering inside MainList.
- [x] Commit: `refactor(forms): integrate MainList controlled selection/search/toolbar`

## Batch 5 â€” Dedup list pages
Files: `src/modules/forms/dashboard.tsx`, `src/modules/forms/pages/ListPage.tsx`, `src/modules/forms/routes.tsx`

### Batch 5 Start: Sync
- [x] Mark completed tasks in `plan.md`
- [x] Read `findings.md` (#10 duplicate list pages)

### Batch 5 Context
- Goal: Match locked decisions + best practice; each batch one commit on main.
- This Batch: Delete orphaned `ListPage.tsx`; `dashboard.tsx` is the single list page.
- Prev: Batch 4 - dashboard integrated on controlled MainList.
- Key: `findings.md` #10; decision D6.

- [x] Delete orphaned `src/modules/forms/pages/ListPage.tsx` (not routed; `routes.tsx:17` mounts `./dashboard`). Confirmed no imports reference it (repo-wide grep: only plan docs mention it).
- [x] Keep `dashboard.tsx` as the single forms list page. Commit: `chore(forms): remove orphaned ListPage (dedup)`

## Batch 6 â€” Tests + coverage scope
Files: new tests under `src/core/ui/main-list/__tests__/` and `src/modules/forms/__tests__/`

### Batch 6 Start: Sync
- [x] Mark completed tasks in `plan.md`
- [x] Read `findings.md` (#1,#2,#3,#4 behaviors now to lock)

### Batch 6 Context
- Goal: Match locked decisions + best practice; each batch one commit on main.
- This Batch: Add unit + integration tests; extend vitest coverage scope.
- Prev: Batch 5 - code + dedup complete.
- Key: `findings.md` #1, #2, #3, #4.

- [x] Unit tests: selection toggle; Select-All vs Select-Visible; deselect-all; massManage visible + `data-visible` + delete flow (resolve clears selection, reject/cancel keeps it); row toolbar open/close + `data-open` + Escape/overlay close + focus + row-click suppression while open; pagination count/onPageChange; row slots (primary/secondary/meta); RowSelect visible variant width + `data-select-mode`/`data-selected` hooks; (search is tested at the dashboard level, not MainList). File: `src/core/ui/main-list/__tests__/main-list.test.tsx` (16 tests).
- [x] Integration test: dashboard renders forms, search filters, select enables massManage, delete confirms + refreshes, cancel keeps selection. File: `src/modules/forms/__tests__/dashboard.test.tsx` (5 tests; renders inside `Page.Root` + `MemoryRouter` to mirror the AppShell chrome; queries module mocked).
- [x] Add `src/modules/forms/**` + `src/core/ui/main-list/**` to vitest coverage `include` (keep 70% thresholds). Follow existing conventions (happy-dom, `@testing-library/react`, `src/setupTests.ts`). Also fixed: coverage `provider: 'vitest'` is invalid in Vitest 4 → `'v8'` (+ `@vitest/coverage-v8` devDependency; coverage could not run at all before). RTL auto-cleanup is unavailable (vitest globals off) → tests call `cleanup()` in `afterEach`.
- [x] Commit: `test(main-list,forms): coverage for selection/toolbar/search/pagination`

## Batch 7 â€” Final gate

### Batch 7 Start: Sync
- [x] Mark completed tasks in `plan.md`
- [x] Read `findings.md` (confirm all 13 items resolved + row-overlay stacking fix)

### Batch 7 Context
- Goal: Match locked decisions + best practice; each batch one commit on main.
- This Batch: Run all quality gates green on `main`.
- Prev: Batch 6 - tests added + coverage scope set.
- Key: `findings.md` (all).

- [x] `pnpm typecheck && pnpm lint && pnpm test` green on touched files (see commit notes for pre-existing errors elsewhere).
- [x] Commit (if fixes needed): `chore(forms): final lint/type/test/build fixes`

---

## Decisions Log (no contradictions; choices resolved during planning)
- D1: Select-column visibility via recipe `rowSelect.visible` variant (not inline CSS var).
- D2: Animations via existing `data-open`/`data-visible` attribute selectors; components now set those attributes.
- D3: MainList.Root is the controlled owner of selection/pagination/massManage (NOT search â€” see D5); consumer supplies data + callbacks only.
- D4: `selection.allFilteredKeys` added (optional) to satisfy "Select All (all matching search)" without coupling Root to the query layer.
- D5: Search is owned by `Page.HeaderBottom` (forms-module #2, module-design page-layout, People reference). MainList does NOT own search â€” remove the `search` prop from MainList.Root + types. (Corrected from earlier draft which wrongly made search MainList-owned.)
- D8: View/row-click â†’ **Public fill page** `forms/:id` (user-selected). Route `PublicPage.tsx` (`FormPublicPage`) under `:id` and reconcile its `formId` param to the router's `:id`. No new admin view page.
- D9: module-design alignment confirmed â€” UI imported only via `@/core/ui` barrel (#2.1); Panda recipes remain in `src/core/theme/recipes` (no module-local recipe authoring, avoiding open gap #1-3); no new `styled-system` usage outside recipes (#2.2); no Page.Footer added to routed pages (#9.3 â€” MainList.Footer is a component footer, not Page.Footer); forms ListPage is NOT a hosted settings page so Page.Main/Header/Body are correct (#9.4/#10).
- D6: `dashboard.tsx` is the single forms list page; delete orphaned `ListPage.tsx`.
- D7: Row toolbar is a single instance per row, triggered by RowButton (proper button + `aria-expanded`), overlay closes on outside click + Escape.

