'use client'
import { Badge, Card, Code, Heading, Kbd, Link, Table, Text } from '@/core/ui'
import { Box, Grid, HStack, Stack } from 'styled-system/jsx'
import { css } from 'styled-system/css'
import type { ReactNode } from 'react'

/* ---------------------------------------------------------------------------
   Typography Showcase — the typography category rendered as a high-end brand
   specimen rather than the generic SubpageTemplate card grid. An editorial
   walkthrough of the full type scale and every typography primitive (Heading,
   Text, Code, Kbd, Link) including their variants.

   Only Park UI native components are used — no bespoke widgets. Each section
   carries the `component-*` id of its TOC entry so the Dashboard links
   deep-link straight to the right specimen (Dashboard scrolls to
   `#component-${name}` after opening the category).
--------------------------------------------------------------------------- */

type ScaleItem = { token: string; sample: string; detail: string }
type LevelItem = { level: string; as: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'; textStyle: string; sample: string; meta: string }

const CODE_VARIANTS = ['subtle', 'solid', 'surface', 'outline', 'plain'] as const
const CODE_SIZES = ['sm', 'md', 'lg', 'xl'] as const
const KBD_VARIANTS = ['subtle', 'solid', 'surface', 'outline', 'plain'] as const
const KBD_SIZES = ['sm', 'md', 'lg', 'xl'] as const

/* Panda emits utility classes only for textStyle values it sees as JSX
   literals (or in `css()` calls with literal values). Because the scale rows
   below are data-driven (`textStyle={item.token}`), we build the classes here
   with literal tokens so the extractor statically generates every one of
   them — otherwise large display sizes would silently fall back to 16px. */
const TEXT_STYLE_CLASSES: Record<string, string> = {
  '7xl': css({ textStyle: '7xl' }),
  '6xl': css({ textStyle: '6xl' }),
  '5xl': css({ textStyle: '5xl' }),
  '4xl': css({ textStyle: '4xl' }),
  '3xl': css({ textStyle: '3xl' }),
  '2xl': css({ textStyle: '2xl' }),
  xl: css({ textStyle: 'xl' }),
  lg: css({ textStyle: 'lg' }),
  md: css({ textStyle: 'md' }),
  sm: css({ textStyle: 'sm' }),
  xs: css({ textStyle: 'xs' }),
  label: css({ textStyle: 'label' }),
}

const DISPLAY_SCALE: ScaleItem[] = [
  { token: '7xl', sample: 'New Light', detail: '72 / 92' },
  { token: '6xl', sample: 'New Light', detail: '60 / 72' },
  { token: '5xl', sample: 'New Light', detail: '48 / 60' },
  { token: '4xl', sample: 'New Light', detail: '36 / 44' },
]

const HEADING_LEVELS: LevelItem[] = [
  { level: 'H1', as: 'h1', textStyle: '3xl', sample: 'Section heading', meta: '30 / 38' },
  { level: 'H2', as: 'h2', textStyle: '2xl', sample: 'Section heading', meta: '24 / 32' },
  { level: 'H3', as: 'h3', textStyle: 'xl', sample: 'Sub-section heading', meta: '20 / 30' },
  { level: 'H4', as: 'h4', textStyle: 'lg', sample: 'Sub-section heading', meta: '18 / 28' },
  { level: 'H5', as: 'h5', textStyle: 'md', sample: 'Group heading', meta: '16 / 24' },
  { level: 'H6', as: 'h6', textStyle: 'sm', sample: 'Group heading', meta: '14 / 20' },
]

const SPECIMEN_ROWS = [
  { token: '7xl', size: '72 / 92', weight: 'Semibold', tracking: '–0.02em', use: 'Display hero' },
  { token: '6xl', size: '60 / 72', weight: 'Semibold', tracking: '–0.02em', use: 'Display' },
  { token: '5xl', size: '48 / 60', weight: 'Semibold', tracking: '–0.02em', use: 'Page hero' },
  { token: '4xl', size: '36 / 44', weight: 'Semibold', tracking: '–0.02em', use: 'Section intro' },
  { token: '3xl', size: '30 / 38', weight: 'Semibold', tracking: 'Normal', use: 'Heading 1' },
  { token: '2xl', size: '24 / 32', weight: 'Semibold', tracking: 'Normal', use: 'Heading 2' },
  { token: 'xl', size: '20 / 30', weight: 'Semibold', tracking: 'Normal', use: 'Heading 3' },
  { token: 'lg', size: '18 / 28', weight: 'Semibold', tracking: 'Normal', use: 'Heading 4 · lead' },
  { token: 'md', size: '16 / 24', weight: 'Regular', tracking: 'Normal', use: 'Body copy' },
  { token: 'sm', size: '14 / 20', weight: 'Regular', tracking: 'Normal', use: 'Secondary text' },
  { token: 'xs', size: '12 / 18', weight: 'Regular', tracking: 'Normal', use: 'Caption · meta' },
  { token: 'label', size: '14 / 20', weight: 'Medium', tracking: 'Normal', use: 'Field label' },
]

/* ------------------------------------------------------------------ helpers */

function Section({
  id,
  index,
  title,
  description,
  children,
}: {
  id?: string
  index: string
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <Stack id={id} gap={{ base: '5', md: '6' }}>
      <Stack gap="3">
        <HStack gap="3" alignItems="baseline">
          <Text textStyle="xs" fontWeight="semibold" color="fg.subtle">
            {index}
          </Text>
          <Heading textStyle="xl" letterSpacing="-0.01em">
            {title}
          </Heading>
        </HStack>
        {description && (
          <Text textStyle="sm" color="fg.muted" maxW="2xl">
            {description}
          </Text>
        )}
        <Box h="1px" bg="border" />
      </Stack>
      {children}
    </Stack>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap="0.5">
      <Text textStyle="xs" fontWeight="medium" color="fg.subtle">
        {label}
      </Text>
      <Text textStyle="sm" fontWeight="semibold">
        {value}
      </Text>
    </Stack>
  )
}

function VariantTile({ name, children }: { name: string; children: ReactNode }) {
  return (
    <Card.Root variant="subtle">
      <Card.Body>
        <Stack gap="2" alignItems="flex-start">
          <Text textStyle="xs" fontWeight="semibold" color="fg.subtle" textTransform="capitalize">
            {name}
          </Text>
          {children}
        </Stack>
      </Card.Body>
    </Card.Root>
  )
}

function PatternCard({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <Card.Root>
      <Card.Header gap="1" paddingBottom="3">
        <Heading textStyle="sm">{title}</Heading>
        <Text textStyle="xs" color="fg.muted">
          {note}
        </Text>
      </Card.Header>
      <Card.Body>
        <Box minH="12" display="flex" alignItems="center">
          {children}
        </Box>
      </Card.Body>
    </Card.Root>
  )
}

/* ------------------------------------------------------------------ page */

export function TypographyShowcase() {
  return (
    <Stack gap={{ base: '12', md: '16' }} maxW="6xl" pb="4">
      {/* Masthead */}
      <Stack gap={{ base: '5', md: '6' }} maxW="3xl">
        <HStack gap="2" flexWrap="wrap">
          <Badge size="sm" variant="subtle">
            Type specimen
          </Badge>
          <Badge size="sm" variant="outline">
            Park UI primitives
          </Badge>
        </HStack>
        <Heading
          textStyle={{ base: '4xl', md: '6xl' }}
          letterSpacing={{ base: '-0.02em', md: '-0.03em' }}
          textWrap="balance"
        >
          New Light, set in type.
        </Heading>
        <Text textStyle={{ base: 'md', md: 'lg' }} color="fg.muted">
          A living specimen — the scale, the weights and the text primitives that carry the
          brand voice across every surface.
        </Text>
        <HStack flexWrap="wrap" gap={{ base: '5', md: '8' }} pt="2">
          <Fact label="Family" value="Inter" />
          <Fact label="Scale" value="xs → 7xl" />
          <Fact label="Measure" value="65ch" />
          <Fact label="Tracking" value="–0.02em" />
          <Fact label="Primitives" value="8" />
        </HStack>
      </Stack>

      {/* 01 — Display scale */}
      <Section
        id="component-DisplayHeading"
        index="01"
        title="Display"
        description="Reserved for the loudest moments — home heroes, campaign covers and brand statements. Tight tracking keeps large sizes balanced."
      >
        <Box borderTopWidth="1px" borderBottomWidth="1px" borderColor="border">
          {DISPLAY_SCALE.map((item, i) => (
            <Grid
              key={item.token}
              gridTemplateColumns={{ base: '1fr', md: '1fr auto' }}
              alignItems="center"
              gap={{ base: '2', md: '8' }}
              py={{ base: '5', md: '7' }}
              borderTopWidth={i === 0 ? '0' : '1px'}
              borderColor="border"
            >
              <Heading className={TEXT_STYLE_CLASSES[item.token]} textWrap="balance">
                {item.sample}
              </Heading>
              <HStack gap="3" justifyContent={{ base: 'flex-start', md: 'flex-end' }}>
                <Code size="sm">{item.token}</Code>
                <Text textStyle="xs" color="fg.muted" whiteSpace="nowrap">
                  {item.detail}
                </Text>
              </HStack>
            </Grid>
          ))}
        </Box>
      </Section>

      {/* 02 — Heading levels */}
      <Section
        id="component-Heading"
        index="02"
        title="Headings"
        description="Six semantic levels, one family. Each maps to a textStyle step so the hierarchy reads consistently across modules."
      >
        <Stack>
          {HEADING_LEVELS.map((row, i) => (
            <HStack
              key={row.level}
              gap={{ base: '3', md: '4' }}
              alignItems="center"
              py={{ base: '3', md: '4' }}
              borderTopWidth={i === 0 ? '0' : '1px'}
              borderColor="border"
            >
              <Kbd size="sm" variant="outline" flexShrink="0">
                {row.level}
              </Kbd>
              <Heading as={row.as} className={TEXT_STYLE_CLASSES[row.textStyle]}>
                {row.sample}
              </Heading>
              <Box flex="1" />
              <Text textStyle="xs" color="fg.subtle" display={{ base: 'none', md: 'block' }} whiteSpace="nowrap">
                {row.meta}
              </Text>
            </HStack>
          ))}
        </Stack>
      </Section>

      {/* 03 — Subheadings & labels */}
      <Section
        id="component-Subheading"
        index="03"
        title="Subheadings & labels"
        description="Small typographic voices that set context before the headline: overlines, field labels and paired subheadings."
      >
        <Grid columns={{ base: 1, sm: 2 }} gap="5">
          <PatternCard title="Eyebrow overline" note="Text · xs, semibold, uppercase, 0.08em">
            <Text
              textStyle="xs"
              fontWeight="semibold"
              textTransform="uppercase"
              letterSpacing="0.08em"
              color="fg.muted"
            >
              Services — Fall series
            </Text>
          </PatternCard>
          <PatternCard title="Field label" note="Text · textStyle label (medium)">
            <Text textStyle="label">Your name</Text>
          </PatternCard>
          <PatternCard title="Subheading pair" note="Heading · md + Text · sm muted">
            <Stack gap="1">
              <Heading textStyle="md">Small groups</Heading>
              <Text textStyle="sm" color="fg.muted">
                Find a circle that fits your season.
              </Text>
            </Stack>
          </PatternCard>
          <PatternCard title="Section header" note="Heading · lg + Text · sm muted">
            <Stack gap="1">
              <Heading textStyle="lg">Weekly services</Heading>
              <Text textStyle="sm" color="fg.muted">
                Gather with us every Sunday at 9:30 and 11:00.
              </Text>
            </Stack>
          </PatternCard>
        </Grid>
      </Section>

      {/* 04 — Body copy */}
      <Section
        id="component-Text"
        index="04"
        title="Body copy"
        description="Reading text set to a comfortable measure. Lead opens the story, body carries it, small recedes into context."
      >
        <Stack gap="6">
          <Stack gap="2">
            <Text textStyle="xs" fontWeight="semibold" color="fg.subtle">
              Lead · textStyle lg
            </Text>
            <Text textStyle="lg" maxW="2xl" textWrap="pretty">
              New Light is a digital home for a growing community — a place to gather, serve and
              grow together.
            </Text>
          </Stack>
          <Stack gap="2">
            <Text textStyle="xs" fontWeight="semibold" color="fg.subtle">
              Body · textStyle md
            </Text>
            <Text textStyle="md" maxW="2xl" textWrap="pretty">
              Every surface begins with a clear hierarchy. Headings announce, body text explains
              and captions ground the detail — each set at a deliberate size so the voice stays
              consistent from phone to desktop.
            </Text>
          </Stack>
          <Stack gap="2">
            <Text textStyle="xs" fontWeight="semibold" color="fg.subtle">
              Small · textStyle sm
            </Text>
            <Text textStyle="sm" color="fg.muted" maxW="2xl">
              Secondary copy and helper text use the small size to recede behind the primary
              message while remaining comfortably legible.
            </Text>
          </Stack>
        </Stack>
      </Section>

      {/* 05 — Captions & meta */}
      <Section
        id="component-Caption"
        index="05"
        title="Captions & meta"
        description="Quiet, factual text — figure captions, timestamps and empty states — set small and muted so it never competes with content."
      >
        <Grid columns={{ base: 1, sm: 2, lg: 3 }} gap="5">
          <Card.Root>
            <Card.Body>
              <Stack gap="3">
                <Box h="24" bg="colorPalette.subtle.bg" borderRadius="l2" />
                <Text textStyle="xs" color="fg.muted">
                  Figure 01 — New Light&apos;s fall series cover.
                </Text>
              </Stack>
            </Card.Body>
          </Card.Root>
          <Card.Root>
            <Card.Body>
              <Stack gap="3">
                <HStack gap="2">
                  <Badge size="sm" colorPalette="green">
                    Live
                  </Badge>
                  <Text textStyle="sm" fontWeight="medium">
                    Sunday service
                  </Text>
                </HStack>
                <Text textStyle="xs" color="fg.muted">
                  Updated 14 Aug 2026 · 4:32 PM
                </Text>
              </Stack>
            </Card.Body>
          </Card.Root>
          <Card.Root>
            <Card.Body>
              <Stack gap="1">
                <Heading textStyle="sm">No services scheduled</Heading>
                <Text textStyle="xs" color="fg.muted">
                  Add a service to start building the calendar.
                </Text>
              </Stack>
            </Card.Body>
          </Card.Root>
        </Grid>
      </Section>

      {/* 06 — Inline code */}
      <Section
        id="component-Code"
        index="06"
        title="Inline code"
        description="Five Code variants make inline snippets feel at home in any context — subtle in prose, solid when it needs to pop."
      >
        <Stack gap="6">
          <Grid columns={{ base: 1, sm: 2, lg: 3 }} gap="3">
            {CODE_VARIANTS.map((variant) => (
              <VariantTile key={variant} name={variant}>
                <Code variant={variant}>const lab = 'design'</Code>
              </VariantTile>
            ))}
          </Grid>
          <Stack gap="2">
            <Text textStyle="xs" fontWeight="semibold" color="fg.subtle">
              Sizes · sm → xl
            </Text>
            <HStack gap="2" flexWrap="wrap" alignItems="center">
              {CODE_SIZES.map((size) => (
                <Code key={size} size={size}>
                  pnpm dev
                </Code>
              ))}
            </HStack>
          </Stack>
          <Text textStyle="md" maxW="2xl">
            Run <Code variant="subtle">pnpm dev</Code> to start the lab, then open{' '}
            <Code variant="surface">localhost:5173</Code> in your browser.
          </Text>
        </Stack>
      </Section>

      {/* 07 — Keyboard */}
      <Section
        id="component-Kbd"
        index="07"
        title="Keyboard"
        description="Keys and shortcuts stay visually quiet until a shortcut is worth discovering — five variants across four sizes."
      >
        <Stack gap="6">
          <Grid columns={{ base: 1, sm: 2, lg: 3 }} gap="3">
            {KBD_VARIANTS.map((variant) => (
              <VariantTile key={variant} name={variant}>
                <HStack gap="1">
                  <Kbd variant={variant}>Ctrl</Kbd>
                  <Text textStyle="sm" color="fg.muted">
                    +
                  </Text>
                  <Kbd variant={variant}>K</Kbd>
                </HStack>
              </VariantTile>
            ))}
          </Grid>
          <Stack gap="2">
            <Text textStyle="xs" fontWeight="semibold" color="fg.subtle">
              Sizes · sm → xl
            </Text>
            <HStack gap="2" flexWrap="wrap" alignItems="center">
              {KBD_SIZES.map((size) => (
                <Kbd key={size} size={size}>
                  {size === 'sm' ? '⌘K' : size === 'md' ? '⌘⇧P' : size === 'lg' ? '⌘⇧K' : 'Command'}
                </Kbd>
              ))}
            </HStack>
          </Stack>
          <Stack gap="2">
            <Text textStyle="xs" fontWeight="semibold" color="fg.subtle">
              Shortcut combos
            </Text>
            <HStack gap="6" flexWrap="wrap">
              <HStack gap="1">
                <Kbd>⌘</Kbd>
                <Text textStyle="sm" color="fg.muted">
                  +
                </Text>
                <Kbd>K</Kbd>
              </HStack>
              <HStack gap="1">
                <Kbd>⌘</Kbd>
                <Text textStyle="sm" color="fg.muted">
                  +
                </Text>
                <Kbd>⇧</Kbd>
                <Text textStyle="sm" color="fg.muted">
                  +
                </Text>
                <Kbd>P</Kbd>
              </HStack>
              <HStack gap="1">
                <Kbd>Alt</Kbd>
                <Text textStyle="sm" color="fg.muted">
                  +
                </Text>
                <Kbd>N</Kbd>
              </HStack>
            </HStack>
          </Stack>
        </Stack>
      </Section>

      {/* 08 — Links */}
      <Section
        id="component-Link"
        index="08"
        title="Links"
        description="Two Link variants cover navigation and inline prose. Underline is the default voice; plain stays quiet inside sentences."
      >
        <Stack gap="6">
          <Grid columns={{ base: 1, sm: 2 }} gap="3">
            <VariantTile name="underline">
              <Link variant="underline" href="#" onClick={(event) => event.preventDefault()}>
                Read the docs
              </Link>
            </VariantTile>
            <VariantTile name="plain">
              <Link variant="plain" href="#" onClick={(event) => event.preventDefault()}>
                Skip to content
              </Link>
            </VariantTile>
          </Grid>
          <Stack gap="2">
            <Text textStyle="xs" fontWeight="semibold" color="fg.subtle">
              Inline prose
            </Text>
            <Text textStyle="md" maxW="2xl">
              New Light is built for a growing community —{' '}
              <Link href="#" onClick={(event) => event.preventDefault()}>
                meet the team
              </Link>
              , explore the{' '}
              <Link href="#" onClick={(event) => event.preventDefault()}>
                services calendar
              </Link>{' '}
              and find your place with us.
            </Text>
          </Stack>
        </Stack>
      </Section>

      {/* Appendix — full type scale reference */}
      <Section
        index="A"
        title="Type scale reference"
        description="The complete textStyle map — every token, its metrics and where to use it."
      >
        <Box overflowX="auto" borderWidth="1px" borderColor="border" borderRadius="l2">
          <Table.Root>
            <Table.Head>
              <Table.Row>
                <Table.Header>Token</Table.Header>
                <Table.Header>Size / line-height</Table.Header>
                <Table.Header>Weight</Table.Header>
                <Table.Header>Tracking</Table.Header>
                <Table.Header>Usage</Table.Header>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {SPECIMEN_ROWS.map((row) => (
                <Table.Row key={row.token}>
                  <Table.Cell>
                    <Code size="sm">{row.token}</Code>
                  </Table.Cell>
                  <Table.Cell whiteSpace="nowrap">{row.size}</Table.Cell>
                  <Table.Cell>{row.weight}</Table.Cell>
                  <Table.Cell>{row.tracking}</Table.Cell>
                  <Table.Cell whiteSpace="normal">{row.use}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      </Section>
    </Stack>
  )
}
