import type { ReactNode } from 'react'

type JourneySectionFieldProps = {
  label: string
  value: ReactNode
}

export function JourneySectionField({ label, value }: JourneySectionFieldProps) {
  return <p><strong>{label}:</strong> {value || 'Not provided'}</p>
}
