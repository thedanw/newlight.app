import type { ReactNode } from 'react'

type ChildSafetySectionFieldProps = {
  label: string
  value: ReactNode
}

export function ChildSafetySectionField({ label, value }: ChildSafetySectionFieldProps) {
  return <p><strong>{label}:</strong> {value || 'Not provided'}</p>
}
