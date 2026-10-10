'use client'
import { forwardRef } from 'react'
import { Edit2 } from 'lucide-react'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import { mainListSlotClassNames } from './main-list-context'

export interface RowButtonProps {
  icon?: React.ReactNode
  label?: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  variant?: 'plain' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export const RowButton = forwardRef<HTMLButtonElement, RowButtonProps>(
  function RowButton({ icon, label = 'Manage', onClick, disabled = false, variant = 'plain', size = 'md', ...props }, ref) {
    return (
      <IconButton
        ref={ref}
        variant={variant}
        size={size}
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={mainListSlotClassNames.rowButton({ variant, size })}
        {...props}
      >
        <Icon size="sm">{icon ?? <Edit2 />}</Icon>
      </IconButton>
    )
  },
)
RowButton.displayName = 'MainList.Row.Button'