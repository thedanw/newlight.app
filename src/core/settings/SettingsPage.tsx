'use client'
import { useNavigate, useParams } from 'react-router-dom'
import { css } from 'styled-system/css'
import { HStack, Stack } from 'styled-system/jsx'
import {
  BackButton,
  Breadcrumb,
  Card,
  Heading,
  PageHeader,
  PagePanel,
  Text,
} from '@/core/ui'
import {
  getSettingsPage,
  getSettingsPages,
  getSettingsSection,
  getSettingsSections,
} from './settings-schema'

/**
 * SettingsPage — dashboard shell for `/settings/:section?/:page?`.
 *
 * - No params → renders the section list (all registered sections).
 * - `:section` → renders that section's component + any registered pages.
 * - `:section/:page` → renders the page's component directly (deep link).
 *
 * Unknown section/page ids fall back to the section list.
 */
export default function SettingsPage() {
  const { section: sectionId, page: pageId } = useParams()
  const navigate = useNavigate()

  const section = sectionId ? getSettingsSection(sectionId) : undefined
  const page = sectionId && pageId ? getSettingsPage(sectionId, pageId) : undefined
  const sectionPages = sectionId ? getSettingsPages(sectionId) : []

  const renderContent = () => {
    if (page && section) {
      const PageComponent = page.component
      return <PageComponent />
    }

    if (section) {
      const SectionComponent = section.component
      return (
        <Stack gap="6">
          <SectionComponent />
          {sectionPages.length > 0 && (
            <Stack gap="3">
              <Heading textStyle="md">Pages</Heading>
              {sectionPages.map((p) => (
                <Card.Root
                  key={p.id}
                  onClick={() => navigate(`/settings/${section.id}/${p.id}`)}
                  css={{ cursor: 'pointer' }}
                >
                  <Card.Body>
                    <Heading textStyle="sm">{p.title}</Heading>
                  </Card.Body>
                </Card.Root>
              ))}
            </Stack>
          )}
        </Stack>
      )
    }

    // Section list
    const sections = getSettingsSections()
    if (sections.length === 0) {
      return (
        <Text color="fg.muted" textStyle="sm">
          No settings sections registered yet.
        </Text>
      )
    }
    return (
      <Stack gap="3">
        {sections.map((s) => (
          <Card.Root
            key={s.id}
            onClick={() => navigate(`/settings/${s.id}`)}
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
    )
  }

  return (
    <PagePanel>
      <PageHeader>
        <HStack gap="2" flex="1" minWidth="0">
          <BackButton onClick={() => navigate(-1)} />
          <Breadcrumb.Root>
            <Breadcrumb.List>
              <Breadcrumb.Item>
                <Breadcrumb.Link
                  href="/settings"
                  onClick={(event) => {
                    event.preventDefault()
                    navigate('/settings')
                  }}
                >
                  Settings
                </Breadcrumb.Link>
              </Breadcrumb.Item>
              {section && (
                <>
                  <Breadcrumb.Separator />
                  <Breadcrumb.Item>
                    <Breadcrumb.Link
                      href={`/settings/${section.id}`}
                      aria-current={page ? undefined : 'page'}
                      onClick={(event) => {
                        event.preventDefault()
                        navigate(`/settings/${section.id}`)
                      }}
                    >
                      {section.title}
                    </Breadcrumb.Link>
                  </Breadcrumb.Item>
                </>
              )}
              {page && (
                <>
                  <Breadcrumb.Separator />
                  <Breadcrumb.Item>
                    <Breadcrumb.Link aria-current="page">{page.title}</Breadcrumb.Link>
                  </Breadcrumb.Item>
                </>
              )}
            </Breadcrumb.List>
          </Breadcrumb.Root>
        </HStack>
      </PageHeader>
      <div className={css({ flex: '1', minHeight: '0', overflowY: 'auto', p: '6' })}>
        {renderContent()}
      </div>
    </PagePanel>
  )
}