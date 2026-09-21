import type { ReactNode } from 'react'
import { Card } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import { ProfileField } from './ProfileSectionField'

type ProfileSectionProps = {
  title: string
  children: ReactNode
}

export function ProfileSection({ title, children }: ProfileSectionProps) {
  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>{title}</Card.Title>
      </Card.Header>
      <Card.Body>
        <Stack>{children}</Stack>
      </Card.Body>
    </Card.Root>
  )
}

export { ProfileField }
