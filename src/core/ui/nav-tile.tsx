'use client'
import { type ComponentProps, type ReactNode, forwardRef } from 'react'
import { styled } from 'styled-system/jsx'
import { navTile } from 'styled-system/recipes'
import { css } from 'styled-system/css'
import { Icon } from '@/core/ui'

type BaseNavTileProps = ComponentProps<typeof BaseNavTile>
const BaseNavTile = styled('button', navTile)

export interface NavTileProps extends BaseNavTileProps {
  /** The icon to display in the tile */
  icon: ReactNode
  /** The label text */
  label: string
  /** Click handler */
  onClick?: () => void
}

export const NavTile = forwardRef<HTMLButtonElement, NavTileProps>(
  ({ icon, label, active = false, disabled = false, onClick, ...props }, ref) => {
    return (
      <BaseNavTile
        ref={ref}
        type="button"
        data-active={active ? '' : undefined}
        data-disabled={disabled ? '' : undefined}
        onClick={onClick}
        disabled={disabled}
        {...props}
      >
        <Icon size="md" aria-hidden="true">
          {icon}
        </Icon>
        <span className={css({ fontSize: 'xs', fontWeight: 'bold', lineHeight: '1', textAlign: 'center' })}>
          {label}
        </span>
      </BaseNavTile>
    )
  }
)

NavTile.displayName = 'NavTile'