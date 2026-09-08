'use client'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { Reorder, Text } from '@/core/ui'
import { Stack } from 'styled-system/jsx'

/* ---------------------------------------------------------------------------
   Reorder demo — handle-only drag list built on the core Reorder compound
   (framer-motion Reorder.Group/Item + a 44px drag handle). Drag tracking is
   never gated on reduced motion; only the release animation is suppressed.
--------------------------------------------------------------------------- */

const INITIAL_ITEMS = ['First', 'Second', 'Third', 'Fourth']

function ReorderListDemo() {
  const [items, setItems] = useState(INITIAL_ITEMS)
  return (
    <Stack gap="3" width="100%" maxWidth="320px">
      <Text textStyle="sm" color="fg.muted">
        Drag the handle to reorder
      </Text>
      <Reorder.Root values={items} onReorder={setItems}>
        {items.map((item) => (
          <Reorder.Item key={item} value={item}>
            <Reorder.Handle />
            <Text flex="1">{item}</Text>
          </Reorder.Item>
        ))}
      </Reorder.Root>
    </Stack>
  )
}

export const reorderDemos: Record<string, ReactNode> = {
  Reorder: <ReorderListDemo />,
}