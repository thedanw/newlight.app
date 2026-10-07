import { describe, expect, it } from 'vitest'
import {
  BATCH_GAP_MS,
  deriveBatchStatus,
  groupRunsIntoBatches,
  type SyncHistoryItem,
} from './sync-batch'

const BASE = Date.parse('2026-10-06T10:00:00.000Z')

/** ISO timestamp `minutes` (fractional allowed) after the base time. */
const at = (minutes: number) => new Date(BASE + minutes * 60_000).toISOString()

let counter = 0
function row(overrides: Partial<SyncHistoryItem> = {}): SyncHistoryItem {
  counter += 1
  return {
    id: `row-${counter}`,
    entity: 'people',
    trigger: 'manual',
    started_at: at(0),
    completed_at: at(1),
    status: 'completed',
    items_processed: 10,
    items_failed: 0,
    error_summary: null,
    triggered_by_user: null,
    ...overrides,
  }
}

describe('groupRunsIntoBatches', () => {
  it('returns an empty list for no rows', () => {
    expect(groupRunsIntoBatches([])).toEqual([])
  })

  it('groups consecutive same-trigger rows within the gap into one batch', () => {
    // Query order is started_at DESC: newest first, oldest last.
    const rows = [
      row({ id: 'c', entity: 'songs', started_at: at(2), completed_at: at(2.5), items_processed: 5 }),
      row({ id: 'b', entity: 'households', started_at: at(1), completed_at: at(1.5), items_processed: 3 }),
      row({ id: 'a', entity: 'people', started_at: at(0), completed_at: at(0.5), items_processed: 2 }),
    ]

    const batches = groupRunsIntoBatches(rows)

    expect(batches).toHaveLength(1)
    const batch = batches[0]
    expect(batch.key).toBe('c')
    expect(batch.trigger).toBe('manual')
    expect(batch.startedAt).toBe(at(0)) // oldest row starts the batch
    expect(batch.completedAt).toBe(at(2.5)) // latest completion ends it
    expect(batch.itemsProcessed).toBe(10)
    expect(batch.itemsFailed).toBe(0)
    expect(batch.rows.map((r) => r.id)).toEqual(['c', 'b', 'a'])
  })

  it('starts a new batch when the trigger changes', () => {
    const rows = [
      row({ id: 'manual', trigger: 'manual', started_at: at(2), completed_at: at(3) }),
      row({ id: 'cron', trigger: 'cron', started_at: at(1), completed_at: at(1.5) }),
    ]

    const batches = groupRunsIntoBatches(rows)

    expect(batches).toHaveLength(2)
    expect(batches[0].trigger).toBe('manual')
    expect(batches[1].trigger).toBe('cron')
  })

  it('starts a new batch when the gap exceeds BATCH_GAP_MS', () => {
    const gapMinutes = BATCH_GAP_MS / 60_000 + 1
    const rows = [
      row({ id: 'newer', started_at: at(gapMinutes), completed_at: at(gapMinutes + 1) }),
      row({ id: 'older', started_at: at(0), completed_at: at(1) }),
    ]

    const batches = groupRunsIntoBatches(rows)

    expect(batches).toHaveLength(2)
    expect(batches[0].key).toBe('newer')
    expect(batches[1].key).toBe('older')
  })

  it('keeps rows exactly BATCH_GAP_MS apart in the same batch', () => {
    const gapMinutes = BATCH_GAP_MS / 60_000
    const rows = [
      row({ id: 'newer', started_at: at(gapMinutes), completed_at: at(gapMinutes + 1) }),
      row({ id: 'older', started_at: at(0), completed_at: at(1) }),
    ]

    expect(groupRunsIntoBatches(rows)).toHaveLength(1)
  })

  it('handles several batches in one pass', () => {
    const rows = [
      row({ id: 'b2', trigger: 'cron', started_at: at(120), completed_at: at(121) }),
      row({ id: 'b1b', trigger: 'manual', started_at: at(3), completed_at: at(4) }),
      row({ id: 'b1a', trigger: 'manual', started_at: at(0), completed_at: at(2) }),
    ]

    const batches = groupRunsIntoBatches(rows)

    expect(batches).toHaveLength(2)
    expect(batches[0].rows.map((r) => r.id)).toEqual(['b2'])
    expect(batches[1].rows.map((r) => r.id)).toEqual(['b1b', 'b1a'])
  })
})

describe('deriveBatchStatus', () => {
  it('is completed when every row completed', () => {
    expect(
      deriveBatchStatus([
        row({ status: 'completed' }),
        row({ status: 'completed' }),
      ]),
    ).toBe('completed')
  })

  it('is failed when every row failed', () => {
    expect(
      deriveBatchStatus([
        row({ status: 'failed' }),
        row({ status: 'failed' }),
      ]),
    ).toBe('failed')
  })

  it('is partial when some rows failed', () => {
    expect(
      deriveBatchStatus([
        row({ status: 'failed' }),
        row({ status: 'completed' }),
      ]),
    ).toBe('partial')
  })

  it('is partial when a row is partial', () => {
    expect(deriveBatchStatus([row({ status: 'partial' })])).toBe('partial')
  })

  it('is running when any row is still running, even alongside failures', () => {
    expect(
      deriveBatchStatus([
        row({ status: 'running', completed_at: null }),
        row({ status: 'failed' }),
      ]),
    ).toBe('running')
  })
})
