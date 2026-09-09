import { describe, it, expect } from 'vitest'
import {
  buildRows,
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
const category = (id: string, name: string, sortOrder: number): JourneyTrackCategory => ({
  id, name, parent_id: null, sort_order: sortOrder,
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
  })

  describe('moveRow', () => {
    const rows: GridRow[] = [
      { id: 'category:c1', type: 'category', label: 'c1' },
      { id: 'track:t1', type: 'track', label: 't1' },
      { id: 'track:t2', type: 'track', label: 't2' },
      { id: 'category:c2', type: 'category', label: 'c2' },
      { id: 'track:t3', type: 'track', label: 't3' },
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
        { id: 'category:c1', type: 'category', label: 'Location' },
        { id: 'track:t1', type: 'track', label: 'Sundays' },
        { id: 'track:t2', type: 'track', label: 'Youth' },
        { id: 'track:t3', type: 'track', label: 'Playtime' },
      ]
      const { tracks: next, categories: nextCats } = deriveAssignments(rows, tracks, categories)
      expect(nextCats[0].sort_order).toBe(0)
      expect(next.find((t) => t.id === 't1')?.category_id).toBe('c1')
      expect(next.find((t) => t.id === 't2')?.category_id).toBe('c1')
      expect(next.find((t) => t.id === 't3')?.category_id).toBe('c1')
    })

    it('assigns null category_id when a track precedes all categories (nesting out)', () => {
      const rows: GridRow[] = [
        { id: 'track:t3', type: 'track', label: 'Playtime' },
        { id: 'category:c1', type: 'category', label: 'Location' },
        { id: 'track:t1', type: 'track', label: 'Sundays' },
        { id: 'track:t2', type: 'track', label: 'Youth' },
      ]
      const { tracks: next } = deriveAssignments(rows, tracks, categories)
      expect(next.find((t) => t.id === 't1')?.category_id).toBe('c1')
      expect(next.find((t) => t.id === 't2')?.category_id).toBe('c1')
      expect(next.find((t) => t.id === 't3')?.category_id).toBeNull()
    })

    it('assigns global sort_order by flat index', () => {
      const rows: GridRow[] = [
        { id: 'category:c1', type: 'category', label: 'Location' },
        { id: 'track:t2', type: 'track', label: 'Youth' },
        { id: 'track:t1', type: 'track', label: 'Sundays' },
        { id: 'track:t3', type: 'track', label: 'Playtime' },
      ]
      const { tracks: next } = deriveAssignments(rows, tracks, categories)
      expect(next.find((t) => t.id === 't1')?.sort_order).toBe(2)
      expect(next.find((t) => t.id === 't2')?.sort_order).toBe(1)
      expect(next.find((t) => t.id === 't3')?.sort_order).toBe(3)
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
