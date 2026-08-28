import { useNavigate } from 'react-router-dom'
import { Heading, PageHeader } from '@/core/ui'
import { createPerson } from '../lib/queries'
import { PersonForm } from '../components/PersonForm'

export default function CreatePersonPage() {
  const navigate = useNavigate()
  return (
    <>
      <PageHeader><Heading>New person</Heading></PageHeader>
      <main><PersonForm submitLabel="Create person" onCancel={() => navigate('/people')} onSubmit={async (value) => { const person = await createPerson(value); navigate(`/people/${person.id}`) }} /></main>
    </>
  )
}