import { useState } from 'react'
import { Button, Card, Field, Input, Text } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import { createTag, deleteTag, updateTag } from '../lib/queries'
import { useTags } from '../lib/hooks'
import type { Tag } from '../lib/types'

export function TagManager() {
  const { data, loading, error } = useTags()
  const [name, setName] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  if (loading) return <Text>Loading tags...</Text>
  if (error || !data) return <Text>{error?.message ?? 'Unable to load tags.'}</Text>
  const run = async (action: () => Promise<unknown>) => { try { await action(); setMessage('Saved.') } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'Unable to save tag.') } }
  return <Card.Root>
    <Card.Header><Card.Title>Tags</Card.Title></Card.Header>
    <Card.Body>
      <Stack gap="4">
        {message && <Text>{message}</Text>}
        <Field.Root><Field.Label>New tag</Field.Label><Input value={name} onChange={(event) => setName(event.target.value)} /><Button onClick={() => run(async () => { await createTag(name); setName('') })}>Add tag</Button></Field.Root>
        {data.map((tag) => <Field.Root key={tag.id}><Input defaultValue={tag.name} onBlur={(event) => run(() => updateTag(tag.id, { name: event.target.value, category: tag.category }))} /><select defaultValue={tag.category} onChange={(event) => run(() => updateTag(tag.id, { name: tag.name, category: event.target.value as Tag['category'] }))}><option value="location">Location</option><option value="journey_track">Journey track</option><option value="demographic">Demographic</option><option value="status">Status</option><option value="custom">Custom</option></select><Button variant="outline" onClick={() => run(() => deleteTag(tag.id))}>Delete</Button></Field.Root>)}
      </Stack>
    </Card.Body>
  </Card.Root>
}