'use client'
import type { ReactNode } from 'react'
import { Box } from 'styled-system/jsx'
import { AbsoluteCenter, Button, Group, Span, Text } from '@/core/ui'

/* ---------------------------------------------------------------------------
   Layout demos — AbsoluteCenter, Group, Span.
--------------------------------------------------------------------------- */

export const layoutDemos: Record<string, ReactNode> = {
  AbsoluteCenter: (
    <Box position="relative" h="24" borderWidth="1px" borderColor="border" borderRadius="l2">
      <AbsoluteCenter>
        <Text textStyle="sm">Centered</Text>
      </AbsoluteCenter>
    </Box>
  ),
  Group: (
    <Group>
      <Button size="sm" variant="outline">
        Left
      </Button>
      <Button size="sm" variant="outline">
        Center
      </Button>
      <Button size="sm" variant="outline">
        Right
      </Button>
    </Group>
  ),
  Span: (
    <Text textStyle="sm">
      Rendered with a <Span fontWeight="semibold" color="colorPalette.solid.fg">styled span</Span> inline.
    </Text>
  ),
}
