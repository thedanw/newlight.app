# Decision: MainList Component System (Global)

## What & Why
Reusable list system (`MainList.Root/Toolbar/Rows/RowHeader/Row/Footer` + `Row.Select/Button/Toolbar/Content`, `Toolbar.PrimaryActions/SecondaryActions/MassManage/MassManageButton`) for consistent interactive lists: row actions, selection, bulk ops, CSS-only animation. Reference consumer: `src/modules/forms/dashboard.tsx`. Tests: `src/core/ui/main-list/__tests__/main-list.test.tsx`.

## Who
Module developers (Forms, People, future).

## Constraints
- React 19, Panda CSS, Park UI (Ark UI), TS strict; import UI only from `@/core/ui`
- CSS-only animation; `mainList` slot recipe (`src/core/theme/recipes/main-list.ts`) is the single styling source — drive via `data-*` attrs, never hand-rolled classes
- Slots: `root,toolbar,rows,row,rowSelect,rowContent,rowButton,rowToolbar,rowHeader,footer,massManage,primaryActions,secondaryActions`; style via `mainListSlotClassNames.*()` (`main-list-context.ts`); only `Root,Rows,Footer` context comps are live
- MainList owns no data/search/selection state — all controlled props from the page (unmount clears selection)

## Non-Goals
- Virtualization; drag-reorder; server sorting/filtering (module queries own it)

## Assumptions
- Modules compose own row content; search is `SearchInput` in `Page.HeaderBottom`; delete/duplicate confirm via Park UI `Dialog` with item name

## Decision Log: decision → Rationale (hierarchical; parent = decision, sub = dependent)

1. **Composable system, not monolithic table** — flexible row content (cards/expandable); row content = `RowContent` slots (`primary/secondary/meta`, truncated) or `children` override (module handles overflow, Forms 3-col pattern)
2. **Root is controlled owner, no internal state** — consumer passes `items/getKey/renderRow`; `selectedKeys:Set` is single source; `selectMode = size>0`
   - `renderRowToolbar(item,index)`, `onRowClick(item,index)` (suppressed while row toolbar open), `headers`, `pagination{page,pageSize,total,onPageChange}`, `toolbar{primaryActions,secondaryActions}`, `selection{selectedKeys,onSelectionChange,allFilteredKeys?,onSelectAll?,onSelectVisible?}`, `massManage{onClose,onDeleteSelected,selectedCount,deleting?}` — no `search` prop, no `massManage.visible` prop
3. **Root layout: flex column, full width, gap 0** (`root` slot) — Rows stack; row/header/footer set own gaps
4. **Toolbar at top inside Root: Primary (left) / Secondary (right, `marginLeft:auto`) / MassManage (full-width below, `flexWrap:wrap`)** — self-contained actions
5. **MassManage visibility derives from `selectedCount>0` via `data-visible`** (`maxHeight 0→500px`, pushes content, no overlay) — Select All (filtered) / Select Visible (page) / Deselect All / Delete `(count)` / X; X → `onClose` + clear Set
   - `onDeleteSelected(keys[])=>Promise`: resolve clears selection, reject keeps (cancel/fail); delete button needs `aria-label={Delete (${count})}` (accessible name is icon + count only)
   - Entry trigger `MassManageButton{onClick,isOpen?}` lives in PrimaryActions; consumer `onClick` selects visible keys
   - Select All uses `selection.allFilteredKeys` (every key matching search, all pages) ?? visible page keys; Select Visible uses current `items` (decision: filtered set vs viewport)
6. **Rows container + explicit RowHeader `[{key,label,width?,align?}]`** — semantic wrapper (virtualization hook); header has select-column spacer bound to `--main-list-select-width`; `headers=[]` hides header
7. **Row: `data-select-mode` on row sets `--main-list-select-width` (48px/0px); `rowSelect` width/maxWidth bind the var (0.4s)** — single source for select column; `data-select-open=true` also forces 48px
   - `Row{selected,selectMode}` sets `data-selected/select-mode/toolbar-open`; open row `relative z-60 bg` above overlay (`mainListOverlay`: fixed z-50 canvas/0.95 blur); outside-click/Escape/overlay-click close; focus moves into toolbar (`tabIndex=-1`); `select` cloned with `checked:false` + `onChange: checked=>{close; onSelect()}` when toolbar open
8. **Row.Button slot (default Manage/plain/md) is the toolbar trigger** — `cloneElement` injects `onClick: open`, `aria-expanded/controls`; hidden while toolbar open; modules pass any valid element
9. **Row.Toolbar mounts only when open, `data-open` drives `maxHeight 0→500px` (0.4s)** — progressive disclosure; X (`IconButton size=fluidSm`) → collapse + restore trigger
10. **Row click == View (navigate to view); Edit → `…/edit`; Duplicate → copy then `navigate(edit)`; Delete/Duplicate confirm via module Dialog** — module conventions, not MainList props
11. **Footer inside Root: `Showing x to y of total` + Ark Pagination (`count=total`)** — modules pass page state only
12. **Buttons inside MainList use `size="fluidSm"/"fluidMd"` (button `size` variant, column→row responsive, `& svg` owns icon size)** — bare `<Icon><Lucide/></Icon>` inherits Button size; do not pass `<Icon size=…>` inside Buttons

## Decision Gap Log
(none — all gaps resolved)