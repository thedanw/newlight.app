import { useState } from 'react'
import { Button, Field, Input, Text } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import type { Address } from '../lib/types'

type HouseholdAddressProps = {
  address: Address | null
  onSave: (address: Pick<Address, 'line1' | 'line2' | 'suburb' | 'state' | 'postcode'>) => Promise<void>
}

const emptyAddress = { line1: '', line2: '', suburb: '', state: '', postcode: '' }

export function HouseholdAddress({ address, onSave }: HouseholdAddressProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState({ ...emptyAddress, ...address })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!editing) {
    if (!address) return <><Text>No home address recorded.</Text><Button variant="outline" onClick={() => setEditing(true)}>Add address</Button></>
    const lines = [address.line1, address.line2, [address.suburb, address.state, address.postcode].filter(Boolean).join(' ')].filter(Boolean)
    return <><address>{lines.map((line) => <Text key={line}>{line}</Text>)}</address><Button variant="outline" onClick={() => setEditing(true)}>Edit address</Button></>
  }

  const update = (key: keyof typeof emptyAddress, next: string) => setValue((current) => ({ ...current, [key]: next }))
  const submit = async () => {
    setSaving(true)
    setError(null)
    try { await onSave(value); setEditing(false) } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Unable to save address.') } finally { setSaving(false) }
  }

  return <Stack gap="4">
    {(['line1', 'line2', 'suburb', 'state', 'postcode'] as const).map((key) => <Field.Root key={key}><Field.Label>{key === 'line1' ? 'Address line 1' : key === 'line2' ? 'Address line 2' : key[0].toUpperCase() + key.slice(1)}</Field.Label><Input value={value[key] ?? ''} onChange={(event) => update(key, event.target.value)} /></Field.Root>)}
    {error && <Text>{error}</Text>}
    <Stack flexDirection="row" gap="3">
      <Button loading={saving} loadingText="Saving" onClick={submit}>Save address</Button>
      <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
    </Stack>
  </Stack>
}
