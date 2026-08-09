import {
  BellRing,
  Compass,
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
   Type-safe data only; no UI. Batch 5 ships the VENDORED set (33 from
   `src/core/ui` barrel). Batch 7 appends the remaining 62-catalog entries
   (add to the matching `components` array, keep `shipped: false` until the
   component is vendored + demonstrated).
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
  | 'buttons'
  | 'typography'
  | 'forms'
  | 'feedback'
  | 'overlays'
  | 'navigation'
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
    description: 'Positioning, grouping and layout primitives.',
    components: [
      { name: 'AbsoluteCenter', description: 'Centers a child within its parent.', shipped: true },
      { name: 'Group', description: 'Groups related controls behind a shared border.', shipped: true },
      { name: 'Span', description: 'Inline text-span primitive.', shipped: true },
    ],
  },
  {
    id: 'buttons',
    name: 'Buttons',
    icon: MousePointerClick,
    description: 'Action triggers — solid, outline, subtle, surface, ghost.',
    components: [
      { name: 'Button', description: 'Primary action button (solid/outline/subtle/surface/ghost).', shipped: true },
      { name: 'ButtonGroup', description: 'Groups multiple buttons into one control.', shipped: true },
      { name: 'IconButton', description: 'Square icon-only button.', shipped: true },
      { name: 'CloseButton', description: 'Dismiss / close icon button.', shipped: true },
      { name: 'Clipboard', description: 'Copy-to-clipboard control with feedback.', shipped: true },
    ],
  },
  {
    id: 'typography',
    name: 'Typography',
    icon: Type,
    description: 'Text, headings and keyboard input affordances.',
    components: [
      { name: 'Heading', description: 'Section heading (textStyle xs–7xl).', shipped: true },
      { name: 'Text', description: 'Body text primitive.', shipped: true },
      { name: 'Kbd', description: 'Keyboard key / shortcut.', shipped: true },
    ],
  },
  {
    id: 'forms',
    name: 'Forms',
    icon: TextCursorInput,
    description: 'Inputs, selectors and data-entry controls.',
    components: [
      { name: 'Checkbox', description: 'Multi-select toggle.', shipped: true },
      { name: 'Field', description: 'Label + helper/error wrapper for inputs.', shipped: true },
      { name: 'FileUpload', description: 'Drag-and-drop file input.', shipped: true },
      { name: 'Select', description: 'Dropdown selector.', shipped: true },
      { name: 'Slider', description: 'Range input with discrete marks.', shipped: true },
    ],
  },
  {
    id: 'feedback',
    name: 'Feedback',
    icon: BellRing,
    description: 'Loading, progress and transient notifications.',
    components: [
      { name: 'Loader', description: 'Inline loading spinner with text.', shipped: true },
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
    id: 'navigation',
    name: 'Navigation',
    icon: Compass,
    description: 'Tabs, breadcrumbs and paging/carousel navigation.',
    components: [
      { name: 'Accordion', description: 'Collapsible sections.', shipped: true },
      { name: 'Breadcrumb', description: 'Navigation trail.', shipped: true },
      { name: 'Carousel', description: 'Slideable strip.', shipped: true },
      { name: 'Tabs', description: 'Tabbed views.', shipped: true },
    ],
  },
  {
    id: 'display',
    name: 'Display',
    icon: Monitor,
    description: 'Avatars, badges, cards and content containers.',
    components: [
      { name: 'Avatar', description: 'User avatar / initials.', shipped: true },
      { name: 'Badge', description: 'Status / label chip.', shipped: true },
      { name: 'Card', description: 'Content container (Root/Header/Body/Footer).', shipped: true },
      { name: 'Icon', description: 'Icon wrapper for SVG icons.', shipped: true },
    ],
  },
]

export const totalComponents = tocCategories.reduce((total, category) => total + category.components.length, 0)

export const shippedComponents = tocCategories.reduce(
  (total, category) => total + category.components.filter((component) => component.shipped).length,
  0,
)
