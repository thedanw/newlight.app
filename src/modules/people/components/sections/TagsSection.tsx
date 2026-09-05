import { useState } from 'react'
import { Button, Text } from '@/core/ui'
import type { Person } from '../../lib/types'
import { setPersonTags } from '../../lib/queries'
import { usePersonTags, useTags } from '../../lib/hooks'
import { TagBadge } from '../TagBadge'
import { ProfileField, ProfileSection } from './ProfileSection'

export function TagsSection({ person }: { person: Person }) {
  const assigned = usePersonTags(person.id)
  const available = useTags()
  const [saving, setSaving] = useState(false)
  const toggle = async (tagId: string) => {
    setSaving(true)
    const current = assigned.data?.map((tag) => tag.id) ?? []
    await setPersonTags(person.id, current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId])
    setSaving(false)
  }
  return (
    <ProfileSection title="Tags">
      {assigned.loading ? <Text>Loading tags...</Text> : assigned.data?.map((tag) => <TagBadge key={tag.id} tag={tag} />)}
      {available.data?.map((tag) => <Button key={tag.id} variant={assigned.data?.some((item) => item.id === tag.id) ? 'solid' : 'outline'} disabled={saving} onClick={() => toggle(tag.id)}>{tag.name}</Button>)}
      <ProfileField label="Journey tracks" value={Object.keys(person.journey || {}).length ? Object.keys(person.journey).join(', ') : 'No journey tracks assigned'} />
    </ProfileSection>
  )
}
