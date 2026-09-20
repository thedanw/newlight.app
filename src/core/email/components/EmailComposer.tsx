import { useState } from 'react'
import { CheckIcon, XIcon } from 'lucide-react'
import { Button, Field, IconButton, Input, Text } from '@/core/ui'
import { EmailEditor } from './EmailEditor'
import { AudiencePicker } from './AudiencePicker'
import { resolveAudience, filterByConsent } from '../lib/audience'
import { sendEmail } from '../lib/client'
import { getSenderAliases } from '../lib/queries'
import type { EmailRecipient, SendEmailInput } from '../lib/types'

export interface EmailComposerProps {
  initialSubject?: string
  initialBody?: string
  onSent?: (acceptedCount: number) => void
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

  const recipientsSummary =
    recipients.length > 0
      ? `${recipients.length} recipient${recipients.length === 1 ? '' : 's'} — ${recipients
          .slice(0, 3)
          .map((r) => r.name || r.email)
          .join(', ')}${recipients.length > 3 ? ` +${recipients.length - 3} more` : ''}`
      : ''

  useState(() => {
    getSenderAliases()
      .then((data) => {
        const defaultAlias = data.find((a) => a.is_default) || data[0]
        if (defaultAlias) setFrom(defaultAlias.email)
      })
      .catch(() => {})
  })

  const handleResolveAudience = async (): Promise<boolean> => {
    if (audienceType === 'explicit' && peopleIds.length === 0) {
      setError('No people selected')
      return false
    }
    if ((audienceType === 'saved_list' || audienceType === 'preset') && !audienceRef) {
      setError('No audience selected')
      return false
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
      setAudienceOpen(false)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      return false
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
      }
      const result = await sendEmail(input)
      setSent(true)
      onSent?.(result.acceptedCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Field.Root>
        <Field.Label>Recipients</Field.Label>
        {!audienceOpen ? (
          <Input
            readOnly
            value={recipientsSummary}
            placeholder="Select recipients..."
            onClick={() => {
              if (sending || sent) return
              setAudienceOpen(true)
            }}
            onFocus={() => {
              if (sending || sent) return
              setAudienceOpen(true)
            }}
            disabled={sending || sent}
            style={{ cursor: sending || sent ? 'not-allowed' : 'pointer', minWidth: '200px' }}
            aria-label="Recipients — open audience selector"
          />
        ) : (
          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Text style={{ fontWeight: 600 }}>Select audience</Text>
              <span style={{ flex: 1 }} />
              <IconButton
                size="sm"
                variant="outline"
                aria-label="Cancel audience selection"
                onClick={() => setAudienceOpen(false)}
                disabled={resolving}
              >
                <XIcon size={16} />
              </IconButton>
              <IconButton
                size="sm"
                aria-label="Confirm recipients"
                onClick={() => void handleResolveAudience()}
                disabled={sending || sent || resolving}
                loading={resolving}
              >
                <CheckIcon size={16} />
              </IconButton>
            </div>

            <Field.Root>
              <Field.Label>Consent Category</Field.Label>
              <select
                value={consentCategory}
                onChange={(e) => setConsentCategory(e.target.value as 'broadcasts' | 'team_updates')}
              >
                <option value="broadcasts">Broadcasts</option>
                <option value="team_updates">Team Updates</option>
              </select>
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
          </div>
        )}
      </Field.Root>

        <Field.Root>
          <Field.Label>Subject</Field.Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
            style={{ minWidth: '200px' }}
          />
        </Field.Root>

        <Field.Root>
          <Field.Label>Sender</Field.Label>
          <Input
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="from@example.com"
            style={{ minWidth: '200px' }}
          />
        </Field.Root>

      {recipients.length > 0 && !audienceOpen && (
        <Text color="fg.muted">
          {recipients.length} recipient{recipients.length === 1 ? '' : 's'} ready to send
        </Text>
      )}

      <div style={{ border: '1px solid #e5e7eb', borderRadius: '4px', minHeight: '300px' }}>
        <EmailEditor onChange={(_, html) => setEditorHtml(html)} />
      </div>

      {error && <Text color="fg.danger">{error}</Text>}
      {sent && <Text color="fg.muted">Email sent successfully.</Text>}

      <Button onClick={handleSend} disabled={sending || sent || recipients.length === 0}>
        {sending ? 'Sending...' : 'Send Email'}
      </Button>
    </div>
  )
}
