import { Stack } from 'styled-system/jsx'
import { Heading, Text, Card } from '@/core/ui'
import { getSettingsPages } from '../settings-schema'
import { useNavigate } from 'react-router-dom'

/**
 * Integrations Section — Lists all registered integration pages
 * Plugins register their settings pages under this section via hooks
 */
export function IntegrationsSection() {
  const navigate = useNavigate()
  const pages = getSettingsPages('integrations')

  if (pages.length === 0) {
    return (
      <Stack gap="4">
        <Heading textStyle="md">Integrations</Heading>
        <Text color="fg.muted" textStyle="sm">
          No integrations configured yet. Install plugins to add integrations.
        </Text>
      </Stack>
    )
  }

  return (
    <Stack gap="4">
      <Heading textStyle="md">Integrations</Heading>
      <Text color="fg.muted" textStyle="sm">
        Manage your third-party integrations and external service connections.
      </Text>
      <Stack gap="3">
        {pages.map((page) => (
          <Card.Root
            key={page.id}
            onClick={() => navigate(`/settings/integrations/${page.id}`)}
            css={{ cursor: 'pointer', transition: 'box-shadow 0.2s' }}
          >
            <Card.Body>
              <Heading textStyle="sm">{page.title}</Heading>
            </Card.Body>
          </Card.Root>
        ))}
      </Stack>
    </Stack>
  )
}