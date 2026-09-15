'use client'
import type { CSSProperties } from 'react'
import { Stack } from 'styled-system/jsx'
import { Users } from 'lucide-react'
import { Card, Heading, Page, Text } from '@/core/ui'
import { useNavigate } from 'react-router-dom'
import { useCurrentOperatorPermission } from '../lib/hooks'
import { getSettingsLinks } from '@/core/plugins/HookRegistry'
import { JourneySettingsManager } from './JourneySettingsManager'
import { PageSkeleton } from '../components/PageSkeleton'

/**
 * PeopleSettingsPage — the People module's settings section, rendered at
 * `/settings/people` via the core #41 `settings-schema` extension point.
 *
 * Includes the Journey Grid settings (tracks / categories / stages) so the
 * journey grid on person profiles is configurable from the settings module.
 */
export default function PeopleSettingsPage() {
  const navigate = useNavigate()
  const permission = useCurrentOperatorPermission()
  const canManage = permission.data === 'admin' || permission.data === 'super_admin'
  const links = getSettingsLinks('people')

  return (
    <Page.Main>
      <Page.Header style={{ '--module-number': 0 } as CSSProperties}>
        <Page.Heading level={1} icon={Users} title="People Settings" />
      </Page.Header>
      <Page.Body>
        <Stack gap="6">
          <Card.Root>
            <Card.Body>
              <Stack gap="2">
                <Heading textStyle="md">People module settings</Heading>
            <Text color="fg.muted" textStyle="sm">
              Configure how the People module behaves. Journey grid tracks,
              categories, and stages are managed below (admins only).
            </Text>
          </Stack>
        </Card.Body>
      </Card.Root>

      {permission.loading && <PageSkeleton lines={2} />}
      {!permission.loading && !canManage && (
        <Text color="fg.muted">You do not have permission to manage journey settings.</Text>
      )}
      {!permission.loading && canManage && (
        <Card.Root>
          <Card.Header>
            <Heading textStyle="md">Journey grid</Heading>
            <Text color="fg.muted" textStyle="sm">
              Journey tracks are designed to track a person's progress through visiting, returning and onboarding.<br/>
              Tracks represent different pathways usually within a ministry or program.
              Stages are the steps a person takes within a track and are designed to be universal language across all tracks.<br/>
              Manage journey tracks, stages and categories below.
            </Text>
          </Card.Header>
          <Card.Body>
            <JourneySettingsManager />
          </Card.Body>
        </Card.Root>
      )}

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
      </Page.Body>
    </Page.Main>
  )
}
