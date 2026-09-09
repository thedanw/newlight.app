import type { ReactNode } from 'react'

type GuardiansSectionFieldProps = {
  label: string
  value: ReactNode
}

export function GuardiansSectionField({ label, value }: GuardiansSectionFieldProps) {
  return <p><strong>{label}:</strong> {value || 'Not provided'}</p>
}
