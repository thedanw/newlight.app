import { useState } from 'react'
import { Badge, Button, Card, Heading, Text } from '@/core/ui'
import { HStack, Stack } from 'styled-system/jsx'
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
    <Card.Root>
      <Card.Body>
        <Stack gap="3">
          <HStack justifyContent="space-between" alignItems="center">
            <Stack gap="1">
              <Heading>{name}</Heading>
              <Text color="fg.muted">{person.email ?? 'No email address'}</Text>
            </Stack>
            <HStack gap="2">
              <Badge colorPalette={person.demographic === 'adult' ? 'blue' : person.demographic === 'youth' ? 'orange' : 'green'}>{person.demographic}</Badge>
              {hasEmail && <Button variant="outline" onClick={() => setEmailOpen(true)}>Email</Button>}
              <Button onClick={onEdit}>Edit person</Button>
            </HStack>
          </HStack>
        </Stack>
      </Card.Body>
      <SendEmailDialog open={emailOpen} onOpenChange={setEmailOpen} recipients={recipient} />
    </Card.Root>
  )
}
