import { describe, expect, it, vi } from 'vitest'

vi.mock('@/core/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

const mockChain = () => ({
  select: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn(),
  single: vi.fn(),
  update: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
})

type MockSupabase = {
  functions: { invoke: ReturnType<typeof vi.fn> }
  from: ReturnType<typeof vi.fn>
}

async function getMockSupabase(): Promise<MockSupabase> {
  return (await import('@/core/lib/supabase')).supabase as unknown as MockSupabase
}

describe('email queries (Batch 3)', () => {
  it('getTemplates returns ordered templates', async () => {
    const supabase = await getMockSupabase()
    const chain = mockChain()
    supabase.from.mockReturnValue(chain)
    chain.select.mockReturnThis()
    chain.order.mockReturnThis()
    chain.maybeSingle.mockResolvedValue({ data: null, error: null })

    const { getTemplates } = await import('../lib/queries')
    const result = await getTemplates()

    expect(supabase.from).toHaveBeenCalledWith('email_templates')
    expect(chain.select).toHaveBeenCalledWith('*')
    expect(chain.order).toHaveBeenCalledWith('updated_at', { ascending: false })
    expect(result).toEqual([])
  })

  it('getTemplate returns a single template', async () => {
    const supabase = await getMockSupabase()
    const chain = mockChain()
    supabase.from.mockReturnValue(chain)
    chain.select.mockReturnThis()
    chain.eq.mockReturnThis()
    chain.maybeSingle.mockResolvedValue({
      data: { id: 't1', name: 'Test', subject: 'Hi', html_content: '<p>Hi</p>', editor_json: null, status: 'draft', from_email: 't@e.org', from_name: 'Test', created_by: null, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' },
      error: null,
    })

    const { getTemplate } = await import('../lib/queries')
    const result = await getTemplate('t1')

    expect(supabase.from).toHaveBeenCalledWith('email_templates')
    expect(chain.eq).toHaveBeenCalledWith('id', 't1')
    expect(chain.maybeSingle).toHaveBeenCalled()
    expect(result?.id).toBe('t1')
  })

  it('getTemplate returns null when not found', async () => {
    const supabase = await getMockSupabase()
    const chain = mockChain()
    supabase.from.mockReturnValue(chain)
    chain.maybeSingle.mockResolvedValue({ data: null, error: null })

    const { getTemplate } = await import('../lib/queries')
    const result = await getTemplate('missing')
    expect(result).toBeNull()
  })

  it('getSends returns ordered sends', async () => {
    const supabase = await getMockSupabase()
    const chain = mockChain()
    supabase.from.mockReturnValue(chain)
    chain.maybeSingle.mockResolvedValue({ data: [], error: null })

    const { getSends } = await import('../lib/queries')
    const result = await getSends()

    expect(supabase.from).toHaveBeenCalledWith('email_sends')
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result).toEqual([])
  })

  it('getSendRecipients queries by send_id', async () => {
    const supabase = await getMockSupabase()
    const chain = mockChain()
    supabase.from.mockReturnValue(chain)
    chain.maybeSingle.mockResolvedValue({ data: [], error: null })

    const { getSendRecipients } = await import('../lib/queries')
    await getSendRecipients('send-1')

    expect(supabase.from).toHaveBeenCalledWith('email_recipients')
    expect(chain.eq).toHaveBeenCalledWith('send_id', 'send-1')
  })

  it('getSenderAliases fetches from email_sender_aliases', async () => {
    const supabase = await getMockSupabase()
    const chain = mockChain()
    supabase.from.mockReturnValue(chain)
    chain.maybeSingle.mockResolvedValue({ data: [], error: null })

    const { getSenderAliases } = await import('../lib/queries')
    await getSenderAliases()

    expect(supabase.from).toHaveBeenCalledWith('email_sender_aliases')
  })

  it('throws when supabase returns an error', async () => {
    const supabase = await getMockSupabase()
    const chain = mockChain()
    supabase.from.mockReturnValue(chain)
    chain.select.mockReturnThis()
    chain.order.mockResolvedValue({ data: null, error: { message: 'DB error' } } as any)

    const { getTemplates } = await import('../lib/queries')
    await expect(getTemplates()).rejects.toThrow('DB error')
  })

  it('createSenderAlias inserts with generated id and timestamp', async () => {
    const supabase = await getMockSupabase()
    const chain = mockChain()
    supabase.from.mockReturnValue(chain)
    chain.insert.mockReturnThis()
    chain.select.mockReturnThis()
    chain.single.mockResolvedValue({
      data: { id: 'alias-1', email: 'a@e.org', name: 'Team', is_default: true, created_by: null, created_at: '2026-01-01T00:00:00.000Z' },
      error: null,
    })

    const { createSenderAlias } = await import('../lib/queries')
    const result = await createSenderAlias({
      email: 'a@e.org',
      name: 'Team',
      is_default: true,
      created_by: null,
    })

    expect(supabase.from).toHaveBeenCalledWith('email_sender_aliases')
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'a@e.org',
        name: 'Team',
        is_default: true,
        created_by: null,
      }),
    )
    expect(result.id).toBe('alias-1')
  })
})
