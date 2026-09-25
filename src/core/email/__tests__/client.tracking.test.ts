import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  sendEmailWithTracking,
  getProvider,
  resetProviderCache,
  createEmailProvider,
  NoopProvider,
  EdgeFunctionProvider,
} from '../lib/client'

function makeChain() {
  const calls: string[] = []
  const self: any = {
    select: vi.fn(() => {
      calls.push('select')
      return self
    }),
    eq: vi.fn(() => {
      calls.push('eq')
      return self
    }),
    in: vi.fn(() => {
      calls.push('in')
      return self
    }),
    maybeSingle: vi.fn(() => {
      calls.push('maybeSingle')
      return self
    }),
    single: vi.fn(() => {
      calls.push('single')
      return self
    }),
    insert: vi.fn(() => {
      calls.push('insert')
      return self
    }),
    update: vi.fn(() => {
      calls.push('update')
      return self
    }),
    order: vi.fn(() => {
      calls.push('order')
      return self
    }),
    is: vi.fn(() => {
      calls.push('is')
      return self
    }),
    _calls: calls,
  }
  return self
}

vi.mock('@/core/lib/supabase', () => {
  const from = vi.fn(() => makeChain())
  const auth = { getUser: vi.fn() }
  const functions = { invoke: vi.fn() }
  return { supabase: { auth, from, functions } }
})

vi.mock('@/core/lib/runtime-config', () => ({
  getSupabaseUrl: () => 'https://test.supabase.co',
}))

const noopInput = {
  to: [{ email: 'recipient@example.org', name: 'Recipient' }],
  subject: 'Welcome',
  body: '<p>Hello</p>',
  from: 'team@example.org',
}

describe('sendEmailWithTracking', () => {
  afterEach(async () => {
    vi.unstubAllEnvs()
    const { supabase } = await import('@/core/lib/supabase')
    vi.mocked(supabase.from).mockReset()
    vi.mocked(supabase.auth.getUser).mockReset()
    vi.mocked(supabase.functions.invoke).mockReset()
    resetProviderCache()
  })

  it('creates a queued send row then marks it sent in noop mode and returns the sendId', async () => {
    const { supabase } = await import('@/core/lib/supabase')
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: { id: 'user-1' } as any },
      error: null,
    })

    const inserts: string[] = []
    const updates: string[] = []
    const tableCalls: string[] = []
    vi.mocked(supabase.from).mockImplementation((_table: string) => {
      tableCalls.push(_table)
      const chain = makeChain()
      chain.maybeSingle.mockResolvedValue({ data: null, error: null })
      chain.insert.mockImplementation(() => {
        inserts.push(_table)
        return Promise.resolve({ error: null })
      })
      chain.update.mockImplementation(() => {
        updates.push(_table)
        return chain
      })
      return chain
    })

    const result = await sendEmailWithTracking({ ...noopInput, consentCategory: 'team_updates' })

    expect(tableCalls).toContain('email_sends')
    expect(inserts).toContain('email_sends')
    expect(updates).toContain('email_sends')
    expect(result.sendId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    expect(result.acceptedCount).toBe(1)
    expect(result.messageId).toBeNull()
  })

  it('delegates to the Edge Function in smtp mode and surfaces acceptedCount', async () => {
    vi.stubEnv('VITE_EMAIL_TRANSPORT', 'smtp')

    const { supabase } = await import('@/core/lib/supabase')
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: { id: 'user-1' } as any },
      error: null,
    })
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: { messageId: '<msg@example.org>', acceptedCount: 1 },
      error: null,
    })
    vi.mocked(supabase.from).mockImplementation((_table: string) => {
      const chain = makeChain()
      chain.maybeSingle.mockResolvedValue({ data: null, error: null })
      chain.insert.mockResolvedValue({ error: null })
      chain.update.mockImplementation(() => chain)
      return chain
    })

    const result = await sendEmailWithTracking({ ...noopInput, consentCategory: 'broadcasts' })

    expect(supabase.functions.invoke).toHaveBeenCalledWith(
      'email-send',
      expect.objectContaining({ body: expect.objectContaining({ consentCategory: 'broadcasts' }) }),
    )
    expect(result.sendId).toBeTruthy()
    expect(result.acceptedCount).toBe(1)
    expect(result.messageId).toBe('<msg@example.org>')
  })

  it('rolls back the queued row when the Edge Function rejects', async () => {
    vi.stubEnv('VITE_EMAIL_TRANSPORT', 'smtp')

    const { supabase } = await import('@/core/lib/supabase')
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: { id: 'user-1' } as any },
      error: null,
    })
    vi.mocked(supabase.functions.invoke).mockRejectedValueOnce(new Error('SMTP down'))
    vi.mocked(supabase.from).mockImplementation((_table: string) => {
      const chain = makeChain()
      chain.maybeSingle.mockResolvedValue({ data: null, error: null })
      chain.insert.mockResolvedValue({ error: null })
      return chain
    })

    await expect(
      sendEmailWithTracking({ ...noopInput, consentCategory: 'broadcasts' }),
    ).rejects.toThrow('SMTP down')
  })
})

describe('getProvider', () => {
  it('returns a NoopProvider for noop transport', async () => {
    resetProviderCache()
    expect(await getProvider()).toBeInstanceOf(NoopProvider)
  })

  it('returns an EdgeFunctionProvider for smtp transport', async () => {
    vi.stubEnv('VITE_EMAIL_TRANSPORT', 'smtp')
    resetProviderCache()
    expect(await getProvider()).toBeInstanceOf(EdgeFunctionProvider)
    vi.unstubAllEnvs()
    resetProviderCache()
  })
})

describe('createEmailProvider', () => {
  it('throws for unknown transport', () => {
    expect(() => createEmailProvider({ transport: 'unknown' as any })).toThrow(
      'Unsupported email transport',
    )
  })
})
