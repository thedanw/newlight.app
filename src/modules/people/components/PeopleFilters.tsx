import type { PeopleListOptions } from '../lib/types'
import { useTags } from '../lib/hooks'

type PeopleFiltersProps = {
  filters: PeopleListOptions
  onChange: (filters: PeopleListOptions) => void
}

export function PeopleFilters({ filters, onChange }: PeopleFiltersProps) {
    const tags = useTags()
  return (
    <fieldset>
      <legend>Filter people</legend>
      <label>
        Demographic
        <select
          value={filters.demographic ?? ''}
          onChange={(event) => onChange({ ...filters, demographic: event.target.value ? event.target.value as NonNullable<PeopleListOptions['demographic']> : undefined })}
        >
          <option value="">All</option>
          <option value="adult">Adults</option>
          <option value="youth">Youth</option>
          <option value="child">Children</option>
        </select>
            <select value={filters.tagId ?? ''} onChange={(event) => onChange({ ...filters, tagId: event.target.value || undefined })}>
              <option value="">All tags</option>
              {tags.data?.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
            </select>
      </label>
      <label>
        Access
        <select
          value={filters.accessPermission ?? ''}
          onChange={(event) => onChange({ ...filters, accessPermission: event.target.value ? event.target.value as NonNullable<PeopleListOptions['accessPermission']> : undefined })}
        >
          <option value="">All</option>
          <option value="public">Public</option>
          <option value="member_area">Member area</option>
          <option value="team_leaders">Team leaders</option>
          <option value="admin">Admin</option>
        </select>
      </label>
    </fieldset>
  )
}
