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
import { getSupabaseAnonKey } from '@/core/lib/runtime-config'

const ELVANTO_VITE_PROXY_BASE = '/api/elvanto'

export interface ElvantoLocation {
  id: string
  name: string
}

export interface ElvantoCategory {
  id: string
  name: string
}

export interface ElvantoDemographic {
  name: string
}

function getEdgeFunctionKey(): string {
  return getSupabaseAnonKey()
}

/**
 * Normalize a `people/getAll` payload to extract unique locations from person records.
 * Locations are nested in `person.locations.location[]`.
 */
function normalizeLocationsFromPeople(data: unknown): ElvantoLocation[] {
  const people = (data as any)?.people?.person ?? []
  const locationMap = new Map<string, string>()

  for (const person of people) {
    const locations = person.locations?.location ?? []
    for (const loc of locations) {
      if (loc.id && loc.name) {
        locationMap.set(loc.id, loc.name)
      }
    }
  }

  return Array.from(locationMap.entries()).map(([id, name]) => ({ id, name }))
}

/**
 * Normalize a `people/getAll` payload to extract unique demographics from person records.
 * Demographics are in `person.demographics.demographic[]` (array of objects with id and name).
 */
function normalizeDemographicsFromPeople(data: unknown): ElvantoDemographic[] {
  const people = (data as any)?.people?.person ?? []
  const demographicSet = new Set<string>()

  for (const person of people) {
    const demographicsObj = person.demographics
    if (demographicsObj && Array.isArray(demographicsObj.demographic)) {
      for (const demo of demographicsObj.demographic) {
        if (demo && demo.name) demographicSet.add(demo.name)
      }
    }
  }

  return Array.from(demographicSet).map(name => ({ name }))
}

/**
 * Normalize a `people/categories/getAll` payload into `{ id, name }[]`.
 */
function normalizeCategories(data: unknown): ElvantoCategory[] {
  const categories = (data as any)?.categories
  const items = Array.isArray(categories)
    ? categories
    : Array.isArray(categories?.category)
      ? categories.category
      : []

  return items
    .filter((item: any) => item && typeof item.id === 'string' && typeof item.name === 'string')
    .map((item: any) => ({ id: item.id, name: item.name }))
}

/**
 * Fetch Elvanto locations by extracting them from all people records via `people/getAll`.
 * Uses the Vite proxy in dev and the Edge Function in production to avoid CORS issues.
 *
 * @throws Error with a descriptive message when the request fails.
 */
export async function fetchElvantoLocations(apiKey: string): Promise<ElvantoLocation[]> {
  if (import.meta.env.DEV) {
    const response = await fetch(`${ELVANTO_VITE_PROXY_BASE}/v1/people/getAll.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(apiKey + ':')}`,
      },
      body: JSON.stringify({ page_size: 1000, fields: ['locations'] }),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok || data.status !== 'ok') {
      throw new Error(data.error?.message || `Elvanto API error: ${response.status}`)
    }

    return normalizeLocationsFromPeople(data)
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

/**
 * Fetch Elvanto demographics by extracting them from all people records via `people/getAll`.
 * Uses the Vite proxy in dev and the Edge Function in production to avoid CORS issues.
 *
 * @throws Error with a descriptive message when the request fails.
 */
export async function fetchElvantoDemographics(apiKey: string): Promise<ElvantoDemographic[]> {
  if (import.meta.env.DEV) {
    const response = await fetch(`${ELVANTO_VITE_PROXY_BASE}/v1/people/getAll.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(apiKey + ':')}`,
      },
      body: JSON.stringify({ page_size: 1000, fields: ['demographics'] }),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok || data.status !== 'ok') {
      throw new Error(data.error?.message || `Elvanto API error: ${response.status}`)
    }

    return normalizeDemographicsFromPeople(data)
  }

  // Production — proxy through the Supabase Edge Function (has CORS headers).
  const edgeKey = getEdgeFunctionKey()
  const response = await fetch(getElvantoSyncWorkerUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(edgeKey ? { apikey: edgeKey, Authorization: `Bearer ${edgeKey}` } : {}),
    },
    body: JSON.stringify({ action: 'list_demographics', api_key: apiKey }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || `Elvanto sync worker request failed (HTTP ${response.status})`)
  }
  if (!payload?.success) {
    throw new Error(payload?.error || 'Failed to fetch demographics from Elvanto')
  }

  return payload.demographics ?? []
}

/**
 * Fetch Elvanto categories via the dedicated `people/categories/getAll` endpoint.
 * Uses the Vite proxy in dev and the Edge Function in production to avoid CORS issues.
 *
 * @throws Error with a descriptive message when the request fails.
 */
export async function fetchElvantoCategories(apiKey: string): Promise<ElvantoCategory[]> {
  if (import.meta.env.DEV) {
    const response = await fetch(`${ELVANTO_VITE_PROXY_BASE}/v1/people/categories/getAll.json`, {
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

    return normalizeCategories(data)
  }

  // Production — proxy through the Supabase Edge Function (has CORS headers).
  const edgeKey = getEdgeFunctionKey()
  const response = await fetch(getElvantoSyncWorkerUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(edgeKey ? { apikey: edgeKey, Authorization: `Bearer ${edgeKey}` } : {}),
    },
    body: JSON.stringify({ action: 'list_categories', api_key: apiKey }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || `Elvanto sync worker request failed (HTTP ${response.status})`)
  }
  if (!payload?.success) {
    throw new Error(payload?.error || 'Failed to fetch categories from Elvanto')
  }

  return payload.categories ?? []
}