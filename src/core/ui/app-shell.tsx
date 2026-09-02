'use client'
import { Suspense, type ReactNode } from 'react'
import { useNavigate, useOutlet } from 'react-router-dom'
import { css } from 'styled-system/css'
import { Loader, Page, Sidebar } from '@/core/ui'
import { useSettings } from '@/core/settings/SettingsProvider'
import { ErrorBoundary } from '@/core/ui'

/**
 * AppShell — the single source of truth for the authenticated app chrome.
 *
 * Every module dashboard, the settings area, and the styleguide share this
 * shell: a fixed Sidebar (left) + Page.Root that renders route content through
 * the Outlet. Render errors in the active route are caught by `ErrorBoundary`
 * (with a retry), and async route chunks are covered by `Suspense`.
 *
 * Modules no longer ship their own layout component — they only declare their
 * route children (see `src/modules/people/routes.tsx`); the router mounts this
 * shell once and nests all authenticated routes beneath it.
 */
const appShellCss = css({
  display: 'flex',
  height: '100dvh',
  width: '100%',
  overflow: 'hidden',
  bg: 'var(--canvas-bg)',
  color: 'fg.default',
})

export function AppShell({ children }: { children?: ReactNode }) {
  const navigate = useNavigate()
  const outlet = useOutlet()
  const { logoUrl } = useSettings()

  return (
    <div className={appShellCss}>
      <Sidebar
        onSettingsNavigate={() => navigate('/settings')}
        onModuleNavigate={(moduleId) => navigate(`/${moduleId}`)}
        logo={logoUrl}
      />
      <Page.Root id="page-panel">
        <ErrorBoundary>
          <Suspense fallback={<Loader />}>{children ?? outlet}</Suspense>
        </ErrorBoundary>
      </Page.Root>
    </div>
  )
}
