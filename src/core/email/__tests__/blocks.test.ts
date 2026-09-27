import { describe, expect, it, vi } from 'vitest'

vi.mock('@/core/lib/supabase', () => ({ supabase: { from: vi.fn() } }))

describe('email blocks registry (Studio SDK)', () => {
  it('returns registered components', async () => {
    const { getRegisteredComponents, registerEmailComponent, clearRegisteredComponents } = await import('../lib/blocks')
    clearRegisteredComponents()
    registerEmailComponent({
      type: 'custom',
      model: { defaultContent: '<p>Custom</p>' },
      view: {},
      traits: {},
    })
    const components = getRegisteredComponents()
    expect(components).toHaveLength(1)
    expect(components[0].type).toBe('custom')
    clearRegisteredComponents()
  })

  it('registerEmailComponent throws on duplicate', async () => {
    const { registerEmailComponent, clearRegisteredComponents } = await import('../lib/blocks')
    clearRegisteredComponents()
    registerEmailComponent({
      type: 'dup',
      model: {},
      view: {},
      traits: {},
    })
    expect(() =>
      registerEmailComponent({
        type: 'dup',
        model: {},
        view: {},
        traits: {},
      }),
    ).toThrow('Email component type already registered')
    clearRegisteredComponents()
  })

  it('clearRegisteredComponents resets the registry', async () => {
    const { registerEmailComponent, getRegisteredComponents, clearRegisteredComponents } = await import('../lib/blocks')
    clearRegisteredComponents()
    registerEmailComponent({
      type: 'temp',
      model: {},
      view: {},
      traits: {},
    })
    expect(getRegisteredComponents()).toHaveLength(1)
    clearRegisteredComponents()
    expect(getRegisteredComponents()).toHaveLength(0)
  })

  it('getStudioComponents returns registered components', async () => {
    const { getStudioComponents, registerEmailComponent, clearRegisteredComponents } = await import('../lib/blocks')
    clearRegisteredComponents()
    registerEmailComponent({
      type: 'custom',
      model: { defaultContent: '<p>Custom</p>' },
      view: {},
      traits: {},
    })
    const components = getStudioComponents()
    expect(components.custom).toBeDefined()
    expect(components.custom.type).toBe('custom')
    clearRegisteredComponents()
  })
})
