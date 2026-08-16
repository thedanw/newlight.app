'use client'
import { type ComponentProps, type ReactNode, forwardRef } from 'react'
import { styled } from 'styled-system/jsx'
import { pullTab } from 'styled-system/recipes'
import { css } from 'styled-system/css'
import { Icon } from '@/core/ui'

type BasePullTabProps = ComponentProps<typeof BasePullTab>
const BasePullTab = styled('button', pullTab)

export interface PullTabProps extends BasePullTabProps {
  /** The icon/content to display in the pull tab (hamburger→X morph) */
  children: ReactNode
  /** Whether the sidebar is open (for styling) */
  open?: boolean
  /** Click handler */
  onClick?: () => void
}

export const PullTab = forwardRef<HTMLButtonElement, PullTabProps>(
  ({ children, open = false, onClick, ...props }, forwardedRef) => {
    return (
      <BasePullTab
        ref={forwardedRef}
        type="button"
        data-open={open ? '' : undefined}
        onClick={(event) => {
          // Never let the toggle's own click count as a "click outside" that
          // would immediately close the sidebar it just opened.
          event.stopPropagation()
          onClick?.()
        }}
        {...props}
      >
        <Icon size="sm" aria-hidden="true" className={css({ display: 'flex', alignItems: 'center', justifyContent: 'center' })}>
          {children}
        </Icon>
      </BasePullTab>
    )
  }
)

PullTab.displayName = 'PullTab'