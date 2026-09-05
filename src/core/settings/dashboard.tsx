'use client'
import { useMemo, type CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Stack } from 'styled-system/jsx'
import { Settings } from 'lucide-react'
import {
  Card,
  Heading,
  Page,
  Text,
} from '@/core/ui'
import { settingsManifest } from './manifest'
import {
  getSettingsPage,
  getSettingsSection,
  getSettingsSections,
} from './lib/schema'


export default function SettingsPage() {
  const { section: sectionId, page: pageId } = useParams()

  const section = sectionId ? getSettingsSection(sectionId) : undefined
  const page = sectionId && pageId ? getSettingsPage(sectionId, pageId) : undefined

  if (page && section) {
    const PageComponent = page.component
    return <PageComponent />
  }

  if (section) {
    const SectionComponent = section.component
    return <SectionComponent />
  }

  return <SettingsDashboard />
}

function SettingsDashboard() {
  const navigate = useNavigate()
  const sections = useMemo(() => getSettingsSections(), [])

  return (
    <Page.Main>
      <Page.HeaderTop style={{ '--module-number': settingsManifest.number } as CSSProperties} />
      <Page.Header
        style={{ '--module-number': settingsManifest.number } as CSSProperties}
      >
        <Page.Heading level={0} icon={Settings} title="Settings" />
      </Page.Header>
      <Page.HeaderBottom style={{ '--module-number': settingsManifest.number } as CSSProperties}>
        {/* Settings description and quick actions can go here */}
      </Page.HeaderBottom>

      <Page.Body>
        {sections.length === 0 ? (
          <Text color="fg.muted" textStyle="sm">
            No settings sections registered yet.
          </Text>
        ) : (
          <Stack gap="3">
            {sections.map((s) => (
              <Card.Root
                key={s.id}
                onClick={() => navigate(`/settings/${s.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    navigate(`/settings/${s.id}`)
                  }
                }}
                tabIndex={0}
                role="link"
                css={{ cursor: 'pointer' }}
              >
                <Card.Body>
                  <Heading textStyle="md">{s.title}</Heading>
                  {s.description && (
                    <Text color="fg.muted" textStyle="sm">
                      {s.description}
                    </Text>
                  )}
                </Card.Body>
              </Card.Root>
            ))}
          </Stack>
        )}
      </Page.Body>
    </Page.Main>
  )
}
