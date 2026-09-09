import type { JourneyStage, JourneyTrack, JourneyTrackCategory } from './types'

export type GridRow = { id: string; type: 'track' | 'category'; label: string }

export const gridTrackId = (id: string): string => `track:${id}`
export const gridCategoryId = (id: string): string => `category:${id}`

function toRow(item: { type: 'track' | 'category'; id: string; label: string; sortOrder: number }): GridRow {
  return { id: `${item.type}:${item.id}`, type: item.type, label: item.label }
}

export function buildRows(tracks: JourneyTrack[], categories: JourneyTrackCategory[]): GridRow[] {
  const all: Array<{ type: 'track' | 'category'; id: string; label: string; sortOrder: number }> = [
    ...categories.map((c) => ({ type: 'category' as const, id: c.id, label: c.name, sortOrder: c.sort_order ?? 0 })),
    ...tracks.map((t) => ({ type: 'track' as const, id: t.id, label: t.name, sortOrder: t.sort_order ?? 0 })),
  ]
  return all
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
    .map(toRow)
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

export function deriveAssignments(
  rows: GridRow[],
  tracks: JourneyTrack[],
  categories: JourneyTrackCategory[],
): { tracks: JourneyTrack[]; categories: JourneyTrackCategory[] } {
  const categorySortOrder: Record<string, number> = {}
  const trackSortOrder: Record<string, number> = {}
  const trackCategory: Record<string, string | null> = {}
  let lastCategory: string | null = null
  rows.forEach((row, index) => {
    const realId = row.id.split(':')[1]!
    if (row.type === 'category') {
      categorySortOrder[realId] = index
      lastCategory = realId
    } else {
      trackSortOrder[realId] = index
      trackCategory[realId] = lastCategory
    }
  })
  return {
    tracks: tracks.map((t) => ({ ...t, sort_order: trackSortOrder[t.id] ?? t.sort_order ?? 0, category_id: trackCategory[t.id] ?? null })),
    categories: categories.map((c) => ({ ...c, sort_order: categorySortOrder[c.id] ?? c.sort_order ?? 0 })),
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

export function newCategory(name: string, sortOrder: number): JourneyTrackCategory {
  return { id: crypto.randomUUID(), parent_id: null, name, sort_order: sortOrder }
}

export function newStage(slug: string, label: string, sortOrder: number): JourneyStage {
  return { id: crypto.randomUUID(), slug, label, color: null, sort_order: sortOrder, is_terminal: false }
}
