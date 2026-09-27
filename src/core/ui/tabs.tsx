'use client'
import { Tabs } from '@ark-ui/react/tabs'
import type { ComponentProps, ReactElement, ReactNode } from 'react'
import { createStyleContext } from 'styled-system/jsx'
import { tabs } from 'styled-system/recipes'

const { withProvider, withContext } = createStyleContext(tabs)

function hasContentChild(children: ReactNode): boolean {
  let found = false
  const walk = (node: ReactNode) => {
    if (node === null || node === undefined) return
    if (Array.isArray(node)) {
      node.forEach(walk)
      return
    }
    if (typeof node !== 'object') return
    const el = node as ReactElement
    if (el?.type === Content) {
      found = true
      return
    }
    const child = (el as { props?: { children?: ReactNode } })?.props?.children
    if (child) walk(child)
  }
  walk(children)
  return found
}

export type RootProps = ComponentProps<typeof Tabs.Root> & {
  children: ReactNode
}

function TabsRoot({ children, ...props }: RootProps) {
  if (process.env.NODE_ENV !== 'production' && !hasContentChild(children)) {
    throw new Error(
      'Tabs.Root requires at least one Tabs.Content as a child. ' +
        'Add <Tabs.Content value="...">...</Tabs.Content> for each tab panel.',
    )
  }
  return <Tabs.Root {...props}>{children}</Tabs.Root>
}

export const Root = withProvider(TabsRoot, 'root')
export const RootProvider = withProvider(Tabs.RootProvider, 'root')
export const List = withContext(Tabs.List, 'list')
export const Trigger = withContext(Tabs.Trigger, 'trigger')
export const Content = withContext(Tabs.Content, 'content')
export const Indicator = withContext(Tabs.Indicator, 'indicator')

export { TabsContext as Context } from '@ark-ui/react/tabs'
