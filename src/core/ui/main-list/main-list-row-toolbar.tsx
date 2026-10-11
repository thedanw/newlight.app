'use client'
import { forwardRef } from 'react'
import { css } from 'styled-system/css'
import { X } from 'lucide-react'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import { mainListSlotClassNames } from './main-list-context'
import type { MainListRowToolbarProps } from './main-list.types'

/** Single source of truth shared with the MainList types module (fixes the
 *  drift where the local interface rejected div props like `id`/`tabIndex`). */
export type RowToolbarProps = MainListRowToolbarProps

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
        <div className={css({ display: 'flex', alignItems: 'center', gap: '2', width: 'full' })}>
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