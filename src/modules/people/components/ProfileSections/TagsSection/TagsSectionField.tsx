import type { ReactNode } from 'react'

type TagsSectionFieldProps = {
  label: string
  value: ReactNode
}

export function TagsSectionField({ label, value }: TagsSectionFieldProps) {
  return <p><strong>{label}:</strong> {value || 'Not provided'}</p>
}
