'use client'
import { Stack } from 'styled-system/jsx'
import { Card, Heading, Text } from '@/core/ui'

/**
 * <Module>SettingsPage — module-registered settings section.
 *
 * Registered by `src/modules/<moduleId>/settings.ts` and deep-linked at
 * `/settings/<moduleId>`. Rendered inside `SettingsPage` (the settings
 * panel-stack scaffold), so this component only owns the section content.
 */
export default function <Module>SettingsPage() {
  return (
    <Stack gap="4">
      <Card.Root>
        <Card.Body>
          <Stack gap="2">
            <Heading textStyle="md"><Module> module settings</Heading>
            <Text color="fg.muted" textStyle="sm">
              This section is registered by the <code><moduleId></code> module
              through the settings registry. It deep-links at
              <code>/settings/<moduleId></code>.
            </Text>
          </Stack>
        </Card.Body>
      </Card.Root>
    </Stack>
  )
}
