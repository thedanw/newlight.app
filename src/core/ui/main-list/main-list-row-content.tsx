'use client'
import { forwardRef } from 'react'
import { Text } from '../text'
import { Stack } from 'styled-system/jsx'
import { mainListSlotClassNames } from './main-list-context'
import type { MainListHeaderConfig } from './main-list.types'

export interface RowContentProps {
  /** Primary content (e.g., name) */
  primary?: React.ReactNode
  /** Secondary content (e.g., description) */
  secondary?: React.ReactNode
  /** Meta content (e.g., badge) */
  meta?: React.ReactNode
  /** Children (alternative to slots) */
  children?: React.ReactNode
  /** Column configuration for consistent alignment across modules */
  headers?: MainListHeaderConfig[]
}

export const RowContent = forwardRef<HTMLDivElement, RowContentProps>(
  function RowContent({ primary, secondary, meta, children, headers, ...props }, ref) {
    // Build column styles from headers config for consistent alignment
    const colStyles = headers?.reduce((acc, h) => {
      const isFlexWidth = h.width === '1fr'
      acc[h.key] = {
        flex: isFlexWidth ? '1 1 0%' : `width: ${h.width}`,
        minWidth: isFlexWidth ? undefined : h.width,
        maxWidth: isFlexWidth ? undefined : h.width,
        textAlign: h.align,
      }
      return acc
    }, {} as Record<string, { flex?: string; minWidth?: string; maxWidth?: string; textAlign?: string }>) || {}

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