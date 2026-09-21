'use client'
import type { CSSProperties } from 'react'
import { Stack } from 'styled-system/jsx'
import { Palette } from 'lucide-react'
import { Card, Heading, Page, Text } from '@/core/ui'

/**
 * ExampleSettingsPage — module-registered settings section.
 *
 * Registered by `src/modules/example/settings.ts` and deep-linked at
 * `/settings/example`. Rendered inside `SettingsPage` (the settings
 * panel-stack scaffold), so this component only owns the section content.
 */
export default function ExampleSettingsPage() {
  return (
    <Page.Main>
      <Page.Header style={{ '--module-number': 0 } as CSSProperties}>
        <Page.Heading level={1} icon={Palette} title="Example Settings" />
      </Page.Header>
      <Page.Body>
        <Stack>
          <Card.Root>
            <Card.Body>
              <Stack gap="2">
                <Heading textStyle="md">Example module settings</Heading>
            <Text color="fg.muted" textStyle="sm">
              This section is registered by the <code>example</code> module
              through the settings registry. It deep-links at
              <code>/settings/example</code>.
            </Text>
          </Stack>
        </Card.Body>
      </Card.Root>
        </Stack>
      </Page.Body>
    </Page.Main>
  )
}
