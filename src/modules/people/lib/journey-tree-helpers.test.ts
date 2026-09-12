import { describe, it, expect } from 'vitest'
import { tracksAndCategoriesToTree, treeToJourneyData } from './journey-tree-helpers'
import type { JourneyTreeNode } from './journey-tree-helpers'
import type { JourneyTrack, JourneyTrackCategory } from './types'

const track = (id: string, name: string, categoryId: string | null, sortOrder: number): JourneyTrack => ({
  id, name, category_id: categoryId, sort_order: sortOrder, elvanto_location_id: null, follow_elvanto: false, deleted_at: null,
})
const category = (id: string, name: string, sortOrder: number, parentId: string | null = null): JourneyTrackCategory => ({
  id, name, parent_id: parentId, sort_order: sortOrder,
})

describe('journey-tree-helpers', () => {
  describe('tracksAndCategoriesToTree', () => {
    it('builds a nested tree with prefixed ids and data.kind', () => {
      const tracks = [
        track('t1', 'Track A', 'c1', 0),
        track('t2', 'Track B', 'sub1', 0),
      ]
      const categories = [
        category('c1', 'Cat top', 0, null),
        category('sub1', 'Cat sub', 0, 'c1'),
      ]
      const tree = tracksAndCategoriesToTree(tracks, categories)
      expect(tree).toEqual([
        {
          id: 'category:c1',
          label: 'Cat top',
          data: { kind: 'category' },
          children: [
            {
              id: 'category:sub1',
              label: 'Cat sub',
              data: { kind: 'category' },
              children: [{ id: 'track:t2', label: 'Track B', data: { kind: 'track' } }],
            },
            { id: 'track:t1', label: 'Track A', data: { kind: 'track' } },
          ],
        },
      ])
    })

    it('orders sibling tracks by sort_order then name', () => {
      const tracks = [track('t2', 'Youth', null, 2), track('t1', 'Sundays', null, 1)]
      const tree = tracksAndCategoriesToTree(tracks, [])
      expect(tree.map((n) => n.id)).toEqual(['track:t1', 'track:t2'])
    })

    it('interleaves root categories and tracks by sort_order', () => {
      const tracks = [track('t1', 'Sundays', null, 1)]
      const categories = [category('c1', 'Location', 0)]
      const tree = tracksAndCategoriesToTree(tracks, categories)
      expect(tree.map((n) => n.id)).toEqual(['category:c1', 'track:t1'])
    })

    it('returns empty for no tracks or categories', () => {
      expect(tracksAndCategoriesToTree([], [])).toEqual([])
    })
  })

  describe('treeToJourneyData', () => {
    it('round-trips tree → data → tree preserving structure', () => {
      const tracks = [
        track('t1', 'Track A', 'c1', 0),
        track('t2', 'Track B', 'sub1', 0),
        track('t3', 'Track C', null, 0),
      ]
      const categories = [
        category('c1', 'Cat top', 0, null),
        category('sub1', 'Cat sub', 0, 'c1'),
      ]
      const tree = tracksAndCategoriesToTree(tracks, categories)
      const { tracks: t2, categories: c2 } = treeToJourneyData(tree, tracks, categories)
      expect(tracksAndCategoriesToTree(t2, c2)).toEqual(tree)
    })

    it('assigns sort_order per sibling group and category_id', () => {
      const tracks = [
        track('t1', 'A', 'c1', 0),
        track('t2', 'B', 'c1', 0),
        track('t3', 'C', null, 0),
      ]
      const categories = [category('c1', 'Cat', 0)]
      const tree = tracksAndCategoriesToTree(tracks, categories)
      const { tracks: out } = treeToJourneyData(tree, tracks, categories)
      const t1 = out.find((t) => t.id === 't1')!
      const t2 = out.find((t) => t.id === 't2')!
      const t3 = out.find((t) => t.id === 't3')!
      expect(t1.category_id).toBe('c1')
      expect(t1.sort_order).toBe(0)
      expect(t2.category_id).toBe('c1')
      expect(t2.sort_order).toBe(1)
      expect(t3.category_id).toBeNull()
      expect(t3.sort_order).toBe(0)
    })

    it('assigns parent_id for nested categories', () => {
      const categories = [category('c1', 'Top', 0), category('sub1', 'Sub', 0, 'c1')]
      const tree = tracksAndCategoriesToTree([], categories)
      const { categories: out } = treeToJourneyData(tree, [], categories)
      const c1 = out.find((c) => c.id === 'c1')!
      const sub1 = out.find((c) => c.id === 'sub1')!
      expect(c1.parent_id).toBeNull()
      expect(sub1.parent_id).toBe('c1')
    })

    it('guards against self-parent cycles', () => {
      const tree: JourneyTreeNode[] = [
        {
          id: 'category:c1',
          label: 'Self',
          data: { kind: 'category' },
          children: [{ id: 'category:c1', label: 'Self', data: { kind: 'category' } }],
        },
      ]
      const categories = [category('c1', 'Self', 0)]
      const { categories: out } = treeToJourneyData(tree, [], categories)
      const c1 = out.find((c) => c.id === 'c1')!
      expect(c1.parent_id).toBeNull()
    })

    it('preserves tracks not present in the tree unchanged', () => {
      const tracks = [track('t1', 'Kept', 'c1', 0), track('t2', 'Dropped', null, 5)]
      const categories = [category('c1', 'Cat', 0)]
      const tree = tracksAndCategoriesToTree([tracks[0]!], categories)
      const { tracks: out } = treeToJourneyData(tree, tracks, categories)
      const t2 = out.find((t) => t.id === 't2')!
      expect(t2.category_id).toBeNull()
      expect(t2.sort_order).toBe(5)
    })
  })
})