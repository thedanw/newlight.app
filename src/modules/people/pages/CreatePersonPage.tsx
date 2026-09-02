import { useNavigate } from 'react-router-dom'
import { Heading, Page } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import { createPerson } from '../lib/queries'
import { PersonForm } from '../components/PersonForm'

export default function CreatePersonPage() {
  const navigate = useNavigate()
  return (
    <>
      <Page.Header><Heading>New person</Heading></Page.Header>
      <Page.Body><Stack gap="6"><PersonForm submitLabel="Create person" onCancel={() => navigate('/people')} onSubmit={async (value) => { const person = await createPerson(value); navigate(`/people/${person.id}`) }} /></Stack></Page.Body>
    </>
  )
}