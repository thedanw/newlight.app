# Findings: Forms Module — MainList Component System

## Stack Confirmation
- React 19.1.0, Vite 7.0.0, TypeScript 5.8.3
- Panda CSS + Park UI (Ark UI @ark-ui/react), Zod, Supabase
- lucide-react for icons
- pnpm (pnpm-lock.yaml present)
- Existing `src/core/ui` barrel exports Badge, Button, Page, Text, SearchInput, Dialog, Icon, Checkbox, IconButton, Pagination
- Test env: **happy-dom** + `src/setupTests.ts`; `vitest run`; coverage thresholds 70% (currently scoped to `src/modules/people/**` only)
- Quality gates: `pnpm typecheck` (tsc -b), `pnpm lint` (eslint, max-warnings 0), `pnpm test`, `pnpm build`

## Verified Bug Ledger (implementation vs. decisions + best practice)
Each item below is confirmed against source with file:line. These drive the remediation plan.

1. **Dead animation — row toolbar** — `main-list-row-toolbar.tsx:20` never sets `data-open`; recipe `recipes/main-list.ts:64` keys on `&[data-open="true"]` → `max-height` transition never fires. (Violates decisions #15, #27.)
2. **Dead animation — massManage** — `main-list-toolbar.tsx:92` passes `visible` to `mainListSlotClassNames.massManage()` (no such variant) and never sets `data-visible`; recipe `recipes/main-list.ts:98` keys on `&[data-visible="true"]` → never fires. (Violates decision #6.)
3. **Dual selection state** — `main-list.tsx:41-42` keeps internal `selectedKeys`/`selectMode` `useState` while consumer (`dashboard.tsx:19`) also owns `selectedKeys`. The `selection.selectedKeys` prop is read once (line 42) and never re-synced → controlled/uncontrolled split-brain. (Violates decision: MainList owns selection.)
4. **Select All == Select Visible** — `main-list.tsx:52-63` both compute `items.map(getKey)` (current page only); no "all matching search". (Violates decision #28.)
5. **Unsanctioned MainList `search` prop + duplicate SearchInput** — `main-list.tsx:181-193` renders a stubbed `SearchInput` (`return [] as any`) AND consumer renders a real one in `Page.HeaderBottom` (dashboard.tsx:171-181). Per **forms-module #2** (search in dashboard header), **module-design page-layout** (HeaderBottom = search/tools), the **People reference** (SearchInput in HeaderBottom), and the locked **main-lists decision** (30 items — *no* `search` prop on MainList.Root; #23 is a behavior rule, #3's "no HeaderBottom" covers list *actions* only), search is **owned by Page.HeaderBottom, not MainList**. Fix = remove the `search` prop + SearchInput from MainList.Root; keep HeaderBottom search. (Contradiction corrected.)
6. **Duplicate/nested row toolbar** — `main-list.tsx:117-121` `toolbar` prop renders `<RowToolbar open={false}>`; consumer `renderRow` (`dashboard.tsx:114`) renders a *separate* `<MainList.RowToolbar open={false}>` with the real buttons → View/Edit/Duplicate/Delete/Select/X are permanently collapsed (`max-height:0`). Row internal toolbar path also nests a RowToolbar inside a RowToolbar.
7. **Nested interactive + dead onClick** — `main-list.tsx:111-116` `button` prop is `<RowButton onClick={() => {}}>`; `main-list-row.tsx:90` wraps it in `<div onClick={handleManageClick}>` → button-in-clickable-div (a11y anti-pattern, keyboard broken).
8. **Inline-style overrides (not recipe/token)** — `main-list-row-select.tsx:21` (`--main-list-select-width`), `main-list-row-header.tsx:18,21,25-40` (fontWeight/color/bg/padding/width), `main-list-row-content.tsx:22` (`marginTop:'2'`), `main-list.tsx:182,249`, `main-list-toolbar.tsx:18-21,95-99`, `main-list-row.tsx:88`, `main-list-row-toolbar.tsx:24`. Violates Panda best practice (tokens/recipes are the styling source).
9. **No-op className variants** — `mainListSlotClassNames.rowButton({variant,size})` (row-button.tsx:27), `.rowHeader({selectMode,interactive})` (row-header.tsx:17), `.massManage({visible})`, `.rowToolbar({open})` — recipe `mainList` defines only a `size` variant; these props are ignored. Animation must come from `data-*` attributes, state from real variants.
10. **Duplicate list pages** — routed `dashboard.tsx` (`routes.tsx:17` mounts `./dashboard`) vs orphaned `pages/ListPage.tsx` (not routed; differs only in Dialog composition — ListPage uses `Dialog.Positioner`, dashboard uses `Dialog.Footer`; both valid per `dialog.tsx:21,26`). Dead code + drift risk. (Violates DRY.)
11. **Type drift** — `main-list.types.ts` `MainListRootButtonProps.onClick: () => void` but impl uses `(e) => void`; `variant`/`size` used in impl but absent from types; `MainListRootProps.selection` lacks `allFilteredKeys` needed for decision #28.
12. **Footer pagination oddity - RESOLVED (Batch 6)** — `main-list.tsx:252-257` `count={hasNextPage ? currentPage*pageSize : total}` and `key={currentPage}` force-remount; fragile. Fixed in Batch 6: `count` derives from `total` (controlled `page`, no `key` remount) and page items render real buttons instead of nested `<Item>`; locked by `main-list.test.tsx`.
13. **`/forms/:id/view` route missing — RESOLVED: View → Public fill page** — forms-module #3/#4 originally required row-click + View → `/forms/:id/view`, but no such route exists. **Decision (user-selected):** View/row-click points to the **Public fill page** (`/forms/:id`). `PublicPage.tsx` (`FormPublicPage`) exists but is **unrouted**; it reads `useParams().formId` while the router uses `:id` — reconcile the param name. Plan: add `{ path: ':id', element: <FormPublicPage/> }` route (place before `:id/edit`/`:id/submissions` or rely on exact-match ordering), fix the param, and point row-click + View there.
14. **SearchInput component API** — `main-list.tsx:181-193` and `dashboard.tsx:171-181` pass `search`/`onResults`/`onSearching` to `SearchInput`; the People reference uses `search={searchPeople}` (a callback returning results). Confirm `SearchInput`'s real prop contract before wiring instant-onChange (#23) to avoid another stub.

## ParkUI / ArkUI / Panda Architecture Notes (target state)
- Two-layer: ArkUI headless logic + PandaCSS tokens/recipes. `createStyleContext` slot components are the idiomatic ParkUI bridge.
- Recipe is the single styling source; components consume recipe classes/variants + `data-*` attributes for state-driven CSS. No inline style for anything expressible via tokens/recipe.
- Ark UI Dialog valid parts (per `dialog.tsx`): Root, RootProvider, Backdrop, CloseTrigger, Content, Description, Positioner, Title, Trigger, Body, Header, Footer, ActionTrigger.
- Controlled composition: MainList.Root owns selection/pagination/massManage; search is owned by the page's `Page.HeaderBottom`; consumer supplies render callbacks + actions.

## Decision Sources (locked — no contradictions with best practice)
- `ui-ux/main-lists/decision.md` — MainList component system decisions (30 items).
- `forms-module/decision.md` — module + list integration decisions (24 items).
- Contradiction check: none between decisions and ParkUI/ArkUI/Panda best practice. Implementation is out of alignment; plan remediates to match.

## Resolved Architectural Choice (was a potential gap, not a blocker)
- Decision #28 "Select All (all matching search)" requires the full filtered key set, but `MainList.Root` receives only the current page `items`. Resolution: add optional `selection.allFilteredKeys?: string[]` (consumer supplies filtered ids) so Root can implement true Select-All vs Select-Visible without owning query logic.

