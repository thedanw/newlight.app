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

import { createClient } from '@supabase/supabase-js'
import { getSupabaseUrl, getSupabaseAnonKey } from '@/core/lib/runtime-config'

const EDGE_FUNCTION_NAME = 'elvanto-sync-worker'

/** Supabase project URL, falling back to the local CLI (supabase start). */
function resolveSupabaseUrl(): string {
  return (getSupabaseUrl() || 'http://127.0.0.1:54321').replace(/\/+$/, '')
}

export function getElvantoSyncWorkerUrl(): string {
  return `${resolveSupabaseUrl()}/functions/v1/${EDGE_FUNCTION_NAME}`
}

/**
 * Invoke the elvanto-sync-worker Edge Function.
 *
 * Uses the signed-in user's access token (from the settings session),
 * not the anon key. Surface 401/403 as visible errors.
 *
 * @throws Error with status/detail when the request fails or the function
 *         returns a non-OK status.
 */
export async function triggerElvantoSync(payload: TriggerSyncPayload = {}): Promise<SyncTriggerResult> {
  const supabaseUrl = resolveSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()

  // Create a Supabase client with the user's session token
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    }
  })

  // Get the current user's session
  const { data: { session } } = await supabase.auth.getSession()
  const jwt = session?.access_token || ''

  const response = await fetch(getElvantoSyncWorkerUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
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