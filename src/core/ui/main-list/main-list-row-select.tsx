'use client'
import { forwardRef } from 'react'
import { Check } from 'lucide-react'
import { Icon } from '../icon'
import { Checkbox } from '../checkbox'
import { mainListSlotClassNames } from './main-list-context'

export interface RowSelectProps {
  visible: boolean
  checked: boolean
  onChange?: (checked: boolean) => void
}

export const RowSelect = forwardRef<HTMLDivElement, RowSelectProps>(
  function RowSelect({ visible = false, checked = false, onChange, ...props }, ref) {
    // D1: width is driven by the recipe `visible` variant — no inline CSS var.
    return (
      <div
        ref={ref}
        className={mainListSlotClassNames.rowSelect({ visible })}
        {...props}
      >
        <Checkbox.Root
          checked={checked}
          onCheckedChange={(details) => onChange?.(details.checked as boolean)}
          aria-label="Select row"
        >
          <Checkbox.Control asChild>
            <Icon size="sm"><Check /></Icon>
          </Checkbox.Control>
        </Checkbox.Root>
      </div>
    )
  },
)
RowSelect.displayName = 'MainList.Row.Select'