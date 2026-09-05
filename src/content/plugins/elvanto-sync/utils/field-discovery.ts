import type { ElvantoCategory, ElvantoCustomField, ElvantoLocation } from '../api/endpoints'

/**
 * Field Discovery — Discovers dynamic UUID-based fields from Elvanto
 * Used to populate field mapping dropdowns with real category/custom field/location IDs
 */

export interface DiscoveredFieldCatalog {
  categories: Array<{ id: string; name: string }>
  customFields: Array<{ id: string; name: string; type: string }>
  locations: Array<{ id: string; name: string }>
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

export async function discoverElvantoFields(apiKey: string): Promise<DiscoveredFieldCatalog> {
  const [categoriesRes, customFieldsRes, locationsRes] = await Promise.all([
    elvantoRequest<{ categories: { category: ElvantoCategory[] } }>(apiKey, 'people/categories/getAll').catch(() => ({ categories: { category: [] } })),
    elvantoRequest<{ custom_fields: { custom_field: ElvantoCustomField[] } }>(apiKey, 'people/customFields/getAll').catch(() => ({ custom_fields: { custom_field: [] } })),
    elvantoRequest<{ locations: { location: ElvantoLocation[] } }>(apiKey, 'locations/getAll').catch(() => ({ locations: { location: [] } })),
  ])

  return {
    categories: (categoriesRes.categories?.category ?? []).map((c) => ({ id: c.id, name: c.name })),
    customFields: (customFieldsRes.custom_fields?.custom_field ?? []).map((cf) => ({ id: cf.id, name: cf.name, type: cf.type })),
    locations: (locationsRes.locations?.location ?? []).map((l) => ({ id: l.id, name: l.name })),
    discoveredAt: new Date().toISOString(),
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

  return options
}
