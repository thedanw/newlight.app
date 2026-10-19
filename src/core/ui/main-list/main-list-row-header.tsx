'use client'
import { forwardRef } from 'react'
import { Text } from '../text'
import { HStack } from 'styled-system/jsx'
import { mainListSlotClassNames } from './main-list-context'
import type { MainListHeaderConfig } from './main-list.types'
import { css } from 'styled-system/css'

export interface RowHeaderProps {
  headers?: MainListHeaderConfig[]
  selectMode?: boolean
}

export const RowHeader = forwardRef<HTMLDivElement, RowHeaderProps>(
  function RowHeader({ headers = [], selectMode, ...props }, ref) {
    return (
      <HStack
        ref={ref}
        className={`${mainListSlotClassNames.rowHeader()} ${css({ fontSize: 'xs' })}`}
        style={{ color: 'var(--colors-fg-subtle', backgroundColor: 'var(--colors-bg-subtle)' } as React.CSSProperties}
        {...props}
      >
        <div style={{ width: 'var(--main-list-select-width, 0px)', maxWidth: 'var(--main-list-select-width, 0px)', overflow: 'hidden' }} />
        {headers.map((header: MainListHeaderConfig) => (
          <div
            key={header.key}
            style={{
              padding: '3',
              textAlign: header.align ?? 'left',
              width: header.width,
              minWidth: header.width,
              maxWidth: header.width,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <Text color="fg.muted">
              {header.label}
            </Text>
          </div>
        ))}
        <div style={{ width: '10', textAlign: 'center' }} />
      </HStack>
    )
  },
)
RowHeader.displayName = 'MainList.RowHeader'
