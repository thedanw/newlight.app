'use client'
import { useCallback, useMemo } from 'react'
import { type ComponentProps } from 'react'
import { Edit2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Icon } from '../icon'
import { Root as Pagination, PrevTrigger, NextTrigger, Item, Items } from '../pagination'
import {
  Root,
  Rows,
  Footer,
  mainListCssVars,
} from './main-list-context'
import { RowSelect } from './main-list-row-select'
import { RowButton } from './main-list-row-button'
import { Row } from './main-list-row'
import { RowContent } from './main-list-row-content'
import { RowToolbar } from './main-list-row-toolbar'
import { RowHeader } from './main-list-row-header'
import { Toolbar, MassManage, PrimaryActions, SecondaryActions } from './main-list-toolbar'
import type {
  MainListRootProps,
  MainListFooterProps,
} from './main-list.types'

export type RootProps = ComponentProps<typeof Root>

/** Stable empty selection set (avoids re-creating a new Set each render). */
const EMPTY_SELECTION: ReadonlySet<string> = new Set<string>()

export function RootComponent<T>({
  items,
  getKey,
  renderRow,
  renderRowToolbar,
  onRowClick,
  headers = [],
  pagination,
  toolbar,
  selection,
  massManage,
  ...props
}: MainListRootProps<T> & ComponentProps<'div'>) {
  // D3: Root is the controlled owner of selection. There is no internal
  // `selectedKeys` state — the consumer's `selection.selectedKeys` is the
  // single source of truth (fixes split-brain, findings #3).
  const selectedKeys = selection?.selectedKeys ?? EMPTY_SELECTION
  const selectMode = selectedKeys.size > 0

  // Sync selection from props
  const handleSelectionChange = useCallback((keys: Set<string>) => {
    selection?.onSelectionChange?.(keys)
  }, [selection])

  // Select all visible (current page)
  const handleSelectVisible = useCallback(() => {
    const visibleKeys = items.map(getKey)
    const newKeys = new Set([...selectedKeys, ...visibleKeys])
    handleSelectionChange(newKeys)
    selection?.onSelectVisible?.(visibleKeys)
  }, [items, getKey, selectedKeys, handleSelectionChange, selection])

  // Select all filtered (all matching search/filter, decision #28). Falls back
  // to the current page when the consumer doesn't supply `allFilteredKeys`.
  const handleSelectAll = useCallback(() => {
    const allKeys = selection?.allFilteredKeys ?? items.map(getKey)
    const newKeys = new Set([...selectedKeys, ...allKeys])
    handleSelectionChange(newKeys)
    selection?.onSelectAll?.(allKeys)
  }, [items, getKey, selectedKeys, handleSelectionChange, selection])

  // Deselect all
  const handleDeselectAll = useCallback(() => {
    handleSelectionChange(new Set())
  }, [handleSelectionChange])

  // Delete selected. A rejection from the consumer means the flow was
  // cancelled (e.g. the confirm dialog was dismissed) or failed — keep the
  // current selection rather than surfacing an unhandled rejection.
  const handleDeleteSelected = useCallback(async () => {
    if (massManage?.onDeleteSelected && selectedKeys.size > 0) {
      try {
        await massManage.onDeleteSelected(Array.from(selectedKeys))
        handleSelectionChange(new Set())
      } catch {
        // Intentionally ignored: selection is preserved on cancel/failure.
      }
    }
  }, [massManage, selectedKeys, handleSelectionChange])

  // Close mass manage
  const handleMassManageClose = useCallback(() => {
    handleSelectionChange(new Set())
    massManage?.onClose?.()
  }, [handleSelectionChange, massManage])

  // Render rows
  const rows = useMemo(() => {
    return items.map((item, index) => {
      const key = getKey(item)
      const isSelected = selectedKeys.has(key)
      return (
        <Row
          key={key}
          item={item}
          index={index}
          selected={isSelected}
          selectMode={selectMode}
          onClick={onRowClick ? () => onRowClick(item, index) : undefined}
          select={
            <RowSelect
              visible={selectMode}
              checked={isSelected}
              onChange={(checked: boolean) => {
                const newKeys = new Set(selectedKeys)
                if (checked) newKeys.add(key)
                else newKeys.delete(key)
                handleSelectionChange(newKeys)
              }}
            />
          }
          button={
            <RowButton
              icon={<Icon size="sm"><Edit2 /></Icon>}
              label="Manage"
            />
          }
          toolbar={renderRowToolbar?.(item, index)}
        >
          {renderRow(item, index)}
        </Row>
      )
    })
  }, [items, getKey, selectedKeys, selectMode, handleSelectionChange, renderRow, renderRowToolbar, onRowClick])

  // Mass manage component
  const massManageComponent = useMemo(() => {
    if (!massManage) return null
    const visibleKeys = items.map(getKey)
    const allVisibleSelected = visibleKeys.length > 0 && visibleKeys.every(k => selectedKeys.has(k))
    // "Select All" must be evaluated against every key matching the search
    // (decision #28), not just the current page — fall back to the page when
    // the consumer doesn't supply `allFilteredKeys`.
    const filteredKeys = selection?.allFilteredKeys ?? visibleKeys
    const allFilteredSelected = filteredKeys.length > 0 && filteredKeys.every(k => selectedKeys.has(k))

    return (
      <MassManage
        selectedCount={selectedKeys.size}
        allVisibleSelected={allVisibleSelected}
        allFilteredSelected={allFilteredSelected}
        onSelectVisible={handleSelectVisible}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onDeleteSelected={handleDeleteSelected}
        onClose={handleMassManageClose}
        deleting={massManage.deleting}
      />
    )
  }, [
    massManage,
    selection?.allFilteredKeys,
    items,
    getKey,
    selectedKeys,
    handleSelectVisible,
    handleSelectAll,
    handleDeselectAll,
    handleDeleteSelected,
    handleMassManageClose,
  ])

  // Toolbar component
  const toolbarComponent = useMemo(() => {
    if (!toolbar) return null
    return (
      <Toolbar
        primaryActions={toolbar.primaryActions}
        secondaryActions={toolbar.secondaryActions}
        massManage={massManageComponent}
      />
    )
  }, [toolbar, massManageComponent])

  return (
    <Root
      ref={props.ref}
      className={mainListCssVars}
      {...props}
    >
      {toolbarComponent}
      {headers.length > 0 && (
        <RowHeader headers={headers} selectMode={selectMode} />
      )}
      <Rows>{rows}</Rows>
      {pagination && (
        <FooterComponent
          currentPage={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onPageChange={pagination.onPageChange}
        />
      )}
    </Root>
  )
}

RootComponent.displayName = 'MainList.Root'

// Add sub-components to Root
Object.assign(RootComponent, {
  Row,
  RowHeader,
  Toolbar,
  Footer: FooterComponent,
  Rows,
})

Object.assign(Toolbar, {
  PrimaryActions,
  SecondaryActions,
  MassManage,
})

Object.assign(Row, {
  Select: RowSelect,
  Button: RowButton,
  Toolbar: RowToolbar,
  Content: RowContent,
})

// Footer component
export type FooterProps = ComponentProps<typeof FooterComponent>

export function FooterComponent({
  currentPage,
  pageSize,
  total,
  onPageChange,
  ...props
}: MainListFooterProps & ComponentProps<'div'>) {
  const totalPages = Math.ceil(total / pageSize)
  const hasNextPage = currentPage < totalPages

  return (
    <Footer {...props}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2', fontSize: 'sm', color: 'fg.muted' }}>
        Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, total)} of {total}
      </div>
      <Pagination
        key={currentPage}
        count={hasNextPage ? currentPage * pageSize : total}
        pageSize={pageSize}
        defaultPage={currentPage}
        onPageChange={(details) => onPageChange(details.page)}
      >
        <PrevTrigger>
          <Icon size="sm"><ChevronLeft /></Icon>
        </PrevTrigger>
        <Items render={(item) => <Item type="page" value={item.value} />} />
        <NextTrigger>
          <Icon size="sm"><ChevronRight /></Icon>
        </NextTrigger>
      </Pagination>
    </Footer>
  )
}

FooterComponent.displayName = 'MainList.Footer'
RootComponent.Footer = FooterComponent

// Rows container (for direct use if needed)
export type RowsProps = ComponentProps<typeof Rows>

export function RowsComponent({ children, ...props }: ComponentProps<'div'>) {
  return <Rows {...props}>{children}</Rows>
}

RowsComponent.displayName = 'MainList.Rows'
RootComponent.Rows = RowsComponent

// Export MainList namespace for proper sub-component access
export const MainList = {
  Root: RootComponent,
  Row,
  RowHeader,
  Toolbar,
  Footer: FooterComponent,
  Rows: RowsComponent,
  RowSelect,
  RowButton,
  RowToolbar,
  RowContent,
  PrimaryActions,
  SecondaryActions,
  MassManage,
} as const