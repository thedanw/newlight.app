'use client'
import { Stack } from 'styled-system/jsx'
import { Card, Field, Heading, Input } from '@/core/ui'
import { useAppSettingsForm } from '../lib/app-settings'

/* ---------------------------------------------------------------------------
   ChurchGeneralPage — hosted content-only "General" settings section
   (decision #13): church name, email, website, and address, persisted to
   `platform_settings` (single `app-settings` key, decision #15).

   Hydration / Apply / Cancel live in `useAppSettingsForm`
   (../lib/app-settings.ts), which re-saves the whole `app-settings` object
   so the theme/logo fields owned by the Appearance page pass through
   untouched. Hosted content-only page — the settings split shell
   (../dashboard.tsx) owns the Page scaffold.
 ------------------------------------------------------------------------- */

export default function ChurchGeneralPage() {
  const { churchInfo, setChurchField } = useAppSettingsForm()

  return (
    <Stack>
      <Card.Root>
        <Card.Header>
          <Heading textStyle="md">Church Information</Heading>
        </Card.Header>
        <Card.Body>
          <Stack
            display={{ base: 'grid', md: 'grid' }}
            gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }}
          >
            <Field.Root>
              <Field.Label>Church Name</Field.Label>
              <Input
                value={churchInfo.churchName}
                onChange={(event) => setChurchField('churchName', event.target.value)}
                placeholder="New Light Church"
              />
            </Field.Root>
            <Field.Root>
              <Field.Label>Church Email</Field.Label>
              <Input
                type="email"
                value={churchInfo.churchEmail}
                onChange={(event) => setChurchField('churchEmail', event.target.value)}
                placeholder="hello@newlight.church"
              />
            </Field.Root>
            <Field.Root>
              <Field.Label>Website</Field.Label>
              <Input
                type="url"
                value={churchInfo.website}
                onChange={(event) => setChurchField('website', event.target.value)}
                placeholder="https://newlight.church"
              />
            </Field.Root>
            <Field.Root>
              <Field.Label>Church Address</Field.Label>
              <Input
                value={churchInfo.churchAddress}
                onChange={(event) => setChurchField('churchAddress', event.target.value)}
                placeholder="123 Main Street, Springfield"
              />
            </Field.Root>
          </Stack>
        </Card.Body>
      </Card.Root>
    </Stack>
  )
}
