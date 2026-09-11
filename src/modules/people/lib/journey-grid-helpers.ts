import type { JourneyStage, JourneyTrack, JourneyTrackCategory } from './types'

export type GridRow = {
  id: string
  type: 'track' | 'category'
  label: string
  depth: number
  connector: string
}

export const gridTrackId = (id: string): string => `track:${id}`
export const gridCategoryId = (id: string): string => `category:${id}`

/** Compute the tree connector prefix for a single item.
 *
 * Each ancestor level contributes either `│` (ancestor is NOT last child)
 * or ` ` (ancestor IS last child). The final segment is `└` or `├`
 * depending on whether THIS item is the last child of its parent.
 */
function buildConnector(depth: number, ancestorLastFlags: boolean[], isLast: boolean): string {
  let prefix = ''
  for (let level = 0; level < depth; level++) {
    prefix += ancestorLastFlags[level] ? '  ' : '│ '
  }
  prefix += isLast ? '└ ' : '├ '
  return prefix
}

/** Build an ordered children map grouped by parent.
 *
 * Returns a structure where each key is a parent ID (or '__root__' for top-level)
 * and each value is `{ categories, tracks }` — children sorted by sort_order.
 */
function buildChildrenIndex(
  tracks: JourneyTrack[],
  categories: JourneyTrackCategory[],
): Map<string, { categories: JourneyTrackCategory[]; tracks: JourneyTrack[] }> {
  const index = new Map<string, { categories: JourneyTrackCategory[]; tracks: JourneyTrack[] }>()

  const getChildren = (parentId: string | null): { categories: JourneyTrackCategory[]; tracks: JourneyTrack[] } => {
    const key = parentId ?? '__root__'
    if (!index.has(key)) index.set(key, { categories: [], tracks: [] })
    return index.get(key)!
  }

  for (const cat of categories) {
    getChildren(cat.parent_id).categories.push(cat)
  }
  for (const track of tracks) {
    getChildren(track.category_id).tracks.push(track)
  }

  // Sort each sibling group by sort_order, then label
  for (const { categories: cats, tracks: trks } of index.values()) {
    cats.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name))
    trks.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name))
  }

  return index
}

/** Build a flat list of rows in depth-first order, with `depth` and `connector`
 * computed from the data's `parent_id` / `category_id` relationships.
 *
 * Use `rowOrder` to override the computed order (e.g. after a drag-and-drop
 * reorder). When omitted, items are laid out in depth-first order sorted by
 * `sort_order`.
 */
export function buildRows(
  tracks: JourneyTrack[],
  categories: JourneyTrackCategory[],
  rowOrder?: string[],
): GridRow[] {
  // If no explicit order, compute depth-first order from the data
  if (!rowOrder) {
    const index = buildChildrenIndex(tracks, categories)
    const result: GridRow[] = []

    function traverse(parentId: string | null, depth: number, ancestorLastFlags: boolean[]): void {
      const children = index.get(parentId ?? '__root__')
      if (!children) return

      // Interleave categories and tracks, sorted by sort_order
      const merged: Array<{ type: 'category' | 'track'; id: string; label: string }> = [
        ...children.categories.map((c) => ({ type: 'category' as const, id: c.id, label: c.name })),
        ...children.tracks.map((t) => ({ type: 'track' as const, id: t.id, label: t.name })),
      ].sort((a, b) => {
        const aItem = a.type === 'category' ? children.categories.find((c) => c.id === a.id)! : children.tracks.find((t) => t.id === a.id)!
        const bItem = b.type === 'category' ? children.categories.find((c) => c.id === b.id)! : children.tracks.find((t) => t.id === b.id)!
        const orderDiff = (aItem.sort_order ?? 0) - (bItem.sort_order ?? 0)
        if (orderDiff !== 0) return orderDiff
        return aItem.name.localeCompare(bItem.name)
      })

      const lastIndex = merged.length - 1
      for (let i = 0; i < merged.length; i++) {
        const child = merged[i]
        const isLast = i === lastIndex
        const connector = buildConnector(depth, ancestorLastFlags, isLast)

        if (child.type === 'category') {
          result.push({
            id: gridCategoryId(child.id),
            type: 'category',
            label: child.label,
            depth,
            connector,
          })
          traverse(child.id, depth + 1, [...ancestorLastFlags, isLast])
        } else {
          result.push({
            id: gridTrackId(child.id),
            type: 'track',
            label: child.label,
            depth,
            connector,
          })
        }
      }
    }

    traverse(null, 0, [])
    return result
  }

  // With an explicit rowOrder, use that order but still compute depth/connector
  // from the data's parent-child relationships
  return rowsFromOrder(rowOrder, tracks, categories)
}

/** Compute GridRow[] from an existing flat order (e.g. drag-reordered `rowOrder`),
 * deriving `depth` and `connector` from the data's `parent_id` / `category_id`.
 *
 * After a drag changes the flat list order, depth values are preserved from the
 * original data relationships. The connector prefix is recomputed based on the
 * new position in the list.
 */
export function rowsFromOrder(
  rowOrder: string[],
  tracks: JourneyTrack[],
  categories: JourneyTrackCategory[],
): GridRow[] {
  const categoryById = new Map(categories.map((c) => [c.id, c]))
  const trackById = new Map(tracks.map((t) => [t.id, t]))

  // Compute depth for each category from parent_id chain
  const categoryDepth: Map<string, number> = new Map()
  function getCategoryDepth(catId: string): number {
    if (categoryDepth.has(catId)) return categoryDepth.get(catId)!
    const cat = categoryById.get(catId)
    if (!cat || !cat.parent_id) return 0
    const parentDepth = getCategoryDepth(cat.parent_id) + 1
    categoryDepth.set(catId, parentDepth)
    return parentDepth
  }

  // Compute depth for each track from category_id
  const trackDepth: Map<string, number> = new Map()
  for (const track of tracks) {
    if (!track.category_id) {
      trackDepth.set(track.id, 0)
    } else {
      const catDepth = getCategoryDepth(track.category_id)
      trackDepth.set(track.id, catDepth + 1)
    }
  }

  // For connector computation, we need to know which items are "last at their depth"
  // — i.e. the last item at a given depth among siblings with the same parent.

  const result: GridRow[] = []

  for (const rowId of rowOrder) {
    if (rowId.startsWith('category:')) {
      const catId = rowId.slice('category:'.length)
      const cat = categoryById.get(catId)
      if (!cat) continue
      result.push({
        id: rowId,
        type: 'category',
        label: cat.name,
        depth: getCategoryDepth(catId),
        connector: '', // filled in second pass
      })
    } else {
      const trackId = rowId.slice('track:'.length)
      const track = trackById.get(trackId)
      if (!track) continue
      result.push({
        id: rowId,
        type: 'track',
        label: track.name,
        depth: trackDepth.get(trackId) ?? 0,
        connector: '', // filled in second pass
      })
    }
  }

  // Second pass: compute connectors
  // Walk the result array, maintaining a stack of (depth, isLast) pairs.
  // In a depth-first layout, siblings at the same depth are contiguous before
  // any lower-depth item returns. So isLast = no sibling at the same depth
  // appears before the next lower-depth (or end-of-list) item.
  const depthStack: Array<{ depth: number; isLast: boolean }> = []

  for (let i = 0; i < result.length; i++) {
    const row = result[i]!

    // Pop stack to current depth
    while (depthStack.length > 0 && depthStack[depthStack.length - 1]!.depth >= row.depth) {
      depthStack.pop()
    }

    // Compute ancestorLastFlags from the stack
    const ancestorLastFlags = depthStack.map((s) => s.isLast)

    // Determine isLast: walk forward skipping descendants (depth > row.depth).
    // A sibling at depth === row.depth means NOT last.
    // A lower-depth item (depth < row.depth) means this WAS the last child.
    let hasSiblingAfter = false
    for (let j = i + 1; j < result.length; j++) {
      const r = result[j]!
      if (r.depth < row.depth) break // parent returned → no more siblings
      if (r.depth === row.depth) {
        hasSiblingAfter = true
        break
      }
      // r.depth > row.depth → descendant, keep skipping
    }
    const isLast = !hasSiblingAfter

    row.connector = buildConnector(row.depth, ancestorLastFlags, isLast)

    // Push this row's depth + isLast onto the stack for children
    depthStack.push({ depth: row.depth, isLast })
  }

  return result
}

export function moveRow(rows: GridRow[], draggedId: string, targetId: string, relative: 'before' | 'after'): GridRow[] {
  const dragged = rows.find((r) => r.id === draggedId)
  if (!dragged) return rows
  const filtered = rows.filter((r) => r.id !== draggedId)
  const targetIdx = filtered.findIndex((r) => r.id === targetId)
  if (targetIdx === -1) return rows
  const insertAt = relative === 'before' ? targetIdx : targetIdx + 1
  filtered.splice(insertAt, 0, dragged)
  return filtered
}

export function nearestRowIndex(centers: { id: string; center: number }[], draggedId: string, pointer: number): number {
  let best = -1
  let bestDist = Infinity
  centers.forEach((c, i) => {
    if (c.id === draggedId) return
    const dist = Math.abs(c.center - pointer)
    if (dist < bestDist) {
      bestDist = dist
      best = i
    }
  })
  return best
}

/** Walk the flat reordered list and derive `parent_id` / `category_id` / `sort_order`
 * for every track and category based on `depth`.
 *
 * - Categories: `parent_id` = nearest preceding category whose depth < this category's depth.
 *   `sort_order` = index among sibling categories under the same parent.
 * - Tracks: `category_id` = nearest preceding item at depth-1 (the enclosing parent).
 *   `sort_order` = index among sibling tracks under the same parent.
 */
export function deriveAssignments(
  rows: GridRow[],
  tracks: JourneyTrack[],
  categories: JourneyTrackCategory[],
): { tracks: JourneyTrack[]; categories: JourneyTrackCategory[] } {
  const parentMap: Record<string, string | null> = {} // categoryId -> parentCategoryId
  const catSortMap: Record<string, number> = {} // categoryId -> sort_order among sibling categories
  const trackSortMap: Record<string, number> = {} // trackId -> sort_order among sibling tracks
  const trackCategoryMap: Record<string, string | null> = {} // trackId -> categoryId

  // Stack of category IDs at each depth level
  const parentStack: string[] = []
  // Per-parent sibling counters for sort_order (relative to siblings)
  const catCounter: Record<string, number> = {}
  const trackCounter: Record<string, number> = {}

  for (const row of rows) {
    const realId = row.id.split(':')[1]!

    // Truncate parent stack to current depth
    while (parentStack.length > row.depth) parentStack.pop()

    const currentParent = parentStack.length > 0 ? parentStack[parentStack.length - 1] : null
    const siblingKey = currentParent ?? '__root__'

    if (row.type === 'category') {
      parentMap[realId] = currentParent
      catSortMap[realId] = catCounter[siblingKey] ?? 0
      catCounter[siblingKey] = (catCounter[siblingKey] ?? 0) + 1
      parentStack.push(realId)
    } else {
      trackCategoryMap[realId] = currentParent
      trackSortMap[realId] = trackCounter[siblingKey] ?? 0
      trackCounter[siblingKey] = (trackCounter[siblingKey] ?? 0) + 1
    }
  }

  return {
    tracks: tracks.map((t) => ({
      ...t,
      sort_order: trackSortMap[t.id] ?? t.sort_order ?? 0,
      category_id: trackCategoryMap[t.id] ?? null,
    })),
    categories: categories.map((c) => ({
      ...c,
      sort_order: catSortMap[c.id] ?? c.sort_order ?? 0,
      parent_id: parentMap[c.id] ?? null,
    })),
  }
}

export function reorderFromDrag(
  ids: string[],
  centers: { id: string; center: number }[],
  draggedId: string,
  pointer: number,
): string[] | null {
  const nearest = nearestRowIndex(centers, draggedId, pointer)
  if (nearest === -1) return null
  const targetId = centers[nearest].id
  const targetCenter = centers[nearest].center
  const relative: 'before' | 'after' = pointer < targetCenter ? 'before' : 'after'
  const filtered = ids.filter((id) => id !== draggedId)
  const targetIdx = filtered.findIndex((id) => id === targetId)
  if (targetIdx === -1) return null
  const insertAt = relative === 'before' ? targetIdx : targetIdx + 1
  filtered.splice(insertAt, 0, draggedId)
  return filtered
}

export function reorderStagesByOrder(stages: JourneyStage[], order: string[]): JourneyStage[] {
  const byId = new Map(stages.map((s) => [s.id, s]))
  return order
    .map((id) => byId.get(id))
    .filter((stage): stage is JourneyStage => Boolean(stage))
    .map((stage, index) => ({ ...stage, sort_order: index }))
}

export function newTrack(name: string, categoryId: string | null, sortOrder: number): JourneyTrack {
  return { id: crypto.randomUUID(), name, category_id: categoryId, sort_order: sortOrder, elvanto_location_id: null, follow_elvanto: false, deleted_at: null }
}

export function newCategory(name: string, sortOrder: number, parentId: string | null = null): JourneyTrackCategory {
  return { id: crypto.randomUUID(), parent_id: parentId, name, sort_order: sortOrder }
}

export function newStage(slug: string, label: string, sortOrder: number): JourneyStage {
  return { id: crypto.randomUUID(), slug, label, color: null, sort_order: sortOrder, is_terminal: false }
}
