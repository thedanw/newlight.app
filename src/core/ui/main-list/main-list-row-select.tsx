'use client'
import { forwardRef } from 'react'
import { Checkbox } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import { mainListSlotClassNames } from './main-list-context'

export interface RowSelectProps {
  checked: boolean
  onChange?: (checked: boolean) => void
}

export const RowSelect = forwardRef<HTMLDivElement, RowSelectProps>(
  function RowSelect({ checked = false, onChange, ...props }, ref) {
    // D1: width is driven by --main-list-select-width CSS var on parent row (data-select-mode)
    return (
      <Stack
        ref={ref}
        className={mainListSlotClassNames.rowSelect()}
        {...props}
      >
        <Checkbox.Root
          checked={checked}
          onCheckedChange={(details) => onChange?.(details.checked as boolean)}
          aria-label="Select row"
        >
          {/* Native input keeps the control keyboard-accessible and clickable. */}
          <Checkbox.HiddenInput />
          <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                </Checkbox.Root>
      </Stack>
    )
  },
)
RowSelect.displayName = 'MainList.Row.Select'