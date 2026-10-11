'use client'
import { forwardRef } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { Icon } from '../icon'
import { Button } from '../button'
import { mainListSlotClassNames } from './main-list-context'

export interface ToolbarProps {
  primaryActions?: React.ReactNode
  secondaryActions?: React.ReactNode
  massManage?: React.ReactNode
}

export const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(
  function Toolbar({ primaryActions, secondaryActions, massManage, ...props }, ref) {
    return (
        <div ref={ref} className={mainListSlotClassNames.toolbar()} {...props}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2' }}>
          {primaryActions}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2', marginLeft: 'auto' }}>
          {secondaryActions}
        </div>
        {massManage}
      </div>
    )
  },
)
Toolbar.displayName = 'MainList.Toolbar'

/** PrimaryActions slot */
export interface PrimaryActionsProps {
  children?: React.ReactNode
}

export const PrimaryActions = forwardRef<HTMLDivElement, PrimaryActionsProps>(
  function PrimaryActions({ children, ...props }, ref) {
    return (
      <div ref={ref} style={{ display: 'flex', alignItems: 'center', gap: '2' }} {...props}>
        {children}
      </div>
    )
  },
)
PrimaryActions.displayName = 'MainList.Toolbar.PrimaryActions'

/** SecondaryActions slot */
export interface SecondaryActionsProps {
  children?: React.ReactNode
}

export const SecondaryActions = forwardRef<HTMLDivElement, SecondaryActionsProps>(
  function SecondaryActions({ children, ...props }, ref) {
    return (
      <div ref={ref} style={{ display: 'flex', alignItems: 'center', gap: '2' }} {...props}>
        {children}
      </div>
    )
  },
)
SecondaryActions.displayName = 'MainList.Toolbar.SecondaryActions'

/** MassManage component */
export interface MassManageProps {
  selectedCount: number
  allVisibleSelected: boolean
  allFilteredSelected: boolean
  onSelectVisible: () => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onDeleteSelected: () => Promise<void>
  onClose: () => void
  deleting?: boolean
}

export const MassManage = forwardRef<HTMLDivElement, MassManageProps>(
  function MassManage({
    selectedCount = 0,
    allVisibleSelected = false,
    allFilteredSelected = false,
    onSelectVisible,
    onSelectAll,
    onDeselectAll,
    onDeleteSelected,
    onClose,
    deleting = false,
    ...props
  }, ref) {
    return (
      <div
        ref={ref}
        className={mainListSlotClassNames.massManage()}
        data-visible={selectedCount > 0}
        {...props}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '3', flexWrap: 'wrap', width: 'full' }}>
          <span style={{ fontSize: 'sm', color: 'fg.default' }}>
            {selectedCount} selected
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2', flex: '1', justifyContent: 'flex-end' }}>
            <Button
              variant="plain"
              size="sm"
              onClick={onSelectVisible}
              disabled={allVisibleSelected}
            >
              Select Visible
            </Button>
            <Button
              variant="plain"
              size="sm"
              onClick={onSelectAll}
              disabled={allFilteredSelected}
            >
              Select All
            </Button>
            <Button
              variant="plain"
              size="sm"
              onClick={onDeselectAll}
            >
              Deselect All
            </Button>
            <Button
              variant="solid"
              size="sm"
              colorPalette="red"
              onClick={onDeleteSelected}
              disabled={deleting || selectedCount === 0}
            >
              Delete ({selectedCount})
            </Button>
            <Button
              variant="plain"
              size="sm"
              onClick={onClose}
              aria-label="Clear selection"
            >
              <Icon size="sm"><SlidersHorizontal /></Icon>
            </Button>
          </div>
        </div>
      </div>
    )
  },
)
MassManage.displayName = 'MainList.Toolbar.MassManage'

/** Toolbar slot exports */
Object.assign(Toolbar, {
  PrimaryActions,
  SecondaryActions,
  MassManage,
})