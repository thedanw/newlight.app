/**
 * Email Unsubscribe Edge Function
 *
 * Public endpoint for one-click unsubscribe. Renders an HTML confirmation
 * page on GET, records the unsubscribe on POST. The email address never
 * appears in the URL — only an opaque token.
 *
 * Deploy: supabase functions deploy email-unsubscribe
 * Local : supabase functions serve email-unsubscribe --no-verify-jwt
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

function htmlPage(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="font-family:sans-serif;max-width:480px;margin:48px auto;padding:0 16px;text-align:center">
${body}
</body>
</html>`
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return new Response(
      htmlPage('Unsubscribe', '<h1>Missing token</h1><p>The unsubscribe link is invalid.</p>'),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      },
    )
  }

  const tokenHash = await hashToken(token)

  if (req.method === 'GET') {
    const { data: existing, error: lookupError } = await supabase
      .from('email_unsubscribes')
      .select('email_hash, send_id, unsubscribed_at, reason')
      .eq('token_hash', tokenHash)
      .maybeSingle()

    if (lookupError) {
      return new Response(
        htmlPage('Error', '<h1>Something went wrong</h1><p>Please try again later.</p>'),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
        },
      )
    }

    if (existing) {
      return new Response(
        htmlPage(
          'Already Unsubscribed',
          '<h1>Already Unsubscribed</h1><p>You have already unsubscribed from New Light emails.</p>',
        ),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
        },
      )
    }

    return new Response(
      htmlPage(
        'Confirm Unsubscribe',
        `<h1>Unsubscribe</h1>
        <p>Are you sure you want to unsubscribe from New Light emails?</p>
        <form method="POST" action="/email/unsubscribe?token=${encodeURIComponent(token)}">
          <textarea name="reason" placeholder="Optional: why are you unsubscribing?" rows="3" style="width:100%;margin-bottom:12px"></textarea>
          <button type="submit" style="padding:8px 16px;background:#ef4444;color:white;border:none;border-radius:4px;cursor:pointer">Yes, unsubscribe me</button>
        </form>`,
      ),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      },
    )
  }

  if (req.method === 'POST') {
    let body: { reason?: string } = {}
    try {
      const contentType = req.headers.get('content-type') ?? ''
      if (contentType.includes('application/json')) {
        body = await req.json()
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await req.text()
        body = Object.fromEntries(new URLSearchParams(formData))
      }
    } catch {
      body = {}
    }

    const { error } = await supabase
      .from('email_unsubscribes')
      .insert({
        id: crypto.randomUUID(),
        email_hash: '',
        token_hash: tokenHash,
        send_id: null,
        reason: body.reason ?? null,
        unsubscribed_at: new Date().toISOString(),
      })

    if (error) {
      return new Response(
        htmlPage('Error', '<h1>Something went wrong</h1><p>Could not record your unsubscribe. Please try again later.</p>'),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
        },
      )
    }

    return new Response(
      htmlPage(
        'Unsubscribed',
        '<h1>Unsubscribed</h1><p>You have been unsubscribed from New Light emails. You will no longer receive these messages.</p>',
      ),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      },
    )
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
