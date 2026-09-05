'use client'
import { ark } from '@ark-ui/react/factory'
import { ChevronRightIcon } from 'lucide-react'
import { type ComponentProps, type ReactNode, createContext, useContext, forwardRef } from 'react'
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

export const ModuleBreadcrumbProvider = forwardRef<HTMLDivElement, ModuleBreadcrumbProviderProps>(
  ({ manifest, level = 0, children, ...props }, ref) => {
    return (
      <ModuleBreadcrumbContext.Provider value={{ manifest, level }}>
        <div ref={ref} {...props}>{children}</div>
      </ModuleBreadcrumbContext.Provider>
    )
  },
)
ModuleBreadcrumbProvider.displayName = 'ModuleBreadcrumbProvider'

const NullIcon = () => null

export function useBreadcrumb(): ModuleBreadcrumbContextValue {
  const ctx = useContext(ModuleBreadcrumbContext)
  if (!ctx) {
    return { manifest: { id: '', name: '', icon: NullIcon as unknown as LucideIcon, basePath: '' }, level: 0 }
  }
  return ctx
}
