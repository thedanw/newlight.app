'use client'
import { Settings2Icon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Avatar, Badge, Button, Card, Heading, Icon, Image, Table, Text } from '@/core/ui'

/* ---------------------------------------------------------------------------
   Display demos — Avatar, Badge, Card, Icon, Image, Table.
--------------------------------------------------------------------------- */

const LOGO_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='14' fill='%23e5484d'/><text x='32' y='42' font-family='Arial' font-size='30' font-weight='bold' fill='white' text-anchor='middle'>NL</text></svg>`,
  )

const TABLE_ROWS = [
  { name: 'Button', category: 'Buttons & Navigation' },
  { name: 'Slider', category: 'Forms' },
  { name: 'Tooltip', category: 'Overlays' },
  { name: 'Tabs', category: 'Layout' },
]

export const displayDemos: Record<string, ReactNode> = {
  Avatar: (
    <Avatar.Root size="md">
      <Avatar.Fallback name="New Light" />
    </Avatar.Root>
  ),
  Badge: <Badge colorPalette="orange">In review</Badge>,
  Card: (
    <Card.Root variant="elevated" w="56">
      <Card.Header>
        <Heading textStyle="md">Card title</Heading>
      </Card.Header>
      <Card.Body>
        <Text textStyle="sm" color="fg.muted">
          Card body with supporting content.
        </Text>
      </Card.Body>
      <Card.Footer>
        <Button size="sm" variant="outline">
          Action
        </Button>
      </Card.Footer>
    </Card.Root>
  ),
  Icon: (
    <Icon size="lg">
      <Settings2Icon />
    </Icon>
  ),
  Image: <Image src={LOGO_SVG} alt="Sample logo" boxSize="16" borderRadius="l2" objectFit="cover" />,
  Table: (
    <Table.Root>
      <Table.Caption>Component index</Table.Caption>
      <Table.Head>
        <Table.Row>
          <Table.Header>Name</Table.Header>
          <Table.Header>Category</Table.Header>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {TABLE_ROWS.map((row) => (
          <Table.Row key={row.name}>
            <Table.Cell>{row.name}</Table.Cell>
            <Table.Cell>{row.category}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  ),
}
