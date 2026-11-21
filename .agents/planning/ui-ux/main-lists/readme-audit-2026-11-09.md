# README.md vs Reality Audit — MainList Component

**Date:** 2026-11-09  
**File:** `src/core/ui/main-list/README.md`  
**Status:** ⚠️ **Significantly Outdated** — Multiple structural inaccuracies

---

## File Structure Comparison

| README Claims | Reality | Status |
|---------------|---------|--------|
| `main-list-row.tsx` | **Does not exist** | ❌ **WRONG** |
| `main-list-row-header.tsx` | **Does not exist** | ❌ **WRONG** |
| `__tests__/` directory | **Does not exist** | ❌ **WRONG** |
| `main-list-types.ts` | `main-list.types.ts` | ⚠️ Naming mismatch |
| (not listed) | `main-list-cell.tsx` | ❌ Missing |
| (not listed) | `main-list-column-utils.ts` | ❌ Missing |
| (not listed) | `use-main-list-selection.ts` | ❌ Missing |
| (not listed) | `main-list-row-wrapper.tsx` | ❌ Missing (replaces row.tsx) |
| (not listed) | `main-list-head.tsx` | ❌ Missing (replaces row-header.tsx) |

**Actual files (14):**
```
index.ts
main-list-cell.tsx
main-list-column-utils.ts
main-list-context.ts
main-list-head.tsx
main-list-row-button.tsx
main-list-row-content.tsx
main-list-row-select.tsx
main-list-row-toolbar.tsx
main-list-row-wrapper.tsx
main-list-toolbar.tsx
main-list.css.ts
main-list.tsx
main-list.types.ts
use-main-list-selection.ts
README.md
```

---

## Implementation Hierarchy Comparison

### README Claims
```
MainList.Root
├─ MainList.Header (RowHeader)
│   └─ Renders column titles with flex-based width styling
├─ MainList.Rows (Row)
│   └─ Renders individual list items
│   ├─ MainList.RowContent
│   ├─ MainList.RowSelect
│   └─ MainList.RowToolbar
├─ MainList.Footer
├─ MainList.Toolbar
│   ├─ MainList.PrimaryActions
│   └─ MainList.SecondaryActions
```

### Reality (from `main-list.tsx` exports)
```typescript
export const MainList = {
    Root: RootComponent,
    RowWrapper,        // NOT "Row"
    RowHeader,         // from main-list-head.tsx
    Toolbar,
    Footer: FooterComponent,
    Rows: RowsComponent,
    RowSelect,
    RowButton,         // NOT in README hierarchy
    RowToolbar,
    RowContent,
    Cell,              // NOT in README hierarchy
    PrimaryActions,
    SecondaryActions,
    MassManage,
    MassManageButton,  // NOT in README hierarchy
} as const;
```

**Key Discrepancies:**
| README | Reality | Issue |
|--------|---------|-------|
| `MainList.Row` | `MainList.RowWrapper` | Renamed; README not updated |
| `MainList.Header` | `MainList.RowHeader` | Different naming |
| Missing `RowButton` | Exists as `MainList.RowButton` | Manage button per row |
| Missing `Cell` | Exists as `MainList.Cell` | Column cell component |
| Missing `MassManageButton` | Exists as `MainList.MassManageButton` | Toolbar trigger |
| `RowSelect`/`RowToolbar` under `Row` | Under `RowWrapper` | Correct in code, wrong in diagram |

---

## JSX Hierarchy with Classnames — Major Inaccuracies

### README Shows (INCORRECT)
```jsx
<MainList.Root className='main-list__root'>
  <MainList.Toolbar className='main-list__toolbar'>
    <MainList.PrimaryActions className='main-list__primaryActions'>
      <MainList.MassManageButton />
    </MainList.PrimaryActions>
    <MainList.SecondaryActions className='main-list__secondaryActions'>
    </MainList.SecondaryActions>
    <MainList.MassManage className='main-list__massManage'>
    </MainList.MassManage>
  </MainList.Toolbar>
<MainList.Header className='main-list__header'>
  <Div className='main-list__rowSelect' style={{width: 'var(--main-list-select-width, 0px)'...}} />
  <Div className={mainListSlotClassNames.headerCell()}>  // ❌ NO SUCH SLOT
    <Text color="fg.muted">{header.labels}</Text>
  </Div>
  <Div style={{width: '10', textAlign: 'center'}} className='main-list__rowToolbar' />
</MainList.Header>
<MainList.Row className={mainListSlotClassNames.rowWrapper()}>
  <MainList.RowContent className={mainListSlotClassNames.rowContent()}>
    <Div style={{flex: '1 1 0%', minWidth: 0, ...colStyles.name}} className={mainListSlotClassNames.rowCell()}>
      <Div><Text fontWeight="medium" truncate>{form.name}</Text></Div>
    </Div>
    <Div className={mainListSlotClassNames.rowCell()}>
      <span>{form.is_public ? 'Public' : 'Private'}</span>
    </Div>
    <Div style={{width: '120px'...}} className={mainListSlotClassNames.rowCell()}>
      {submissionCounts[form.id] ?? 0}
    </Div>
  </MainList.RowContent>
</MainList.Row>
<MainList.RowSelect className={mainListSlotClassNames.rowSelect()} />  // ❌ WRONG PLACEMENT
<MainList.RowToolbar className={mainListSlotClassNames.rowToolbar()} />  // ❌ WRONG PLACEMENT
<MainList.Footer className={mainListSlotClassNames.footer()}>
  <div className={mainListSlotClassNames.footerText()}>  // ❌ NO SUCH SLOT
    Showing 1 to 3 of 3
  </div>
  <nav class={mainListSlotClassNames.paginationRoot()}>  // ❌ NO SUCH SLOT
    ...
  </nav>
</MainList.Footer>
</MainList.Root>
```

### Actual Slot Names (from `main-list.ts` recipe)
```typescript
slots: [
    "root", "toolbar", "rows", "rowWrapper", "rowSelect", 
    "rowContent", "rowCell", "rowButton", "rowToolbar", 
    "rowHeader", "footer", "massManage", "primaryActions", "secondaryActions"
]
```

### Non-Existent Slots Referenced in README
| README Slot | Exists? | Actual Slot |
|-------------|---------|-------------|
| `headerCell` | ❌ | `rowCell` (for header cells too) |
| `footerText` | ❌ | None (footer uses raw markup) |
| `paginationRoot` | ❌ | None (Ark Pagination handles own classes) |
| `main-list__*` (BEM classes) | ❌ | Recipe generates `main-list__*` but via `mainListSlotClassNames.*()` |

---

## Component Structure Diagram — Corrected

### Actual Hierarchy (from code)
```
MainList.Root (main-list.tsx:RootComponent)
├── MainList.Toolbar (main-list-toolbar.tsx:Toolbar)
│   ├── MainList.PrimaryActions (PrimaryActions)
│   ├── MainList.SecondaryActions (SecondaryActions)
│   └── MainList.MassManage (MassManage) — conditional render
│       └── MainList.MassManageButton (MassManageButton) — in PrimaryActions
├── MainList.RowHeader (main-list-head.tsx:RowHeader) — conditional on headers.length > 0
├── MainList.Rows (context:Rows) — container
│   └── MainList.RowWrapper (main-list-row-wrapper.tsx:RowWrapper) — per item
│       ├── MainList.RowSelect (RowSelect) — select checkbox
│       ├── MainList.RowContent (RowContent) — column cells
│       │   └── MainList.Cell (Cell) — per column (via Children.map)
│       ├── MainList.RowButton (RowButton) — manage trigger
│       └── MainList.RowToolbar (RowToolbar) — actions panel
└── MainList.Footer (FooterComponent) — conditional on pagination
```

---

## Specific Inaccuracies Catalog

### 1. File Names (3 wrong, 4 missing)
| Line | README | Reality |
|------|--------|---------|
| 18 | `main-list-row.tsx` | `main-list-row-wrapper.tsx` |
| 19 | `main-list-row-header.tsx` | `main-list-head.tsx` |
| 20 | `__tests__/` | Does not exist |
| 17 | `main-list-types.ts` | `main-list.types.ts` |
| — | (missing) | `main-list-cell.tsx` |
| — | (missing) | `main-list-column-utils.ts` |
| — | (missing) | `use-main-list-selection.ts` |

### 2. Non-Existent Slots (4)
| Line | README | Reality |
|------|--------|---------|
| 58 | `mainListSlotClassNames.headerCell()` | Use `mainListSlotClassNames.rowCell()` |
| 85 | `mainListSlotClassNames.footerText()` | No such slot |
| 87 | `mainListSlotClassNames.paginationRoot()` | No such slot |
| 56 | `className='main-list__rowSelect'` | Should use `mainListSlotClassNames.rowSelect()` |

### 3. Wrong Component Placement (2)
| Line | README | Reality |
|------|--------|---------|
| 80 | `<MainList.RowSelect />` as Root child | Inside `RowWrapper` |
| 81 | `<MainList.RowToolbar />` as Root child | Inside `RowWrapper` |

### 4. Missing Components in Hierarchy (3)
| Component | Exported As | Used For |
|-----------|-------------|----------|
| `RowButton` | `MainList.RowButton` | Manage trigger per row |
| `Cell` | `MainList.Cell` | Column cell in RowContent |
| `MassManageButton` | `MainList.MassManageButton` | Toolbar trigger for mass actions |

### 5. Outdated Class Name Style
README uses BEM-style `main-list__*` class names directly, but code uses `mainListSlotClassNames.slotName()` which generates those classes. The README should show the **API**, not the output classes.

---

## Root Causes

1. **Cleanup tasks completed but README not updated** — Tasks 1-12 renamed/removed files (`main-list-row.tsx` → `main-list-row-wrapper.tsx`, `main-list-row-header.tsx` → `main-list-head.tsx`)
2. **Slot recipe evolved** — `headerCell` slot never existed; `footerText`/`paginationRoot` never added
3. **Component exports expanded** — `RowButton`, `Cell`, `MassManageButton` added to `MainList` namespace but not documented
4. **No test directory created** — Task list didn't include test creation

---

## Recommended README Updates

### Minimum Fixes (High Priority)
1. **Fix file list** — Replace 3 wrong names, add 4 missing files
2. **Fix slot references** — Remove `headerCell`, `footerText`, `paginationRoot`; use `rowCell` for header cells
3. **Fix hierarchy diagram** — Show `RowWrapper`, `RowButton`, `Cell`, `MassManageButton` in correct positions
4. **Remove `__tests__/` reference** — Or create the directory

### Ideal Rewrite (Medium Priority)
- Replace BEM class examples with `mainListSlotClassNames.*()` API
- Show actual JSX structure matching `main-list.tsx` render output
- Document `virtualized` prop (Task 10)
- Document `useMainListSelection` hook (Task 7)
- Add usage example from `head-dashboard.tsx` or `ListPage.tsx`

---

## Effort Estimate

| Task | Effort |
|------|--------|
| Fix file list + slot names | 30 min |
| Rewrite hierarchy diagram | 45 min |
| Update JSX example to match API | 45 min |
| Add missing component docs | 30 min |
| **Total** | **~2.5 hours** |

---

*Audit performed by GitHub Copilot on 2026-11-09*