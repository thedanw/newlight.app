# Findings: Sidebar & Navigation (runsheets reference) — verified 2026-08-08

> **Reference facts vs DS tokens:** all raw px/ms values below are what the legacy runsheets app does (kept as evidence). What we *build with* are Park UI tokens — see "Park UI compatibility adaptations" at the bottom (full table in `decision.md`).

## Reference source
- Sidebar shell: `C:\laragon\www\runsheets\src\components\Navigation\SidebarContainer.jsx`
- Sidebar content: `C:\laragon\www\runsheets\src\components\Navbars\Sidebar.jsx`
- Pull-tab: `C:\laragon\www\runsheets\src\components\Navigation\SidebarToggle.jsx`
- State: `C:\laragon\www\runsheets\src\contexts\NavigationContext.jsx`
- Layout: `C:\laragon\www\runsheets\src\layouts\User.jsx`
- Layout/styles: `.../scss/paper-dashboard/_sidebar-and-main-panel.scss`
- Responsive + toggle: `.../scss/paper-dashboard/_responsive.scss`

## Component map
| Component | Role |
|---|---|
| SidebarContainer | motion shell: drag, snap, breakpoint, dynamic width, outside-click |
| Sidebar | sidebar content (module grid, logo, account avatar) |
| SidebarToggle | pull-tab (9-dot grid + `.toggled` morph) |
| NavigationContext | single source of truth for `isSidebarOpen` |
| User layout | wires SidebarContainer + main-panel |

## Verified behaviour

### Breakpoint
- `isWideDesktop = window.innerWidth >= 1300` (reference; DS: Park UI `xl` = 1280px); resize listener **debounced 150ms**
- Wide: `drag=false`, pinned `x:0`. Narrow: draggable slide-in overlay.

### Slide + 5px peek
- `PEEK_WIDTH = 5`, `OPEN_X = 0`, `CLOSED_X = -(width - 5)` → **5px of the sidebar always visible** when closed
- Sidebar width **measured dynamically** (`useResizeObserver`, min 90px) — not hard-coded, because the sidebar is `width: max-content`
- Measured width published as **`--dynamic-sidebar-width` CSS var** (main-panel offsets by the actual width)

### Drag & snap (Framer Motion)
- `drag="x"`, constraints `[CLOSED_X, OPEN_X]`, `dragElastic 0.05`, `dragMomentum=false`
- Snap: `|velocity.x| > 100` → direction wins; else compare position to **midpoint**
- Spring: `stiffness 400, damping 35`

### Pull-tab (sidebar-drag-handle)
- `top: 8px; right: -48px` (sticks out over page edge), `z-index 1051` → Park UI: `spacing.2` / `spacing.12`, layer `zIndex.modal` 1400 (later DOM than sidebar)
- Opens via pointer-down drag OR click; `touch-action: pan-y` preserves vertical scroll while dragging
- 9-dot grid: `grid-template: repeat(3, 4px)`, glass background, rounded right edge, shadow

### 9-dot → 4-dot morph  → 9-dot (`.toggled`)
- Corner dots `dot1/3/7/9` stay, center `dot5` stays
- Mid-edge dots `dot2/4/6/8` **translate diagonally into the gaps** → reads as 4-corner diamond
- Pure CSS transform; no DOM swap

### Open/close affordances
- **Open:** click pull-tab, or drag pull-tab right
- **Close:** click pull-tab, drag left, or click anywhere outside — full-viewport `#bodyClick` overlay (`z-index 1040` → Park UI `zIndex.overlay` 1300, below sidebar `zIndex.modal` 1400), rendered only when `open && !wideDesktop`
- `useReducedMotion` respected (layout page transitions)

### Sidebar (module grid)
- `.nav`: `grid; grid-auto-flow: column; grid-template-rows: repeat(auto-fill, 90px); grid-auto-columns: 90px; gap: 10px` → **fills top-to-bottom then wraps to a new column** (variable columns); DS: 90px cell = custom, gap → `spacing.2.5` (10px)
- Tile: 70×70, `border-radius 16px` → `radii.2xl`, **32px icon (`sizes.8`) + 10px label (`text.2xs`)** stacked vertically
- Active = full opacity; hover = accent glow
- `.nav` max-height `calc(100vh - 150px)` → wraps into columns instead of scrolling
- Account avatar in sidebar footer (`margin-top: auto`)

### Panel / visual
- Glass panel (`backdrop-filter: blur`, fallback opacity), `data-active-color` theming, `border-left: 5px solid` (the visible peek edge)

## iOS-style sliding panel stack (research) — verified 2026-08-08
- **No maintained web library clones the iOS Settings menu** (npm + GitHub searched): `react-ios-settings-menu` / `ios-settings-menu` 404 on npm; GitHub "ios settings clone / iphone menu animation" hits are all native (SwiftUI, Flutter, React Native, Unity) or Ionic demos (e.g. `julescript/ios-wifi-settings-ionic`) — nothing web/React to adopt
- **Implement with Framer Motion (already in stack)** — verified pattern (motion.dev docs): `AnimatePresence` `custom` prop + dynamic variants give direction-aware push/pop (`hidden: (direction) => ({ x: direction === 1 ? -300 : 300 })`); `usePresenceData` reads direction in exiting children; `mode: sync | wait | popLayout`
- **iOS Settings push/pop mechanics:** entering panel slides in from right (x 100%→0); outgoing panel slides left with parallax (x 0→-30%); ~400ms ease-out; back = exact reverse
- **Ionic** (`@ionic/react`) has built-in iOS push/pop but is a heavyweight full framework (Web Components + runtime CSS) — conflicts with zero-runtime lean constraints (1.1–1.2)

## SlidePanel overlay modal (reference analysis) — verified 2026-08-08
- Component: `src/components/SlidePanel.jsx` — portal modal (`createPortal`→`document.body`), `motion/react` `AnimatePresence` + `motion.div`; spring `{damping: 28, stiffness: 220}`; `useReducedMotion` respected (disables slide, jumps to target)
- Props: `isOpen`, `onClose`, `title`, `children`, `width="750px"`, `className`, `variant='default'`, `bodyPadding=true`, `headerActions`, `headerBottom`, `showHeader=true`
- Body scroll-lock while open — EXCEPT `control` variant (background stays scrollable)
- 4 variants in code (`'default' | 'control' | 'immersive' | 'fullscreen'`); DS adopts 3 (`control` dropped — 0 usages):
  - `default` (normal): **centered modal** on desktop (fixed center, translate −50%,−50%, rise from +20px, fade, scale 0.95→1; width 750px) — does NOT slide from right; full-width **bottom-sheet** on mobile (<576px). Header: spacer + centered title + close (top-right)
  - `control`: same centered-modal motion, width 400px; backdrop `backdrop-clear` (transparent, `pointer-events:none`), outside-click closes via capture-phase listener, no scroll-lock. Header: spacer + title + close (top-right)
  - `immersive`: full-screen **slide-in from right** (x 100%→0), width 100vw, transparent panel over dark backdrop (0.85/0.95), floating close button (top-right), `drag="x"` drag-to-close (offset>100 & velocity>0)
  - `fullscreen`: full-screen **slide-in from right**, white bg; header = **back-chevron (top-left)** + title + `headerActions` (+ `headerBottom` 2nd row)
- CSS (`_slide-panel.scss`): `.slide-panel` z-index 1060 (header 1070) → Park UI `zIndex.popover` 1500, box-shadow −10px 0 20px; widths 750px (default) → `sizes.3xl` 768px / 400px (control); backdrops glass rgba(0,0,0,.4→.6), immersive .85→.95, control transparent; `@media ≤576px` → below Park UI `sm` (640px) all full-screen (width/height 100vw/100vh, top/left 0)
- Actual usage: `default` 1× (ConnectGroupAdmin files modal); `fullscreen` drill-down workhorse (ServiceDetail 307, ConnectGroups 446/498, TeamsAdmin 401); `immersive` 1× (Song video-embed); `control` 0 usages found
- ✅ DS trio = `normal`(default) / `fullscreen` / `immersive`: `fullscreen` slides in from right WITH back-chevron header (top-left, title + headerActions); `immersive` slides in from right with close-only (top-right), no title bar. Reference `control` dropped (0 usages).

## Cross-refs
- Decisions: [`decision.md`](decision.md) (DS architecture: 1–10; foundation, DS source, layout, nav 7.x, stack 8.x, SlidePanel 9.x, customizer 10.x)

## Park UI compatibility adaptations (what the DS builds with)
The raw values above are legacy reference facts. The design system maps them onto Park UI tokens (verified from `@park-ui/preset`, 2026-08-09). Highlights:
- **Breakpoints**: 1300px → `xl` (1280px); 576px → `sm` (640px)
- **Sizes**: 1200px → `sizes.6xl` (1152px); 750px → `sizes.3xl` (768px); 32px → `sizes.8`; 52px header → `--header-height` (custom)
- **Spacing**: 10px → `spacing.2.5`; 8px → `spacing.2`; 48px → `spacing.12`; 5px peek = custom (off-grid, deliberate)
- **Radii**: 16px → `radii.2xl`; containers use `radii.l1/l2/l3` via `[data-radius]`
- **Durations**: 400ms → `durations.slowest`; 300ms → `durations.slower`; 150ms → `durations.fast`; springs (400/35, 220/28) stay Framer physics
- **zIndex**: 1040 → `zIndex.overlay` (1300); 1050/1051 → `zIndex.modal` (1400); 1060/1070 → `zIndex.popover` (1500)
- **Focus ring**: Park UI `--global-color-focus-ring` (= colorPalette.solid.bg), do not redefine

## Park UI React component catalog (for styleguide panels) — verified 2026-08-09

Full shipped list from `components/react/src/components/ui/index.ts` — **62 distinct components**. Grouped by Park UI storybook category; allocation across the 4 SG panels is provisional (see `temp-styleguide-pages.md`).

### Layout (3)
AbsoluteCenter, Group, Span

### Buttons (4)
Button (+ButtonGroup), CloseButton, IconButton, Clipboard

### Typography (5)
Code, Heading, Kbd, Link, Text

### Forms (24)
Checkbox, ColorPicker, Combobox, DatePicker, DisplayValue, Editable, Field, Fieldset, FileUpload, Input, InputAddon, InputGroup, NumberInput, PinInput, RadioCardGroup, RadioGroup, RatingGroup, SegmentGroup, Select, Slider, Switch, TagsInput, Textarea, ToggleGroup

### Feedback (6)
Alert, Loader, Progress, Skeleton (+Circle/Text), Spinner, Toast (Toaster/toaster)

### Overlays (6)
Dialog, Drawer, HoverCard, Menu, Popover, Tooltip

### Navigation (8)
Accordion, Breadcrumb, Carousel, Collapsible, Pagination, ScrollArea, Splitter, Tabs

### Display (6)
Avatar, Badge, Card, Icon, Image, Table

> Count check: 3+4+5+24+6+6+8+6 = 62. ✅
> SG allocation: Dashboard = TOC hub + brand-form entry; 8 subpages (one per Park UI category) hold the full catalog — see layout table below.

## Park UI radius slider = native discrete Marks slider (verified 2026-08-09)

- Park UI's own website ships `BorderRadiusSlider` (`website/src/components/docs/border-radius-slider.tsx`):
  ```tsx
  <Slider.Root min={0} max={radii.length - 1} value={[radii.indexOf(radius)]} onValueChange={...}>
    <Slider.Label>Radius</Slider.Label>
    <Slider.Control>
      <Slider.Track><Slider.Range /></Slider.Track>
      <Slider.Thumbs />
      <Slider.Marks marks={radii.map((label, value) => ({ label, value }))} />
    </Slider.Control>
  </Slider.Root>
  ```
- `radii = ['none','xs','sm','md','lg','xl','2xl']` (from `website/src/lib/theme.ts`) — EXACTLY the 7 preset sizes in tokens.md.
- Conclusion: a 7-stop discrete radius slider is a **native Park UI Slider** (`Slider.Marks` with labels) — no custom control needed (decision.md 10.8).

## SG layout: component → natural location (proposed allocation, all 62)

> Compatible with app decisions; NOT limited to 3 subpages. Layout: **Dashboard (TOC hub)** + **8 category subpages** + **persistent app shell** (sidebar/header/kebab/toolPanel) + **brand settings = normal SlidePanel**. Breadcrumb on EVERY page. Every component appears ≥ once in a natural context.

### Persistent app shell (on every page)
| Component(s) | Where |
|---|---|
| Breadcrumb | every page header (Module / Sub / Item path) |
| Menu (kebab) | header-utilities kebab: Avatar + brand settings + login/account/help/settings |
| Avatar | kebab menu item (user row) |
| IconButton + Tooltip | header actions (search, print, share, kebab trigger) |
| Icon / Span | sidebar tiles + labels |
| Badge | tile notifications, status chips |
| toolPanel (Input, Field, Button, IconButton) | expandable under header (search/filter) |

### Dashboard (Page 1 / Home) — TOC hub + brand entry
| Component(s) | Where |
|---|---|
| Heading, Text, Code, Link, Kbd | page header, intro, keyboard-hint row |
| Table of Contents (Card grid + Link/Button) | category nav — each Card = category name + component count + open button |
| Button, ButtonGroup | TOC open-buttons, subpage launcher buttons |
| SlidePanel demo trio | variant demo buttons (normal/fullscreen/immersive) |
| Toast (Toaster) | triggered by Clipboard copy + save actions |
| Clipboard | "copy component name" on each TOC card |
| Alert | info/welcome banner |
| Loader, Skeleton, Spinner, Progress | loading demo strip |
| Accordion, Collapsible | grouped TOC / FAQ sections |
| Tabs | TOC view switch (All / Forms / Feedback / …) |
| Carousel | featured component carousel |
| Pagination | TOC paging if long |
| ScrollArea | long TOC scroll region |
| Splitter | layout demo (resize preview) |
| Dialog | confirm "reset theme" |
| Drawer | quick-access drawer demo |
| HoverCard | hover a TOC card for preview |
| Popover | popover demo anchored to a button |
| Tooltip | icon tooltips across dashboard |
| Image | brand preview / screenshots |
| Table | component index table (all 62) |
| AbsoluteCenter, Group, Span | layout demos |

### Subpages (8, one per Park UI category)
| Subpage | Components (all in category) |
|---|---|
| Layout (3) | AbsoluteCenter, Group, Span |
| Buttons (4) | Button (+ButtonGroup), CloseButton, IconButton, Clipboard |
| Typography (5) | Code, Heading, Kbd, Link, Text |
| Forms (24) | Checkbox, ColorPicker, Combobox, DatePicker, DisplayValue, Editable, Field, Fieldset, FileUpload, Input, InputAddon, InputGroup, NumberInput, PinInput, RadioCardGroup, RadioGroup, RatingGroup, SegmentGroup, Select, Slider (radius knob), Switch, TagsInput, Textarea, ToggleGroup |
| Feedback (6) | Alert, Loader, Progress, Skeleton, Spinner, Toast |
| Overlays (6) | Dialog, Drawer, HoverCard, Menu, Popover, Tooltip |
| Navigation (8) | Accordion, Breadcrumb, Carousel, Collapsible, Pagination, ScrollArea, Splitter, Tabs |
| Display (6) | Avatar, Badge, Card, Icon, Image, Table |

> Count check: 3+4+5+24+6+6+8+6 = 62 ✅. Allocation is a NATURAL-CONTEXT layout (not a bare gallery): overlays on real triggers (Dialog on confirm, Popover on button, Toast on copy, Tooltip on IconButtons, Menu = kebab), feedback in real states (Alert banner, loading strip), breadcrumb every page, TOC Cards + Table index on the Dashboard.

> Allocation table in findings.md; exact per-subpage layout is a gap (temp-styleguide-pages.md gap #1).
