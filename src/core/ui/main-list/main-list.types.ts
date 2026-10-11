'use client'
import type { ComponentProps, MouseEvent, ReactNode } from 'react'

/** MainList.Root props */
export interface MainListRootProps<T> extends ComponentProps<'div'> {
  /** Data items to render */
  items: T[]
  /** Unique key extractor for items */
  getKey: (item: T) => string
  /** Render function for each row */
  renderRow: (item: T, index: number) => ReactNode
  /** Optional header configuration */
  headers?: MainListHeaderConfig[]
  /** Search configuration */
  search?: {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    onSearch?: (term: string) => void
  }
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
    selectedKeys: Set<string>
    onSelectionChange: (keys: Set<string>) => void
    /** Keys for ALL items matching the current search/filter (not just the visible page) — enables true "Select All" (decision #28) */
    allFilteredKeys?: string[]
    onSelectAll?: (allKeys: string[]) => void
    onSelectVisible?: (visibleKeys: string[]) => void
  }
  /** Mass manage configuration */
  massManage?: {
    visible: boolean
    onClose: () => void
    onDeleteSelected: (keys: string[]) => Promise<void>
    selectedCount: number
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
  /** Whether select column is visible */
  visible: boolean
  /** Whether this row is selected */
  checked: boolean
  /** Checkbox change handler */
  onChange?: (checked: boolean) => void
  /** Animation duration in ms */
  duration?: number
}

/** MainList.Row.Button props */
export interface MainListRowButtonProps extends Omit<ComponentProps<'button'>, 'onClick'> {
  /** Button icon */
  icon?: ReactNode
  /** Button label (for accessibility) */
  label?: string
  /** Click handler */
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  /** Whether button is disabled */
  disabled?: boolean
  /** Visual variant */
  variant?: 'plain' | 'outline'
  /** Size */
  size?: 'sm' | 'md' | 'lg'
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