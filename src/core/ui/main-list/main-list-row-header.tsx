'use client'
import { forwardRef } from 'react'
import { Text } from '../text'
import { mainListSlotClassNames } from './main-list-context'
import type { MainListHeaderConfig } from './main-list.types'

export interface RowHeaderProps extends ComponentProps<'div'> {
  headers?: MainListHeaderConfig[]
  selectMode?: boolean
}

export const RowHeader = forwardRef<HTMLDivElement, RowHeaderProps>(
  function RowHeader({ headers = [], selectMode, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={mainListSlotClassNames.rowHeader()}
        style={{ fontWeight: 'semibold', color: 'var(--colors-fg-muted)', backgroundColor: 'var(--colors-bg-subtle)' } as React.CSSProperties}
        {...props}
      >
        <div style={{ width: 'var(--main-list-select-width, 0px)', maxWidth: 'var(--main-list-select-width, 0px)', overflow: 'hidden' }} />
        {headers.map((header: MainListHeaderConfig) => (
          <div
            key={header.key}
            style={{
              padding: '3 4',
              textAlign: header.align ?? 'left',
              width: header.width,
              minWidth: header.width,
              maxWidth: header.width,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <Text fontWeight="semibold" color="fg.muted" fontSize="sm">
              {header.label}
            </Text>
          </div>
        ))}
        <div style={{ width: '10', textAlign: 'center' }} />
      </div>
    )
  },
)
RowHeader.displayName = 'MainList.RowHeader'