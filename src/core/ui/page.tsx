'use client'
import { ark } from '@ark-ui/react/factory'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { forwardRef, type ComponentProps, type ReactNode } from 'react'
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
export const Main = withContext(ark.main, 'main')
export const Footer = withContext(ark.div, 'footer')

export type BreadcrumbLevel = 0 | 1 | 2

export interface HeadingRootProps extends ComponentProps<'div'> {
  level?: BreadcrumbLevel
  icon?: React.ElementType
  title?: string
  children?: ReactNode
}

const HeadingRootBase = forwardRef<HTMLDivElement, HeadingRootProps>(
  ({ level: propLevel, icon: IconComponent, title, children, css: cssProp, ...rest }, ref) => {
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
        boxShadow="none"
        opacity="0.5"
        css={{ _icon: { boxSize: '7' } }}
        onClick={() => window.history.back()}
      >
        <ChevronLeftIcon />
      </BackButton>
    ) : null

    const separator = actualLevel === 2 ? (
      <ChevronLeftIcon />
    ) : null

    return (
      <>
        {backButton}
        <Icon size="">
          <ActualIcon />
        </Icon>
        <PageHeading size="lg" truncate>
          {displayTitle}
        </PageHeading>
        {children}
      </>
    )
  },
)
HeadingRootBase.displayName = 'Page.Heading.Root'

export const Heading = Object.assign(HeadingRootBase, {
  Root: HeadingRootBase,
  Icon: withContext(ark.span, 'headingIcon'),
  Title: withContext(ark.span, 'headingTitle'),
})
