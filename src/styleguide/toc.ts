import {
  BellRing,
  Layers,
  LayoutGrid,
  Monitor,
  MousePointerClick,
  TextCursorInput,
  Type,
  type LucideIcon,
} from 'lucide-react'

/* ---------------------------------------------------------------------------
   TOC — category → components index for the Styleguide Dashboard.
   Type-safe data only; no UI. Batch 7 ships the FULL catalog (63 components,
   all vendored + demonstrated in `src/styleguide/pages/demos.tsx`).
   Counts by category: Layout 3 · Buttons 5 · Typography 5 · Forms 24 ·
   Feedback 6 · Overlays 6 · Navigation 8 · Display 6.
   `group` (Forms/Navigation) drives Accordion sections in SubpageTemplate.
--------------------------------------------------------------------------- */

export type TocComponent = {
  /** Display name — matches the barrel export (e.g. `Button`, `Card.Root`). */
  name: string
  /** One-line natural-context description shown in the TOC. */
  description: string
  /** Optional sub-group within the category (Batch 7 accordion sections). */
  group?: string
  /** True once the component is vendored and demonstrated. */
  shipped: boolean
}

export type TocCategoryId =
  | 'layout'
  | 'buttons-navigation'
  | 'typography'
  | 'forms'
  | 'feedback'
  | 'overlays'
  | 'display'

export type TocCategory = {
  id: TocCategoryId
  name: string
  icon: LucideIcon
  description: string
  components: TocComponent[]
}

export const tocCategories: TocCategory[] = [
  {
    id: 'layout',
    name: 'Layout',
    icon: LayoutGrid,
    description: 'Layout primitives, containers and structural components.',
    components: [
      { name: 'AbsoluteCenter', description: 'Centers a child within its parent.', shipped: true },
      { name: 'Group', description: 'Groups related controls behind a shared border.', shipped: true },
      { name: 'Span', description: 'Inline text-span primitive.', shipped: true },
      { name: 'Card', description: 'Content container (Root/Header/Body/Footer).', shipped: true },
      { name: 'Table', description: 'Tabular data (Head/Body/Row/Cell).', shipped: true },
      { name: 'Image', description: 'Responsive image element.', shipped: true },
      { name: 'Tabs', description: 'Tabbed views.', shipped: true },
      { name: 'Accordion', description: 'Collapsible sections.', shipped: true },
      { name: 'Collapsible', description: 'Inline expand/collapse region.', shipped: true },
      { name: 'ScrollArea', description: 'Custom scrollable region.', shipped: true },
      { name: 'Splitter', description: 'Resizable multi-panel split.', shipped: true },
      { name: 'Carousel', description: 'Slideable strip.', shipped: true },
    ],
  },
  {
    id: 'buttons-navigation',
    name: 'Buttons & Navigation',
    icon: MousePointerClick,
    description: 'Action triggers and navigation controls.',
    components: [
      { name: 'Button', description: 'Primary action button (solid/outline/subtle/surface/ghost).', shipped: true },
      { name: 'ButtonGroup', description: 'Groups multiple buttons into one control.', shipped: true },
      { name: 'IconButton', description: 'Square icon-only button.', shipped: true },
      { name: 'CloseButton', description: 'Dismiss / close icon button.', shipped: true },
      { name: 'Clipboard', description: 'Copy-to-clipboard control with feedback.', shipped: true },
      { name: 'Pagination', description: 'Paged navigation controls.', shipped: true },
      { name: 'Breadcrumb', description: 'Navigation trail.', shipped: true },
    ],
  },
  {
    id: 'typography',
    name: 'Typography',
    icon: Type,
    description: 'Text, headings and keyboard input affordances.',
    components: [
      { name: 'Code', description: 'Inline code snippet.', shipped: true },
      { name: 'Heading', description: 'Section heading (textStyle xs–7xl).', shipped: true },
      { name: 'Kbd', description: 'Keyboard key / shortcut.', shipped: true },
      { name: 'Link', description: 'Anchor / inline link.', shipped: true },
      { name: 'Text', description: 'Body text primitive.', shipped: true },
    ],
  },
  {
    id: 'forms',
    name: 'Forms',
    icon: TextCursorInput,
    description: 'Inputs, selectors and data-entry controls.',
    components: [
      { name: 'Field', description: 'Label + helper/error wrapper for inputs.', group: 'Text input', shipped: true },
      { name: 'Fieldset', description: 'Groups fields into a bordered section.', group: 'Text input', shipped: true },
      { name: 'Input', description: 'Single-line text input.', group: 'Text input', shipped: true },
      { name: 'InputAddon', description: 'Static prefix/suffix adornment.', group: 'Text input', shipped: true },
      { name: 'InputGroup', description: 'Input with leading/trailing elements.', group: 'Text input', shipped: true },
      { name: 'Textarea', description: 'Multi-line text input.', group: 'Text input', shipped: true },
      { name: 'Checkbox', description: 'Multi-select toggle.', group: 'Selection', shipped: true },
      { name: 'RadioGroup', description: 'Single-select radio list.', group: 'Selection', shipped: true },
      { name: 'RadioCardGroup', description: 'Radio options as selectable cards.', group: 'Selection', shipped: true },
      { name: 'SegmentGroup', description: 'Segmented single-select control.', group: 'Selection', shipped: true },
      { name: 'Slider', description: 'Range input with discrete marks.', group: 'Selection', shipped: true },
      { name: 'Switch', description: 'On/off toggle.', group: 'Selection', shipped: true },
      { name: 'ToggleGroup', description: 'Multi-select icon toggle bar.', group: 'Selection', shipped: true },
      { name: 'ColorPicker', description: 'Color swatch + format selection.', group: 'Advanced & composite', shipped: true },
      { name: 'Combobox', description: 'Searchable dropdown with free input.', group: 'Advanced & composite', shipped: true },
      { name: 'DatePicker', description: 'Date input with calendar popup.', group: 'Advanced & composite', shipped: true },
      { name: 'DisplayValue', description: 'Displays a field value inline.', group: 'Advanced & composite', shipped: true },
      { name: 'Editable', description: 'Click/double-click inline edit.', group: 'Advanced & composite', shipped: true },
      { name: 'FileUpload', description: 'Drag-and-drop file input.', group: 'Advanced & composite', shipped: true },
      { name: 'NumberInput', description: 'Stepper numeric input.', group: 'Advanced & composite', shipped: true },
      { name: 'PinInput', description: 'Code/OTP digit input.', group: 'Advanced & composite', shipped: true },
      { name: 'RatingGroup', description: 'Star rating input.', group: 'Advanced & composite', shipped: true },
      { name: 'Select', description: 'Dropdown selector.', group: 'Advanced & composite', shipped: true },
      { name: 'TagsInput', description: 'Chip/tag multi-input.', group: 'Advanced & composite', shipped: true },
    ],
  },
  {
    id: 'feedback',
    name: 'Feedback',
    icon: BellRing,
    description: 'Loading, progress and transient notifications.',
    components: [
      { name: 'Alert', description: 'Banner with icon + title + body.', shipped: true },
      { name: 'Loader', description: 'Inline loading spinner with text.', shipped: true },
      { name: 'Progress', description: 'Determinate progress bar.', shipped: true },
      { name: 'Skeleton', description: 'Placeholder shimmer (Skeleton/SkeletonText/SkeletonCircle).', shipped: true },
      { name: 'Spinner', description: 'Circular progress indicator.', shipped: true },
      { name: 'Toast', description: 'Transient notification (Toaster + toaster).', shipped: true },
    ],
  },
  {
    id: 'overlays',
    name: 'Overlays',
    icon: Layers,
    description: 'Modals, drawers, popovers and floating layers.',
    components: [
      { name: 'Dialog', description: 'Modal dialog.', shipped: true },
      { name: 'Drawer', description: 'Side drawer.', shipped: true },
      { name: 'HoverCard', description: 'Hover-triggered floating card.', shipped: true },
      { name: 'Menu', description: 'Context menu / kebab.', shipped: true },
      { name: 'Popover', description: 'Click-triggered popover.', shipped: true },
      { name: 'Tooltip', description: 'Hover tooltip.', shipped: true },
    ],
  },
  {
    id: 'display',
    name: 'Display',
    icon: Monitor,
    description: 'Avatars, badges and content markers.',
    components: [
      { name: 'Avatar', description: 'User avatar / initials.', shipped: true },
      { name: 'Badge', description: 'Status / label chip.', shipped: true },
      { name: 'Icon', description: 'Icon wrapper for SVG icons.', shipped: true },
    ],
  },
]

export const totalComponents = tocCategories.reduce((total, category) => total + category.components.length, 0)

export const shippedComponents = tocCategories.reduce(
  (total, category) => total + category.components.filter((component) => component.shipped).length,
  0,
)
