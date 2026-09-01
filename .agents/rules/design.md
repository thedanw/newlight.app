# Design System: New Light App

**Single Source of Truth** for UI architecture. Enforced by Panda config recipes + Park UI + typed tokens + lint.

## Architecture

- **Zero-runtime CSS**: Panda config recipes (`defineRecipe`/`defineSlotRecipe`) compile to a single cached `global.css`. No CSS-in-JS, no inline styles, no `<style>` tags.
- **BEM class naming**: `hash:false` emits human-readable classes (`.button`, `.button--size-lg`). Every div carries a semantic class.
- **Park UI**: Vendored via `@park-ui/cli` into `src/core/ui`. Ark UI headless + Panda recipes. Source owned + editable.
- **Barrel**: `src/core/ui/index.ts` is the ONLY UI import point for modules. No direct component file imports.
- **Lint-gated**: Atomic `css()`/`cva`/`sva` restricted to rare one-offs. Recipe-first enforced.

## Theme Pipeline

Token→semantic→pattern. 5 theme knobs + 2 pattern fields → Park UI derives the rest.

### Theme Knobs (super-admin locked, platform-wide)
| Knob | Catalog | Default |
|------|---------|---------|
| colorScheme | light \| dark | light |
| accent | 26 presets (orange default) | orange |
| gray | 6 neutrals (sand default) | sand |
| font | family list (Inter default) | Inter |
| radius | none, xs, sm, md, lg, xl, 2xl | md |
| sidebar style | dark / light / brand dark text / brand light text | light |
| heading style | checkboxes: bold \| uppercase \| accent (independent) | off |

### Runtime Mechanism
```html
<html data-color-scheme="light" data-accent-color="orange" data-gray-color="sand" data-radius="md" data-sidebar-style="light" data-heading-style="bold accent">
```
CSS-var emission block maps each palette → semantic tokens. Zero rebuild, instant change. Logo = brand asset (save-on-apply only, NOT live re-theme).

### Brand Asset (Logo)
- Image URL (lab: local object URL → brand slot; final: Supabase Storage URL in `platform_settings` → Realtime)
- Applies on SAVE only — persisted asset, not a runtime knob

## Typography

- **Inter variable font** — preloaded, single typeface
- Weight variants via recipes (no separate display font)
- Semantic text tokens: `fg.default`, `fg.muted`, `fg.subtle` — pick by information importance

## Iconography

- **Lucide React** — consistent 24px stroke-based icons
- No Material Symbols (legacy)

## Layout & Navigation

### App Shell
- `#page-panel` = header (52px `--header-height`) + page header (h1) + content
- Default `max-width: content-width` (`sizes.6xl` 1152px); `full` = 100%
- Header: header-main (left, back-chevron) + header-utilities (right, wraps when narrow)
- Kebab pinned top-right: login/account, help, settings

### Sidebar (Primary Nav)
- Mobile-first right-side module grid (icons + labels)
- Pins at `xl` (1280px); draggable overlay on narrow screens
- 5px peek when closed; persistent pull-tab (9-dot→4-dot morph)
- Dynamic width measured at runtime; `--dynamic-sidebar-width` CSS var drives offsets
- Account avatar in sidebar footer

### Panel Stack (iOS Drill-Down)
- Tap tile → push sub-panel from right; back-chevron pops
- Framer Motion AnimatePresence (direction-aware: enter x 100%→0, exit x 0→-30% parallax)
- `durations.slowest` (400ms); respects `useReducedMotion`
- Browser back + back-chevron both pop; depth URL/history-driven

### SlidePanel (Overlay Modal)
Portal modal (`createPortal`→`body`), 3 variants:
- `normal`: centered modal (sizes.3xl 768px) desktop; bottom-sheet mobile — dialogs/editors
- `fullscreen`: full-screen slide-in; back-chevron + title + headerActions — drill-down pages
- `immersive`: full-screen slide-in; close-only, dark backdrop, drag-to-close — focus modes

### toolPanel
- Vertically-expanding region under panel-header (pushes content down, not overlay)
- Used for in-flow tools (search/filter fields); default closed

## Breakpoints (Park UI tokens)
| Name | Width |
|------|-------|
| sm | 640px |
| md | 768px |
| lg | 1024px |
| xl | 1280px (sidebar pinned) |
| 2xl | 1536px |

## Data Display (Cards)

Dashboard app: **everything except page/panel title, description, and toolbars is carded.** Cards = grouping container, NOT padding. 2 alignment lines.

### Alignment Lines
- **L1** = page gutter (24px): titles, descriptions, alerts, toolbars, card outer edges
- **L2** = card inset (24px, `p:6`): all card-internal text

### Chrome vs Content
| Never card (page chrome) | Card (content) |
|---|---|
| Page/panel title | Settings sections (1 logical group = 1 card) |
| Page description (1–2 lines, muted) | Single continuous form (1 form = 1 card) |
| Alerts / notices | Full-page table / data grid (1 table = 1 card) |
| Page-level toolbars / action rows | Forms (grouped by section) |
|  | Dashboard widgets (grid) |
|  | Empty states |
|  | Table + its controls |

### Rules
1. One page gutter for chrome + card outer edges
2. One card inset for card content
3. No canvas-level text directly above a card → fold into `Card.Description`
4. Cards span full content width (except grids)
5. One action location per card: `Card.Footer` (right, primary last) OR page toolbar — never both
6. No nested cards → use divider / sub-section instead
7. Card everything except title, description, toolbars → uniform dashboard rhythm

### When Cards Are Wrong
- Modal / drawer content → container already exists
- Already-surfaced content (code blocks, previews)
- Page chrome (title, description, alerts, toolbars) → stays on canvas

## Motion & Interaction

- **Framer Motion** (`motion/react`) for drag/snap + panel push/pop
- **useReducedMotion** respected (accessibility)
- Spring physics: sidebar snap 400/35, SlidePanel 220/28
- No waterfall mounting, no breathing loops (legacy patterns removed)

## Do's and Don'ts

| Do | Don't |
|----|-------|
| Use recipes + variants for all UI | Use atomic `css()`/`cva` except for rare one-offs |
| Import UI only from `@/core/ui` barrel | Import component files directly |
| Use semantic tokens (`fg.default`, `colorPalette.solid`) | Reference raw palette values (`accent.9`, `gray.12`) |
| Use Park UI components via CLI | Hand-edit vendored Park UI source |
| Maintain WCAG AA contrast (4.5:1 normal text) | Mix carded + uncarded content at same hierarchy level |
| Use the accent color for the single most important action per screen | Create nested cards |
| Respect `useReducedMotion` | Animate without checking reduced-motion preference |

## Component Promotion

1. Need a component? Check Park UI catalog first → vendor via `@park-ui/cli add`
2. Not in Park UI? Build as module-local recipe
3. On 2nd reuse → promote to base DS (`src/core/ui`)
