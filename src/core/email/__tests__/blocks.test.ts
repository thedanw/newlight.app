import { describe, expect, it, vi } from 'vitest'

vi.mock('@/core/lib/supabase', () => ({ supabase: { from: vi.fn() } }))

describe('email blocks registry (Batch 7)', () => {
  it('returns all 7 builtin blocks', async () => {
    const { getBuiltinBlocks } = await import('../lib/blocks')
    const blocks = getBuiltinBlocks()
    expect(blocks).toHaveLength(7)
    expect(blocks.map((b) => b.type)).toEqual([
      'text',
      'heading',
      'image',
      'button',
      'spacer',
      'divider',
      'columns',
    ])
  })

  it('getAllEmailBlocks includes builtins + registered', async () => {
    const { getAllEmailBlocks, registerEmailBlock, clearRegisteredBlocks } = await import('../lib/blocks')
    clearRegisteredBlocks()
    registerEmailBlock({
      type: 'custom',
      label: 'Custom',
      icon: '*',
      category: 'custom',
      defaultContent: '<p>Custom</p>',
    })
    const all = getAllEmailBlocks()
    expect(all.some((b) => b.type === 'custom')).toBe(true)
    expect(all.some((b) => b.type === 'text')).toBe(true)
    clearRegisteredBlocks()
  })

  it('lookup by type returns the correct block', async () => {
    const { getEmailBlock } = await import('../lib/blocks')
    const block = getEmailBlock('button')
    expect(block?.label).toBe('Button')
    expect(block?.category).toBe('basic')
  })

  it('lookup returns undefined for unknown type', async () => {
    const { getEmailBlock } = await import('../lib/blocks')
    expect(getEmailBlock('nonexistent')).toBeUndefined()
  })

  it('registerEmailBlock throws on duplicate', async () => {
    const { registerEmailBlock, clearRegisteredBlocks } = await import('../lib/blocks')
    clearRegisteredBlocks()
    registerEmailBlock({
      type: 'dup',
      label: 'Dup',
      icon: '*',
      category: 'test',
      defaultContent: '<p></p>',
    })
    expect(() =>
      registerEmailBlock({
        type: 'dup',
        label: 'Dup2',
        icon: '*',
        category: 'test',
        defaultContent: '<p></p>',
      }),
    ).toThrow('Email block type already registered')
    clearRegisteredBlocks()
  })

  it('clearRegisteredBlocks resets the registry', async () => {
    const { registerEmailBlock, getRegisteredBlocks, clearRegisteredBlocks } = await import('../lib/blocks')
    clearRegisteredBlocks()
    registerEmailBlock({
      type: 'temp',
      label: 'Temp',
      icon: '*',
      category: 'test',
      defaultContent: '<p></p>',
    })
    expect(getRegisteredBlocks()).toHaveLength(1)
    clearRegisteredBlocks()
    expect(getRegisteredBlocks()).toHaveLength(0)
  })

  it('blocks have required fields', async () => {
    const { getBuiltinBlocks } = await import('../lib/blocks')
    const blocks = getBuiltinBlocks()
    for (const b of blocks) {
      expect(b.type).toBeTruthy()
      expect(b.label).toBeTruthy()
      expect(b.icon).toBeTruthy()
      expect(b.category).toBeTruthy()
      expect(b.defaultContent).toBeTruthy()
    }
  })
})
