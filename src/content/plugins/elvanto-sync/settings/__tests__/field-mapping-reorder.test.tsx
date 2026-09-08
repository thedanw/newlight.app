import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FieldMappingTable } from '../components/FieldMappingTable'

const mockUseOrderedCollection = vi.fn()

vi.mock('@/core/lib', () => ({
  useOrderedCollection: (options: unknown) => mockUseOrderedCollection(options),
}))

const mockSettings = {
  getConfig: vi.fn(),
  setConfig: vi.fn(),
}
const mockToast = { error: vi.fn(), success: vi.fn() }
const mockRegister = vi.fn()

vi.mock('@/core/plugins/PluginAPI', () => ({
  usePluginAPIContext: () => ({
    settings: mockSettings,
    toast: mockToast,
    reorder: { register: mockRegister },
  }),
}))

afterEach(cleanup)

const initialMappings = [
  { id: 'rule-1', appField: 'firstname', elvantoField: 'firstname', direction: 'both', priority: 100 },
  { id: 'rule-2', appField: 'lastname', elvantoField: 'lastname', direction: 'both', priority: 90 },
]

describe('FieldMappingTable reorder integration', () => {
  beforeEach(() => {
    mockUseOrderedCollection.mockReset()
    mockUseOrderedCollection.mockReturnValue({
      items: [],
      reorder: vi.fn(),
      isDirty: false,
      save: vi.fn().mockResolvedValue(true),
      reset: vi.fn(),
      error: null,
    })
    mockSettings.getConfig.mockReset()
    mockSettings.getConfig.mockResolvedValue(initialMappings)
    mockSettings.setConfig.mockReset()
    mockSettings.setConfig.mockResolvedValue(undefined)
    mockToast.error.mockReset()
    mockToast.success.mockReset()
    mockRegister.mockReset()
  })

  it('wires field mappings through useOrderedCollection with an elvanto definition', async () => {
    render(<FieldMappingTable />)
    await screen.findByRole('button', { name: 'Save All' })
    const call = mockUseOrderedCollection.mock.calls.find(
      ([opts]) => opts.definition.collectionId === 'elvanto:field-mappings',
    )
    expect(call).toBeDefined()
    if (!call) throw new Error('Expected an elvanto:field-mappings useOrderedCollection call')
    expect(call[0].definition.table).toBe('elvanto_sync_config')
  })

  it('persists reordered mappings with re-derived priorities via the core hook', async () => {
    render(<FieldMappingTable />)
    await screen.findByRole('button', { name: 'Save All' })
    const calls = mockUseOrderedCollection.mock.calls.filter(
      ([opts]) => opts.definition.collectionId === 'elvanto:field-mappings',
    )
    const lastCall = calls[calls.length - 1]
    if (!lastCall) throw new Error('Expected an elvanto:field-mappings useOrderedCollection call')
    const { persist } = lastCall[0]
    await act(async () => {
      await persist(['rule-2', 'rule-1'])
    })
    expect(mockSettings.setConfig).toHaveBeenCalledWith(
      'field_mappings',
      [
        expect.objectContaining({ id: 'rule-2', priority: 20 }),
        expect.objectContaining({ id: 'rule-1', priority: 10 }),
      ],
    )
  })
})