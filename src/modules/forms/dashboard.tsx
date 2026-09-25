import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Page, Text } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import { Plus } from 'lucide-react'
import { Manifest } from './manifest'

/**
 * Forms dashboard — a thin landing page that links to the list view.
 * The real content lives in ListPage (`/forms/list` → redirected here).
 * Mirrors the example module's dashboard pattern.
 */
export default function FormsDashboardPage() {
  const navigate = useNavigate()
  const moduleNumberStyle = { '--module-number': Manifest.number } as CSSProperties
  return (
    <Page.Main>
      <Page.Header style={moduleNumberStyle}>
        <Page.Heading level={1} icon={Manifest.icon} title={Manifest.name} />
      </Page.Header>
      <Page.Body>
        <Stack>
          <Text color="fg.muted">
            Create and manage data collection forms with drag-and-drop fields, multi-column layouts, and conditional logic.
          </Text>
          <Stack flexDirection="row" gap="2">
            <Button onClick={() => navigate('/forms/new')}>
              <Plus /> New form
            </Button>
          </Stack>
        </Stack>
      </Page.Body>
    </Page.Main>
  )
}