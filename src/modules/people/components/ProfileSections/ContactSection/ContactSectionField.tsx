import type { ReactNode } from 'react'

type ContactSectionFieldProps = {
  label: string
  value: ReactNode
}

export function ContactSectionField({ label, value }: ContactSectionFieldProps) {
  return <p><strong>{label}:</strong> {value || 'Not provided'}</p>
}
