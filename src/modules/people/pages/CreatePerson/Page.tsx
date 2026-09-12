import { useNavigate } from 'react-router-dom'
import type { CSSProperties } from 'react'
import { Page } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import { Users } from 'lucide-react'
import { createPerson } from '../lib/queries'
import { PersonForm } from '../components/PersonForm'

export default function CreatePersonPage() {
  const navigate = useNavigate()
  return (
    <Page.Main>
        <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
          <Page.Heading level={1} icon={Users} title="New person" />
      </Page.Header>
      <Page.Body><Stack gap="6"><PersonForm submitLabel="Create person" onCancel={() => navigate('/people')} onSubmit={async (value) => { const person = await createPerson(value); navigate(`/people/${person.id}`) }} /></Stack></Page.Body>
    </Page.Main>
  )
}
