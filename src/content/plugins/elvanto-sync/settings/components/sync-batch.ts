/**
 * Client-side batching for sync history reports.
 *
 * The Elvanto sync worker executes one `runSync` invocation per batch and
 * writes one `elvanto_sync_history` row per endpoint inside that invocation
 * (there is no batch/run id column). All rows of a batch therefore share the
 * same `trigger` and are contiguous when ordered by `started_at` descending —
 * the order returned by the history query. Batches are reconstructed by
 * walking the rows newest-first and starting a new batch whenever the trigger
 * changes or the gap to the previous row exceeds BATCH_GAP_MS.
 *
 * Note: batching is per fetched page. A batch that straddles a page boundary
 * renders as (at most) two accordion items — a cosmetic edge case accepted in
 * exchange for keeping server-side row pagination.
 */

export interface SyncHistoryItem {
  id: string
  entity: string
  trigger: 'cron' | 'manual' | 'webhook'
  started_at: string
  completed_at: string | null
  status: 'running' | 'completed' | 'partial' | 'failed'
  items_processed: number
  items_failed: number
  error_summary: string | null
  triggered_by_user: string | null
}

export type BatchStatus = 'running' | 'completed' | 'partial' | 'failed'

export interface SyncBatch {
  /** Stable key for React lists / accordion values (newest row's id). */
  key: string
  trigger: SyncHistoryItem['trigger']
  /** Oldest row's start — when the batch began. */
  startedAt: string
  /** Latest row completion; null while any row is still running. */
  completedAt: string | null
  status: BatchStatus
  itemsProcessed: number
  itemsFailed: number
  /** Rows newest-first, in query order. */
  rows: SyncHistoryItem[]
}

/**
 * Max gap between consecutive rows of the same batch. Entities run
 * sequentially within one worker invocation, so gaps are per-entity durations;
 * distinct cron/manual runs are typically minutes-to-hours apart.
 */
export const BATCH_GAP_MS = 10 * 60 * 1000

/**
 * Roll per-endpoint row statuses up to a single batch status:
 * - any row still running            → running
 * - every row failed                 → failed
 * - some rows failed or partial      → partial
 * - otherwise                        → completed
 */
export function deriveBatchStatus(rows: SyncHistoryItem[]): BatchStatus {
  if (rows.some((row) => row.status === 'running')) return 'running'
  const failedCount = rows.filter((row) => row.status === 'failed').length
  if (rows.length > 0 && failedCount === rows.length) return 'failed'
  if (failedCount > 0 || rows.some((row) => row.status === 'partial')) return 'partial'
  return 'completed'
}

/**
 * Group history rows into batches. Input must be sorted by `started_at`
 * descending — the order returned by the history query.
 */
export function groupRunsIntoBatches(rows: SyncHistoryItem[]): SyncBatch[] {
  const batches: SyncBatch[] = []
  let current: SyncHistoryItem[] = []

  const flush = () => {
    if (current.length === 0) return
    const itemsProcessed = current.reduce((sum, row) => sum + row.items_processed, 0)
    const itemsFailed = current.reduce((sum, row) => sum + row.items_failed, 0)
    const completedAt = current.reduce<string | null>((latest, row) => {
      if (!row.completed_at) return latest
      return !latest || row.completed_at > latest ? row.completed_at : latest
    }, null)
    batches.push({
      key: current[0].id,
      trigger: current[0].trigger,
      startedAt: current[current.length - 1].started_at,
      completedAt,
      status: deriveBatchStatus(current),
      itemsProcessed,
      itemsFailed,
      rows: current,
    })
    current = []
  }

  for (const row of rows) {
    if (current.length > 0) {
      // current is newest-first; its last element is the previous (older) row.
      const previous = current[current.length - 1]
      const gap = Math.abs(
        Date.parse(previous.started_at) - Date.parse(row.started_at),
      )
      const sameBatch = row.trigger === previous.trigger && gap <= BATCH_GAP_MS
      if (!sameBatch) flush()
    }
    current.push(row)
  }
  flush()

  return batches
}
