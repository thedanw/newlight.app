'use client'
import { forwardRef } from 'react'
import { X } from 'lucide-react'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import { mainListSlotClassNames } from './main-list-context'

export interface RowToolbarProps {
  open?: boolean
  children?: React.ReactNode
  onClose?: () => void
}

export const RowToolbar = forwardRef<HTMLDivElement, RowToolbarProps>(
  function RowToolbar({ open = false, children, onClose, ...props }, ref) {
    // D2: the recipe's `&[data-open="true"]` selector drives the max-height
    // transition, so the attribute must be present on the element.
    return (
      <div
        ref={ref}
        className={mainListSlotClassNames.rowToolbar()}
        data-open={open}
        {...props}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '2', width: 'full' }}>
          {children}
          {onClose && (
            <IconButton
              variant="plain"
              size="sm"
              onClick={onClose}
              aria-label="Close toolbar"
            >
              <Icon size="sm"><X /></Icon>
            </IconButton>
          )}
        </div>
      </div>
    )
  },
)
RowToolbar.displayName = 'MainList.Row.Toolbar'