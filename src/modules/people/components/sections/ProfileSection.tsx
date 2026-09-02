import type { ReactNode } from 'react'
import { Card } from '@/core/ui'
import { Stack } from 'styled-system/jsx'

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
        <Stack gap="3">{children}</Stack>
      </Card.Body>
    </Card.Root>
  )
}

export function ProfileField({ label, value }: { label: string; value: ReactNode }) {
  return <p><strong>{label}:</strong> {value || 'Not provided'}</p>
}
