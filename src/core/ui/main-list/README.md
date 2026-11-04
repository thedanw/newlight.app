# MainList Component

Centralized UI component using ParkUI, Ark UI, and Panda CSS for displaying lists of items with consistent styling, pagination, and selection management.

## Overview

The `MainList` component provides a complete solution for displaying item lists with:

- **Row rendering** with consistent column layout
- **Pagination** support
- **Selection management** (single/multiple selection)
- **Toolbar actions** (primary and secondary)
- **Mass management** (delete, duplicate, etc.)
- **Row headers** and **toolbar** components

## Component Structure

```
main-list/
├── main-list.tsx          # Root component - controls selection, pagination, rendering
├── main-list-context.ts   # Context provider - selection state, callbacks
├── main-list.css.ts       # CSS variables and styling
├── main-list-types.ts     # Type definitions for props and configs
├── main-list-row.tsx      # Individual row component
├── main-list-row-content.tsx  # Row content area - name, description, meta
├── main-list-row-header.tsx   # Row header - column titles
├── main-list-row-select.tsx   # Row selection checkboxes
├── main-list-row-toolbar.tsx  # Row action buttons (view, edit, etc.)
├── main-list-toolbar.tsx    # Component toolbar (mass manage, actions)
└── __tests__/           # Test files
```

## Implementation Hierarchy

```
MainList.Root
├─ MainList.Header (RowHeader)
│   └─ Renders column titles with flex-based width styling
│   ├─ Handles 1fr → flex: '1 1 0%'
│   └─ Handles 120px → width: '120px' with min/max constraints
├─ MainList.Rows (Row)
│   └─ Renders individual list items
│   ├─ MainList.RowContent
│   │   └─ Name, visibility, submissions columns
│   │   ├─ Uses same flex styling as RowHeader
│   │   └─ Consistent column sizing
│   ├─ MainList.RowSelect
│   │   └─ Selection checkbox
│   └─ MainList.RowToolbar
│       └─ Action buttons (view, edit, delete)
├─ MainList.Footer
│   └─ Pagination and display info (showing X to Y of Z items)
│   └─ Navigation buttons (prev/next page)
├─ MainList.Toolbar
│   ├─ MainList.PrimaryActions
│   │   └─ MassManageButton, etc.
│   └─ MainList.SecondaryActions
│       └─ Additional actions
```

## Component Structure (JSX Hierarchy with Classnames)

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
      <Div className='main-list__rowSelect' 
        style={{ width: 'var(--main-list-select-width, 0px)', maxWidth: 'var(--main-list-select-width, 0px)', overflow: 'hidden' }}  ></div>
      <Div
        className={mainListSlotClassNames.headerCell()}
      >
        <Text color="fg.muted">
          {header.labels} 
        </Text>
      </Div>
      <Div style={{ width: '10', textAlign: 'center' }} className='main-list__rowToolbar' />
    </MainList.Header>
  {/* Row content is rendered within MainList.Row components */}
  <MainList.Row className={mainListSlotClassNames.row()}>
    <MainList.RowContent className={mainListSlotClassNames.rowContent()}>
      <Div style={{ flex: '1 1 0%', minWidth: 0, ...colStyles.name }} className={mainListSlotClassNames.rowCell()}>
        <Div>
          <Text fontWeight="medium" truncate>{form.name}</Text>
        </Div>
      </Div>
      <Div className={mainListSlotClassNames.rowCell()}>
        <span>{form.is_public ? 'Public' : 'Private'}</span>
      </Div>
      <Div style={{ width: '120px', minWidth: '120px', maxWidth: '120px', textAlign: 'center', color: 'fg.muted', fontSize: 'sm', ...colStyles.submissions }} className={mainListSlotClassNames.rowCell()}>
        {submissionCounts[form.id] ?? 0}
      </Div>
    </MainList.RowContent>
  </MainList.Row>
  <MainList.RowSelect className={mainListSlotClassNames.rowSelect()} />
  <MainList.RowToolbar className={mainListSlotClassNames.rowToolbar()} />
  {/* Footer shows pagination info and navigation */}
  <MainList.Footer className={mainListSlotClassNames.footer()}>
    <div className={mainListSlotClassNames.footerText()}>
      Showing 1 to 3 of 3
    </div>
    <nav class={mainListSlotClassNames.paginationRoot()}
    >
      <button
        class={mainListSlotClassNames.prevTrigger()}
      ></button>
      <button
       class={mainListSlotClassNames.item()}
      >
        1
      </button>
      <button
        class={mainListSlotClassNames.nextTrigger()}
      >
      </button>
    </nav>
  </MainList.Footer>
</MainList.Root>