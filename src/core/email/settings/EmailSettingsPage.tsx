'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Mail, Settings, Info, HelpCircle, CheckCircle, XCircle, CheckIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Stack, HStack } from 'styled-system/jsx'
import {
  Alert,
  Button,
  Card,
  Drawer,
  Field,
  Heading,
  Input,
  RadioCardGroup,
  Switch,
  Tabs,
  TabScroller,
  Text,
  Textarea,
  toaster,
  useRegisterPageActions,
} from '@/core/ui'
import {
  getEmailSettings,
  saveEmailSettings,
  saveEmailSecret,
  hasEmailSecret,
  DEFAULT_EMAIL_SETTINGS,
} from '../lib/settings'
import { sendEmailWithTracking } from '../lib/client'
import type { EmailSettings, EmailTransport, EmailEditorTheme } from '../lib/types'

const TRANSPORT_OPTIONS: Array<{ label: string; value: EmailTransport; description: string }> = [
  { label: 'SMTP', value: 'smtp', description: 'Send through your own mail server (e.g. Google Workspace)' },
  { label: 'Resend', value: 'resend', description: 'Send through the Resend email API' },
  { label: 'None (development only)', value: 'noop', description: 'No delivery — for local testing only' },
]

export default function EmailSettingsPage() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState<EmailSettings>(DEFAULT_EMAIL_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [activeTab, setActiveTab] = useState('setup')
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false)
  const [troubleshootDrawerOpen, setTroubleshootDrawerOpen] = useState(false)

  const initialSettings = useRef<EmailSettings>(DEFAULT_EMAIL_SETTINGS)

  const [smtpPassword, setSmtpPassword] = useState('')
  const [resendApiKey, setResendApiKey] = useState('')
  const [hasSmtpSecret, setHasSmtpSecret] = useState<boolean | null>(null)
  const [hasResendSecret, setHasResendSecret] = useState<boolean | null>(null)
  const [savingSecret, setSavingSecret] = useState(false)

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

  const updateEditor = (field: keyof EmailSettings['editor'], value: string | boolean) => {
    setSettings((s) => ({
      ...s,
      editor: { ...s.editor, [field]: value },
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

      // Persist secrets separately if a new value was entered. These are never
      // sent to platform_settings — they go to the email-secrets edge function
      // which encrypts and stores them in the service-role-only table.
      if (settings.transport === 'smtp' && smtpPassword) {
        setSavingSecret(true)
        await saveEmailSecret('smtp_pass', smtpPassword)
        setSmtpPassword('')
        setHasSmtpSecret(true)
        setSavingSecret(false)
      }
      if (settings.transport === 'resend' && resendApiKey) {
        setSavingSecret(true)
        await saveEmailSecret('resend_api_key', resendApiKey)
        setResendApiKey('')
        setHasResendSecret(true)
        setSavingSecret(false)
      }

      toaster.create({ title: 'Email settings saved', type: 'success' })
    } catch (error) {
      toaster.create({
        title: 'Failed to save',
        description: error instanceof Error ? error.message : String(error),
        type: 'error',
      })
    } finally {
      setSaving(false)
      setSavingSecret(false)
    }
  }, [settings, smtpPassword, resendApiKey])

  const handleCancel = () => {
    setSettings(initialSettings.current)
    setIsDirty(false)
    navigate('/settings')
  }

  useRegisterPageActions({
    cancel: handleCancel,
    apply: handleApply,
    isSaving: saving || savingSecret,
    isDirty,
    applyLabel: 'Save',
  })

  const [testEmail, setTestEmail] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle')

  useEffect(() => {
    let cancelled = false
    void Promise.allSettled([
      hasEmailSecret('smtp_pass').then((v) => !cancelled && setHasSmtpSecret(v)),
      hasEmailSecret('resend_api_key').then((v) => !cancelled && setHasResendSecret(v)),
    ])
    return () => {
      cancelled = true
    }
  }, [])

  const handleTestEmail = async () => {
    if (!testEmail) {
      toaster.create({ title: 'Enter an email address', type: 'error' })
      return
    }
    setTesting(true)
    setTestResult('idle')
    try {
      const result = await sendEmailWithTracking({
        to: [{ email: testEmail }],
        subject: '[Test] Email configuration check',
        body: '<p>If you received this, your email settings work.</p>',
        from: settings.defaults.fromEmail || undefined,
        consentCategory: 'team_updates',
      })
      setTestResult('success')
      toaster.create({
        title: 'Test email sent',
        description: `Message ID: ${result.messageId ?? 'n/a'} (send ${result.sendId.slice(0, 8)})`,
        type: 'success',
      })
    } catch (error) {
      setTestResult('error')
      toaster.create({
        title: 'Test email failed',
        description: error instanceof Error ? error.message : String(error),
        type: 'error',
      })
    } finally {
      setTesting(false)
    }
  }

  const isSmtpConfigured =
    settings.transport === 'smtp' &&
    settings.smtp.host &&
    settings.smtp.username &&
    hasSmtpSecret === true
  const isDefaultsConfigured = settings.defaults.fromEmail && settings.defaults.replyToEmail
  const isFullyConfigured = isSmtpConfigured && isDefaultsConfigured

  if (loading) {
    return (
      <Stack gap="4">
        <Heading textStyle="md">Email Settings</Heading>
        <Text color="fg.muted" textStyle="sm">
          Loading email settings…
        </Text>
      </Stack>
    )
  }

  return (
    <Stack gap="4">
      <HStack justifyContent="space-between" alignItems="center">
        <Stack gap="1">
          <Heading textStyle="md">Email Settings</Heading>
          <Text color="fg.muted" textStyle="sm">
            Configure how the system sends emails — transport, sender defaults, and template branding.
          </Text>
        </Stack>
        <HStack gap="2">
          <Button variant="plain" size="sm" onClick={() => setInfoDrawerOpen(true)}>
            <Info size={16} />
            More info
          </Button>
          <Button variant="plain" size="sm" onClick={() => setTroubleshootDrawerOpen(true)}>
            <HelpCircle size={16} />
            Help
          </Button>
        </HStack>
      </HStack>

      {isFullyConfigured && (
        <Alert.Root>
          <Alert.Indicator>
            <CheckCircle size={16} />
          </Alert.Indicator>
          <Alert.Title>Email is configured</Alert.Title>
          <Alert.Description>
            Your transport and default sender are set up. Send a test email to verify.
          </Alert.Description>
        </Alert.Root>
      )}

      {!isFullyConfigured && (
        <Alert.Root status="warning">
          <Alert.Indicator>
            <Info size={16} />
          </Alert.Indicator>
          <Alert.Title>Setup incomplete</Alert.Title>
          <Alert.Description>
            Configure your transport and default sender. Follow the steps in the Setup tab.
          </Alert.Description>
        </Alert.Root>
      )}

      <Tabs.Root value={activeTab} onValueChange={(details) => setActiveTab(details.value)}>
        <TabScroller>
          <Tabs.List css={{ gap: '0' }}>
            <Tabs.Trigger value="setup" css={{ py: '2', px: '4' }}>
              <HStack gap="2">
                <Settings size={16} />
                <Text fontSize="sm">Setup</Text>
              </HStack>
            </Tabs.Trigger>
            <Tabs.Trigger value="sender" css={{ py: '2', px: '4' }}>
              <HStack gap="2">
                <Mail size={16} />
                <Text fontSize="sm">Default Sender</Text>
              </HStack>
            </Tabs.Trigger>
            <Tabs.Trigger value="branding" css={{ py: '2', px: '4' }}>
              <HStack gap="2">
                <Info size={16} />
                <Text fontSize="sm">Branding</Text>
              </HStack>
            </Tabs.Trigger>
            <Tabs.Trigger value="editor" css={{ py: '2', px: '4' }}>
              <HStack gap="2">
                <Settings size={16} />
                <Text fontSize="sm">Editor</Text>
              </HStack>
            </Tabs.Trigger>
          </Tabs.List>
        </TabScroller>

        <Tabs.Content value="setup">
          <Stack gap="4">
            <Card.Root>
              <Card.Header>
                <Heading textStyle="sm">Step 1: Choose Transport</Heading>
              </Card.Header>
              <Card.Body>
                <RadioCardGroup.Root
                  aria-label="Email transport"
                  value={settings.transport}
                  onValueChange={(details) => updateTransport(details.value as EmailTransport)}
                >
                  {TRANSPORT_OPTIONS.map((option) => (
                    <RadioCardGroup.Item key={option.value} value={option.value} marginBottom="2">
                      <RadioCardGroup.ItemHiddenInput />
                      <RadioCardGroup.ItemText>
                        <Stack gap="1">
                          <Text fontWeight="medium">{option.label}</Text>
                          <Text color="fg.muted" textStyle="sm">
                            {option.description}
                          </Text>
                        </Stack>
                      </RadioCardGroup.ItemText>
                    </RadioCardGroup.Item>
                  ))}
                </RadioCardGroup.Root>
              </Card.Body>
            </Card.Root>

            {settings.transport === 'smtp' && (
              <Card.Root>
                <Card.Header>
                  <Heading textStyle="sm">Step 2: SMTP Configuration</Heading>
                </Card.Header>
                <Card.Body>
                  <Stack gap="4" display="grid" gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }}>
                    <Field.Root>
                      <Field.Label>SMTP Host</Field.Label>
                      <Input
                        value={settings.smtp.host}
                        onChange={(e) => updateSmtp('host', e.target.value)}
                        placeholder="smtp.gmail.com"
                      />
                      <Field.HelperText>
                        E.g. smtp.gmail.com (Workspace), smtp.sendgrid.net, or your mail server.
                      </Field.HelperText>
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>SMTP Port</Field.Label>
                      <Input
                        type="number"
                        value={settings.smtp.port}
                        onChange={(e) => updateSmtp('port', parseInt(e.target.value, 10) || 0)}
                        placeholder="587"
                      />
                      <Field.HelperText>
                        587 (TLS) or 465 (SSL) — check your provider's docs.
                      </Field.HelperText>
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>SMTP Username</Field.Label>
                      <Input
                        value={settings.smtp.username}
                        onChange={(e) => updateSmtp('username', e.target.value)}
                        placeholder="user@example.org"
                      />
                      <Field.HelperText>Your full email address or app-specific username.</Field.HelperText>
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>SMTP Password</Field.Label>
                      <Input
                        type="password"
                        value={smtpPassword}
                        onChange={(e) => {
                          setSmtpPassword(e.target.value)
                          if (e.target.value) setIsDirty(true)
                        }}
                        placeholder="• • • • • • • •"
                      />
                      <Field.HelperText>
                        Encrypted at rest and saved via the <code>email-secrets</code> edge function
                        (service-role-only). Enter a new value to replace; the stored password is
                        never displayed. For Gmail, use an App Password
                        (Google Account → Security → App passwords).
                      </Field.HelperText>
                      {hasSmtpSecret === true && (
                        <Text color="fg.success" textStyle="sm" marginTop="2">
                          <HStack gap="1">
                            <CheckIcon size={14} />
                            <span>SMTP password configured</span>
                          </HStack>
                        </Text>
                      )}
                    </Field.Root>
                  </Stack>

                  <Field.Root marginTop="4">
                    <Field.Label>Use TLS / SSL</Field.Label>
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
                      Enable for ports 465/587. Required by most providers.
                    </Field.HelperText>
                  </Field.Root>
                </Card.Body>
              </Card.Root>
            )}

            {settings.transport === 'resend' && (
              <Card.Root>
                <Card.Header>
                  <Heading textStyle="sm">Step 2: Resend Configuration</Heading>
                </Card.Header>
                <Card.Body>
                  <Field.Root>
                    <Field.Label>Resend API Key</Field.Label>
                    <Input
                      type="password"
                      value={resendApiKey}
                      onChange={(e) => {
                        setResendApiKey(e.target.value)
                        if (e.target.value) setIsDirty(true)
                      }}
                      placeholder="re_xxxxxxxxxxxxxxxx"
                    />
                    <Field.HelperText>
                      Encrypted at rest and saved via the <code>email-secrets</code> edge function
                      (service-role-only). Enter a new key to replace; the stored value is never
                      displayed. Create one at resend.com under API Keys.
                    </Field.HelperText>
                    {hasResendSecret === true && (
                      <Text color="fg.success" textStyle="sm" marginTop="2">
                        <HStack gap="1">
                          <CheckIcon size={14} />
                          <span>Resend API key configured</span>
                        </HStack>
                      </Text>
                    )}
                  </Field.Root>
                </Card.Body>
              </Card.Root>
            )}

            {settings.transport !== 'noop' && (
              <Card.Root>
                <Card.Header>
                  <Heading textStyle="sm">Step 3: Test Configuration</Heading>
                </Card.Header>
                <Card.Body>
                  <Stack gap="3">
                    <Text color="fg.muted" textStyle="sm">
                      Send a test email to verify your transport settings work.
                    </Text>
                    <Field.Root>
                      <Field.Label>Recipient email</Field.Label>
                      <Input
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="you@example.org"
                      />
                    </Field.Root>
                    <HStack gap="2">
                      <Button
                        onClick={handleTestEmail}
                        disabled={testing || !testEmail}
                        loading={testing}
                      >
                        {testing ? 'Sending…' : 'Send test email'}
                      </Button>
                      {testResult === 'success' && (
                        <HStack gap="1">
                          <CheckCircle size={16} />
                          <Text color="fg.success" textStyle="sm">
                            Test email sent successfully
                          </Text>
                        </HStack>
                      )}
                      {testResult === 'error' && (
                        <HStack gap="1">
                          <XCircle size={16} />
                          <Text color="fg.danger" textStyle="sm">
                            Test email failed — check your settings
                          </Text>
                        </HStack>
                      )}
                    </HStack>
                  </Stack>
                </Card.Body>
              </Card.Root>
            )}

            {!isDefaultsConfigured && (
              <Alert.Root status="warning">
                <Alert.Indicator>
                  <Info size={16} />
                </Alert.Indicator>
                <Alert.Title>Default sender not configured</Alert.Title>
                <Alert.Description>
                  Go to the <strong>Default Sender</strong> tab to set up your From and Reply-To addresses.
                </Alert.Description>
              </Alert.Root>
            )}
          </Stack>
        </Tabs.Content>

        <Tabs.Content value="sender">
          <Stack gap="4">
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
                    <Field.HelperText>This address appears as the email sender.</Field.HelperText>
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
                    <Field.HelperText>Where replies from recipients will be delivered.</Field.HelperText>
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
          </Stack>
        </Tabs.Content>

        <Tabs.Content value="branding">
          <Stack gap="4">
            <Card.Root>
              <Card.Header>
                <Heading textStyle="sm">Email Template Branding</Heading>
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
                    <Field.HelperText>URL of the logo displayed in email headers (use a public storage URL).</Field.HelperText>
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Primary Color</Field.Label>
                    <HStack gap="2">
                      <Input
                        type="color"
                        value={settings.branding.primaryColor}
                        onChange={(e) => updateBranding('primaryColor', e.target.value)}
                      />
                      <Input
                        value={settings.branding.primaryColor}
                        onChange={(e) => updateBranding('primaryColor', e.target.value)}
                        style={{ width: '100px' }}
                      />
                    </HStack>
                    <Field.HelperText>Accent color used in buttons and links in email templates.</Field.HelperText>
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Footer Text</Field.Label>
                    <Textarea
                      value={settings.branding.footerText}
                      onChange={(e) => updateBranding('footerText', e.target.value)}
                      placeholder="New Light Church • 123 Main St, City"
                      rows={3}
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
                    <Field.HelperText>Adds a one-click unsubscribe link to every email.</Field.HelperText>
                  </Field.Root>
                </Stack>
              </Card.Body>
            </Card.Root>
          </Stack>
        </Tabs.Content>

        <Tabs.Content value="editor">
          <Stack gap="4">
            <Card.Root>
              <Card.Header>
                <Heading textStyle="sm">Editor Theme</Heading>
              </Card.Header>
              <Card.Body>
                <RadioCardGroup.Root
                  aria-label="Editor theme"
                  value={settings.editor.theme}
                  onValueChange={(details) => updateEditor('theme', details.value as EmailEditorTheme)}
                >
                  <RadioCardGroup.Item key="light" value="light" marginBottom="2">
                    <RadioCardGroup.ItemHiddenInput />
                    <RadioCardGroup.ItemText>
                      <Stack gap="1">
                        <Text fontWeight="medium">Light</Text>
                        <Text color="fg.muted" textStyle="sm">
                          Light mode editor UI.
                        </Text>
                      </Stack>
                    </RadioCardGroup.ItemText>
                  </RadioCardGroup.Item>
                  <RadioCardGroup.Item key="dark" value="dark" marginBottom="2">
                    <RadioCardGroup.ItemHiddenInput />
                    <RadioCardGroup.ItemText>
                      <Stack gap="1">
                        <Text fontWeight="medium">Dark</Text>
                        <Text color="fg.muted" textStyle="sm">
                          Dark mode editor UI.
                        </Text>
                      </Stack>
                    </RadioCardGroup.ItemText>
                  </RadioCardGroup.Item>
                  <RadioCardGroup.Item key="auto" value="auto" marginBottom="2">
                    <RadioCardGroup.ItemHiddenInput />
                    <RadioCardGroup.ItemText>
                      <Stack gap="1">
                        <Text fontWeight="medium">Auto</Text>
                        <Text color="fg.muted" textStyle="sm">
                          Follows your system theme preference.
                        </Text>
                      </Stack>
                    </RadioCardGroup.ItemText>
                  </RadioCardGroup.Item>
                </RadioCardGroup.Root>
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Header>
                <Heading textStyle="sm">Studio SDK License</Heading>
              </Card.Header>
              <Card.Body>
                <Field.Root>
                  <Field.Label>License Key</Field.Label>
                  <Input
                    value={settings.editor.licenseKey}
                    onChange={(e) => updateEditor('licenseKey', e.target.value)}
                    placeholder="DEV_LICENSE_KEY"
                  />
                  <Field.HelperText>
                    Use <code>DEV_LICENSE_KEY</code> for local development. For production deployments, create an SDK
                    license at the{' '}
                    <a
                      href="https://app.grapesjs.com/dashboard/sdk/licenses"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      GrapesJS Dashboard
                    </a>
                    .
                  </Field.HelperText>
                </Field.Root>
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Header>
                <Heading textStyle="sm">Default Template Content</Heading>
              </Card.Header>
              <Card.Body>
                <Field.Root>
                  <Field.Label>MJML Template</Field.Label>
                  <Textarea
                    value={settings.editor.defaultTemplate}
                    onChange={(e) => updateEditor('defaultTemplate', e.target.value)}
                    placeholder='<mjml><mj-body><mj-section><mj-column><mj-text>...</mj-text></mj-column></mj-section></mj-body></mjml>'
                    rows={6}
                  />
                  <Field.HelperText>
                    Default MJML content for new emails. MJML tags ensure responsive design across email clients.
                  </Field.HelperText>
                </Field.Root>
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Header>
                <Heading textStyle="sm">Editor Panels</Heading>
              </Card.Header>
              <Card.Body>
                <Stack gap="3">
                  <Field.Root display="flex" alignItems="center" gap="2">
                    <Field.Label>Blocks panel</Field.Label>
                    <Switch.Root
                      checked={settings.editor.showBlocksPanel}
                      onCheckedChange={(details) => updateEditor('showBlocksPanel', details.checked)}
                    >
                      <Switch.HiddenInput />
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch.Root>
                    <Field.HelperText>Show the drag-and-drop blocks sidebar.</Field.HelperText>
                  </Field.Root>

                  <Field.Root display="flex" alignItems="center" gap="2">
                    <Field.Label>Layers panel</Field.Label>
                    <Switch.Root
                      checked={settings.editor.showLayersPanel}
                      onCheckedChange={(details) => updateEditor('showLayersPanel', details.checked)}
                    >
                      <Switch.HiddenInput />
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch.Root>
                    <Field.HelperText>Show the layer hierarchy sidebar.</Field.HelperText>
                  </Field.Root>

                  <Field.Root display="flex" alignItems="center" gap="2">
                    <Field.Label>Styles panel</Field.Label>
                    <Switch.Root
                      checked={settings.editor.showStylesPanel}
                      onCheckedChange={(details) => updateEditor('showStylesPanel', details.checked)}
                    >
                      <Switch.HiddenInput />
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch.Root>
                    <Field.HelperText>Show the style properties sidebar.</Field.HelperText>
                  </Field.Root>
                </Stack>
              </Card.Body>
            </Card.Root>
          </Stack>
        </Tabs.Content>
      </Tabs.Root>

      <MoreInfoDrawer open={infoDrawerOpen} onClose={() => setInfoDrawerOpen(false)} />
      <TroubleshootDrawer open={troubleshootDrawerOpen} onClose={() => setTroubleshootDrawerOpen(false)} />
    </Stack>
  )
}

function MoreInfoDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Drawer.Root open={open} onOpenChange={(details) => { if (!details.open) onClose() }}>
      <Drawer.Positioner>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Email Transport Options</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>
            <Stack gap="4">
              <Stack gap="2">
                <Heading textStyle="sm">SMTP</Heading>
                <Text textStyle="sm">
                  Sends email through your own mail server. Common providers:
                  Google Workspace (smtp.gmail.com:587), SendGrid (smtp.sendgrid.net:587),
                  or your church's IT-provided SMTP server.
                </Text>
                <Text textStyle="sm">
                  You will need an app-specific password — not your regular login password.
                  In Google Workspace, create one at Google Account → Security → 2FA → App passwords.
                </Text>
              </Stack>
              <Stack gap="2">
                <Heading textStyle="sm">Resend</Heading>
                <Text textStyle="sm">
                  Sends email through the Resend API. Create an API key at resend.com,
                  then enter it above. Resend handles deliverability automatically.
                </Text>
              </Stack>
              <Stack gap="2">
                <Heading textStyle="sm">Noop</Heading>
                <Text textStyle="sm">
                  Does not send email — for local development only. The editor still
                  renders previews, but no email is delivered.
                </Text>
              </Stack>
            </Stack>
          </Drawer.Body>
          <Drawer.CloseTrigger />
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  )
}

function TroubleshootDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Drawer.Root open={open} onOpenChange={(details) => { if (!details.open) onClose() }}>
      <Drawer.Positioner>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Email Troubleshooting</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>
            <Stack gap="4">
              <Stack gap="2">
                <Heading textStyle="sm" color="fg.danger">SMTP 401/403: Authentication failed</Heading>
                <Text textStyle="sm">
                  - Verify the username and password are correct.
                  - Use an app-specific password, not your regular password.
                  - Confirm TLS/SSL setting matches your provider's requirements.
                  - Check that your provider allows SMTP access (some block it by default).
                </Text>
              </Stack>
              <Stack gap="2">
                <Heading textStyle="sm" color="fg.danger">SMTP 404: Connection refused</Heading>
                <Text textStyle="sm">
                  - Verify the SMTP host is correct (no typos).
                  - Confirm the port number matches your provider's recommendation.
                  - Check if your firewall or ISP blocks outbound SMTP (port 25/587/465).
                </Text>
              </Stack>
              <Stack gap="2">
                <Heading textStyle="sm" color="fg.danger">Emails not arriving</Heading>
                <Text textStyle="sm">
                  - Check spam/junk folders.
                  - Verify SPF, DKIM, and DMARC records are set up for your domain.
                  - Confirm the "From" address matches your authenticated domain.
                </Text>
              </Stack>
              <Stack gap="2">
                <Heading textStyle="sm">Gmail / Google Workspace</Heading>
                <Text textStyle="sm">
                  Gmail SMTP requires an App Password, not your Google account password. In your Google
                  Account, go to <strong>Security</strong> → enable <strong>2-Step Verification</strong>, then under
                  <strong>App passwords</strong> generate one and paste it into the SMTP Password field above. Use
                  <strong> smtp.gmail.com</strong> on port <strong>465</strong> (SSL) or <strong>587</strong> (TLS).
                  Limits: ~2,000 emails/day for Google Workspace, ~500/day for consumer accounts. If you can't
                  create an App Password, your admin may have enforced OAuth-only SMTP — use Resend as an
                  alternate transport instead.
                </Text>
              </Stack>
              <Stack gap="2">
                <Heading textStyle="sm" color="fg.danger">SMTP 535 / 5.7.8 — Authentication failed</Heading>
                <Text textStyle="sm">
                  - Use an App Password (Gmail) or API key (SendGrid), not your regular login password.
                  - For Gmail: verify 2-Step Verification is on and the App Password was generated for "Mail".
                  - For SendGrid: username <code>apikey</code>, password = your API key.
                </Text>
              </Stack>
              <Stack gap="2">
                <Heading textStyle="sm" color="fg.danger">SMTP 5.7.30 / 5.7.14 — Please log in via your web browser</Heading>
                <Text textStyle="sm">
                  - Google blocked the sign-in as suspicious. Unlock via 'Allow less secure apps' (if available) or
                  switch to an App Password. This clears after a successful web login + a brief wait.
                </Text>
              </Stack>
              <Stack gap="2">
                <Heading textStyle="sm" color="fg.danger">SMTP 5.7.1 / 5.1.2 — Username mismatch</Heading>
                <Text textStyle="sm">
                  - Send the full email address (e.g. <code>you@your-domain.com</code>) as the SMTP username, not just
                  the local part.
                </Text>
              </Stack>
              <Stack gap="2">
                <Heading textStyle="sm">Settings not saving</Heading>
                <Text textStyle="sm">
                  - Ensure you are logged in as Admin or Super Admin.
                  - The VITE_APP_ENV variable must match across local and deployed environments.
                </Text>
              </Stack>
            </Stack>
          </Drawer.Body>
          <Drawer.CloseTrigger />
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  )
}
