import { describe, it, expect, beforeEach } from 'vitest'
import { createPluginDragndropAPI } from '../PluginAPI'
import {
  getDndCollections,
  getPluginRegistrations,
  clearPluginRegistrations,
} from '../HookRegistry'
import type { DndCollection } from '@/core/dragndrop/types'

describe('Plugin Dragndrop API', () => {
  beforeEach(() => {
    clearPluginRegistrations()
  })

  it('exposes a register function on the dragndrop API', () => {
    const api = createPluginDragndropAPI('test-plugin')
    expect(typeof api.register).toBe('function')
  })

  it('registers a collection via api.dragndrop.register()', () => {
    const api = createPluginDragndropAPI('test-plugin')
    api.register({
      id: 'people',
      label: 'People',
      items: [{ id: '1', label: 'Alice' }],
    })

    const collections = getDndCollections()
    expect(collections).toHaveLength(1)
    expect(collections[0].id).toBe('people')
    expect(collections[0].label).toBe('People')
    expect(collections[0].items[0].label).toBe('Alice')
  })

  it('does not register duplicate collection ids', () => {
    const api = createPluginDragndropAPI('test-plugin')
    api.register({ id: 'people', label: 'People', items: [] })
    api.register({ id: 'people', label: 'People', items: [] })

    expect(getDndCollections()).toHaveLength(1)
  })

  it('tracks which plugin registered a collection', () => {
    const api = createPluginDragndropAPI('test-plugin')
    api.register({ id: 'people', label: 'People', items: [] })

    const reg = getPluginRegistrations('test-plugin')
    expect(reg?.dndCollections).toContain('people')
  })

  it('clears collections when the plugin is unloaded', () => {
    const api = createPluginDragndropAPI('test-plugin')
    api.register({ id: 'people', label: 'People', items: [] })

    clearPluginRegistrations('test-plugin')
    expect(getDndCollections()).toHaveLength(0)
  })

  it('supports multiple plugins registering distinct collections', () => {
    const apiA = createPluginDragndropAPI('plugin-a')
    const apiB = createPluginDragndropAPI('plugin-b')
    apiA.register({ id: 'a-collection', label: 'A', items: [] })
    apiB.register({ id: 'b-collection', label: 'B', items: [] })

    const collections = getDndCollections()
    expect(collections).toHaveLength(2)
    expect(collections.map((c) => c.id).sort()).toEqual(['a-collection', 'b-collection'])
  })

  it('accepts a full DndCollection with isActive flag', () => {
    const api = createPluginDragndropAPI('test-plugin')
    const collection: DndCollection = {
      id: 'journey-tracks',
      label: 'Journey Tracks',
      items: [
        { id: 'track-1', label: 'First Steps', data: { hue: 'blue' } },
        { id: 'track-2', label: 'Grow', disabled: true },
      ],
      isActive: true,
    }
    api.register(collection)

    const [registered] = getDndCollections()
    expect(registered.isActive).toBe(true)
    expect(registered.items[0].data).toEqual({ hue: 'blue' })
    expect(registered.items[1].disabled).toBe(true)
  })
})