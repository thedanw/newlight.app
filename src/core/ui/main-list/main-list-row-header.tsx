'use client'
import { forwardRef } from 'react'
import { css } from 'styled-system/css'
import { Text } from '../text'
import { mainListSlotClassNames } from './main-list-context'
import type { MainListHeaderConfig } from './main-list.types'

export interface RowHeaderProps {
  headers?: MainListHeaderConfig[]
  selectMode?: boolean
}

export const RowHeader = forwardRef<HTMLDivElement, RowHeaderProps>(
  function RowHeader({ headers = [], selectMode = false, ...props }, ref) {
    // fontWeight/color/bg/padding come from the recipe base — no inline style.
    return (
      <div
        ref={ref}
        className={mainListSlotClassNames.rowHeader()}
        data-select-mode={selectMode}
        {...props}
      >
        {/* Reserve space for the row select column so headers align with rows. */}
        <div className={css({ width: 'var(--main-list-select-width, 0px)', maxWidth: 'var(--main-list-select-width, 0px)', overflow: 'hidden', flexShrink: '0' })} />
        {headers.map((header: MainListHeaderConfig) => (
          <div
            key={header.key}
            className={css({
              padding: '3 4',
              textAlign: header.align ?? 'left',
              width: header.width,
              minWidth: header.width,
              maxWidth: header.width,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            })}
          >
            <Text fontWeight="semibold" color="fg.muted" fontSize="sm">
              {header.label}
            </Text>
          </div>
        ))}
        {/* Reserve space for the row action button column. */}
        <div className={css({ width: '10', textAlign: 'center', flexShrink: '0' })} />
      </div>
    )
  },
)
RowHeader.displayName = 'MainList.RowHeader'