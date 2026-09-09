import type { ReactNode } from 'react'

type DemographicsSectionFieldProps = {
  label: string
  value: ReactNode
}

export function DemographicsSectionField({ label, value }: DemographicsSectionFieldProps) {
  return <p><strong>{label}:</strong> {value || 'Not provided'}</p>
}
