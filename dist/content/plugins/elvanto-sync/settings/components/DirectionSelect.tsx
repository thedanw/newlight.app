'use client'
import { Combobox, IconButton } from '@/core/ui'
import { ArrowLeft, ArrowLeftRight, ArrowRight, CheckIcon, type LucideIcon } from 'lucide-react'
import { createListCollection } from '@ark-ui/react'
import { useMemo } from 'react'

export type SyncDirection = 'pull' | 'push' | 'both'

const DIRECTION_ICONS: Record<SyncDirection, LucideIcon> = {
  pull: ArrowRight,
  push: ArrowLeft,
  both: ArrowLeftRight,
}

const DIRECTION_LABELS: Record<SyncDirection, string> = {
  pull: 'Pull (Elvanto → App)',
  push: 'Push (App → Elvanto)',
  both: 'Both (bidirectional)',
}

interface DirectionSelectProps {
  value: SyncDirection
  onChange: (direction: SyncDirection) => void
  disabled?: boolean
}

/**
 * Icon-button trigger that opens a combobox to pick the sync direction.
 * The button icon reflects the current direction (→ pull, ← push, ↔ both).
 */
export function DirectionSelect({ value, onChange, disabled }: DirectionSelectProps) {
  const Icon = DIRECTION_ICONS[value]

  const collection = useMemo(() => createListCollection({
    items: [
      { label: DIRECTION_LABELS.pull, value: 'pull' },
      { label: DIRECTION_LABELS.push, value: 'push' },
      { label: DIRECTION_LABELS.both, value: 'both' },
    ],
  }), [])

  return (
    <Combobox.Root
      collection={collection}
      value={[value]}
      onValueChange={(details) => {
        const next = details.value[0] as SyncDirection | undefined
        if (next) onChange(next)
      }}
      disabled={disabled}
      css={{ width: 'auto' }}
    >
      <Combobox.Control>
        <Combobox.Trigger asChild>
          <IconButton
            variant="outline"
            size="sm"
            title={`Direction: ${DIRECTION_LABELS[value]}`}
            aria-label={`Sync direction: ${value}. Click to change.`}
          >
            <Icon />
          </IconButton>
        </Combobox.Trigger>
      </Combobox.Control>
      <Combobox.Positioner>
        <Combobox.Content css={{ minWidth: '220px' }}>
          {collection.items.map((item) => (
            <Combobox.Item key={item.value} item={item}>
              <Combobox.ItemText>{item.label}</Combobox.ItemText>
              <Combobox.ItemIndicator><CheckIcon /></Combobox.ItemIndicator>
            </Combobox.Item>
          ))}
        </Combobox.Content>
      </Combobox.Positioner>
    </Combobox.Root>
  )
}