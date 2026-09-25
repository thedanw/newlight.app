/**
 * Email Secrets Edge Function
 *
 * Write-only surface for super_admins to store SMTP / Resend credentials.
 * The plaintext value is encrypted server-side (AES-256-GCM) and persisted to
 * the `service_role`-only `email_secrets` table. The client never receives the
 * plaintext back — the UI renders a masked field and a "configured" probe.
 *
 * Deploy: supabase functions deploy email-secrets
 * Local : supabase functions serve email-secrets --no-verify-jwt
 *
 * Env: EMAIL_ENCRYPTION_KEY is NOT required — the AES key is auto-provisioned
 *      in `email_encryption_keys` (service_role-only) on first use.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const ENC_KEY_NAME = 'default'
const ENC_KEY_LENGTH = 32 // AES-256
const ENC_NONCE_LENGTH = 12

interface JsonBody {
  action: 'upsert' | 'has' | 'remove'
  name: string
  value?: string
}

function b64ToBuf(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function bufToB64(buf: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i] as number)
  return btoa(bin)
}

async function getOrCreateEncryptionKey(): Promise<Uint8Array> {
  const { data, error } = await supabase
    .from('email_encryption_keys')
    .select('key_bytes')
    .eq('name', ENC_KEY_NAME)
    .maybeSingle()

  if (!error && data?.key_bytes) return b64ToBuf(data.key_bytes as string)

  // First use: provision a key. Race-safe via unique PK (catch dup violation).
  const keyBytes = crypto.getRandomValues(new Uint8Array(ENC_KEY_LENGTH))
  const { error: insertError } = await supabase.from('email_encryption_keys').insert({
    name: ENC_KEY_NAME,
    key_bytes: keyBytes,
  })
  if (insertError) {
    // Another instance won the race; read it back.
    const { data: again, error: againErr } = await supabase
      .from('email_encryption_keys')
      .select('key_bytes')
      .eq('name', ENC_KEY_NAME)
      .maybeSingle()
    if (againErr || !again?.key_bytes) throw againErr ?? new Error('Failed to provision encryption key')
    return b64ToBuf(again.key_bytes as string)
  }
  return keyBytes
}

async function encryptValue(plain: string): Promise<{ value_encrypted: Uint8Array; nonce: Uint8Array }> {
  const keyBytes = await getOrCreateEncryptionKey()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt'],
  )
  const nonce = crypto.getRandomValues(new Uint8Array(ENC_NONCE_LENGTH))
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, cryptoKey, new TextEncoder().encode(plain))
  return { value_encrypted: new Uint8Array(encrypted), nonce }
}

async function hasSecret(name: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('email_secrets')
    .select('*', { count: 'exact', head: true })
    .eq('name', name)
  if (error) throw error
  return (count ?? 0) > 0
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

  const authHeader = req.headers.get('authorization') || ''
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : ''

  let body: JsonBody
  try {
    body = (await req.json()) as JsonBody
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    if (!(body.name && body.action)) {
      throw new Error('name and action are required')
    }

    // Authenticate and authorize: all actions require a super_admin.
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt)
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: person, error: personError } = await supabase
      .from('people')
      .select('access_permission')
      .eq('id', user.id)
      .maybeSingle()
    if (personError || !person || person.access_permission !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    switch (body.action) {
      case 'upsert': {
        if (!body.value) throw new Error('value is required for upsert')
        const enc = await encryptValue(body.value)
        const { error } = await supabase.from('email_secrets').upsert({
          name: body.name,
          value_encrypted: enc.value_encrypted,
          nonce: enc.nonce,
          created_by: user.id,
        })
        if (error) throw error
        return new Response(JSON.stringify({ success: true, hasSecret: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'has': {
        const has = await hasSecret(body.name)
        return new Response(JSON.stringify({ success: true, hasSecret: has }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'remove': {
        const { error } = await supabase.from('email_secrets').delete().eq('name', body.name)
        if (error) throw error
        return new Response(JSON.stringify({ success: true, hasSecret: false }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      default:
        throw new Error(`Unknown action: ${body.action as string}`)
    }
  } catch (err) {
    console.error('[email-secrets] Error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
