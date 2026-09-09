import { useEffect, useState } from 'react'
import { getCurrentOperatorPermission, getHouseholdById, getHouseholds, getJourneyCategories, getJourneyGrid, getJourneyStages, getJourneyTracks, getPeopleList, getPersonById, getPersonGuardians, getPublicPeopleList, getPublicPersonById, searchPeople } from './queries'
import { getPersonTags, getTags } from './queries'
import type { HouseholdDetails, JourneyGrid, JourneyStage, JourneyTrack, JourneyTrackCategory, PeopleListOptions, Person, PersonPublic, PersonWithJourney } from './types'

type AsyncState<T> = {
  data: T | null
  loading: boolean
  error: Error | null
}

export function useAsyncQuery<T>(query: () => Promise<T>, key: string): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null })

  useEffect(() => {
    let active = true
    setState({ data: null, loading: true, error: null })
    query()
      .then((data) => {
        if (active) setState({ data, loading: false, error: null })
      })
      .catch((error: unknown) => {
        if (active) setState({ data: null, loading: false, error: error instanceof Error ? error : new Error(String(error)) })
      })
    return () => {
      active = false
    }
  }, [key])

  return state
}

export function usePeopleList(options: PeopleListOptions = {}, isPublic = false): AsyncState<(PersonWithJourney | PersonPublic)[]> {
  const query: () => Promise<(PersonWithJourney | PersonPublic)[]> = isPublic
    ? () => getPublicPeopleList(options)
    : () => getPeopleList(options)
  // Mode-scoped key so the correct table is (re)queried if auth resolves mid-render.
  return useAsyncQuery(query, `${isPublic ? 'public' : 'private'}:${JSON.stringify(options)}`)
}

export function usePerson(id: string | undefined): AsyncState<Person> {
  return useAsyncQuery(() => {
    if (!id) return Promise.reject(new Error('A person id is required'))
    return getPersonById(id).then((person) => {
      if (!person) throw new Error('Person not found')
      return person
    })
  }, id ?? '')
}

export function useHousehold(id: string | undefined): AsyncState<HouseholdDetails> {
  return useAsyncQuery(() => {
    if (!id) return Promise.reject(new Error('A household id is required'))
    return getHouseholdById(id).then((household) => {
      if (!household) throw new Error('Household not found')
      return household
    })
  }, id ?? '')
}

export function useHouseholds(): AsyncState<HouseholdDetails[]> {
  return useAsyncQuery(getHouseholds, 'households')
}

export function useJourneyGrid(): AsyncState<JourneyGrid> {
  return useAsyncQuery(getJourneyGrid, 'journey-grid')
}

export function useJourneyTracks(): AsyncState<JourneyTrack[]> {
  return useAsyncQuery(getJourneyTracks, 'journey-tracks')
}

export function useJourneyStages(): AsyncState<JourneyStage[]> {
  return useAsyncQuery(getJourneyStages, 'journey-stages')
}

export function useJourneyCategories(): AsyncState<JourneyTrackCategory[]> {
  return useAsyncQuery(getJourneyCategories, 'journey-categories')
}

export function useCurrentOperatorPermission(): AsyncState<Person['access_permission'] | null> {
  return useAsyncQuery(getCurrentOperatorPermission, 'current-operator-permission')
}

export function usePeopleSearch(searchTerm: string): AsyncState<Person[]> {
  return useAsyncQuery(() => searchPeople(searchTerm), searchTerm.trim())
}

export function useTags(): AsyncState<import('./types').Tag[]> {
  return useAsyncQuery(getTags, 'tags')
}

export function usePersonTags(personId: string | undefined): AsyncState<import('./types').Tag[]> {
  return useAsyncQuery(() => personId ? getPersonTags(personId) : Promise.resolve([]), personId ?? '')
}

export function usePersonGuardians(personId: string | undefined): AsyncState<Person[]> {
  return useAsyncQuery(() => personId ? getPersonGuardians(personId) : Promise.resolve([]), personId ?? '')
}

export function usePublicPerson(id: string | undefined): AsyncState<PersonPublic | null> {
  return useAsyncQuery(() => {
    if (!id) return Promise.reject(new Error('A person id is required'))
    return getPublicPersonById(id).then((person) => {
      if (!person) throw new Error('Person not found')
      return person
    })
  }, id ?? '')
}
