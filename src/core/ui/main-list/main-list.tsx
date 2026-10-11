'use client'
import { useState, useCallback, useMemo } from 'react'
import { type ComponentProps } from 'react'
import { Edit2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Icon } from '../icon'
import { Root as Pagination, PrevTrigger, NextTrigger, Item, Items } from '../pagination'
import { SearchInput } from '../search-input'
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

export function RootComponent<T>({
  items,
  getKey,
  renderRow,
  headers = [],
  search,
  pagination,
  toolbar,
  selection,
  massManage,
  ...props
}: MainListRootProps<T> & ComponentProps<'div'>) {
  const [selectMode, setSelectMode] = useState(false)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(selection?.selectedKeys ?? new Set())

  // Sync selection from props
  const handleSelectionChange = useCallback((keys: Set<string>) => {
    setSelectedKeys(keys)
    selection?.onSelectionChange?.(keys)
    setSelectMode(keys.size > 0)
  }, [selection])

  // Select all visible (current page)
  const handleSelectVisible = useCallback(() => {
    const visibleKeys = items.map(getKey)
    const newKeys = new Set([...selectedKeys, ...visibleKeys])
    handleSelectionChange(newKeys)
  }, [items, getKey, selectedKeys, handleSelectionChange])

  // Select all filtered (would need search results - for now same as visible)
  const handleSelectAll = useCallback(() => {
    const allKeys = items.map(getKey)
    const newKeys = new Set([...selectedKeys, ...allKeys])
    handleSelectionChange(newKeys)
  }, [items, getKey, selectedKeys, handleSelectionChange])

  // Deselect all
  const handleDeselectAll = useCallback(() => {
    handleSelectionChange(new Set())
  }, [handleSelectionChange])

  // Delete selected
  const handleDeleteSelected = useCallback(async () => {
    if (massManage?.onDeleteSelected && selectedKeys.size > 0) {
      await massManage.onDeleteSelected(Array.from(selectedKeys))
      handleSelectionChange(new Set())
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
          onClick={() => {
            // Row click handled by renderRow
          }}
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
              onClick={() => {}} // Handled by Row component
            />
          }
          toolbar={
            <RowToolbar open={false} onClose={() => {}}>
              {/* Toolbar content rendered by renderRow */}
            </RowToolbar>
          }
        >
          {renderRow(item, index)}
        </Row>
      )
    })
  }, [items, getKey, selectedKeys, selectMode, handleSelectionChange, renderRow])

  // Mass manage component
  const massManageComponent = useMemo(() => {
    if (!massManage) return null
    const visibleKeys = items.map(getKey)
    const allVisibleSelected = visibleKeys.length > 0 && visibleKeys.every(k => selectedKeys.has(k))
    const allFilteredSelected = items.length > 0 && items.every(item => selectedKeys.has(getKey(item)))

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
      {search && (
        <div style={{ padding: '0 4' }}>
          <SearchInput
            search={async (term) => {
              search.onSearch?.(term)
              return [] as any
            }}
            onResults={() => {}}
            onSearching={() => {}}
            placeholder={search.placeholder}
          />
        </div>
      )}
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