'use client'
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Stack } from 'styled-system/jsx'
import {
  Card,
  Field,
  Heading,
  Input,
  Page,
  RadioCardGroup,
  Switch,
  Text,
  toaster,
  useRegisterPageActions,
} from '@/core/ui'
import { getEmailSettings, saveEmailSettings, DEFAULT_EMAIL_SETTINGS } from '../lib/settings'
import type { EmailSettings, EmailTransport } from '../lib/types'

const TRANSPORT_OPTIONS: Array<{ label: string; value: EmailTransport }> = [
  { label: 'SMTP', value: 'smtp' },
  { label: 'Resend', value: 'resend' },
  { label: 'None (development only)', value: 'noop' },
]

export default function EmailSettingsPage() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState<EmailSettings>(DEFAULT_EMAIL_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const initialSettings = useRef<EmailSettings>(DEFAULT_EMAIL_SETTINGS)

  useEffect(() => {
    let cancelled = false
    getEmailSettings()
      .then((data) => {
        if (cancelled) return
        if (data) {
          const merged = { ...DEFAULT_EMAIL_SETTINGS, ...data }
          setSettings(merged)
          initialSettings.current = merged
        }
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const updateSmtp = (field: keyof EmailSettings['smtp'], value: string | number | boolean) => {
    setSettings((s) => ({
      ...s,
      smtp: { ...s.smtp, [field]: value },
    }))
    setIsDirty(true)
  }

  const updateResend = (field: keyof EmailSettings['resend'], value: string) => {
    setSettings((s) => ({
      ...s,
      resend: { ...s.resend, [field]: value },
    }))
    setIsDirty(true)
  }

  const updateDefaults = (field: keyof EmailSettings['defaults'], value: string) => {
    setSettings((s) => ({
      ...s,
      defaults: { ...s.defaults, [field]: value },
    }))
    setIsDirty(true)
  }

  const updateBranding = (field: keyof EmailSettings['branding'], value: string | boolean | (string | null)) => {
    setSettings((s) => ({
      ...s,
      branding: { ...s.branding, [field]: value },
    }))
    setIsDirty(true)
  }

  const updateTransport = (transport: EmailTransport) => {
    setSettings((s) => ({ ...s, transport }))
    setIsDirty(true)
  }

  const handleApply = useCallback(async () => {
    setSaving(true)
    try {
      await saveEmailSettings(settings)
      initialSettings.current = settings
      setIsDirty(false)
      toaster.create({ title: 'Email settings saved', type: 'success' })
    } catch (error) {
      toaster.create({
        title: 'Failed to save',
        description: error instanceof Error ? error.message : String(error),
        type: 'error',
      })
    } finally {
      setSaving(false)
    }
  }, [settings])

  const handleCancel = () => {
    setSettings(initialSettings.current)
    setIsDirty(false)
    navigate('/settings')
  }

  useRegisterPageActions({
    cancel: handleCancel,
    apply: handleApply,
    isSaving: saving,
    isDirty,
    applyLabel: 'Save',
  })

  if (loading) {
    return (
      <Page.Main>
        <Page.Header style={{ '--module-number': 0 } as CSSProperties}>
          <Page.Heading level={1} icon={Mail} title="Email Settings" />
        </Page.Header>
        <Page.Body>
          <Text color="fg.muted">Loading email settings…</Text>
        </Page.Body>
      </Page.Main>
    )
  }

  return (
    <Page.Main>
      <Page.Header style={{ '--module-number': 0 } as CSSProperties}>
        <Page.Heading level={1} icon={Mail} title="Email Settings" />
      </Page.Header>

      <Page.Body>
        <Stack gap="4">
          <Heading textStyle="md">Email Settings</Heading>
          <Text color="fg.muted" textStyle="sm">
            Configure how the system sends emails — transport, sender defaults, and template branding.
          </Text>

          <Card.Root>
            <Card.Header>
              <Heading textStyle="sm">Transport</Heading>
            </Card.Header>
            <Card.Body>
              <RadioCardGroup.Root
                aria-label="Email transport"
                value={settings.transport}
                onValueChange={(details) => updateTransport(details.value as EmailTransport)}
              >
                {TRANSPORT_OPTIONS.map((option) => (
                  <RadioCardGroup.Item key={option.value} value={option.value}>
                    <RadioCardGroup.ItemHiddenInput />
                    <RadioCardGroup.ItemText>{option.label}</RadioCardGroup.ItemText>
                  </RadioCardGroup.Item>
                ))}
              </RadioCardGroup.Root>
              <Field.HelperText>
                SMTP sends through your mail server; Resend uses the Resend API; Noop is for local development only.
              </Field.HelperText>
            </Card.Body>
          </Card.Root>

          {settings.transport === 'smtp' && (
            <Card.Root>
              <Card.Header>
                <Heading textStyle="sm">SMTP Configuration</Heading>
              </Card.Header>
              <Card.Body>
                <Stack gap="4" display="grid" gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }}>
                  <Field.Root>
                    <Field.Label>SMTP Host</Field.Label>
                    <Input
                      value={settings.smtp.host}
                      onChange={(e) => updateSmtp('host', e.target.value)}
                      placeholder="smtp.example.org"
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>SMTP Port</Field.Label>
                    <Input
                      type="number"
                      value={settings.smtp.port}
                      onChange={(e) => updateSmtp('port', parseInt(e.target.value, 10) || 0)}
                      placeholder="587"
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>SMTP Username</Field.Label>
                    <Input
                      value={settings.smtp.username}
                      onChange={(e) => updateSmtp('username', e.target.value)}
                      placeholder="user@example.org"
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>SMTP Password</Field.Label>
                    <Input
                      type="password"
                      value={settings.smtp.password}
                      onChange={(e) => updateSmtp('password', e.target.value)}
                      placeholder="••••••••"
                    />
                  </Field.Root>
                </Stack>
                <Field.Root marginTop="4">
                  <Field.Label>Use TLS (recommended)</Field.Label>
                  <Switch.Root
                    checked={settings.smtp.secure}
                    onCheckedChange={(details) => updateSmtp('secure', details.checked)}
                  >
                    <Switch.HiddenInput />
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch.Root>
                  <Field.HelperText>
                    Requires a STARTTLS-capable SMTP server. Disable for plaintext connections on port 25.
                  </Field.HelperText>
                </Field.Root>
              </Card.Body>
            </Card.Root>
          )}

          {settings.transport === 'resend' && (
            <Card.Root>
              <Card.Header>
                <Heading textStyle="sm">Resend Configuration</Heading>
              </Card.Header>
              <Card.Body>
                <Field.Root>
                  <Field.Label>Resend API Key</Field.Label>
                  <Input
                    type="password"
                    value={settings.resend.apiKey}
                    onChange={(e) => updateResend('apiKey', e.target.value)}
                    placeholder="re_xxxxxxxxxxxxxxxx"
                  />
                  <Field.HelperText>Find your API key in the Resend dashboard.</Field.HelperText>
                </Field.Root>
              </Card.Body>
            </Card.Root>
          )}

          <Card.Root>
            <Card.Header>
              <Heading textStyle="sm">Default Sender</Heading>
            </Card.Header>
            <Card.Body>
              <Stack gap="4" display="grid" gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }}>
                <Field.Root>
                  <Field.Label>From Email</Field.Label>
                  <Input
                    value={settings.defaults.fromEmail}
                    onChange={(e) => updateDefaults('fromEmail', e.target.value)}
                    placeholder="noreply@example.org"
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>From Name</Field.Label>
                  <Input
                    value={settings.defaults.fromName}
                    onChange={(e) => updateDefaults('fromName', e.target.value)}
                    placeholder="New Light Church"
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Reply-To Email</Field.Label>
                  <Input
                    value={settings.defaults.replyToEmail}
                    onChange={(e) => updateDefaults('replyToEmail', e.target.value)}
                    placeholder="office@example.org"
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Reply-To Name</Field.Label>
                  <Input
                    value={settings.defaults.replyToName}
                    onChange={(e) => updateDefaults('replyToName', e.target.value)}
                    placeholder="Office Team"
                  />
                </Field.Root>
              </Stack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Heading textStyle="sm">Email Branding</Heading>
            </Card.Header>
            <Card.Body>
              <Stack gap="4">
                <Field.Root>
                  <Field.Label>Logo URL</Field.Label>
                  <Input
                    value={settings.branding.logoUrl ?? ''}
                    onChange={(e) => updateBranding('logoUrl', e.target.value || null)}
                    placeholder="https://example.org/logo.png"
                  />
                  <Field.HelperText>URL of the logo displayed in email headers.</Field.HelperText>
                </Field.Root>

                <Field.Root>
                  <Field.Label>Primary Color</Field.Label>
                  <Input
                    type="color"
                    value={settings.branding.primaryColor}
                    onChange={(e) => updateBranding('primaryColor', e.target.value)}
                  />
                  <Field.HelperText>Accent color used in buttons and links.</Field.HelperText>
                </Field.Root>

                <Field.Root>
                  <Field.Label>Footer Text</Field.Label>
                  <Input
                    value={settings.branding.footerText}
                    onChange={(e) => updateBranding('footerText', e.target.value)}
                    placeholder="New Light Church • 123 Main St"
                  />
                </Field.Root>

                <Field.Root display="flex" alignItems="center" gap="2">
                  <Field.Label>Include unsubscribe footer</Field.Label>
                  <Switch.Root
                    checked={settings.branding.includeUnsubscribeFooter}
                    onCheckedChange={(details) => updateBranding('includeUnsubscribeFooter', details.checked)}
                  >
                    <Switch.HiddenInput />
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch.Root>
                </Field.Root>
              </Stack>
            </Card.Body>
          </Card.Root>
        </Stack>
      </Page.Body>
    </Page.Main>
  )
}
