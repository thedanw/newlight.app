import { useState, type CSSProperties } from 'react'
import { <Icon> } from 'lucide-react'
import { Heading, Page } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import { Manifest } from './manifest'

/**
 * DashboardPage — module entry point mounted at `/<moduleId>`.
 *
 * Renders inside the shared `AppShell` (Sidebar + PagePanel + ErrorBoundary +
 * Suspense) so this page only owns the dashboard content itself.
 */
export default function DashboardPage() {
  const [loaded, setLoaded] = useState(false)
  const moduleNumberStyle = { '--module-number': Manifest.number } as CSSProperties

  return (
    <Page.Main>
      <Page.HeaderTop style={moduleNumberStyle} />
      <Page.Header
        headerVariant="hero"
        style={moduleNumberStyle}
      >
        <Page.Heading level={0} icon={Manifest.icon} title={Manifest.name} />
      </Page.Header>
      <Page.HeaderBottom style={moduleNumberStyle}>
        {/* Add your dashboard description, search, or hero tools here. */}
      </Page.HeaderBottom>
      <Page.Body>
        <Stack gap="6">
          {/* Add your dashboard widgets, lists, or quick actions here. */}
        </Stack>
      </Page.Body>
    </Page.Main>
  )
}