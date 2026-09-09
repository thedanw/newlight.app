import type { ReactNode } from 'react'

type ConsentsSectionFieldProps = {
  label: string
  value: ReactNode
}

export function ConsentsSectionField({ label, value }: ConsentsSectionFieldProps) {
  return <p><strong>{label}:</strong> {value || 'Not provided'}</p>
}
