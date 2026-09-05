'use client'
import { PlusIcon, Settings2Icon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Stack } from 'styled-system/jsx'
import { Button, Checkbox, CloseButton, Dialog, Drawer, Heading, HoverCard, IconButton, Menu, Popover, Text, Tooltip } from '@/core/ui'

/* ---------------------------------------------------------------------------
   Overlays demos — Dialog, Drawer, HoverCard, Menu, Popover, Tooltip.
--------------------------------------------------------------------------- */

export const overlaysDemos: Record<string, ReactNode> = {
  Dialog: (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="outline">Open dialog</Button>
      </Dialog.Trigger>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Confirm</Dialog.Title>
            <Dialog.CloseTrigger asChild>
              <CloseButton />
            </Dialog.CloseTrigger>
          </Dialog.Header>
          <Dialog.Body>
            <Text textStyle="sm" color="fg.muted">
              This action cannot be undone.
            </Text>
          </Dialog.Body>
          <Dialog.Footer>
            <Button>Confirm</Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  ),
  Drawer: (
    <Drawer.Root>
      <Drawer.Trigger asChild>
        <Button variant="outline">Open drawer</Button>
      </Drawer.Trigger>
      <Drawer.Backdrop />
      <Drawer.Positioner>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Settings</Drawer.Title>
            <Drawer.CloseTrigger asChild>
              <CloseButton />
            </Drawer.CloseTrigger>
          </Drawer.Header>
          <Drawer.Body>
            <Text textStyle="sm" color="fg.muted">
              Quick-access settings panel.
            </Text>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  ),
  HoverCard: (
    <HoverCard.Root>
      <HoverCard.Trigger asChild>
        <Button variant="subtle" size="sm">
          @daniel
        </Button>
      </HoverCard.Trigger>
      <HoverCard.Positioner>
        <HoverCard.Content>
          <HoverCard.Arrow>
            <HoverCard.ArrowTip />
          </HoverCard.Arrow>
          <Stack gap="0.5">
            <Heading textStyle="sm">Daniel</Heading>
            <Text textStyle="xs" color="fg.muted">
              Design lead · New Light
            </Text>
          </Stack>
        </HoverCard.Content>
      </HoverCard.Positioner>
    </HoverCard.Root>
  ),
  Menu: (
    <Menu.Root>
      <Menu.Trigger asChild>
        <IconButton variant="outline" aria-label="Actions">
          <Settings2Icon />
        </IconButton>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.ItemGroup id="actions">
            <Menu.ItemGroupLabel>Actions</Menu.ItemGroupLabel>
            <Menu.Item value="edit">
              <Menu.ItemText>Edit</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="duplicate">
              <Menu.ItemText>Duplicate</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="delete">
              <Menu.ItemText>Delete</Menu.ItemText>
            </Menu.Item>
          </Menu.ItemGroup>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  ),
  Popover: (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button variant="outline" size="sm">
          Filters
        </Button>
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content>
          <Popover.Arrow>
            <Popover.ArrowTip />
          </Popover.Arrow>
          <Popover.Header>
            <Popover.Title>Filters</Popover.Title>
            <Popover.CloseTrigger asChild>
              <CloseButton />
            </Popover.CloseTrigger>
          </Popover.Header>
          <Popover.Body>
            <Checkbox.Root defaultChecked>
              <Checkbox.HiddenInput />
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Label>Active only</Checkbox.Label>
            </Checkbox.Root>
          </Popover.Body>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  ),
  Tooltip: (
    <Tooltip content="Add a note">
      <IconButton variant="outline" aria-label="Add note">
        <PlusIcon />
      </IconButton>
    </Tooltip>
  ),
}
