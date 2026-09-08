import { useMemo, useState } from 'react'
import { createListCollection } from '@ark-ui/react'
import { Button, Card, Field, Input, Reorder, Select, Tabs, Text } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import { useOrderedCollection } from '@/core/lib'
import { createJourneyCategory, createJourneyStage, createJourneyTrack, deleteJourneyTrack, saveJourneyCategory, saveJourneyStage, saveJourneyTrack } from '../lib/queries'
import { useJourneySettings } from '../lib/settings-hooks'

function categoryOptions(categories: { id: string; parent_id: string | null; name: string }[]) {
  const children = new Map<string | null, typeof categories>()
  for (const category of categories) children.set(category.parent_id, [...(children.get(category.parent_id) ?? []), category])
  const options: { label: string; value: string }[] = []
  const visit = (parentId: string | null, depth: number) => {
    for (const category of children.get(parentId) ?? []) {
      options.push({ label: `${'  '.repeat(depth)}${category.name}`, value: category.id })
      visit(category.id, depth + 1)
    }
  }
  visit(null, 0)
  return options
}

/**
 * Persist an ordering by re-deriving `sort_order` from array position.
 * Missing items are skipped; any save failure returns false (rollback).
 */
async function persistOrder<T>(
  ids: string[],
  items: T[],
  keyOf: (item: T) => string,
  saveItem: (item: T, index: number) => Promise<unknown>,
): Promise<boolean> {
  const results = await Promise.all(
    ids.map((id, index) => {
      const item = items.find((candidate) => keyOf(candidate) === id)
      if (!item) return Promise.resolve(true)
      return saveItem(item, index).then(() => true).catch(() => false)
    }),
  )
  return results.every(Boolean)
}

export function JourneySettingsManager() {
  const { data, loading, error } = useJourneySettings()
  const [message, setMessage] = useState<string | null>(null)
  const [targetByTrack, setTargetByTrack] = useState<Record<string, string>>({})
  const [newTrack, setNewTrack] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newStage, setNewStage] = useState({ slug: '', label: '' })

  // Stable id lists (memoized) so `useOrderedCollection` syncs once data loads.
  const trackIds = useMemo(() => data?.tracks.map((track) => track.id) ?? [], [data])
  const categoryIds = useMemo(() => data?.categories.map((category) => category.id) ?? [], [data])
  const stageIds = useMemo(() => data?.stages.map((stage) => stage.slug) ?? [], [data])

  const tracksCollection = useOrderedCollection({
    definition: { collectionId: 'journey:tracks', table: 'journey_tracks' },
    initialItems: trackIds,
    persist: (ids) => {
      if (!data) return Promise.resolve(false)
      return persistOrder(ids, data.tracks, (track) => track.id, (track, index) =>
        saveJourneyTrack({ ...track, sort_order: index }),
      )
    },
  })

  const categoriesCollection = useOrderedCollection({
    definition: { collectionId: 'journey:categories', table: 'journey_track_categories' },
    initialItems: categoryIds,
    persist: (ids) => {
      if (!data) return Promise.resolve(false)
      return persistOrder(ids, data.categories, (category) => category.id, (category, index) =>
        saveJourneyCategory({ ...category, sort_order: index }),
      )
    },
  })

  const stagesCollection = useOrderedCollection({
    definition: { collectionId: 'journey:stages', table: 'journey_stages', primaryKey: 'slug' },
    initialItems: stageIds,
    persist: (ids) => {
      if (!data) return Promise.resolve(false)
      return persistOrder(ids, data.stages, (stage) => stage.slug, (stage, index) =>
        saveJourneyStage({ ...stage, sort_order: index }),
      )
    },
  })

  if (loading) return <Text>Loading journey settings...</Text>
  if (error || !data) return <Text>{error?.message ?? 'Unable to load journey settings.'}</Text>

  const save = async (action: () => Promise<unknown>) => { try { await action(); setMessage('Saved.') } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'Unable to save.') } }
  const categories = categoryOptions(data.categories)
  const categoryCollection = createListCollection({ items: categories })
  const tracks = tracksCollection.items.map((id) => data.tracks.find((track) => track.id === id)).filter((track): track is typeof data.tracks[number] => Boolean(track))
  const orderedCategories = categoriesCollection.items.map((id) => data.categories.find((category) => category.id === id)).filter((category): category is typeof data.categories[number] => Boolean(category))
  const stages = stagesCollection.items.map((slug) => data.stages.find((stage) => stage.slug === slug)).filter((stage): stage is typeof data.stages[number] => Boolean(stage))
  const reorderAndSave = (collection: { reorder: (next: string[]) => void; save: (next?: string[]) => Promise<boolean> }, next: string[]) => {
    collection.reorder(next)
    void collection.save(next)
  }
  return <Card.Root>
    <Card.Header><Card.Title>Journey settings</Card.Title></Card.Header>
    <Card.Body>
      <Stack gap="4">
        {message && <Text>{message}</Text>}
        <Tabs.Root defaultValue="tracks">
          <Tabs.List><Tabs.Trigger value="tracks">Tracks</Tabs.Trigger><Tabs.Trigger value="categories">Categories</Tabs.Trigger><Tabs.Trigger value="stages">Stages</Tabs.Trigger><Tabs.Indicator /></Tabs.List>
          <Tabs.Content value="tracks">
            <Field.Root><Field.Label>New track</Field.Label><Input value={newTrack} onChange={(event) => setNewTrack(event.target.value)} /><Button onClick={() => save(async () => { await createJourneyTrack(newTrack, null, data.tracks.length); setNewTrack('') })}>Add track</Button></Field.Root>
            <Reorder.Root values={tracksCollection.items} onReorder={(next) => reorderAndSave(tracksCollection, next)}>
              {tracks.map((track) => <Reorder.Item key={track.id} value={track.id}><Reorder.Handle /><Field.Root flex="1"><Field.Label>Track name</Field.Label><Input defaultValue={track.name} onBlur={(event) => save(() => saveJourneyTrack({ id: track.id, name: event.target.value, category_id: track.category_id, sort_order: track.sort_order }))} /><Field.Label>Category</Field.Label><Select.Root collection={categoryCollection} value={track.category_id ? [track.category_id] : []} onValueChange={(details) => save(() => saveJourneyTrack({ id: track.id, name: track.name, category_id: details.value[0] ?? null, sort_order: track.sort_order }))}><Select.Control><Select.Trigger><Select.ValueText placeholder="Uncategorized" /><Select.Indicator /></Select.Trigger></Select.Control><Select.Positioner><Select.Content>{categoryCollection.items.map((item) => <Select.Item key={item.value} item={item}><Select.ItemText>{item.label}</Select.ItemText><Select.ItemIndicator /></Select.Item>)}</Select.Content></Select.Positioner></Select.Root><Field.Label>Sort order</Field.Label><Input type="number" defaultValue={track.sort_order} onBlur={(event) => save(() => saveJourneyTrack({ id: track.id, name: track.name, category_id: track.category_id, sort_order: Number(event.target.value) }))} /><select value={targetByTrack[track.id] ?? ''} onChange={(event) => setTargetByTrack((current) => ({ ...current, [track.id]: event.target.value }))}><option value="">Migration target</option>{data.tracks.filter((target) => target.id !== track.id).map((target) => <option key={target.id} value={target.id}>{target.name}</option>)}</select><Button variant="outline" onClick={() => save(() => deleteJourneyTrack(track.id, targetByTrack[track.id] ?? ''))}>Delete</Button></Field.Root></Reorder.Item>)}
            </Reorder.Root>
          </Tabs.Content>
          <Tabs.Content value="categories">
            <Field.Root><Field.Label>New category</Field.Label><Input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} /><Button onClick={() => save(async () => { await createJourneyCategory(newCategory, null, data.categories.length); setNewCategory('') })}>Add category</Button></Field.Root>
            {categories.map((option) => <Text key={option.value}>{option.label}</Text>)}
            <Reorder.Root values={categoriesCollection.items} onReorder={(next) => reorderAndSave(categoriesCollection, next)}>
              {orderedCategories.map((category) => <Reorder.Item key={category.id} value={category.id}><Reorder.Handle /><Field.Root flex="1"><Field.Label>Category name</Field.Label><Input defaultValue={category.name} onBlur={(event) => save(() => saveJourneyCategory({ ...category, name: event.target.value }))} /><Field.Label>Parent category</Field.Label><Select.Root collection={categoryCollection} value={category.parent_id ? [category.parent_id] : []} onValueChange={(details) => save(() => saveJourneyCategory({ ...category, parent_id: details.value[0] ?? null }))}><Select.Control><Select.Trigger><Select.ValueText placeholder="Top level" /><Select.Indicator /></Select.Trigger></Select.Control><Select.Positioner><Select.Content>{categoryCollection.items.filter((item) => item.value !== category.id).map((item) => <Select.Item key={item.value} item={item}><Select.ItemText>{item.label}</Select.ItemText><Select.ItemIndicator /></Select.Item>)}</Select.Content></Select.Positioner></Select.Root><Field.Label>Sort order</Field.Label><Input type="number" defaultValue={category.sort_order} onBlur={(event) => save(() => saveJourneyCategory({ ...category, sort_order: Number(event.target.value) }))} /></Field.Root></Reorder.Item>)}
            </Reorder.Root>
          </Tabs.Content>
          <Tabs.Content value="stages">
            <Field.Root><Field.Label>New stage slug</Field.Label><Input value={newStage.slug} onChange={(event) => setNewStage((current) => ({ ...current, slug: event.target.value }))} /><Field.Label>New stage label</Field.Label><Input value={newStage.label} onChange={(event) => setNewStage((current) => ({ ...current, label: event.target.value }))} /><Button onClick={() => save(async () => { await createJourneyStage(newStage.slug, newStage.label, data.stages.length); setNewStage({ slug: '', label: '' }) })}>Add stage</Button></Field.Root>
            <Reorder.Root values={stagesCollection.items} onReorder={(next) => reorderAndSave(stagesCollection, next)}>
              {stages.map((stage) => <Reorder.Item key={stage.slug} value={stage.slug}><Reorder.Handle /><Field.Root flex="1"><Field.Label>{stage.slug}</Field.Label><Input defaultValue={stage.label} onBlur={(event) => save(() => saveJourneyStage({ ...stage, label: event.target.value }))} /><Field.Label>Sort order</Field.Label><Input type="number" defaultValue={stage.sort_order} onBlur={(event) => save(() => saveJourneyStage({ ...stage, sort_order: Number(event.target.value) }))} /><Text>{stage.is_terminal ? 'Terminal stage; cannot be deleted.' : 'Stages are retained once created.'}</Text></Field.Root></Reorder.Item>)}
            </Reorder.Root>
          </Tabs.Content>
        </Tabs.Root>
      </Stack>
    </Card.Body>
  </Card.Root>
}
