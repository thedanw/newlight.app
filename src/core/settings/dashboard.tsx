'use client'
import { useMemo, type CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, HStack, Stack } from 'styled-system/jsx'
import { css } from 'styled-system/css'
import { ChevronRight, Settings, SlidersHorizontal } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, Heading, Icon, Page, Text } from '@/core/ui'
import { settingsManifest } from './manifest'
import { getSettingsPage, getSettingsSection } from './lib/schema'
import { getSettingsSections, type SettingsSection } from './lib/schema'

const MODULE_NUMBER_STYLE = { '--module-number': settingsManifest.number } as CSSProperties

export default function SettingsPage() {
  const { section: sectionId, page: pageId } = useParams()
  const section = sectionId ? getSettingsSection(sectionId) : undefined
  const page = sectionId && pageId ? getSettingsPage(sectionId, pageId) : undefined
  const contentComponent = useMemo(
    () => (page ? page.component : section ? section.component : null),
    [page, section],
  )
  const hasSelection = Boolean(section)
  if (contentComponent) {
    const Content = contentComponent
    return (
      <SettingsSplitShell activeSection={section} hasSelection={hasSelection} page={page}>
        <Content />
      </SettingsSplitShell>
    )
  }
  return <SettingsDashboard />
}

function resolveSectionIcon(section: SettingsSection | undefined): LucideIcon {
  return section?.icon ?? SlidersHorizontal
}

function resolveHeading(
  section: SettingsSection | undefined,
  page: ReturnType<typeof getSettingsPage>,
): { title: string; icon: LucideIcon } {
  if (page) return { title: page.title, icon: resolveSectionIcon(section) }
  if (section) return { title: section.title, icon: resolveSectionIcon(section) }
  return { title: 'Settings', icon: Settings }
}

function SettingsDashboard() {
  const sections = useMemo(() => getSettingsSections(), [])
  const heading = resolveHeading(undefined, undefined)
  return (
    <Page.Main>
      <Page.Header style={{ ...MODULE_NUMBER_STYLE, display: 'flex' }}>
        <Page.Heading level={0} icon={heading.icon} title={heading.title} />
      </Page.Header>
      <Page.Body>
        <Stack role="list" aria-label="Settings sections">
          {sections.length === 0 ? (
            <Text color="fg.muted" textStyle="sm">No settings sections registered yet.</Text>
          ) : (
            sections.map((s) => (
              <SettingsSectionCard key={s.id} section={s} isActive={false} />
            ))
          )}
        </Stack>
      </Page.Body>
    </Page.Main>
  )
}

/** SettingsSplitShell — the iOS "list + detail" layout wrapped around a section
 * (or deep page) component.
 *
 *  - `base` (mobile): the section list collapses when a selection is made and
 *    the header shows the current subpage with a back button (hidden on large
 *    screens) as the visible Page.Header following the established module
 *    sub-page pattern.
 *  - `lg` (desktop): the section list persists as a left-side nav column and the
 *    selected settings page renders (and scrolls) inside a right-side panel. */
function SettingsSplitShell({
  activeSection,
  hasSelection,
  page,
  children,
}: {
  activeSection: SettingsSection | undefined
  hasSelection: boolean
  page: ReturnType<typeof getSettingsPage>
  children: React.ReactNode
}) {
  const sections = useMemo(() => getSettingsSections(), [])
  const activeSectionId = activeSection?.id ?? undefined
  const heading = resolveHeading(activeSection, page)

  return (
    <Page.Main style={hasSelection ? { overflowY: 'hidden' } : undefined}>
      <Page.Header style={MODULE_NUMBER_STYLE}>
        <Page.Heading level={hasSelection ? 1 : 0} icon={heading.icon} title={heading.title} />
      </Page.Header>

      <Page.Body
        className={css({
          flex: '1 1 auto',
          minHeight: '0',
          display: 'flex',
          flexDirection: 'column',
          p:0,
        })}
      >
        <Box display="flex" flex="1 1 auto" minHeight="0" gap='0'>
          <Box
            as="nav"
            aria-label="Settings sections"
            flex="0 0 280px"
            flexShrink="0"
            minW="0"
            minH="0"
            overflowY="auto"
            display={{ base: hasSelection ? 'none' : 'flex', lg: 'flex' }}
            flexDirection="column"
            padding={{ base: '0', lg: '6' }}
            background={{ base: 'transparent', lg: 'gray.subtle.bg' }}
          >
            <Stack role="list">
              {sections.length === 0 ? (
                <Text color="fg.muted" textStyle="sm">No settings sections registered yet.</Text>
              ) : (
                sections.map((s) => (
                  <SettingsSectionCard
                    key={s.id}
                    section={s}
                    isActive={s.id === activeSectionId}
                  />
                ))
              )}
            </Stack>
          </Box>

          <Box
            as="Content"
            flex="1"
            minW="0"
            minH="0"
            overflow="auto"
            display={{ base: hasSelection ? 'flex' : 'none', lg: 'flex' }}
            flexDirection="column"
            padding={{ base: '0', lg: '6' }}
          >
            {hasSelection ? children : <SettingsEmptyPanel />}
          </Box>
        </Box>
      </Page.Body>
    </Page.Main>
  )
}

function SettingsEmptyPanel() {
  return (
    <Box
      flex="1"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap="3"
      minH="0"
    >
      <Icon size="xl" boxSize="10" css={{ color: 'fg.subtle', flexShrink: 0 }}>
        <SlidersHorizontal />
      </Icon>
      <Text color="fg.muted" textStyle="sm">Select a setting to view its options.</Text>
    </Box>
  )
}

function SettingsSectionCard({
  section,
  isActive,
}: {
  section: SettingsSection
  isActive: boolean
}) {
  const navigate = useNavigate()
  const SectionIcon = resolveSectionIcon(section)
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      navigate(`/settings/${section.id}`)
    }
  }
  return (
    <Card.Root
      variant="outline"
      size={{ base: 'default', lg: 'compact' }}
      aria-current={isActive ? 'page' : undefined}
      role="button"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onClick={() => navigate(`/settings/${section.id}`)}
      className={css({
        cursor: 'pointer',
        borderRadius: 'l3',
        borderWidth: '1px',
        borderColor: isActive ? 'colorPalette.a5' : 'border',
        p: { base: '3', lg: '2' },
        ...(isActive ? { bg: 'colorPalette.3' } : { bg: 'gray.surface.bg' }),
        '&:hover': { bg: 'colorPalette.4' },
        '&:focus-visible': {
          outline: '2px solid colorPalette.9',
          outlineOffset: '2px',
        },
            })}
    >
      <Card.Body>
        <HStack alignItems="center" minW="0">
          <Box
            boxSize="10"
            borderRadius="l2"
            bg="colorPalette.solid.bg"
            color="colorPalette.solid.fg"
            display="grid"
            placeItems="center"
            flexShrink={0}
          >
            <Icon size="md" aria-hidden>
              <SectionIcon />
            </Icon>
          </Box>
          <Stack gap="1" flex="1" minW="0">
            <Heading textStyle="sm" lineHeight="1">{section.title}</Heading>
            {section.description && (
              <Text color="fg.muted" textStyle="xs" lineHeight="1" css={{ truncate: true }}>
                {section.description}
              </Text>
            )}
          </Stack>
          <ChevronRight className={css({ boxSize: '5', flexShrink: 0, color: 'fg.subtle' })} aria-hidden />
        </HStack>
      </Card.Body>
    </Card.Root>
  )
}

