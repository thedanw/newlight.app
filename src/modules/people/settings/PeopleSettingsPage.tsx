'use client'
import { Stack } from 'styled-system/jsx'
import { Card, Heading, Text } from '@/core/ui'

/**
 * PeopleSettingsPage — demo module-registered settings page (Batch 6).
 *
 * Registered by `src/modules/people/settings.ts` under the `church-info`
 * section, proving the core #41 `settings-schema` extension point: any
 * module can declare its own settings page and deep-link to it via
 * `/settings/<sectionId>/<pageId>`.
 */
export default function PeopleSettingsPage() {
  return (
    <Stack gap="4">
      <Card.Root>
        <Card.Body>
          <Stack gap="2">
            <Heading textStyle="md">People module settings</Heading>
            <Text color="fg.muted" textStyle="sm">
              This page is registered by the <code>people</code> module through the settings
              registry. It deep-links at <code>/settings/church-info/people</code> — a pattern any
              module can use to expose its own settings surface.
            </Text>
          </Stack>
        </Card.Body>
      </Card.Root>
    </Stack>
  )
}