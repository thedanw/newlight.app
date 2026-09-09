import type { ReactNode } from 'react'

type AdminSectionFieldProps = {
  label: string
  value: ReactNode
}

export function AdminSectionField({ label, value }: AdminSectionFieldProps) {
  return <p><strong>{label}:</strong> {value || 'Not provided'}</p>
}
