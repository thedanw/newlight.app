'use client'
import { createListCollection } from '@ark-ui/react/collection'
import { BoldIcon, CalendarIcon, ItalicIcon, PencilIcon, SearchIcon, UnderlineIcon, XIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  Checkbox,
  ColorPicker,
  Combobox,
  DatePicker,
  DisplayValue,
  Editable,
  Field,
  Fieldset,
  FileUpload,
  Input,
  InputAddon,
  InputGroup,
  NumberInput,
  PinInput,
  RadioCardGroup,
  RadioGroup,
  RatingGroup,
  SegmentGroup,
  Select,
  Slider,
  Switch,
  TagsInput,
  Text,
  Textarea,
  ToggleGroup,
} from '@/core/ui'

/* ---------------------------------------------------------------------------
   Forms demos — 24 components across Text input, Selection and
   Advanced & composite groups.
--------------------------------------------------------------------------- */

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

export const formsDemos: Record<string, ReactNode> = {
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
}
