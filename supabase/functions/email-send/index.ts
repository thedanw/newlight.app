/**
 * Email Send Edge Function
 *
 * Receives send requests from the client, enforces consent and suppression
 * checks, sends via Google Workspace SMTP (nodemailer port 465), records
 * per-recipient outcomes, and rolls up the send status.
 *
 * Deploy: supabase functions deploy email-send
 * Local : supabase functions serve email-send --no-verify-jwt
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer@9.1.1'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const SMTP_HOST = Deno.env.get('SMTP_HOST') ?? ''
const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') ?? '465', 10)
const SMTP_USER = Deno.env.get('SMTP_USER') ?? ''
const SMTP_PASS = Deno.env.get('SMTP_PASS') ?? ''
const SMTP_FROM_NAME = Deno.env.get('SMTP_FROM_NAME') ?? 'New Light'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

interface SendRecipient {
  email: string
  name?: string | null
  person_id?: string | null
  consent_category: 'broadcasts' | 'team_updates'
}

interface SendRequest {
  sendId: string
  templateId?: string | null
  recipients: SendRecipient[]
  subject: string
  body: string
  from: string
  consentCategory: 'broadcasts' | 'team_updates'
}

interface SendResult {
  email: string
  status: 'sent' | 'failed' | 'suppressed' | 'skipped'
  messageId: string | null
  error: string | null
}

async function hashEmail(email: string): Promise<string> {
  const data = new TextEncoder().encode(email.toLowerCase())
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function isSuppressed(email: string): Promise<boolean> {
  const emailHash = await hashEmail(email)
  const { data, error } = await supabase
    .from('email_unsubscribes')
    .select('email_hash')
    .eq('email_hash', emailHash)
    .maybeSingle()
  if (error) throw error
  return data !== null
}

async function hasConsent(personId: string, consentCategory: string): Promise<boolean> {
  const consentColumn = `consent_${consentCategory}`
  const { data, error } = await supabase
    .from('people')
    .select(consentColumn)
    .eq('id', personId)
    .maybeSingle()
  if (error) throw error
  return data?.[consentColumn] === 'yes'
}

function rollupStatus(
  statuses: SendResult['status'][],
): 'sent' | 'failed' | 'partial' | 'suppressed' {
  if (statuses.length === 0) return 'suppressed'
  const sent = statuses.filter((s) => s === 'sent').length
  const failed = statuses.filter((s) => s === 'failed').length
  const suppressed = statuses.filter((s) => s === 'suppressed' || s === 'skipped').length

  if (sent === statuses.length) return 'sent'
  if (failed === statuses.length) return 'failed'
  if (suppressed === statuses.length) return 'suppressed'
  return 'partial'
}

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      'SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables.',
    )
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  })

  await new Promise((resolve, reject) => {
    transporter.verify((err: Error | null) => {
      if (err) reject(err)
      else resolve(undefined)
    })
  })

  return transporter
}

async function sendIndividualEmail(
  transporter: nodemailer.Transporter,
  recipient: SendRecipient,
  subject: string,
  body: string,
  from: string,
): Promise<SendResult> {
  try {
    const info = await transporter.sendMail({
      from: { email: from, name: SMTP_FROM_NAME },
      to: recipient.email,
      subject,
      html: body,
    })
    return {
      email: recipient.email,
      status: 'sent',
      messageId: info.messageId ?? null,
      error: null,
    }
  } catch (err) {
    return {
      email: recipient.email,
      status: 'failed',
      messageId: null,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const startTime = new Date().toISOString()

  try {
    const body = await req.json() as SendRequest
    const { sendId, recipients, subject, body: htmlBody, from, consentCategory } = body

    if (!sendId) throw new Error('sendId is required')
    if (!recipients || recipients.length === 0) throw new Error('recipients are required')
    if (!subject) throw new Error('subject is required')
    if (!htmlBody) throw new Error('body is required')
    if (!from) throw new Error('from is required')

    await supabase
      .from('email_sends')
      .update({ status: 'sending', updated_at: startTime })
      .eq('id', sendId)

    const results: SendResult[] = []
    const toSend: SendRecipient[] = []
    const skippedOrSuppressed: { recipient: SendRecipient; status: 'skipped' | 'suppressed'; reason: string }[] = []

    for (const recipient of recipients) {
      const email = recipient.email.toLowerCase()

      if (recipient.person_id) {
        const consent = await hasConsent(recipient.person_id, consentCategory)
        if (!consent) {
          results.push({ email, status: 'skipped', messageId: null, error: 'consent not given' })
          skippedOrSuppressed.push({ recipient, status: 'skipped', reason: 'consent not given' })
          continue
        }
      }

      const suppressed = await isSuppressed(email)
      if (suppressed) {
        results.push({ email, status: 'suppressed', messageId: null, error: 'unsubscribed' })
        skippedOrSuppressed.push({ recipient, status: 'suppressed', reason: 'unsubscribed' })
        continue
      }

      results.push({ email, status: 'queued' as const, messageId: null, error: null })
      toSend.push(recipient)
    }

    let sentResults: SendResult[] = []
    if (toSend.length > 0) {
      const transporter = await getTransporter()
      sentResults = await Promise.all(
        toSend.map(async (recipient) =>
          sendIndividualEmail(transporter, recipient, subject, htmlBody, from),
        ),
      )

      toSend.forEach((recipient, idx) => {
        const resultIdx = results.findIndex((r) => r.email === recipient.email.toLowerCase() && r.status === 'queued')
        if (resultIdx !== -1) results[resultIdx] = sentResults[idx]
      })
    }

    const recipientWrites = [
      ...skippedOrSuppressed.map(({ recipient, status, reason }) => ({
        id: crypto.randomUUID(),
        send_id: sendId,
        person_id: recipient.person_id ?? null,
        email: recipient.email.toLowerCase(),
        name: recipient.name ?? null,
        status,
        provider_message_id: null,
        error_message: reason,
        sent_at: null,
        created_at: startTime,
      })),
      ...results
        .filter((r) => r.status === 'sent' || r.status === 'failed')
        .map((r) => {
          const recipient = recipients.find((p) => p.email.toLowerCase() === r.email)
          return {
            id: crypto.randomUUID(),
            send_id: sendId,
            person_id: recipient?.person_id ?? null,
            email: r.email,
            name: recipient?.name ?? null,
            status: r.status,
            provider_message_id: r.messageId,
            error_message: r.error,
            sent_at: r.status === 'sent' ? new Date().toISOString() : null,
            created_at: startTime,
          }
        }),
    ]

    if (recipientWrites.length > 0) {
      const { error: insertError } = await supabase.from('email_recipients').insert(recipientWrites)
      if (insertError) throw insertError
    }

    const sendStatus = rollupStatus(results.map((r) => r.status))
    const acceptedCount = results.filter((r) => r.status === 'sent').length

    await supabase
      .from('email_sends')
      .update({
        status: sendStatus,
        accepted_count: acceptedCount,
        provider: 'smtp',
        sent_at: sendStatus === 'sent' || sendStatus === 'partial' ? new Date().toISOString() : null,
        error_message:
          sendStatus === 'failed'
            ? results.filter((r) => r.error).map((r) => r.error).join('; ')
            : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sendId)

    return new Response(
      JSON.stringify({
        success: true,
        results: results.map((r) => ({
          email: r.email,
          status: r.status,
          messageId: r.messageId,
          error: r.error,
        })),
        acceptedCount,
        sendStatus,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    console.error('[email-send] Fatal error:', err)

    if (err instanceof Error && err.message.includes('SMTP is not configured')) {
      return new Response(JSON.stringify({ error: 'SMTP not configured', message: err.message }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
