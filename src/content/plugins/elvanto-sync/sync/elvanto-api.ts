/**
 * Elvanto API helpers for browser contexts (settings UI).
 *
 * Elvanto's REST API does not send CORS headers, so a direct browser fetch to
 * api.elvanto.com is blocked ("preflight request doesn't pass access control
 * check"). To work around that we route requests through two proxies, mirroring
 * the rest of the sync plugin:
 *
 *  - Development: the Vite dev-server proxy `/api/elvanto` (see vite.config.ts),
 *    which forwards to https://api.elvanto.com server-side.
 *  - Production: the `elvanto-sync-worker` Edge Function, which performs the
 *    request server-side and responds with CORS headers.
 */

import { getElvantoSyncWorkerUrl } from './trigger-sync'

const ELVANTO_VITE_PROXY_BASE = '/api/elvanto'

export interface ElvantoLocation {
  id: string
  name: string
}

/** Anon/publishable key used for authenticated Edge Function calls. */
function getEdgeFunctionKey(): string {
  return import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
}

/**
 * Normalize a `calendar/getAll` payload into `{ id, name }[]`.
 * The response wraps the list in `data.calendars.calendar[]` (pagination
 * envelope) but we also tolerate a bare `data.calendars[]` array.
 */
function normalizeCalendars(data: unknown): ElvantoLocation[] {
  const calendars = (data as any)?.calendars
  const items = Array.isArray(calendars)
    ? calendars
    : Array.isArray(calendars?.calendar)
      ? calendars.calendar
      : []

  return items
    .filter((item: any) => item && typeof item.id === 'string' && typeof item.name === 'string')
    .map((item: any) => ({ id: item.id, name: item.name }))
}

/**
 * Fetch Elvanto locations/campuses (modeled as Calendars for this integration)
 * via `calendar/getAll`. Uses the Vite proxy in dev and the Edge Function in
 * production to avoid the API's missing CORS headers.
 *
 * @throws Error with a descriptive message when the request fails.
 */
export async function fetchElvantoLocations(apiKey: string): Promise<ElvantoLocation[]> {
  if (import.meta.env.DEV) {
    const response = await fetch(`${ELVANTO_VITE_PROXY_BASE}/v1/calendar/getAll.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(apiKey + ':')}`,
      },
      body: JSON.stringify({ page_size: 1000 }),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok || data.status !== 'ok') {
      throw new Error(data.error?.message || `Elvanto API error: ${response.status}`)
    }

    return normalizeCalendars(data)
  }

  // Production — proxy through the Supabase Edge Function (has CORS headers).
  const edgeKey = getEdgeFunctionKey()
  const response = await fetch(getElvantoSyncWorkerUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(edgeKey ? { apikey: edgeKey, Authorization: `Bearer ${edgeKey}` } : {}),
    },
    body: JSON.stringify({ action: 'list_locations', api_key: apiKey }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || `Elvanto sync worker request failed (HTTP ${response.status})`)
  }
  if (!payload?.success) {
    throw new Error(payload?.error || 'Failed to fetch locations from Elvanto')
  }

  return payload.locations ?? []
}