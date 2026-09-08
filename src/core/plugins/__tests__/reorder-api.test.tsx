import { describe, it, expect, beforeEach } from 'vitest'
import { createPluginReorderAPI } from '../PluginAPI'
import {
  getOrderedCollections,
  getPluginRegistrations,
  clearPluginRegistrations,
} from '../HookRegistry'

describe('plugin reorder API', () => {
  beforeEach(() => {
    clearPluginRegistrations()
  })

  const definition = { collectionId: 'elvanto:field-mappings', table: 'elvanto_sync_config' }

  it('registers an ordered collection via the API and retrieves it', () => {
    const api = createPluginReorderAPI('elvanto-sync')
    api.register({ id: 'elvanto:field-mappings', definition, label: 'Field mappings' })
    const collections = getOrderedCollections()
    expect(collections).toHaveLength(1)
    expect(collections[0]).toEqual({
      id: 'elvanto:field-mappings',
      definition,
      label: 'Field mappings',
    })
  })

  it('tracks registrations per plugin', () => {
    const api = createPluginReorderAPI('elvanto-sync')
    api.register({ id: 'elvanto:field-mappings', definition })
    const reg = getPluginRegistrations('elvanto-sync')
    expect(reg?.orderedCollections).toEqual(['elvanto:field-mappings'])
  })

  it('dedupes by id', () => {
    const api = createPluginReorderAPI('elvanto-sync')
    api.register({ id: 'elvanto:field-mappings', definition })
    api.register({ id: 'elvanto:field-mappings', definition })
    expect(getOrderedCollections()).toHaveLength(1)
  })

  it('clears ordered collections when a plugin is unloaded', () => {
    const api = createPluginReorderAPI('elvanto-sync')
    api.register({ id: 'elvanto:field-mappings', definition })
    clearPluginRegistrations('elvanto-sync')
    expect(getOrderedCollections()).toHaveLength(0)
  })
})