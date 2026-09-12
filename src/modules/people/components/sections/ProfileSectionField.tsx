import type { ReactNode } from 'react'

type ProfileFieldProps = {
  label: string
  value: ReactNode
}

export function ProfileField({ label, value }: ProfileFieldProps) {
  return <p><strong>{label}:</strong> {value || 'Not provided'}</p>
}
