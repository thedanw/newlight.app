import { useState } from 'react'
import { Badge, Button, Heading, Text } from '@/core/ui'
import type { EmailRecipient } from '@/core/lib/email'
import type { Person } from '../lib/types'
import { SendEmailDialog } from './SendEmailDialog'

type PersonHeaderProps = {
  person: Person
  onEdit: () => void
}

export function PersonHeader({ person, onEdit }: PersonHeaderProps) {
  const [emailOpen, setEmailOpen] = useState(false)
  const name = person.preferred_name ? `${person.preferred_name} ${person.lastname}` : `${person.firstname} ${person.lastname}`
  const hasEmail = Boolean(person.email?.trim())
  const recipient: EmailRecipient[] = hasEmail
    ? [{ email: person.email as string, name }]
    : []
  return (
    <header>
      <Heading>{name}</Heading>
      <Text>{person.email ?? 'No email address'}</Text>
      <Badge colorPalette={person.demographic === 'adult' ? 'blue' : person.demographic === 'youth' ? 'orange' : 'green'}>{person.demographic}</Badge>
      {hasEmail && <Button variant="outline" onClick={() => setEmailOpen(true)}>Email</Button>}
      <Button onClick={onEdit}>Edit person</Button>
      <SendEmailDialog open={emailOpen} onOpenChange={setEmailOpen} recipients={recipient} />
    </header>
  )
}
