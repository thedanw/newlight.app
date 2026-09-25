import { assert, assertEquals } from 'https://deno.land/std@0.217.0/assert/mod.ts'
import { hashEmail, rollupStatus } from './index.ts'

Deno.test('hashEmail produces a stable SHA-256 hex hash, lowercased', async () => {
  const hash = await hashEmail('User@Example.Org')
  assertEquals(hash.length, 64)
  assertEquals(hash, await hashEmail('user@example.org'))
})

Deno.test('hashEmail differs per address', async () => {
  const a = await hashEmail('a@example.org')
  const b = await hashEmail('b@example.org')
  assert(a !== b)
})

Deno.test('rollupStatus rolls up statuses', () => {
  assertEquals(rollupStatus([]), 'suppressed')
  assertEquals(rollupStatus(['sent']), 'sent')
  assertEquals(rollupStatus(['failed']), 'failed')
  assertEquals(rollupStatus(['suppressed']), 'suppressed')
  assertEquals(rollupStatus(['skipped']), 'suppressed')
  assertEquals(rollupStatus(['sent', 'failed']), 'partial')
  assertEquals(rollupStatus(['sent', 'suppressed']), 'partial')
})
