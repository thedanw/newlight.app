/**
 * Trigger Elvanto sync worker — client-side helper for invoking the
 * Supabase Edge Function.
 *
 * The previous implementation called a relative `/functions/v1/...` URL, which
 * 404'd against the Vite dev server. Edge Functions are served by the Supabase
 * Functions gateway (hosted or local CLI), so we build an *absolute* URL from
 * env and attach the required `apikey` header (hosted functions run with
 * `verify_jwt = true`).
 */

export interface TriggerSyncPayload {
  trigger?: 'cron' | 'manual' | 'webhook'
  entity?: string
  fullScan?: boolean
}

export interface SyncTriggerResult {
  success: boolean
  trigger: string
  startedAt: string
  completedAt: string
  entities: Record<string, unknown>
  totalProcessed: number
  totalFailed: number
  errors: string[]
}

const EDGE_FUNCTION_NAME = 'elvanto-sync-worker'

/** Supabase project URL, falling back to the local CLI (supabase start). */
function getSupabaseUrl(): string {
  return (import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321').replace(/\/+$/, '')
}

/** Anon/publishable key — same fallback as src/core/lib/supabase.ts. */
function getSupabaseAnonKey(): string {
  return import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
}

export function getElvantoSyncWorkerUrl(): string {
  return `${getSupabaseUrl()}/functions/v1/${EDGE_FUNCTION_NAME}`
}

/**
 * Invoke the elvanto-sync-worker Edge Function.
 *
 * @throws Error with status/detail when the request fails or the function
 *         returns a non-OK status.
 */
export async function triggerElvantoSync(payload: TriggerSyncPayload = {}): Promise<SyncTriggerResult> {
  const apiKey = getSupabaseAnonKey()

  const response = await fetch(getElvantoSyncWorkerUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { apikey: apiKey, Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({ trigger: 'manual', ...payload }),
  })

  // Parse the JSON body unconditionally — the edge function returns HTTP 207
  // (Multi-Status) with `success: false` for partial/none failures, which
  // `response.ok` treats as success (2xx). Classify failure from either signal.
  const parsedBody = await response.json().catch(() => null)

  if (!parsedBody) {
    throw new Error(
      `Elvanto sync worker request failed (HTTP ${response.status}): empty or non-JSON response body`,
    )
  }

  if (!response.ok || parsedBody.success === false) {
    let detail = ''
    const details = parsedBody.details
    const errors = parsedBody.errors
    if (Array.isArray(details) && details.length > 0) {
      detail = details.join('; ')
    } else if (Array.isArray(errors) && errors.length > 0) {
      detail = errors.join('; ')
    } else {
      detail = parsedBody.message || parsedBody.error || JSON.stringify(parsedBody)
    }
    throw new Error(
      `Elvanto sync worker request failed (HTTP ${response.status})${detail ? `: ${detail}` : ''}`,
    )
  }

  return parsedBody as SyncTriggerResult
}