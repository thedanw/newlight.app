import { useEffect, useMemo, useState } from 'react'
import { Mail } from 'lucide-react'
import { createListCollection } from '@ark-ui/react'
import {
  Alert,
  Button,
  Card,
  Field,
  Input,
  InputDynamic,
  Page,
  Select,
  Text,
} from '@/core/ui'
import { HStack } from 'styled-system/jsx'
import { EmailEditor } from './EmailEditor'
import { AudiencePicker } from './AudiencePicker'
import { resolveAudience, filterByConsent } from '../lib/audience'
import { sendEmailWithTracking } from '../lib/client'
import { getSenderAliases } from '../lib/queries'
import { getEmailSettings, DEFAULT_EMAIL_SETTINGS } from '../lib/settings'
import type { EmailRecipient, SendEmailInput, EmailEditorConfig } from '../lib/types'

export interface EmailComposerProps {
  initialSubject?: string
  initialBody?: string
  onSent?: (acceptedCount: number, sendId: string) => void
}

export function EmailComposer({ initialSubject = '', initialBody = '', onSent }: EmailComposerProps) {
  const [subject, setSubject] = useState(initialSubject)
  const [editorHtml, setEditorHtml] = useState(initialBody)
  const [from, setFrom] = useState('')
  const [consentCategory, setConsentCategory] = useState<'broadcasts' | 'team_updates'>('broadcasts')
  const [audienceType, setAudienceType] = useState<'saved_list' | 'explicit' | 'preset'>('saved_list')
  const [audienceRef, setAudienceRef] = useState<string | undefined>(undefined)
  const [peopleIds, setPeopleIds] = useState<string[]>([])
  const [recipients, setRecipients] = useState<EmailRecipient[]>([])
  const [sending, setSending] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [audienceOpen, setAudienceOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [editorConfig, setEditorConfig] = useState<Partial<EmailEditorConfig>>({})

  const consentCategoryCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { label: 'Broadcasts', value: 'broadcasts' },
          { label: 'Team Updates', value: 'team_updates' },
        ],
      }),
    [],
  )

  const recipientsSummary =
    recipients.length > 0
      ? `${recipients.length} recipient${recipients.length === 1 ? '' : 's'} — ${recipients
          .slice(0, 3)
          .map((r) => r.name || r.email)
          .join(', ')}${recipients.length > 3 ? ` +${recipients.length - 3} more` : ''}`
      : ''

  useEffect(() => {
    getSenderAliases()
      .then((data) => {
        const defaultAlias = data.find((a) => a.is_default) || data[0]
        if (defaultAlias) setFrom(defaultAlias.email)
      })
      .catch(() => {})

    getEmailSettings()
      .then((settings) => {
        if (settings?.editor) {
          setEditorConfig({ ...DEFAULT_EMAIL_SETTINGS.editor, ...settings.editor })
        }
      })
      .catch(() => {})
  }, [])

  const handleResolveAudience = async (): Promise<string | void> => {
    if (audienceType === 'explicit' && peopleIds.length === 0) {
      setError('No people selected')
      return
    }
    if ((audienceType === 'saved_list' || audienceType === 'preset') && !audienceRef) {
      setError('No audience selected')
      return
    }

    setResolving(true)
    try {
      const resolved = await resolveAudience({
        type: audienceType,
        ref: audienceRef,
        peopleIds: audienceType === 'explicit' ? peopleIds : undefined,
      })
      const filtered = await filterByConsent(resolved, consentCategory)
      setRecipients(filtered)
      setError(null)
      const summary =
        filtered.length > 0
          ? `${filtered.length} recipient${filtered.length === 1 ? '' : 's'} — ${filtered
              .slice(0, 3)
              .map((r) => r.name || r.email)
              .join(', ')}${filtered.length > 3 ? ` +${filtered.length - 3} more` : ''}`
          : ''
      return summary
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      return
    } finally {
      setResolving(false)
    }
  }

  const handleSend = async () => {
    if (!subject.trim()) {
      setError('Subject is required')
      return
    }
    if (!editorHtml.trim()) {
      setError('Email body is required')
      return
    }
    if (recipients.length === 0) {
      setError('Resolve recipients before sending')
      return
    }
    if (!from) {
      setError('Select a sender address')
      return
    }

    setSending(true)
    setError(null)

    try {
      const input: SendEmailInput = {
        to: recipients,
        subject: subject.trim(),
        body: editorHtml,
        from,
        consentCategory,
      }
      const result = await sendEmailWithTracking(input)
      setSent(true)
      onSent?.(result.acceptedCount, result.sendId)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <Page.Main>
      <Page.Header>
        <Page.Heading level={1} icon={Mail} title="Compose Email" />
      </Page.Header>
      <Page.Body>
        <Card.Root>
          <Card.Body>
            <Field.Root>
              <Field.Label>Recipients</Field.Label>
              <InputDynamic.Root value={recipientsSummary || 'Select recipients...'} onOpen={() => setAudienceOpen(true)} onClose={() => setAudienceOpen(false)}>
                <InputDynamic.Trigger placeholder="Select recipients..." disabled={sending || sent} />
                <InputDynamic.Header
                  label="Select Recipients"
                  confirmLoading={resolving}
                  confirmDisabled={sending || sent || resolving}
                  onConfirm={() => handleResolveAudience()}
                  onCancel={() => setAudienceOpen(false)}
                />
                <InputDynamic.Body>
                  {error && (
                    <Alert.Root>
                      <Alert.Content>{error}</Alert.Content>
                    </Alert.Root>
                  )}
                  <Field.Root>
                    <Field.Label>Consent Category</Field.Label>
                    <Select.Root
                      collection={consentCategoryCollection}
                      value={[consentCategory]}
                      onValueChange={(e) => setConsentCategory(e.value[0] as 'broadcasts' | 'team_updates')}
                    >
                      <Select.Trigger>
                        <Select.ValueText placeholder="Select category" />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Content>
                        {consentCategoryCollection.items.map((item) => (
                          <Select.Item key={item.value} item={item}>
                            <Select.ItemText>{item.label}</Select.ItemText>
                            <Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  </Field.Root>

                  <AudiencePicker
                    audienceType={audienceType}
                    audienceRef={audienceRef}
                    peopleIds={peopleIds}
                    onChange={(type, ref, ids) => {
                      setAudienceType(type)
                      setAudienceRef(ref)
                      setPeopleIds(ids ?? [])
                    }}
                  />
                </InputDynamic.Body>
              </InputDynamic.Root>
            </Field.Root>

            <HStack gap="2">
              <Field.Root>
                <Field.Label>Subject</Field.Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                />
              </Field.Root>

              <Field.Root>
                <Field.Label>Sender</Field.Label>
                <Input
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="from@example.com"
                />
              </Field.Root>
            </HStack>
          </Card.Body>
        </Card.Root>

        {recipients.length > 0 && !audienceOpen && (
          <Text color="fg.muted">
            {recipients.length} recipient{recipients.length === 1 ? '' : 's'} ready to send
          </Text>
        )}
        <Card.Root padding="0">
          <Card.Body>
            <EmailEditor onChange={(_, html) => setEditorHtml(html)} editorConfig={editorConfig} />
          </Card.Body>
        </Card.Root>
        {error && (
          <Alert.Root>
            <Alert.Content>{error}</Alert.Content>
          </Alert.Root>
        )}
        {sent && (
          <Alert.Root>
            <Alert.Content>Email sent successfully.</Alert.Content>
          </Alert.Root>
        )}
      </Page.Body>
      <Page.Actions>
        <Button onClick={handleSend} disabled={sending || sent || recipients.length === 0}>
          {sending ? 'Sending...' : 'Send Email'}
        </Button>
      </Page.Actions>
    </Page.Main>
  )
}
