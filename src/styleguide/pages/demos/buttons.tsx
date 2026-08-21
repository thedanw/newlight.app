'use client'
import { CheckIcon, CopyIcon, PencilIcon, PlusIcon, SaveIcon, TrashIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Stack, Wrap } from 'styled-system/jsx'
import { Button, ButtonGroup, Clipboard, CloseButton, IconButton, Text } from '@/core/ui'

/* ---------------------------------------------------------------------------
   Buttons & Navigation demos — Button, ButtonGroup, IconButton, CloseButton,
   Clipboard.
   Each entry is one TYPE (matches a TOC component + a single dashboard link).
   Variants are grouped into labelled rows inside each card so the gallery is
   scannable without spawning extra dashboard links.
--------------------------------------------------------------------------- */

/** Muted uppercase label for a row of examples. */
function RowLabel({ children }: { children: ReactNode }) {
  return (
    <Text
      textStyle="xs"
      color="fg.muted"
      fontWeight="semibold"
      textTransform="uppercase"
      letterSpacing="0.08em"
    >
      {children}
    </Text>
  )
}

/** One labelled row: label above, examples wrapped and spaced. */
function DemoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack gap="2">
      <RowLabel>{label}</RowLabel>
      <Wrap gap="3" alignItems="center">
        {children}
      </Wrap>
    </Stack>
  )
}

export const buttonsDemos: Record<string, ReactNode> = {
  Button: (
    <Stack gap="5">
      <DemoRow label="Variants">
        <Button>Solid</Button>
        <Button variant="surface">Surface</Button>
        <Button variant="subtle">Subtle</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="plain">Plain</Button>
      </DemoRow>

      <DemoRow label="Sizes">
        <Button size="xs">Extra small</Button>
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
        <Button size="xl">Extra large</Button>
        <Button size="2xl">Huge</Button>
      </DemoRow>

      <DemoRow label="With icons">
        <Button>
          <PlusIcon />
          Add to cart
        </Button>
        <Button variant="outline">
          Save changes
          <SaveIcon />
        </Button>
        <Button variant="subtle">
          <TrashIcon />
          Delete
        </Button>
      </DemoRow>

      <DemoRow label="Loading">
        <Button loading>Save changes</Button>
        <Button loading loadingText="Saving…" />
        <Button loading spinnerPlacement="end">
          Send
        </Button>
        <Button variant="outline" loading>
          Fetching
        </Button>
      </DemoRow>

      <DemoRow label="States & palettes">
        <Button disabled>Disabled</Button>
        <Button variant="outline" disabled>
          Disabled
        </Button>
        <Button colorPalette="red">Delete</Button>
        <Button colorPalette="green" variant="subtle">
          <CheckIcon />
          Approved
        </Button>
        <Button variant="plain" colorPalette="red">
          Cancel
        </Button>
      </DemoRow>
    </Stack>
  ),

  ButtonGroup: (
    <Stack gap="5">
      <DemoRow label="Attached">
        <ButtonGroup attached>
          <Button size="sm" variant="outline">
            Day
          </Button>
          <Button size="sm" variant="outline">
            Week
          </Button>
          <Button size="sm" variant="outline">
            Month
          </Button>
        </ButtonGroup>
      </DemoRow>

      <DemoRow label="Separated">
        <ButtonGroup>
          <Button size="sm" variant="outline">
            Cancel
          </Button>
          <Button size="sm">Confirm</Button>
        </ButtonGroup>
      </DemoRow>

      <DemoRow label="With icons">
        <ButtonGroup attached>
          <Button size="sm" variant="outline">
            <PencilIcon />
            Edit
          </Button>
          <Button size="sm" variant="outline">
            <CopyIcon />
            Duplicate
          </Button>
          <Button size="sm" variant="outline">
            <TrashIcon />
            Delete
          </Button>
        </ButtonGroup>
      </DemoRow>

      <DemoRow label="Sizes">
        <ButtonGroup attached>
          <Button variant="outline">Day</Button>
          <Button variant="outline">Week</Button>
          <Button variant="outline">Month</Button>
        </ButtonGroup>
        <ButtonGroup attached>
          <Button size="lg" variant="outline">
            Day
          </Button>
          <Button size="lg" variant="outline">
            Week
          </Button>
          <Button size="lg" variant="outline">
            Month
          </Button>
        </ButtonGroup>
      </DemoRow>
    </Stack>
  ),

  IconButton: (
    <Stack gap="5">
      <DemoRow label="Variants">
        <IconButton aria-label="Edit profile">
          <PencilIcon />
        </IconButton>
        <IconButton variant="surface" aria-label="Edit profile">
          <PencilIcon />
        </IconButton>
        <IconButton variant="subtle" aria-label="Edit profile">
          <PencilIcon />
        </IconButton>
        <IconButton variant="outline" aria-label="Edit profile">
          <PencilIcon />
        </IconButton>
        <IconButton variant="plain" aria-label="Edit profile">
          <PencilIcon />
        </IconButton>
      </DemoRow>

      <DemoRow label="Sizes">
        <IconButton size="xs" aria-label="Edit profile">
          <PencilIcon />
        </IconButton>
        <IconButton size="sm" aria-label="Edit profile">
          <PencilIcon />
        </IconButton>
        <IconButton size="md" aria-label="Edit profile">
          <PencilIcon />
        </IconButton>
        <IconButton size="lg" aria-label="Edit profile">
          <PencilIcon />
        </IconButton>
        <IconButton size="xl" aria-label="Edit profile">
          <PencilIcon />
        </IconButton>
      </DemoRow>

      <DemoRow label="Palettes">
        <IconButton aria-label="Delete">
          <TrashIcon />
        </IconButton>
        <IconButton colorPalette="red" aria-label="Delete">
          <TrashIcon />
        </IconButton>
        <IconButton colorPalette="green" variant="subtle" aria-label="Add">
          <PlusIcon />
        </IconButton>
        <IconButton colorPalette="gray" variant="outline" aria-label="Add">
          <PlusIcon />
        </IconButton>
      </DemoRow>
    </Stack>
  ),

  CloseButton: (
    <Stack gap="5">
      <DemoRow label="Sizes">
        <CloseButton aria-label="Close" />
        <CloseButton size="sm" aria-label="Close" />
        <CloseButton size="lg" aria-label="Close" />
      </DemoRow>

      <DemoRow label="Variants">
        <CloseButton aria-label="Close" />
        <CloseButton variant="subtle" aria-label="Close" />
        <CloseButton variant="outline" aria-label="Close" />
        <CloseButton colorPalette="red" aria-label="Close" />
      </DemoRow>
    </Stack>
  ),

  Clipboard: (
    <Stack gap="5">
      <DemoRow label="With input">
        <Clipboard.Root value="newlight.app">
          <Clipboard.Control>
            <Clipboard.Input />
            <Clipboard.Trigger>
              <CopyIcon />
            </Clipboard.Trigger>
          </Clipboard.Control>
        </Clipboard.Root>
      </DemoRow>

      <DemoRow label="Icon only">
        <Clipboard.Root value="newlight.app">
          <Clipboard.Trigger>
            <CopyIcon />
          </Clipboard.Trigger>
        </Clipboard.Root>
      </DemoRow>
    </Stack>
  ),
}
