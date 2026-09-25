'use client'
import { Stack } from 'styled-system/jsx'
import { Card, Heading, Text } from '@/core/ui'

/**
 * DevelopersSettingsPage — module-registered settings section.
 *
 * Registered by `src/modules/developers/settings.ts` and deep-linked at
 * `/settings/developers`. Rendered inside `SettingsPage` (the settings
 * panel-stack scaffold), so this component only owns the section content.
 */
export default function ExampleSettingsPage() {
  return (
    <Stack>
      <Card.Root>
        <Card.Body>
          <Stack gap="2">
            <Heading textStyle="md">Developers module settings</Heading>
            <Text color="fg.muted" textStyle="sm">
              This section is registered by the <code>developers</code> module
              through the settings registry. It deep-links at
              <code>/settings/developers</code>.
            </Text>
          </Stack>
        </Card.Body>
      </Card.Root>
    </Stack>
  )
}
