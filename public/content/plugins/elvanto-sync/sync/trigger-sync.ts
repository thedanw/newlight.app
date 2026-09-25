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

export interface TestConnectionResult {
  success: boolean
  message?: string
  error?: string
}

import { createClient } from '@supabase/supabase-js'
import { getSupabaseUrl, getSupabaseAnonKey } from '@/core/lib/runtime-config'
import type { SupabaseClient } from '@supabase/supabase-js'

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
 * Uses the signed-in user's access token from the provided Supabase client.
 * Surface 401/403 as visible errors.
 *
 * @throws Error with status/detail when the request fails or the function
 *         returns a non-OK status.
 */
export async function triggerElvantoSync(
  supabase: SupabaseClient,
  payload: TriggerSyncPayload = {}
): Promise<SyncTriggerResult> {
  // Get the current user's session from the provided client
  const { data: { session } } = await supabase.auth.getSession()
  const jwt = session?.access_token || ''

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Include Authorization header if we have a JWT token
  if (jwt) {
    headers.Authorization = `Bearer ${jwt}`
  }

  const response = await fetch(getElvantoSyncWorkerUrl(), {
    method: 'POST',
    headers,
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

/**
 * Test Elvanto API connection via the Edge Function proxy.
 * This avoids CORS issues since the Edge Function makes the request server-side.
 */
export async function testElvantoConnection(
  supabase: SupabaseClient,
  apiKey: string
): Promise<TestConnectionResult> {
  // Get the current user's session from the provided client
  const { data: { session } } = await supabase.auth.getSession()
  const jwt = session?.access_token || ''

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Include Authorization header if we have a JWT token
  if (jwt) {
    headers.Authorization = `Bearer ${jwt}`
  }

  const response = await fetch(getElvantoSyncWorkerUrl(), {
    method: 'POST',
    headers,
    body: JSON.stringify({ action: 'test_connection', api_key: apiKey }),
  })

  const parsedBody = await response.json().catch(() => null)

  if (!parsedBody) {
    return {
      success: false,
      error: `Connection test failed (HTTP ${response.status}): empty or non-JSON response body`,
    }
  }

  if (!response.ok) {
    return {
      success: false,
      error: parsedBody.error || parsedBody.message || `HTTP ${response.status}`,
    }
  }

  return parsedBody as TestConnectionResult
}