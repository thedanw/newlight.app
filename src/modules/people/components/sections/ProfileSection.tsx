import type { ReactNode } from 'react'
import { Heading } from '@/core/ui'

type ProfileSectionProps = {
  title: string
  children: ReactNode
}

export function ProfileSection({ title, children }: ProfileSectionProps) {
  return (
    <section aria-labelledby={`profile-section-${title}`}>
      <Heading id={`profile-section-${title}`}>{title}</Heading>
      {children}
    </section>
  )
}

export function ProfileField({ label, value }: { label: string; value: ReactNode }) {
  return <p><strong>{label}:</strong> {value || 'Not provided'}</p>
}
