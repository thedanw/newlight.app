'use client'
import type { ReactNode } from 'react'
import { HStack, Stack } from 'styled-system/jsx'
import { Code, Heading, Kbd, Link, Text } from '@/core/ui'

/* ---------------------------------------------------------------------------
   Typography demos — DisplayHeading, Heading, Subheading, Text, Caption,
   Code, Kbd, Link. NOTE: the typography category now renders a bespoke
   specimen page (TypographyShowcase) instead of the generic SubpageTemplate
   card grid; this record is kept in sync so the DEMOS barrel stays keyed to
   every TOC name.
--------------------------------------------------------------------------- */

export const typographyDemos: Record<string, ReactNode> = {
  DisplayHeading: <Heading textStyle="4xl">New Light</Heading>,
  Heading: <Heading textStyle="lg">Section title</Heading>,
  Subheading: (
    <Stack gap="1">
      <Heading textStyle="md">Small groups</Heading>
      <Text textStyle="sm" color="fg.muted">
        Find a circle that fits your season.
      </Text>
    </Stack>
  ),
  Text: (
    <Stack gap="1">
      <Text textStyle="lg">Lead paragraph</Text>
      <Text textStyle="sm" color="fg.muted">
        Body copy — the catalog is one natural context per component.
      </Text>
    </Stack>
  ),
  Caption: (
    <Text textStyle="xs" color="fg.muted">
      Updated 14 Aug 2026 · 4:32 PM
    </Text>
  ),
  Code: <Code>const lab = 'design'</Code>,
  Kbd: (
    <HStack gap="1">
      <Kbd>Ctrl</Kbd>
      <Text textStyle="sm">+</Text>
      <Kbd>K</Kbd>
    </HStack>
  ),
  Link: (
    <Link href="#" onClick={(event) => event.preventDefault()}>
      View all components
    </Link>
  ),
}
