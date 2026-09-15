'use client'
import { ark } from '@ark-ui/react/factory'
import { ChevronLeftIcon } from 'lucide-react'
import { Children, forwardRef, isValidElement, useRef, type ComponentProps, type ReactNode } from 'react'
import { css } from 'styled-system/css'
import { createStyleContext } from 'styled-system/jsx'
import { page } from 'styled-system/recipes'
import type { SystemStyleObject } from 'styled-system/types'
import { BackButton } from './back-button'
import { useBreadcrumb } from './breadcrumb'
import { Heading as PageHeading } from './heading'
import { Icon } from './icon'

const { withProvider, withContext } = createStyleContext(page)

export type RootProps = ComponentProps<typeof Root>
export const Root = withProvider(ark.div, 'root')

const headerInnerCss = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  flex: '1',
  minWidth: '0',
})

const HeaderBase = withContext(ark.header, 'header')

export type HeaderProps = ComponentProps<typeof HeaderBase> & {
  children?: ReactNode
  headerVariant?: 'default'
}
export const HeaderTop = withContext(ark.header, 'headerTop')
export const Header = forwardRef<HTMLElement, HeaderProps>(
  ({ children, headerVariant = 'default', css: cssProp, ...props }, ref) => {
    const callerCss = (Array.isArray(cssProp) ? Object.assign({}, ...cssProp) : cssProp) as
      | SystemStyleObject
      | undefined
    return (
      <HeaderBase ref={ref} {...props} css={callerCss}>
        <div className={headerInnerCss}>{children}</div>
      </HeaderBase>
    )
  },
)
Header.displayName = 'PageHeader'

export const HeaderBottom = withContext(ark.header, 'headerBottom')
export const Body = withContext(ark.div, 'body')

const MainBase = withContext(ark.main, 'main')

export type MainProps = ComponentProps<typeof MainBase>

/**
 * Page.Main — the scroll container for a routed page.
 *
 * Enforces the page scaffold contract at dev time: every page must render
 * `<Page.Header>` and `<Page.Body>` as DIRECT children of `<Page.Main>` (the
 * AppShell already provides the outer `<Page.Root>`). `Page.HeaderTop` /
 * `Page.HeaderBottom` are optional siblings. `Page.Footer` is SHELL-OWNED:
 * AppShell renders it once (with `ActionFooter`) directly under `Page.Root`;
 * routed pages must NOT render it (enforced by `pnpm lint:pages`).
 *
 * Violations log a console warning so a page that forgets a slot is caught
 * immediately in the browser during development, not in QA. The static gate
 * is `pnpm lint:pages` (scripts/lint-pages.mjs).
 */
export const Main = forwardRef<HTMLElement, MainProps>(({ children, ...props }, ref) => {
  // Validate the scaffold contract once per mounted instance. Gating on a ref
  // (preserved by React Fast Refresh) prevents false positives during HMR of
  // this file: hot-reloading swaps the Header/Body references used here, but
  // already-mounted pages still render the previous references, so reference
  // equality checks would fail on every re-render until the page remounts.
  const validatedRef = useRef(false)
  if (import.meta.env.DEV && !validatedRef.current) {
    validatedRef.current = true
    const flat = Children.toArray(children)
    const hasHeader = flat.some((child) => isValidElement(child) && child.type === Header)
    const hasBody = flat.some((child) => isValidElement(child) && child.type === Body)
    const allowed = [Header, HeaderTop, HeaderBottom, Body]
    const unexpected = flat.filter(
      (child) => isValidElement(child) && !allowed.includes(child.type as never),
    )
    if (!hasHeader || !hasBody) {
      console.warn(
        '[Page.Main] Page scaffold violation: every page must render <Page.Header> and <Page.Body> inside <Page.Main>.',
        { hasHeader, hasBody },
      )
    }
    if (unexpected.length > 0) {
      console.warn(
        '[Page.Main] Page scaffold violation: only <Page.HeaderTop>/<Page.Header>/<Page.HeaderBottom>/<Page.Body> are allowed as direct children of <Page.Main>.',
        unexpected,
      )
    }
  }
  return (
    <MainBase ref={ref} {...props}>
      {children}
    </MainBase>
  )
})
Main.displayName = 'PageMain'

export const Footer = withContext(ark.div, 'footer')

export type BreadcrumbLevel = 0 | 1 | 2

export interface HeadingRootProps extends ComponentProps<'div'> {
  level?: BreadcrumbLevel
  icon?: React.ElementType
  title?: string
  children?: ReactNode
}

const HeadingRootBase = forwardRef<HTMLDivElement, HeadingRootProps>(
  ({ level: propLevel, icon: IconComponent, title, children }, ref) => {
    const { manifest, level: ctxLevel } = useBreadcrumb()
    const actualLevel = propLevel ?? ctxLevel
    const ActualIcon = IconComponent ?? manifest.icon
    const displayTitle = title ?? manifest.name

    const backButton = actualLevel >= 1 ? (
      <BackButton
        variant="plain"
        marginRight="-2"
        marginLeft="0"
        boxSize="8"
        minW="8"
        boxShadow="none"
        opacity="0.5"
        css={{ _icon: { boxSize: '7' } }}
        onClick={() => window.history.back()}
      >
        <ChevronLeftIcon />
      </BackButton>
    ) : null

    return (
      <div className={headerInnerCss} ref={ref}>
        {backButton}
        <Icon size="xl" boxSize="7">
          <ActualIcon />
        </Icon>
        <PageHeading truncate>
          {displayTitle}
        </PageHeading>
        {children}
      </div>
    )
  },
)
HeadingRootBase.displayName = 'Page.Heading.Root'

export const Heading = Object.assign(HeadingRootBase, {
  Root: HeadingRootBase,
})
