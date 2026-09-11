import { describe, it, expect } from 'vitest'
import {
  buildRows,
  rowsFromOrder,
  moveRow,
  nearestRowIndex,
  deriveAssignments,
  reorderStagesByOrder,
  newTrack,
  newCategory,
  newStage,
  gridTrackId,
  gridCategoryId,
} from './journey-grid-helpers'
import type { GridRow } from './journey-grid-helpers'
import type { JourneyStage, JourneyTrack, JourneyTrackCategory } from './types'

const track = (id: string, name: string, categoryId: string | null, sortOrder: number): JourneyTrack => ({
  id, name, category_id: categoryId, sort_order: sortOrder, elvanto_location_id: null, follow_elvanto: false, deleted_at: null,
})
const category = (id: string, name: string, sortOrder: number, parentId: string | null = null): JourneyTrackCategory => ({
  id, name, parent_id: parentId, sort_order: sortOrder,
})
const stage = (slug: string, label: string, sortOrder: number): JourneyStage => ({
  id: `stage-${slug}`,
  slug,
  label,
  color: null,
  sort_order: sortOrder,
  is_terminal: false,
})

describe('journey-grid-helpers', () => {
  describe('buildRows', () => {
    it('orders categories and tracks by sort_order, namespaced by type', () => {
      const tracks = [track('t2', 'Youth', null, 2), track('t1', 'Sundays', 'c1', 1)]
      const categories = [category('c1', 'Location', 0)]
      const rows = buildRows(tracks, categories)
      expect(rows.map((r) => r.id)).toEqual(['category:c1', 'track:t1', 'track:t2'])
    })

    it('returns empty when no tracks or categories', () => {
      expect(buildRows([], [])).toEqual([])
    })

    it('builds depth-first tree with nested sub-category', () => {
      const tracks = [
        track('t1', 'Track A', 'c1', 0),
        track('t2', 'Track B', 'sub1', 0),
      ]
      const categories = [
        category('c1', 'Cat top', 0, null),
        category('sub1', 'Cat sub', 0, 'c1'),
      ]
      const rows = buildRows(tracks, categories)
      expect(rows.map((r) => r.id)).toEqual(['category:c1', 'category:sub1', 'track:t2', 'track:t1'])
      expect(rows.map((r) => r.depth)).toEqual([0, 1, 2, 1])
    })

    it('produces correct tree connector strings', () => {
      const tracks = [
        track('t1', 'Track A', 'c1', 0),
        track('t2', 'Track B', 'sub1', 0),
      ]
      const categories = [
        category('c1', 'Cat top', 0, null),
        category('sub1', 'Cat sub', 0, 'c1'),
      ]
      const rows = buildRows(tracks, categories)
      expect(rows.map((r) => r.connector)).toEqual([
        '└ ',          // c1 — only top-level item
        '  ├ ',        // sub1 — not last child of c1 (t1 follows at depth 1)
        '  │ └ ',      // t2 — only child of sub1, ancestor sub1 is not last
        '  └ ',        // t1 — last child of c1
      ])
    })
  })

  describe('rowsFromOrder', () => {
    it('computes depth and connector from data, preserving given order', () => {
      const tracks = [track('t2', 'Track B', 'sub1', 0)]
      const categories = [
        category('c1', 'Cat top', 0, null),
        category('sub1', 'Cat sub', 0, 'c1'),
      ]
      const rowOrder = [gridCategoryId('c1'), gridCategoryId('sub1'), gridTrackId('t2')]
      const rows = rowsFromOrder(rowOrder, tracks, categories)
      expect(rows.map((r) => r.id)).toEqual(['category:c1', 'category:sub1', 'track:t2'])
      expect(rows.map((r) => r.depth)).toEqual([0, 1, 2])
    })

    it('produces correct connectors for given order', () => {
      const tracks = [track('t2', 'Track B', 'sub1', 0)]
      const categories = [
        category('c1', 'Cat top', 0, null),
        category('sub1', 'Cat sub', 0, 'c1'),
      ]
      const rowOrder = [gridCategoryId('c1'), gridCategoryId('sub1'), gridTrackId('t2')]
      const rows = rowsFromOrder(rowOrder, tracks, categories)
      expect(rows.map((r) => r.connector)).toEqual([
        '└ ',           // c1 — only top-level
        '  └ ',         // sub1 — last child of c1 (no more siblings at depth 1)
        '    └ ',       // t2 — only child of sub1
      ])
    })

    it('filters out IDs not present in data', () => {
      const tracks = [track('t1', 'Track A', null, 0)]
      const categories: JourneyTrackCategory[] = []
      const rowOrder = [gridTrackId('t1'), 'category:ghost', gridTrackId('ghost2')]
      const rows = rowsFromOrder(rowOrder, tracks, categories)
      expect(rows.map((r) => r.id)).toEqual(['track:t1'])
    })

    it('supports complex multi-level tree with mixed siblings', () => {
      // c1 (depth 0, last)
      //   ├─ t1 (depth 1, not last)
      //   ├─ sub (depth 1, not last)
      //   │   └─ t2 (depth 2, last)
      //   └─ t3 (depth 1, last)
      const tracks = [
        track('t1', 'T1', 'c1', 0),
        track('t2', 'T2', 'sub', 0),
        track('t3', 'T3', 'c1', 2),
      ]
      const categories = [
        category('c1', 'Cat', 0, null),
        category('sub', 'Sub', 1, 'c1'),
      ]
      const rows = buildRows(tracks, categories)
      expect(rows.map((r) => r.id)).toEqual([
        'category:c1',
        'track:t1',
        'category:sub',
        'track:t2',
        'track:t3',
      ])
      expect(rows.map((r) => r.depth)).toEqual([0, 1, 1, 2, 1])
      expect(rows.map((r) => r.connector)).toEqual([
        '└ ',           // c1 — only top-level, isLast
        '  ├ ',        // t1 — depth 1, ancestor c1 is last → spaces, not last sibling
        '  ├ ',        // sub — depth 1, ancestor c1 is last → spaces, not last sibling
        '  │ └ ',      // t2 — depth 2, ancestors: [c1 last → spaces, sub not last → │   ], last sibling
        '  └ ',        // t3 — depth 1, ancestor c1 is last → spaces, last sibling
      ])
    })
  })

  describe('moveRow', () => {
    const rows: GridRow[] = [
      { id: 'category:c1', type: 'category', label: 'c1', depth: 0, connector: '├ ' },
      { id: 'track:t1', type: 'track', label: 't1', depth: 1, connector: '│ └ ' },
      { id: 'track:t2', type: 'track', label: 't2', depth: 1, connector: '│ └ ' },
      { id: 'category:c2', type: 'category', label: 'c2', depth: 0, connector: '└ ' },
      { id: 'track:t3', type: 'track', label: 't3', depth: 1, connector: '  └ ' },
    ]

    it('moves a row below a target (insert after)', () => {
      const result = moveRow(rows, 'track:t3', 'category:c1', 'after')
      expect(result.map((r) => r.id)).toEqual(['category:c1', 'track:t3', 'track:t1', 'track:t2', 'category:c2'])
    })

    it('moves a row above a target (insert before)', () => {
      const result = moveRow(rows, 'track:t1', 'category:c2', 'before')
      expect(result.map((r) => r.id)).toEqual(['category:c1', 'track:t2', 'track:t1', 'category:c2', 'track:t3'])
    })

    it('returns unchanged if target not found', () => {
      expect(moveRow(rows, 'track:t1', 'track:zzz', 'after')).toBe(rows)
    })

    it('returns unchanged if dragged not found', () => {
      expect(moveRow(rows, 'track:zzz', 'track:t1', 'after')).toBe(rows)
    })
  })

  describe('nearestRowIndex', () => {
    const centers = [
      { id: 'a', center: 50 },
      { id: 'b', center: 150 },
      { id: 'c', center: 250 },
    ]

    it('returns the index of the nearest non-dragged row', () => {
      expect(nearestRowIndex(centers, 'b', 60)).toBe(0)
      expect(nearestRowIndex(centers, 'a', 240)).toBe(2)
      expect(nearestRowIndex(centers, 'b', 200)).toBe(2)
    })

    it('returns -1 when only the dragged row exists', () => {
      expect(nearestRowIndex([{ id: 'a', center: 100 }], 'a', 50)).toBe(-1)
    })
  })

  describe('deriveAssignments', () => {
    const tracks = [track('t1', 'Sundays', null, 1), track('t2', 'Youth', null, 2), track('t3', 'Playtime', null, 3)]
    const categories = [category('c1', 'Location', 0)]

    it('assigns category_id from position (nearest preceding category)', () => {
      const rows: GridRow[] = [
        { id: 'category:c1', type: 'category', label: 'Location', depth: 0, connector: '├─ ' },
        { id: 'track:t1', type: 'track', label: 'Sundays', depth: 1, connector: '│   ├─ ' },
        { id: 'track:t2', type: 'track', label: 'Youth', depth: 1, connector: '│   ├─ ' },
        { id: 'track:t3', type: 'track', label: 'Playtime', depth: 1, connector: '│   └─ ' },
      ]
      const { tracks: next, categories: nextCats } = deriveAssignments(rows, tracks, categories)
      expect(nextCats[0].sort_order).toBe(0)
      expect(nextCats[0].parent_id).toBeNull()
      expect(next.find((t) => t.id === 't1')?.category_id).toBe('c1')
      expect(next.find((t) => t.id === 't2')?.category_id).toBe('c1')
      expect(next.find((t) => t.id === 't3')?.category_id).toBe('c1')
    })

    it('assigns null category_id when a track precedes all categories (nesting out)', () => {
      const rows: GridRow[] = [
        { id: 'track:t3', type: 'track', label: 'Playtime', depth: 0, connector: '├─ ' },
        { id: 'category:c1', type: 'category', label: 'Location', depth: 0, connector: '├─ ' },
        { id: 'track:t1', type: 'track', label: 'Sundays', depth: 1, connector: '│   ├─ ' },
        { id: 'track:t2', type: 'track', label: 'Youth', depth: 1, connector: '│   └─ ' },
      ]
      const { tracks: next } = deriveAssignments(rows, tracks, categories)
      expect(next.find((t) => t.id === 't1')?.category_id).toBe('c1')
      expect(next.find((t) => t.id === 't2')?.category_id).toBe('c1')
      expect(next.find((t) => t.id === 't3')?.category_id).toBeNull()
    })

    it('assigns relative sort_order among siblings under the same parent', () => {
      const rows: GridRow[] = [
        { id: 'category:c1', type: 'category', label: 'Location', depth: 0, connector: '├─ ' },
        { id: 'track:t2', type: 'track', label: 'Youth', depth: 1, connector: '│   ├─ ' },
        { id: 'track:t1', type: 'track', label: 'Sundays', depth: 1, connector: '│   ├─ ' },
        { id: 'track:t3', type: 'track', label: 'Playtime', depth: 1, connector: '│   └─ ' },
      ]
      const { tracks: next } = deriveAssignments(rows, tracks, categories)
      expect(next.find((t) => t.id === 't1')?.sort_order).toBe(1)
      expect(next.find((t) => t.id === 't2')?.sort_order).toBe(0)
      expect(next.find((t) => t.id === 't3')?.sort_order).toBe(2)
    })

    it('assigns parent_id for nested categories', () => {
      const subTracks = [track('t1', 'Track A', 'c1', 0)]
      const subCats = [category('c1', 'Cat top', 0, null), category('sub1', 'Cat sub', 0, 'c1')]
      const rows = buildRows(subTracks, subCats)
      const { categories: nextCats } = deriveAssignments(rows, subTracks, subCats)
      const c1 = nextCats.find((c) => c.id === 'c1')!
      const sub1 = nextCats.find((c) => c.id === 'sub1')!
      expect(c1.parent_id).toBeNull()
      expect(sub1.parent_id).toBe('c1')
    })

    it('assigns category_id to tracks nested under sub-category', () => {
      const subTracks = [track('t2', 'Track B', 'sub1', 0)]
      const subCats = [category('c1', 'Cat top', 0, null), category('sub1', 'Cat sub', 0, 'c1')]
      const rows = buildRows(subTracks, subCats)
      const { tracks: next } = deriveAssignments(rows, subTracks, subCats)
      expect(next.find((t) => t.id === 't2')?.category_id).toBe('sub1')
    })
  })

  describe('reorderStagesByOrder', () => {
    it('reorders stages and renumbers sort_order', () => {
      const stages = [stage('a', 'A', 0), stage('b', 'B', 1), stage('c', 'C', 2)]
      const result = reorderStagesByOrder(stages, ['stage-c', 'stage-a', 'stage-b'])
      expect(result.map((s) => s.id)).toEqual(['stage-c', 'stage-a', 'stage-b'])
      expect(result.map((s) => s.sort_order)).toEqual([0, 1, 2])
    })

    it('drops unknown stages', () => {
      const stages = [stage('a', 'A', 0), stage('b', 'B', 1)]
      expect(reorderStagesByOrder(stages, ['stage-b', 'stage-a']).map((s) => s.id)).toEqual(['stage-b', 'stage-a'])
    })
  })

  describe('factory helpers', () => {
    it('newTrack generates a uuid id', () => {
      expect(newTrack('Foo', null, 0).id).toMatch(/^[0-9a-f-]{36}$/)
      expect(newTrack('Foo', 'cat-1', 5).id).toMatch(/^[0-9a-f-]{36}$/)
    })
    it('newCategory generates a uuid id', () => {
      expect(newCategory('Bar', 0).id).toMatch(/^[0-9a-f-]{36}$/)
    })
    it('newStage generates a uuid id and keeps the given slug', () => {
      const s = newStage('custom', 'Custom', 0)
      expect(s.id).toMatch(/^[0-9a-f-]{36}$/)
      expect(s.slug).toBe('custom')
      expect(s.is_terminal).toBe(false)
    })
  })

  describe('ids', () => {
    it('namespaces ids', () => {
      expect(gridTrackId('abc')).toBe('track:abc')
      expect(gridCategoryId('xyz')).toBe('category:xyz')
    })
  })
})
