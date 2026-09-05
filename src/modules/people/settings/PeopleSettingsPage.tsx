'use client'
import { Stack } from 'styled-system/jsx'
import { Card, Heading, Text } from '@/core/ui'
import { useNavigate } from 'react-router-dom'
import { getSettingsLinks } from '@/core/plugins/HookRegistry'

/**
 * PeopleSettingsPage — demo module-registered settings section (Batch 6).
 *
 * Registered by `src/modules/people/settings.ts` as its own section,
 * proving the core #41 `settings-schema` extension point: any module can
 * declare its own settings section and deep-link to it via
 * `/settings/<sectionId>`.
 *
 * Plugins can hook into this section by registering a `SettingsLink` with
 * `sectionId: 'people'` (see the Elvanto Sync plugin). Those links render
 * below the module's own content.
 */
export default function PeopleSettingsPage() {
  const navigate = useNavigate()
  const links = getSettingsLinks('people')

  return (
    <Stack gap="4">
      <Card.Root>
        <Card.Body>
          <Stack gap="2">
            <Heading textStyle="md">People module settings</Heading>
            <Text color="fg.muted" textStyle="sm">
              This section is registered by the <code>people</code> module through the settings
              registry. It deep-links at <code>/settings/people</code> — a pattern any
              module can use to expose its own settings surface.
            </Text>
          </Stack>
        </Card.Body>
      </Card.Root>

      {links.length > 0 && (
        <Stack gap="3">
          <Heading textStyle="md">Integrations</Heading>
          {links.map((link) => {
            const target = link.targetPageId
              ? `/settings/${link.targetSectionId}/${link.targetPageId}`
              : `/settings/${link.targetSectionId}`
            return (
              <Card.Root
                key={`${link.targetSectionId}/${link.targetPageId ?? ''}`}
                onClick={() => navigate(target)}
                css={{ cursor: 'pointer', transition: 'box-shadow 0.2s' }}
              >
                <Card.Body>
                  <Stack gap="1">
                    <Heading textStyle="sm">{link.label}</Heading>
                    {link.description && (
                      <Text color="fg.muted" textStyle="sm">
                        {link.description}
                      </Text>
                    )}
                  </Stack>
                </Card.Body>
              </Card.Root>
            )
          })}
        </Stack>
      )}
    </Stack>
  )
}