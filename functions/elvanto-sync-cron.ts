/**
 * Cloudflare Pages Function — Elvanto Sync Cron Trigger
 *
 * Triggered by Cloudflare Cron Triggers on the schedule defined in `config`.
 * On each invocation, POSTs to the Supabase Edge Function
 * `elvanto-sync-worker` with `{trigger: "cron"}` using service_role Basic auth.
 *
 * Setup:
 * 1. Add `SUPABASE_SERVICE_ROLE_KEY` as a Secret in Cloudflare Pages dashboard
 * 2. Deploy this branch to trigger a Pages build
 * 3. The cron trigger activates automatically based on the schedule below
 */

export const config = {
  // Daily at 02:00 UTC — matches the default in elvanto_sync_config
  // To change the schedule, update this cron expression and redeploy
  schedule: '0 2 * * *',
}

interface Env {
  SUPABASE_SERVICE_ROLE_KEY: string
}

export default async (_req: Request, env: Env): Promise<Response> => {
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  const url = 'https://rupujdsalfekudambviu.supabase.co/functions/v1/elvanto-sync-worker'

  if (!key) {
    return new Response('Missing SUPABASE_SERVICE_ROLE_KEY', { status: 500 })
  }

  const auth = btoa(`${key}:`)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trigger: 'cron' }),
    })

    const text = await res.text()
    return new Response(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
