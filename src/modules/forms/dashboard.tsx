import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Page, Text } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import { ClipboardList, Plus } from 'lucide-react'

/**
 * Forms dashboard — a thin landing page that links to the list view.
 * The real content lives in ListPage (`/forms/list` → redirected here).
 * Mirrors the example module's dashboard pattern.
 */
export default function FormsDashboardPage() {
  const navigate = useNavigate()
  return (
    <Page.Main>
      <Page.Header style={{ '--module-number': 2 } as CSSProperties}>
        <Page.Heading level={1} icon={ClipboardList} title="Forms" />
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
