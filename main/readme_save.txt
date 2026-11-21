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
â”œâ”€â”€ main-list.tsx          # Root component - controls selection, pagination, rendering
â”œâ”€â”€ main-list-context.ts   # Context provider - selection state, callbacks
â”œâ”€â”€ main-list.css.ts       # CSS variables and styling
â”œâ”€â”€ main-list-types.ts     # Type definitions for props and configs
â”œâ”€â”€ main-list-row.tsx      # Individual row component
â”œâ”€â”€ main-list-row-content.tsx  # Row content area - name, description, meta
â”œâ”€â”€ main-list-row-header.tsx   # Row header - column titles
â”œâ”€â”€ main-list-row-select.tsx   # Row selection checkboxes
â”œâ”€â”€ main-list-row-toolbar.tsx  # Row action buttons (view, edit, etc.)
â”œâ”€â”€ main-list-toolbar.tsx    # Component toolbar (mass manage, actions)
â””â”€â”€ __tests__/           # Test files
```

## Implementation Hierarchy

```
MainList.Root
â”œâ”€ MainList.Header (RowHeader)
â”‚   â””â”€ Renders column titles with flex-based width styling
â”‚   â”œâ”€ Handles 1fr â†’ flex: '1 1 0%'
â”‚   â””â”€ Handles 120px â†’ width: '120px' with min/max constraints
â”œâ”€ MainList.Rows (Row)
â”‚   â””â”€ Renders individual list items
â”‚   â”œâ”€ MainList.RowContent
â”‚   â”‚   â””â”€ Name, visibility, submissions columns
â”‚   â”‚   â”œâ”€ Uses same flex styling as RowHeader
â”‚   â”‚   â””â”€ Consistent column sizing
â”‚   â”œâ”€ MainList.RowSelect
â”‚   â”‚   â””â”€ Selection checkbox
â”‚   â””â”€ MainList.RowToolbar
â”‚       â””â”€ Action buttons (view, edit, delete)
â”œâ”€ MainList.Toolbar
â”‚   â”œâ”€ MainList.PrimaryActions
â”‚   â”‚   â””â”€ MassManageButton, etc.
â”‚   â””â”€ MainList.SecondaryActions
â”‚       â””â”€ Additional actions
```

## Component Structure (JSX Hierarchy)

```tsx
<MainList.Root>
  <MainList.Header>
    <HStack>
      <Div style={{ width: 'var(--main-list-select-width, 0px)', maxWidth: 'var(--main-list-select-width, 0px)', overflow: 'hidden' }} />
      {headers.map((header: MainListHeaderConfig) => {
        const isFlexWidth = header.width === '1fr'
        return (
          <Div
            key={header.key}
            style={{
              padding: '3',
              textAlign: header.align ?? 'left',
              flex: isFlexWidth ? '1 1 0%' : `width: ${header.width}`,
              minWidth: isFlexWidth ? undefined : header.width,
              maxWidth: isFlexWidth ? undefined : header.width,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <Text color="fg.muted">
              {header.label}
            </Text>
          </Div>
        )
      })}
      <Div style={{ width: '10', textAlign: 'center' }} />
    </HStack>
  </MainList.Header>
  <MainList.Body>
    <MainList.Row>
      <MainList.RowContent>
        <Div style={{ flex: '1 1 0%', minWidth: 0, ...colStyles.name }}>
          <Div>
            <Text fontWeight="medium" truncate>{form.name}</Text>
          </Div>
        </Div>
        <Div style={{ width: '120px', minWidth: '120px', maxWidth: '120px', textAlign: 'center', ...colStyles.visibility }}>
          <span>{form.is_public ? 'Public' : 'Private'}</span>
        </Div>
        <Div style={{ width: '120px', minWidth: '120px', maxWidth: '120px', textAlign: 'center', color: 'fg.muted', fontSize: 'sm', ...colStyles.submissions }}>
          {submissionCounts[form.id] ?? 0}
        </Div>
      </MainList.RowContent>
    </MainList.Row>
    <MainList.RowSelect />
    <MainList.RowToolbar />
  </MainList.Body>
</MainList.Root>
```

### MainList.Root
The root wrapper that provides all MainList functionality:

| Prop | Type | Description |
|------|------|-------------|
| `items` | `T[]` | List of items to display |
| `getKey` | `(item: T) => string` | Function to get unique key for each item |
| `renderRow` | `(item: T, index: number, headers?: MainListHeaderConfig[]) => ReactNode` | Render function for each row |
| `renderRowToolbar` | `(item: T) => ReactNode` | Render toolbar actions per row |
| `headers` | `MainListHeaderConfig[]` | Column configuration (name, visibility, submissions, etc.) |
| `pagination` | `PaginationProps` | Pagination configuration |
| `toolbar` | `ToolbarProps` | Toolbar configuration (primary/secondary actions) |
| `selection` | `SelectionProps` | Selection state and callbacks |
| `massManage` | `MassManageProps` | Mass management (delete, etc.) |

### MainList.RowHeader
Displays the column headers row. Now properly handles `1fr` width values using flex layout.

**Column styling logic:**
- `width: '1fr'` â†’ `flex: '1 1 0%'` (flexible, grows to fill space)
- `width: '120px'` â†’ `width: '120px'` with `minWidth: '120px'` and `maxWidth: '120px'`

### MainList.RowContent
Displays the content area for each row. Now uses the same flex-based column styling as RowHeader for consistency.

**Column styling (from headers config):**
- `flex: '1 1 0%'` for `1fr` widths
- `width: '120px'` / `minWidth: '120px'` / `maxWidth: '120px'` for fixed widths
- `textAlign: h.align` for text alignment

### MainList.RowSelect
Contains the selection checkbox for row selection.

### MainList.RowToolbar
Contains action buttons for each row (view, edit, duplicate, delete).

### MainList.Toolbar
Component-level toolbar with:
- **PrimaryActions**: Actions like mass manage button
- **SecondaryActions**: Additional actions

## Width Styling

The component now properly supports CSS Grid `1fr` unit for flexible column sizing:

```typescript
// Headers config example
headers={[
  { key: 'name', label: 'Name', width: '1fr' },
  { key: 'visibility', label: 'Visibility', width: '120px' },
  { key: 'submissions', label: 'Submissions', width: '120px' },
]}
```

**Behavior:**
- Name column (`1fr`): Grows to fill available space
- Visibility column (`120px`): Fixed width of 120px
- Submissions column (`120px`): Fixed width of 120px

This ensures consistent sizing between header (`RowHeader`) and content (`RowContent`) columns.

## Usage Example

```tsx
<MainList.Root
  items={forms}
  getKey={(form) => form.id}
  renderRow={(form) => <MainList.RowContent primary={form.name} />}
  headers={[
    { key: 'name', label: 'Name', width: '1fr' },
    { key: 'visibility', label: 'Visibility', width: '120px' },
    { key: 'submissions', label: 'Submissions', width: '120px' },
  ]}
  pagination={{ page, pageSize, total: filteredForms.length, onPageChange: setPage }}
  selection={{ selectedKeys, onSelectionChange: setSelectedKeys }}
  massManage={{ onDeleteSelected: handleMassDelete }}
/>
```

## CSS Custom Properties

The component defines these CSS variables (in `main-list.css.ts`):

```css
--main-list-select-width: 0px;
--main-list-row-height: 12;
```

These can be overridden via the `style` prop on `MainList.Root` or through global theme configuration.

