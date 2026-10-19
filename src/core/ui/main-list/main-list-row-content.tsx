'use client'
import { forwardRef } from 'react'
import { Text } from '../text'
import { Stack } from 'styled-system/jsx'
import { mainListSlotClassNames } from './main-list-context'

export interface RowContentProps {
  primary?: React.ReactNode
  secondary?: React.ReactNode
  meta?: React.ReactNode
  children?: React.ReactNode
}

export const RowContent = forwardRef<HTMLDivElement, RowContentProps>(
  function RowContent({ primary, secondary, meta, children, ...props }, ref) {
    if (children) {
          return <Stack ref={ref} className={mainListSlotClassNames.rowContent()} {...props}>{children}</Stack>
    }
    return (
          <Stack ref={ref} className={mainListSlotClassNames.rowContent()} {...props}>
        {primary && <Text fontWeight="medium" truncate>{primary}</Text>}
        {secondary && <Text color="fg.muted" fontSize="sm" truncate>{secondary}</Text>}
        {meta && <Stack className="main-list__row-content-meta" mt="2">{meta}</Stack>}
      </Stack>
    )
  },
)
RowContent.displayName = 'MainList.Row.Content'