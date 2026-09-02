'use client'
import { ark } from '@ark-ui/react/factory'
import { forwardRef, type ComponentProps, type ReactNode } from 'react'
import { css } from 'styled-system/css'
import { createStyleContext } from 'styled-system/jsx'
import { page } from 'styled-system/recipes'
import type { SystemStyleObject } from 'styled-system/types'

const { withProvider, withContext } = createStyleContext(page)

export type RootProps = ComponentProps<typeof Root>
export const Root = withProvider(ark.div, 'root')

// Header wraps its children in an internal flex group (gap 2, flex 1,
// minWidth 0) so callers don't need an HStack wrapper for the left-hand
// chrome (back button + breadcrumbs / heading). The header itself stays a
// plain slot so it remains structurally consistent with the other slots.
const headerInnerCss = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  flex: '1',
  minWidth: '0',
})

const HeaderBase = withContext(ark.header, 'header')

// Hero header styles — mirrors the `headerVariant: "hero"` recipe variant.
// `Header` is a `withContext` slot (it reads slot styles from the `Page.Root`
// provider and cannot split recipe variant props itself), so the hero styles
// are applied directly here and merged through the `css` prop.
const heroHeaderCss: SystemStyleObject = {
  position: 'relative',
  zIndex: '1',
  overflow: 'hidden',
  borderBottom: 'none',
  borderRadius: '0',
  color: 'var(--colors-color-palette-solid-fg)',
  padding: { base: '9', md: '12' },
  paddingTop: { base: '16', md: '16' },
  paddingBottom: { base: '14', md: '14' },
  fontSize: '2xl',
  /* Background layer: same saturation/brightness as the accent solid, hue
     rotated by the module number. Applied to a ::before so the header's own
     children (h1, back button) are NOT hue-shifted. */
  _before: {
    content: '""',
    position: 'absolute',
    inset: '0',
    zIndex: '-1',
    pointerEvents: 'none',
    background: 'var(--colors-color-palette-solid-bg)',
    filter: 'hue-rotate(calc(60deg * var(--module-number, 0)))',
  },
}

export type HeaderProps = ComponentProps<typeof HeaderBase> & {
  children?: ReactNode
  /** `hero` tints the header with the module's accent hue (see page recipe). */
  headerVariant?: 'default' | 'hero'
}
export const Header = forwardRef<HTMLElement, HeaderProps>(
  ({ children, headerVariant = 'default', css: cssProp, ...props }, ref) => {
    const callerCss = (Array.isArray(cssProp) ? Object.assign({}, ...cssProp) : cssProp) as
      | SystemStyleObject
      | undefined
    const mergedCss = headerVariant === 'hero' ? { ...heroHeaderCss, ...callerCss } : callerCss
    return (
      <HeaderBase ref={ref} {...props} css={mergedCss}>
        <div className={headerInnerCss}>{children}</div>
      </HeaderBase>
    )
  },
)
Header.displayName = 'PageHeader'

export const Body = withContext(ark.div, 'body')
export const Footer = withContext(ark.div, 'footer')
