'use client'
import { createListCollection } from '@ark-ui/react/collection'
import {
  BoldIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  ItalicIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Settings2Icon,
  UnderlineIcon,
  XIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Box, HStack, Stack } from 'styled-system/jsx'
import {
  AbsoluteCenter,
  Accordion,
  Alert,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  ButtonGroup,
  Card,
  Carousel,
  Checkbox,
  Clipboard,
  CloseButton,
  Code,
  Collapsible,
  ColorPicker,
  Combobox,
  DatePicker,
  Dialog,
  DisplayValue,
  Drawer,
  Editable,
  Field,
  Fieldset,
  FileUpload,
  Group,
  Heading,
  HoverCard,
  Icon,
  IconButton,
  Image,
  Input,
  InputAddon,
  InputGroup,
  Kbd,
  Link,
  Loader,
  Menu,
  NumberInput,
  Pagination,
  PinInput,
  Popover,
  Progress,
  RadioCardGroup,
  RadioGroup,
  RatingGroup,
  ScrollArea,
  SegmentGroup,
  Select,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Slider,
  Span,
  Spinner,
  Splitter,
  Switch,
  Table,
  Tabs,
  TagsInput,
  Text,
  Textarea,
  toaster,
  ToggleGroup,
  Tooltip,
} from '@/core/ui'

/* ---------------------------------------------------------------------------
   DEMOS — one natural-context demo per catalogue component (Batch 7).
   Keyed by the exact `name` in toc.ts. Each is a small, real usage — the
   subpage template renders one Card per component with these inside.
   YAGNI: no over-engineered demos; expand iteratively.
--------------------------------------------------------------------------- */

const LOGO_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='14' fill='%23e5484d'/><text x='32' y='42' font-family='Arial' font-size='30' font-weight='bold' fill='white' text-anchor='middle'>NL</text></svg>`,
  )

const SIZE_OPTIONS = createListCollection({
  items: [
    { label: 'Small', value: 'sm' },
    { label: 'Medium', value: 'md' },
    { label: 'Large', value: 'lg' },
  ],
})

const FRAMEWORK_OPTIONS = createListCollection({
  items: [
    { label: 'React', value: 'react' },
    { label: 'Vue', value: 'vue' },
    { label: 'Svelte', value: 'svelte' },
    { label: 'Solid', value: 'solid' },
  ],
})

const ROLE_OPTIONS = [
  { label: 'Member', value: 'member' },
  { label: 'Leader', value: 'leader' },
  { label: 'Admin', value: 'admin' },
]

const ACCORDION_ITEMS = [
  { value: 'item-1', title: 'When was the event scheduled?', body: 'The event was scheduled two weeks ago and synced to every calendar.' },
  { value: 'item-2', title: 'Who can edit this group?', body: 'Leaders and admins can edit the group; members can view and join.' },
  { value: 'item-3', title: 'How do I leave a group?', body: 'Open the group menu and choose Leave — your data is kept for 30 days.' },
]

const TABLE_ROWS = [
  { name: 'Button', category: 'Buttons & Navigation' },
  { name: 'Slider', category: 'Forms' },
  { name: 'Tooltip', category: 'Overlays' },
  { name: 'Tabs', category: 'Layout' },
]

const SCROLL_TEXT = `Scrollable content\n\nThis panel demonstrates the ScrollArea inside a fixed-height box. Long content scrolls vertically while the thumb tracks your position.\n\nKeep scrolling — every row here is part of one continuous surface. ScrollArea is great for logs, member lists and long form summaries.\n\n(That's it — you've reached the end of the demo.)`

export const DEMOS: Record<string, ReactNode> = {
  /* --- Layout (3) ------------------------------------------------------- */
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

  /* --- Buttons (4) ------------------------------------------------------ */
  Button: <Button>Save changes</Button>,
  ButtonGroup: (
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
  ),
  IconButton: (
    <IconButton variant="outline" aria-label="Edit profile">
      <PencilIcon />
    </IconButton>
  ),
  CloseButton: <CloseButton aria-label="Close" />,
  Clipboard: (
    <Clipboard.Root value="newlight.app">
      <Clipboard.Control>
        <Clipboard.Input />
        <Clipboard.Trigger>
          <CopyIcon />
        </Clipboard.Trigger>
      </Clipboard.Control>
    </Clipboard.Root>
  ),

  /* --- Typography (5) --------------------------------------------------- */
  Code: <Code>const lab = 'design'</Code>,
  Heading: <Heading textStyle="lg">Section title</Heading>,
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
  Text: (
    <Text textStyle="sm" color="fg.muted">
      Body copy — the catalog is one natural context per component.
    </Text>
  ),

  /* --- Forms (24) ------------------------------------------------------- */
  Checkbox: (
    <Checkbox.Root defaultChecked>
      <Checkbox.HiddenInput />
      <Checkbox.Control>
        <Checkbox.Indicator />
      </Checkbox.Control>
      <Checkbox.Label>Accept terms</Checkbox.Label>
    </Checkbox.Root>
  ),
  ColorPicker: (
    <ColorPicker.Root>
      <ColorPicker.Label>Accent</ColorPicker.Label>
      <ColorPicker.Control>
        <ColorPicker.ValueSwatch />
        <ColorPicker.ValueText />
        <ColorPicker.Trigger />
      </ColorPicker.Control>
    </ColorPicker.Root>
  ),
  Combobox: (
    <Combobox.Root collection={FRAMEWORK_OPTIONS} defaultValue={['react']}>
      <Combobox.Label>Framework</Combobox.Label>
      <Combobox.Control>
        <Combobox.Input />
        <Combobox.Trigger />
        <Combobox.ClearTrigger>
          <XIcon />
        </Combobox.ClearTrigger>
      </Combobox.Control>
      <Combobox.Positioner>
        <Combobox.Content>
          <Combobox.ItemGroup id="frameworks">
            <Combobox.ItemGroupLabel>Frameworks</Combobox.ItemGroupLabel>
            {FRAMEWORK_OPTIONS.items.map((item) => (
              <Combobox.Item key={item.value} item={item}>
                <Combobox.ItemText>{item.label}</Combobox.ItemText>
                <Combobox.ItemIndicator>✓</Combobox.ItemIndicator>
              </Combobox.Item>
            ))}
          </Combobox.ItemGroup>
        </Combobox.Content>
      </Combobox.Positioner>
    </Combobox.Root>
  ),
  DatePicker: (
    <DatePicker.Root selectionMode="single" locale="en-US">
      <DatePicker.Label>Start date</DatePicker.Label>
      <DatePicker.Control>
        <DatePicker.Input />
        <DatePicker.Trigger>
          <CalendarIcon />
        </DatePicker.Trigger>
        <DatePicker.ClearTrigger>
          <XIcon />
        </DatePicker.ClearTrigger>
      </DatePicker.Control>
    </DatePicker.Root>
  ),
  DisplayValue: <DisplayValue value="New Light" />,
  Editable: (
    <Editable.Root defaultValue="New Light" activationMode="dblclick">
      <Editable.Label>Group name</Editable.Label>
      <Editable.Area>
        <Editable.Input />
        <Editable.Preview />
      </Editable.Area>
      <Editable.Control>
        <Editable.EditTrigger>
          <PencilIcon />
        </Editable.EditTrigger>
        <Editable.SubmitTrigger>Save</Editable.SubmitTrigger>
        <Editable.CancelTrigger>Cancel</Editable.CancelTrigger>
      </Editable.Control>
    </Editable.Root>
  ),
  Field: (
    <Field.Root>
      <Field.Label>Display name</Field.Label>
      <Input placeholder="Ada" />
      <Field.HelperText>Shown to other members.</Field.HelperText>
    </Field.Root>
  ),
  Fieldset: (
    <Fieldset.Root>
      <Fieldset.Legend>Account</Fieldset.Legend>
      <Fieldset.Content>
        <Field.Root>
          <Field.Label>Full name</Field.Label>
          <Input placeholder="Jane Doe" />
        </Field.Root>
      </Fieldset.Content>
      <Fieldset.HelperText>Used across the whole shell.</Fieldset.HelperText>
    </Fieldset.Root>
  ),
  FileUpload: (
    <FileUpload.Root accept="image/*" maxFiles={1}>
      <FileUpload.Dropzone>
        <Text textStyle="sm">Drop an image or click to browse</Text>
      </FileUpload.Dropzone>
      <FileUpload.HiddenInput />
    </FileUpload.Root>
  ),
  Input: <Input placeholder="Search components…" />,
  InputAddon: (
    <InputGroup>
      <InputAddon>@</InputAddon>
      <Input placeholder="username" />
    </InputGroup>
  ),
  InputGroup: (
    <InputGroup startElement={<SearchIcon />}>
      <Input placeholder="Search members" />
    </InputGroup>
  ),
  NumberInput: (
    <NumberInput.Root defaultValue="3" min={1} max={10}>
      <NumberInput.Label>Quantity</NumberInput.Label>
      <NumberInput.Control>
        <NumberInput.DecrementTrigger>−</NumberInput.DecrementTrigger>
        <NumberInput.Input />
        <NumberInput.IncrementTrigger>+</NumberInput.IncrementTrigger>
      </NumberInput.Control>
    </NumberInput.Root>
  ),
  PinInput: (
    <PinInput.Root placeholder="●" defaultValue={['1', '2', '3', '4']}>
      <PinInput.Label>Pin</PinInput.Label>
      <PinInput.Control>
        {[0, 1, 2, 3].map((index) => (
          <PinInput.Input key={index} index={index} />
        ))}
      </PinInput.Control>
      <PinInput.HiddenInput />
    </PinInput.Root>
  ),
  RadioCardGroup: (
    <RadioCardGroup.Root defaultValue="member">
      {ROLE_OPTIONS.map((option) => (
        <RadioCardGroup.Item key={option.value} value={option.value}>
          <RadioCardGroup.ItemControl>
            <RadioCardGroup.Indicator />
          </RadioCardGroup.ItemControl>
          <RadioCardGroup.ItemText>{option.label}</RadioCardGroup.ItemText>
          <RadioCardGroup.ItemHiddenInput />
        </RadioCardGroup.Item>
      ))}
    </RadioCardGroup.Root>
  ),
  RadioGroup: (
    <RadioGroup.Root defaultValue="member">
      <RadioGroup.Label>Role</RadioGroup.Label>
      {ROLE_OPTIONS.map((option) => (
        <RadioGroup.Item key={option.value} value={option.value}>
          <RadioGroup.ItemControl>
            <RadioGroup.Indicator />
          </RadioGroup.ItemControl>
          <RadioGroup.ItemText>{option.label}</RadioGroup.ItemText>
          <RadioGroup.ItemHiddenInput />
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  ),
  RatingGroup: (
    <RatingGroup.Root count={5} defaultValue={3} allowHalf>
      <RatingGroup.Label>Rating</RatingGroup.Label>
      <RatingGroup.Control>
        <RatingGroup.Items />
      </RatingGroup.Control>
      <RatingGroup.HiddenInput />
    </RatingGroup.Root>
  ),
  SegmentGroup: (
    <SegmentGroup.Root defaultValue="week">
      <SegmentGroup.Label>View</SegmentGroup.Label>
      <SegmentGroup.Indicator />
      {[
        { label: 'Day', value: 'day' },
        { label: 'Week', value: 'week' },
        { label: 'Month', value: 'month' },
      ].map((option) => (
        <SegmentGroup.Item key={option.value} value={option.value}>
          <SegmentGroup.ItemControl />
          <SegmentGroup.ItemText>{option.label}</SegmentGroup.ItemText>
          <SegmentGroup.ItemHiddenInput />
        </SegmentGroup.Item>
      ))}
    </SegmentGroup.Root>
  ),
  Select: (
    <Select.Root collection={SIZE_OPTIONS} defaultValue={['md']}>
      <Select.Label>Size</Select.Label>
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText placeholder="Select…" />
          <Select.Indicator />
        </Select.Trigger>
      </Select.Control>
      <Select.Positioner>
        <Select.Content>
          {SIZE_OPTIONS.items.map((item) => (
            <Select.Item key={item.value} item={item}>
              <Select.ItemText>{item.label}</Select.ItemText>
              <Select.ItemIndicator>✓</Select.ItemIndicator>
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Positioner>
    </Select.Root>
  ),
  Slider: (
    <Slider.Root min={0} max={100} step={1} defaultValue={[40]}>
      <Slider.Control>
        <Slider.Track>
          <Slider.Range />
        </Slider.Track>
        <Slider.Thumbs />
      </Slider.Control>
    </Slider.Root>
  ),
  Switch: (
    <Switch.Root defaultChecked>
      <Switch.HiddenInput />
      <Switch.Control>
        <Switch.Thumb />
      </Switch.Control>
      <Switch.Label>Notifications</Switch.Label>
    </Switch.Root>
  ),
  TagsInput: (
    <TagsInput.Root defaultValue={['react', 'panda']}>
      <TagsInput.Label>Stack</TagsInput.Label>
      <TagsInput.Control>
        <TagsInput.Items />
        <TagsInput.Input placeholder="Add tag…" />
        <TagsInput.ClearTrigger>Clear</TagsInput.ClearTrigger>
      </TagsInput.Control>
      <TagsInput.HiddenInput />
    </TagsInput.Root>
  ),
  Textarea: <Textarea placeholder="Write a note…" rows={3} />,
  ToggleGroup: (
    <ToggleGroup.Root defaultValue={['bold']}>
      <ToggleGroup.Item value="bold">
        <BoldIcon />
      </ToggleGroup.Item>
      <ToggleGroup.Item value="italic">
        <ItalicIcon />
      </ToggleGroup.Item>
      <ToggleGroup.Item value="underline">
        <UnderlineIcon />
      </ToggleGroup.Item>
    </ToggleGroup.Root>
  ),

  /* --- Feedback (6) ----------------------------------------------------- */
  Alert: (
    <Alert.Root>
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>Heads up</Alert.Title>
        <Alert.Description>This is an informational alert.</Alert.Description>
      </Alert.Content>
    </Alert.Root>
  ),
  Loader: <Loader text="Loading…" />,
  Progress: (
    <Progress.Root value={70} max={100}>
      <Progress.Label>Uploading</Progress.Label>
      <Progress.Track>
        <Progress.Range />
      </Progress.Track>
      <Progress.ValueText>70%</Progress.ValueText>
    </Progress.Root>
  ),
  Skeleton: (
    <Stack gap="3" w="full">
      <SkeletonText noOfLines={2} />
      <HStack gap="3">
        <SkeletonCircle boxSize="10" />
        <Skeleton h="4" flex="1" />
      </HStack>
    </Stack>
  ),
  Spinner: <Spinner size="md" />,
  Toast: (
    <Button
      onClick={() =>
        toaster.create({
          title: 'Changes saved',
          description: 'Your design has been applied to the shell.',
          type: 'success',
        })
      }
    >
      Show toast
    </Button>
  ),

  /* --- Overlays (6) ----------------------------------------------------- */
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

  /* --- Navigation (8) --------------------------------------------------- */
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

  /* --- Display (6) ------------------------------------------------------ */
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
