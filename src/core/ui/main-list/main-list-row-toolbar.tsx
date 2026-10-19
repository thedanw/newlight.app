'use client'
import { forwardRef } from 'react'
import { X } from 'lucide-react'
import { IconButton, Icon } from '@/core/ui'
import { Stack, HStack } from 'styled-system/jsx'
import { mainListSlotClassNames } from './main-list-context'

export interface RowToolbarProps {
  open?: boolean
  children?: React.ReactNode
  duration?: number
  onClose?: () => void
}

export const RowToolbar = forwardRef<HTMLDivElement, RowToolbarProps>(
  function RowToolbar({ open = false, children, onClose, ...props }, ref) {
    return (
      <Stack
        ref={ref}
        className={mainListSlotClassNames.rowToolbar()}
        data-open={open}
        {...props}
      >
        <HStack className="main-list__row-toolbar-group">
          {children}
          {onClose && (
            <IconButton
              variant="plain"
              size="fluidSm"
              onClick={onClose}
              aria-label="Close toolbar"
            >
              <Icon><X /></Icon>
            </IconButton>
          )}
        </HStack>
      </Stack>
    )
  },
)
RowToolbar.displayName = 'MainList.Row.Toolbar'