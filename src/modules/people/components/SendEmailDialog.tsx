import { useState } from 'react'
import { Dialog, Field, Input, Text, Textarea } from '@/core/ui'
import type { EmailRecipient } from '@/core/lib/email'
import { sendPeopleEmail } from '../lib/email'

type SendEmailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Recipients to pre-fill. Resolved from a saved list or a single person. */
  recipients: EmailRecipient[]
  /** Optional default subject line. */
  defaultSubject?: string
}

export function SendEmailDialog({ open, onOpenChange, recipients, defaultSubject = '' }: SendEmailDialogProps) {
  const [subject, setSubject] = useState(defaultSubject)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const reset = () => {
    setSubject(defaultSubject)
    setBody('')
    setError(null)
    setSent(false)
    setSending(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const handleSend = async () => {
    setSending(true)
    setError(null)
    try {
      await sendPeopleEmail(recipients, subject, body)
      setSent(true)
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(details) => handleOpenChange(details.open)}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Title>Send email</Dialog.Title>
          <Dialog.Body>
            <Text color="fg.muted">
              {recipients.length} recipient{recipients.length === 1 ? '' : 's'}
            </Text>
            <Field.Root>
              <Field.Label>Subject</Field.Label>
              <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Email subject" />
            </Field.Root>
            <Field.Root>
              <Field.Label>Message</Field.Label>
              <Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write your message..." rows={6} />
            </Field.Root>
            {error && <Text color="fg.default">{error}</Text>}
            {sent && <Text color="fg.muted">Email sent.</Text>}
          </Dialog.Body>
          <Dialog.Footer>
            <Dialog.ActionTrigger onClick={() => void handleSend()} disabled={sending || sent}>
              {sending ? 'Sending...' : 'Send'}
            </Dialog.ActionTrigger>
            <Dialog.CloseTrigger>Close</Dialog.CloseTrigger>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}
