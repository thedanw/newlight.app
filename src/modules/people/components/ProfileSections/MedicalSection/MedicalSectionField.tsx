import type { ReactNode } from 'react'

type MedicalSectionFieldProps = {
  label: string
  value: ReactNode
}

export function MedicalSectionField({ label, value }: MedicalSectionFieldProps) {
  return <p><strong>{label}:</strong> {value || 'Not provided'}</p>
}
