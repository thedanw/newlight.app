import type { ReactNode } from 'react'

type PersonalSectionFieldProps = {
  label: string
  value: ReactNode
}

export function PersonalSectionField({ label, value }: PersonalSectionFieldProps) {
  return <p><strong>{label}:</strong> {value || 'Not provided'}</p>
}
