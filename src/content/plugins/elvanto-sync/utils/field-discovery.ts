import type { ElvantoCategory, ElvantoCustomField, ElvantoLocation } from '../api/endpoints'

/**
 * Field Discovery — Discovers dynamic UUID-based fields from Elvanto
 * Used to populate field mapping dropdowns with real category/custom field/location IDs
 */

export interface DiscoveredFieldCatalog {
  categories: Array<{ id: string; name: string }>
  customFields: Array<{ id: string; name: string; type: string }>
  locations: Array<{ id: string; name: string }>
  demographics: string[]
  discoveredAt: string
}

async function elvantoRequest<T>(
  apiKey: string,
  endpoint: string,
  body: Record<string, any> = {}
): Promise<T> {
  const isDev = import.meta.env.DEV
  const path = `/v1/${endpoint}.json`
  const url = isDev ? `/api/elvanto${path}` : `https://api.elvanto.com${path}`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(apiKey + ':')}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `HTTP ${response.status}`)
  }

  const data = await response.json()
  if (data.status === 'error' || data.error) {
    throw new Error(data.error?.message || 'Elvanto API error')
  }

  return data as T
}

async function discoverViaEdgeFunction(apiKey: string): Promise<DiscoveredFieldCatalog> {
  // Use the edge function as a CORS proxy for field discovery
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
  const response = await fetch(`${supabaseUrl}/functions/v1/elvanto-sync-worker`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
    },
    body: JSON.stringify({
      action: 'discover_fields',
      api_key: apiKey
    }),
  })

  if (!response.ok) {
    throw new Error(`Edge function error: ${response.status}`)
  }

  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error || 'Edge function discovery failed')
  }

  return {
    categories: data.categories ?? [],
    customFields: data.customFields ?? [],
    locations: data.locations ?? [],
    demographics: data.demographics ?? [],
    discoveredAt: new Date().toISOString(),
  }
}

export async function discoverElvantoFields(apiKey: string): Promise<DiscoveredFieldCatalog> {
  const isDev = import.meta.env.DEV
  
  if (isDev) {
    // In dev, use Vite proxy directly
    const [categoriesRes, customFieldsRes, peopleRes] = await Promise.all([
      elvantoRequest<{ categories: { category: ElvantoCategory[] } }>(apiKey, 'people/categories/getAll').catch(() => ({ categories: { category: [] } })),
      elvantoRequest<{ custom_fields: { custom_field: ElvantoCustomField[] } }>(apiKey, 'people/customFields/getAll').catch(() => ({ custom_fields: { custom_field: [] } })),
      elvantoRequest<{ people: { person: any[] } }>(apiKey, 'people/getAll', { page_size: 1000, fields: ['locations', 'demographics'] }).catch(() => ({ people: { person: [] } })),
    ])
    
    // Extract unique locations and demographics from people
    const locationMap = new Map<string, string>()
    const demographicSet = new Set<string>()
    
    for (const person of peopleRes.people?.person ?? []) {
      const locs = person.locations?.location ?? []
      for (const loc of locs) {
        if (loc.id && loc.name) locationMap.set(loc.id, loc.name)
      }
      const demos = person.demographics ?? []
      for (const demo of demos) {
        if (demo) demographicSet.add(demo)
      }
    }
    
    return {
      categories: (categoriesRes.categories?.category ?? []).map((c) => ({ id: c.id, name: c.name })),
      customFields: (customFieldsRes.custom_fields?.custom_field ?? []).map((cf) => ({ id: cf.id, name: cf.name, type: cf.type })),
      locations: Array.from(locationMap.entries()).map(([id, name]) => ({ id, name })),
      demographics: Array.from(demographicSet),
      discoveredAt: new Date().toISOString(),
    }
  } else {
    // In production, use edge function proxy to avoid CORS issues
    return discoverViaEdgeFunction(apiKey)
  }
}

export function getElvantoFieldOptions(catalog: DiscoveredFieldCatalog | null): Array<{ value: string; label: string }> {
  if (!catalog) return []

  const options: Array<{ value: string; label: string }> = []

  for (const cat of catalog.categories) {
    options.push({ value: `category_id:${cat.id}`, label: `Category: ${cat.name} (${cat.id})` })
  }

  for (const cf of catalog.customFields) {
    options.push({ value: `custom_${cf.id}`, label: `Custom Field: ${cf.name} (${cf.id})` })
  }

  for (const loc of catalog.locations) {
    options.push({ value: `locations:${loc.id}`, label: `Location: ${loc.name} (${loc.id})` })
  }

  // Add demographics as field options (they map to the 'demographics' field in Elvanto)
  for (const demo of catalog.demographics ?? []) {
    options.push({ value: `demographics:${demo}`, label: `Demographic: ${demo}` })
  }

  return options
}
