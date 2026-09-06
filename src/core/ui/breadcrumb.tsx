'use client'
import { ark } from '@ark-ui/react/factory'
import { ChevronRightIcon } from 'lucide-react'
import { type ComponentProps, type ReactNode, createContext, useContext } from 'react'
import { createStyleContext } from 'styled-system/jsx'
import { breadcrumb } from 'styled-system/recipes'
import type { LucideIcon } from 'lucide-react'

const { withProvider, withContext } = createStyleContext(breadcrumb)

export type RootProps = ComponentProps<typeof Root>

export const Root = withProvider(ark.nav, 'root', { defaultProps: { 'aria-label': 'breadcrumb' } })
export const List = withContext(ark.ol, 'list')
export const Item = withContext(ark.li, 'item')
export const Link = withContext(ark.a, 'link')
export const Ellipsis = withContext(ark.li, 'ellipsis', {
  defaultProps: {
    role: 'presentation',
    'aria-hidden': true,
    children: '...',
  },
})

export const Separator = withContext(ark.li, 'separator', {
  defaultProps: {
    'aria-hidden': true,
    children: <ChevronRightIcon />,
  },
})

export type BreadcrumbLevel = 0 | 1 | 2

export interface ModuleManifest {
  id: string
  name: string
  icon: LucideIcon
  basePath: string
}

export interface ModuleBreadcrumbContextValue {
  manifest: ModuleManifest
  level: BreadcrumbLevel
}

export const ModuleBreadcrumbContext = createContext<ModuleBreadcrumbContextValue | null>(null)

export interface ModuleBreadcrumbProviderProps {
  manifest: ModuleManifest
  level?: BreadcrumbLevel
  children: ReactNode
}

// Pure context provider — intentionally renders NO DOM element so that the
// routed page's Page.Main / Page.Footer become direct children of the shell's
// Page.Root. A wrapper <div> here breaks the flex height chain (auto-height
// parent + height:100% child) and kills Page.Main's scrolling.
export function ModuleBreadcrumbProvider({ manifest, level = 0, children }: ModuleBreadcrumbProviderProps) {
  return (
    <ModuleBreadcrumbContext.Provider value={{ manifest, level }}>
      {children}
    </ModuleBreadcrumbContext.Provider>
  )
}
ModuleBreadcrumbProvider.displayName = 'ModuleBreadcrumbProvider'

const NullIcon = () => null

export function useBreadcrumb(): ModuleBreadcrumbContextValue {
  const ctx = useContext(ModuleBreadcrumbContext)
  if (!ctx) {
    return { manifest: { id: '', name: '', icon: NullIcon as unknown as LucideIcon, basePath: '' }, level: 0 }
  }
  return ctx
}
