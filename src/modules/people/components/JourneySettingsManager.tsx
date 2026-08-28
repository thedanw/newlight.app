import { useEffect, useState } from 'react'
import { createListCollection } from '@ark-ui/react'
import { Button, Field, Input, Tabs, Text } from '@/core/ui'
import * as Select from '@/core/ui/select'
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

function moveItem(ids: string[], draggedId: string, targetId: string) {
  const next = ids.filter((id) => id !== draggedId)
  next.splice(next.indexOf(targetId), 0, draggedId)
  return next
}

export function JourneySettingsManager() {
  const { data, loading, error } = useJourneySettings()
  const [message, setMessage] = useState<string | null>(null)
  const [targetByTrack, setTargetByTrack] = useState<Record<string, string>>({})
  const [newTrack, setNewTrack] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newStage, setNewStage] = useState({ slug: '', label: '' })
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [trackOrder, setTrackOrder] = useState<string[]>([])
  const [categoryOrder, setCategoryOrder] = useState<string[]>([])
  const [stageOrder, setStageOrder] = useState<string[]>([])
  useEffect(() => {
    if (!data) return
    setTrackOrder(data.tracks.map((track) => track.id))
    setCategoryOrder(data.categories.map((category) => category.id))
    setStageOrder(data.stages.map((stage) => stage.slug))
  }, [data])
  if (loading) return <Text>Loading journey settings...</Text>
  if (error || !data) return <Text>{error?.message ?? 'Unable to load journey settings.'}</Text>
  const save = async (action: () => Promise<unknown>) => { try { await action(); setMessage('Saved.') } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'Unable to save.') } }
  const categories = categoryOptions(data.categories)
  const categoryCollection = createListCollection({ items: categories })
  const tracks = trackOrder.map((id) => data.tracks.find((track) => track.id === id)).filter((track): track is typeof data.tracks[number] => Boolean(track))
  const orderedCategories = categoryOrder.map((id) => data.categories.find((category) => category.id === id)).filter((category): category is typeof data.categories[number] => Boolean(category))
  const stages = stageOrder.map((slug) => data.stages.find((stage) => stage.slug === slug)).filter((stage): stage is typeof data.stages[number] => Boolean(stage))
  const reorder = async (kind: 'tracks' | 'categories' | 'stages', targetId: string) => {
    if (!draggedId || draggedId === targetId) return
    const next = kind === 'tracks' ? moveItem(trackOrder, draggedId, targetId) : kind === 'categories' ? moveItem(categoryOrder, draggedId, targetId) : moveItem(stageOrder, draggedId, targetId)
    if (kind === 'tracks') setTrackOrder(next)
    if (kind === 'categories') setCategoryOrder(next)
    if (kind === 'stages') setStageOrder(next)
    setDraggedId(null)
    await save(() => Promise.all(next.map((id, index) => kind === 'tracks' ? saveJourneyTrack({ ...data.tracks.find((item) => item.id === id)!, sort_order: index }) : kind === 'categories' ? saveJourneyCategory({ ...data.categories.find((item) => item.id === id)!, sort_order: index }) : saveJourneyStage({ ...data.stages.find((item) => item.slug === id)!, sort_order: index }))))
  }
  return <>
    {message && <Text>{message}</Text>}
    <Tabs.Root defaultValue="tracks">
      <Tabs.List><Tabs.Trigger value="tracks">Tracks</Tabs.Trigger><Tabs.Trigger value="categories">Categories</Tabs.Trigger><Tabs.Trigger value="stages">Stages</Tabs.Trigger><Tabs.Indicator /></Tabs.List>
      <Tabs.Content value="tracks">
        <Field.Root><Field.Label>New track</Field.Label><Input value={newTrack} onChange={(event) => setNewTrack(event.target.value)} /><Button onClick={() => save(async () => { await createJourneyTrack(newTrack, null, data.tracks.length); setNewTrack('') })}>Add track</Button></Field.Root>
        {tracks.map((track) => <Field.Root key={track.id} draggable onDragStart={() => setDraggedId(track.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => reorder('tracks', track.id)}><Field.Label>Track name</Field.Label><Input defaultValue={track.name} onBlur={(event) => save(() => saveJourneyTrack({ id: track.id, name: event.target.value, category_id: track.category_id, sort_order: track.sort_order }))} /><Field.Label>Category</Field.Label><Select.Root collection={categoryCollection} value={track.category_id ? [track.category_id] : []} onValueChange={(details) => save(() => saveJourneyTrack({ id: track.id, name: track.name, category_id: details.value[0] ?? null, sort_order: track.sort_order }))}><Select.Control><Select.Trigger><Select.ValueText placeholder="Uncategorized" /><Select.Indicator /></Select.Trigger></Select.Control><Select.Positioner><Select.Content>{categoryCollection.items.map((item) => <Select.Item key={item.value} item={item}><Select.ItemText>{item.label}</Select.ItemText><Select.ItemIndicator /></Select.Item>)}</Select.Content></Select.Positioner></Select.Root><Field.Label>Sort order</Field.Label><Input type="number" defaultValue={track.sort_order} onBlur={(event) => save(() => saveJourneyTrack({ id: track.id, name: track.name, category_id: track.category_id, sort_order: Number(event.target.value) }))} /><select value={targetByTrack[track.id] ?? ''} onChange={(event) => setTargetByTrack((current) => ({ ...current, [track.id]: event.target.value }))}><option value="">Migration target</option>{data.tracks.filter((target) => target.id !== track.id).map((target) => <option key={target.id} value={target.id}>{target.name}</option>)}</select><Button variant="outline" onClick={() => save(() => deleteJourneyTrack(track.id, targetByTrack[track.id] ?? ''))}>Delete</Button></Field.Root>)}
      </Tabs.Content>
      <Tabs.Content value="categories">
        <Field.Root><Field.Label>New category</Field.Label><Input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} /><Button onClick={() => save(async () => { await createJourneyCategory(newCategory, null, data.categories.length); setNewCategory('') })}>Add category</Button></Field.Root>
        {categories.map((option) => <Text key={option.value}>{option.label}</Text>)}
        {orderedCategories.map((category) => <Field.Root key={category.id} draggable onDragStart={() => setDraggedId(category.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => reorder('categories', category.id)}><Field.Label>Category name</Field.Label><Input defaultValue={category.name} onBlur={(event) => save(() => saveJourneyCategory({ ...category, name: event.target.value }))} /><Field.Label>Parent category</Field.Label><Select.Root collection={categoryCollection} value={category.parent_id ? [category.parent_id] : []} onValueChange={(details) => save(() => saveJourneyCategory({ ...category, parent_id: details.value[0] ?? null }))}><Select.Control><Select.Trigger><Select.ValueText placeholder="Top level" /><Select.Indicator /></Select.Trigger></Select.Control><Select.Positioner><Select.Content>{categoryCollection.items.filter((item) => item.value !== category.id).map((item) => <Select.Item key={item.value} item={item}><Select.ItemText>{item.label}</Select.ItemText><Select.ItemIndicator /></Select.Item>)}</Select.Content></Select.Positioner></Select.Root><Field.Label>Sort order</Field.Label><Input type="number" defaultValue={category.sort_order} onBlur={(event) => save(() => saveJourneyCategory({ ...category, sort_order: Number(event.target.value) }))} /></Field.Root>)}
      </Tabs.Content>
      <Tabs.Content value="stages">
        <Field.Root><Field.Label>New stage slug</Field.Label><Input value={newStage.slug} onChange={(event) => setNewStage((current) => ({ ...current, slug: event.target.value }))} /><Field.Label>New stage label</Field.Label><Input value={newStage.label} onChange={(event) => setNewStage((current) => ({ ...current, label: event.target.value }))} /><Button onClick={() => save(async () => { await createJourneyStage(newStage.slug, newStage.label, data.stages.length); setNewStage({ slug: '', label: '' }) })}>Add stage</Button></Field.Root>
        {stages.map((stage) => <Field.Root key={stage.slug} draggable onDragStart={() => setDraggedId(stage.slug)} onDragOver={(event) => event.preventDefault()} onDrop={() => reorder('stages', stage.slug)}><Field.Label>{stage.slug}</Field.Label><Input defaultValue={stage.label} onBlur={(event) => save(() => saveJourneyStage({ ...stage, label: event.target.value }))} /><Field.Label>Sort order</Field.Label><Input type="number" defaultValue={stage.sort_order} onBlur={(event) => save(() => saveJourneyStage({ ...stage, sort_order: Number(event.target.value) }))} /><Text>{stage.is_terminal ? 'Terminal stage; cannot be deleted.' : 'Stages are retained once created.'}</Text></Field.Root>)}
      </Tabs.Content>
    </Tabs.Root>
  </>
}
