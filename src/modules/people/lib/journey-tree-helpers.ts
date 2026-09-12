import type { TreeNode } from '@/core/dragndrop/types'
import type { JourneyTrack, JourneyTrackCategory } from './types'
import { gridCategoryId, gridTrackId } from './journey-grid-helpers'

/** A journey grid tree node. `data.kind` distinguishes categories from tracks
 * (the id prefix `category:`/`track:` also encodes this, but `data.kind` is
 * convenient for custom row rendering).
 */
export type JourneyTreeNode = TreeNode<{ kind: 'category' | 'track' }>

type SiblingGroup = { categories: JourneyTrackCategory[]; tracks: JourneyTrack[] }

/** Build a children index grouped by parent, sorted by `sort_order` then name.
 *
 * Categories are keyed by `parent_id`; tracks by `category_id`. The `__root__`
 * key holds top-level items (null parent).
 */
function buildChildrenIndex(
  tracks: JourneyTrack[],
  categories: JourneyTrackCategory[],
): Map<string, SiblingGroup> {
  const index = new Map<string, SiblingGroup>()

  const getChildren = (parentId: string | null): SiblingGroup => {
    const key = parentId ?? '__root__'
    if (!index.has(key)) index.set(key, { categories: [], tracks: [] })
    return index.get(key)!
  }

  for (const cat of categories) getChildren(cat.parent_id).categories.push(cat)
  for (const track of tracks) getChildren(track.category_id).tracks.push(track)

  for (const { categories: cats, tracks: trks } of index.values()) {
    cats.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name))
    trks.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name))
  }

  return index
}

/** Convert journey tracks + categories into a nested `TreeNode[]` for SortableTree.
 *
 * Categories become parent nodes (their children are sub-categories and tracks);
 * tracks are leaves. Ids are prefixed (`category:`/`track:`) so the two kinds can
 * share one tree without collisions. Order within each sibling group matches the
 * existing grid order (sort_order, then name).
 */
export function tracksAndCategoriesToTree(
  tracks: JourneyTrack[],
  categories: JourneyTrackCategory[],
): JourneyTreeNode[] {
  const index = buildChildrenIndex(tracks, categories)

  const build = (parentId: string | null): JourneyTreeNode[] => {
    const group = index.get(parentId ?? '__root__')
    if (!group) return []

    const merged: Array<{ type: 'category' | 'track'; item: JourneyTrackCategory | JourneyTrack }> = [
      ...group.categories.map((c) => ({ type: 'category' as const, item: c })),
      ...group.tracks.map((t) => ({ type: 'track' as const, item: t })),
    ].sort((a, b) => {
      const orderDiff = (a.item.sort_order ?? 0) - (b.item.sort_order ?? 0)
      if (orderDiff !== 0) return orderDiff
      return a.item.name.localeCompare(b.item.name)
    })

    return merged.map(({ type, item }) => {
      if (type === 'category') {
        const cat = item as JourneyTrackCategory
        return {
          id: gridCategoryId(cat.id),
          label: cat.name,
          data: { kind: 'category' as const },
          children: build(cat.id),
        }
      }
      const trk = item as JourneyTrack
      return {
        id: gridTrackId(trk.id),
        label: trk.name,
        data: { kind: 'track' as const },
      }
    })
  }

  return build(null)
}

/** Convert a nested `TreeNode[]` back into journey tracks + categories.
 *
 * Walks the tree depth-first assigning `parent_id`/`category_id` and per-sibling
 * `sort_order` (categories and tracks are counted independently within each
 * sibling group, matching `deriveAssignments`). Original objects are preserved
 * (only the three fields are updated); items not present in the tree are kept
 * unchanged so no data is lost.
 *
 * A category whose parent resolves to itself (malformed tree) is treated as a
 * root to guard against cycles.
 */
export function treeToJourneyData(
  tree: JourneyTreeNode[],
  tracks: JourneyTrack[],
  categories: JourneyTrackCategory[],
): { tracks: JourneyTrack[]; categories: JourneyTrackCategory[] } {
  const trackById = new Map(tracks.map((t) => [t.id, t]))
  const categoryById = new Map(categories.map((c) => [c.id, c]))

  const resultTracks: JourneyTrack[] = []
  const resultCategories: JourneyTrackCategory[] = []
  const seenTrackIds = new Set<string>()
  const seenCategoryIds = new Set<string>()

  const walk = (nodes: JourneyTreeNode[], parentCategoryId: string | null): void => {
    let catIndex = 0
    let trackIndex = 0

    for (const node of nodes) {
      const realId = node.id.split(':')[1]!
      const kind = node.data?.kind ?? (node.id.startsWith('category:') ? 'category' : 'track')

      if (kind === 'category') {
        seenCategoryIds.add(realId)
        const original = categoryById.get(realId)
        const parentId = parentCategoryId === realId ? null : parentCategoryId
        resultCategories.push({
          ...(original ?? { id: realId, name: node.label }),
          id: realId,
          name: node.label,
          parent_id: parentId,
          sort_order: catIndex,
        })
        catIndex++
        walk(node.children ?? [], realId)
      } else {
        seenTrackIds.add(realId)
        const original = trackById.get(realId)
        resultTracks.push({
          ...(original ?? { id: realId, name: node.label, elvanto_location_id: null, follow_elvanto: false, deleted_at: null }),
          id: realId,
          name: node.label,
          category_id: parentCategoryId,
          sort_order: trackIndex,
        })
        trackIndex++
      }
    }
  }

  walk(tree, null)

  // Preserve any originals not present in the tree unchanged.
  for (const t of tracks) if (!seenTrackIds.has(t.id)) resultTracks.push(t)
  for (const c of categories) if (!seenCategoryIds.has(c.id)) resultCategories.push(c)

  return { tracks: resultTracks, categories: resultCategories }
}