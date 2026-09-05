'use client'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Box, HStack } from 'styled-system/jsx'
import { Accordion, Breadcrumb, Carousel, Collapsible, Pagination, ScrollArea, Splitter, Tabs, Text } from '@/core/ui'

/* ---------------------------------------------------------------------------
   Navigation demos — Accordion, Breadcrumb, Carousel, Collapsible, Pagination,
   ScrollArea, Splitter, Tabs.
--------------------------------------------------------------------------- */

const ACCORDION_ITEMS = [
  { value: 'item-1', title: 'When was the event scheduled?', body: 'The event was scheduled two weeks ago and synced to every calendar.' },
  { value: 'item-2', title: 'Who can edit this group?', body: 'Leaders and admins can edit the group; members can view and join.' },
  { value: 'item-3', title: 'How do I leave a group?', body: 'Open the group menu and choose Leave — your data is kept for 30 days.' },
]

const SCROLL_TEXT = `Scrollable content\n\nThis panel demonstrates the ScrollArea inside a fixed-height box. Long content scrolls vertically while the thumb tracks your position.\n\nKeep scrolling — every row here is part of one continuous surface. ScrollArea is great for logs, member lists and long form summaries.\n\n(That's it — you've reached the end of the demo.)`

export const navigationDemos: Record<string, ReactNode> = {
  Accordion: (
    <Accordion.Root defaultValue={['item-1']}>
      {ACCORDION_ITEMS.map((item) => (
        <Accordion.Item key={item.value} value={item.value}>
          <Accordion.ItemTrigger>
            <Text textStyle="sm" fontWeight="medium">
              {item.title}
            </Text>
            <Accordion.ItemIndicator>⌄</Accordion.ItemIndicator>
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Accordion.ItemBody>
              <Text textStyle="sm" color="fg.muted">
                {item.body}
              </Text>
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  ),
  Breadcrumb: (
    <Breadcrumb.Root>
      <Breadcrumb.List>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="#" onClick={(event) => event.preventDefault()}>
            Home
          </Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Separator />
        <Breadcrumb.Item>
          <Breadcrumb.Link href="#" onClick={(event) => event.preventDefault()}>
            Components
          </Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Separator />
        <Breadcrumb.Item>
          <Breadcrumb.Link href="#" aria-current="page">
            Tabs
          </Breadcrumb.Link>
        </Breadcrumb.Item>
      </Breadcrumb.List>
    </Breadcrumb.Root>
  ),
  Carousel: (
    <Carousel.Root slideCount={3} slidesPerPage={1} loop>
      <Carousel.ItemGroup>
        {['Announcements', 'Events', 'People'].map((title, index) => (
          <Carousel.Item key={title} index={index}>
            <Box
              h="24"
              borderWidth="1px"
              borderColor="border"
              borderRadius="l2"
              display="grid"
              placeItems="center"
            >
              <Text textStyle="md" fontWeight="semibold">
                {title}
              </Text>
            </Box>
          </Carousel.Item>
        ))}
      </Carousel.ItemGroup>
      <Carousel.Control>
        <Carousel.PrevTrigger aria-label="Previous slide">
          <ChevronLeftIcon />
        </Carousel.PrevTrigger>
        <Carousel.IndicatorGroup />
        <Carousel.NextTrigger aria-label="Next slide">
          <ChevronRightIcon />
        </Carousel.NextTrigger>
      </Carousel.Control>
    </Carousel.Root>
  ),
  Collapsible: (
    <Collapsible.Root defaultOpen>
      <Collapsible.Trigger>
        <HStack gap="2">
          <Text textStyle="sm" fontWeight="medium">
            More details
          </Text>
          <Collapsible.Indicator>⌄</Collapsible.Indicator>
        </HStack>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <Text textStyle="sm" color="fg.muted">
          Additional context that expands in place when the trigger is pressed.
        </Text>
      </Collapsible.Content>
    </Collapsible.Root>
  ),
  Pagination: (
    <Pagination.Root count={24} pageSize={4} defaultPage={2}>
      <HStack gap="2">
        <Pagination.PrevTrigger>
          <ChevronLeftIcon />
        </Pagination.PrevTrigger>
        <Pagination.Items
          render={(page) => <Pagination.Item type="page" value={page.value} />}
        />
        <Pagination.NextTrigger>
          <ChevronRightIcon />
        </Pagination.NextTrigger>
      </HStack>
    </Pagination.Root>
  ),
  ScrollArea: (
    <ScrollArea.Root h="40" w="64" borderWidth="1px" borderColor="border" borderRadius="l2">
      <ScrollArea.Content>
        <Text textStyle="sm" whiteSpace="pre-line" p="3">
          {SCROLL_TEXT}
        </Text>
      </ScrollArea.Content>
      <ScrollArea.Scrollbar orientation="vertical">
        <ScrollArea.Thumb />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  ),
  Splitter: (
    <Splitter.Root
      defaultSize={[50, 50]}
      panels={[
        { id: 'a', minSize: 20 },
        { id: 'b', minSize: 20 },
      ]}
    >
      <Splitter.Panel id="a">
        <Box h="24" display="grid" placeItems="center" borderWidth="1px" borderColor="border" borderRadius="l2" m="1">
          <Text textStyle="sm">Panel A</Text>
        </Box>
      </Splitter.Panel>
      <Splitter.ResizeTrigger id="a:b" />
      <Splitter.Panel id="b">
        <Box h="24" display="grid" placeItems="center" borderWidth="1px" borderColor="border" borderRadius="l2" m="1">
          <Text textStyle="sm">Panel B</Text>
        </Box>
      </Splitter.Panel>
    </Splitter.Root>
  ),
  Tabs: (
    <Tabs.Root defaultValue="overview">
      <Tabs.List>
        <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
        <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
        <Tabs.Indicator />
      </Tabs.List>
      <Tabs.Content value="overview">
        <Text textStyle="sm" color="fg.muted">
          A summary of this group.
        </Text>
      </Tabs.Content>
      <Tabs.Content value="activity">
        <Text textStyle="sm" color="fg.muted">
          Recent activity feed.
        </Text>
      </Tabs.Content>
    </Tabs.Root>
  ),
}
