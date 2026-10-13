'use client'
import type { ComponentProps, ReactNode } from 'react'

/** MainList.Root props */
export interface MainListRootProps<T> extends ComponentProps<'div'> {
  /** Data items to render */
  items: T[]
  /** Unique key extractor for items */
  getKey: (item: T) => string
  /** Render function for each row */
  renderRow: (item: T, index: number) => ReactNode
  /** Optional per-row toolbar renderer */
  renderRowToolbar?: (item: T, index: number) => ReactNode
  /** Optional row click handler (e.g., navigate to detail) */
  onRowClick?: (item: T, index: number) => void
  /** Optional header configuration */
  headers?: MainListHeaderConfig[]
  /** Pagination configuration */
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
  }
  /** Toolbar configuration */
  toolbar?: {
    primaryActions?: ReactNode
    secondaryActions?: ReactNode
  }
  /** Selection configuration */
  selection?: {
    /** Currently selected keys (controlled) */
    selectedKeys: Set<string>
    /** Called when selection changes */
    onSelectionChange: (keys: Set<string>) => void
    /** All keys matching current search/filter (for "Select All") */
    allFilteredKeys?: string[]
    /** Called when "Select All" is triggered */
    onSelectAll?: (allKeys: string[]) => void
    /** Called when "Select Visible" is triggered */
    onSelectVisible?: (visibleKeys: string[]) => void
  }
  /** Mass manage configuration */
  massManage?: {
    /** Whether mass manage bar is visible */
    visible: boolean
    /** Called to close mass manage */
    onClose: () => void
    /** Called to delete selected items */
    onDeleteSelected: (keys: string[]) => Promise<void>
    /** Number of selected items */
    selectedCount: number
    /** Whether delete is in progress */
    deleting?: boolean
  }
}

/** MainList.RowHeader configuration */
export interface MainListHeaderConfig {
  /** Column key */
  key: string
  /** Column label */
  label: string
  /** Column width (CSS) */
  width?: string
  /** Alignment */
  align?: 'left' | 'center' | 'right'
}

/** MainList.Row props */
export interface MainListRowProps<T> extends ComponentProps<'div'> {
  /** The item data */
  item: T
  /** Row index */
  index: number
  /** Whether row is selected */
  selected?: boolean
  /** Whether row is in select mode */
  selectMode?: boolean
  /** Row click handler */
  onClick?: () => void
  /** Row content */
  children: ReactNode
  /** Row select component */
  select?: ReactNode
  /** Row button component (manage button) */
  button?: ReactNode
  /** Row toolbar component */
  toolbar?: ReactNode
}

/** MainList.Row.Select props */
export interface MainListRowSelectProps extends Omit<ComponentProps<'div'>, 'onChange'> {
  /** Whether this row is selected */
  checked: boolean
  /** Checkbox change handler */
  onChange?: (checked: boolean) => void
}

/** MainList.Row.Button props */
export interface MainListRowButtonProps extends ComponentProps<'button'> {
  /** Button icon */
  icon?: ReactNode
  /** Button label (for accessibility) */
  label?: string
  /** Click handler */
  onClick?: () => void
  /** Whether button is disabled */
  disabled?: boolean
}

/** MainList.Row.Toolbar props */
export interface MainListRowToolbarProps extends ComponentProps<'div'> {
  /** Whether toolbar is open */
  open: boolean
  /** Toolbar content */
  children: ReactNode
  /** Animation duration in ms */
  duration?: number
  /** Close handler */
  onClose?: () => void
}

/** MainList.Row.Content props */
export interface MainListRowContentProps extends ComponentProps<'div'> {
  /** Primary content (e.g., name) */
  primary?: ReactNode
  /** Secondary content (e.g., description) */
  secondary?: ReactNode
  /** Meta content (e.g., badge) */
  meta?: ReactNode
  /** Children (alternative to slots) */
  children?: ReactNode
}

/** MainList.Toolbar props */
export interface MainListToolbarProps extends ComponentProps<'div'> {
  /** Primary actions (e.g., New Form) */
  primaryActions?: ReactNode
  /** Secondary actions (e.g., Filter) */
  secondaryActions?: ReactNode
  /** Mass manage component */
  massManage?: ReactNode
}

/** MainList.Toolbar.MassManage props */
export interface MainListToolbarMassManageProps extends ComponentProps<'div'> {
  /** Number of selected items */
  selectedCount: number
  /** Whether all visible items are selected */
  allVisibleSelected: boolean
  /** Whether all filtered items are selected */
  allFilteredSelected: boolean
  /** Select all visible handler */
  onSelectVisible: () => void
  /** Select all filtered handler */
  onSelectAll: () => void
  /** Deselect all handler */
  onDeselectAll: () => void
  /** Delete selected handler */
  onDeleteSelected: () => Promise<void>
  /** Close handler */
  onClose: () => void
  /** Whether delete is in progress */
  deleting?: boolean
}

/** MainList.Footer props */
export interface MainListFooterProps extends ComponentProps<'div'> {
  /** Current page (1-indexed) */
  currentPage: number
  /** Page size */
  pageSize: number
  /** Total items */
  total: number
  /** Page change handler */
  onPageChange: (page: number) => void
}