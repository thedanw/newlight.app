'use client'
import { forwardRef } from 'react'
import { Text } from '../text'
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
      return <div ref={ref} className={mainListSlotClassNames.rowContent()} {...props}>{children}</div>
    }
    return (
      <div ref={ref} className={mainListSlotClassNames.rowContent()} {...props}>
        {primary && <Text fontWeight="medium" truncate>{primary}</Text>}
        {secondary && <Text color="fg.muted" fontSize="sm" truncate>{secondary}</Text>}
        {meta && <div style={{ marginTop: '2' }}>{meta}</div>}
      </div>
    )
  },
)
RowContent.displayName = 'MainList.Row.Content'