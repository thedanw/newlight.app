# Design System: New Light App

Single source of truth for UI architecture. Enforced by Panda config recipes + Park UI + typed tokens + lint.

## Theme Pipeline

Token → semantic → pattern. 5 theme knobs + 2 pattern fields → Park UI derives the rest.

- **colorScheme**: light | dark
- **accent**: 26 presets (orange default)
- **gray**: 6 neutrals (sand default)
- **font**: family list (Inter default)
- **radius**: none, xs, sm, md, lg, xl, 2xl (md)
- **sidebar style**: dark / light / brand dark text / brand light text (light)
- **heading style**: checkboxes: bold | uppercase | accent (independent, off)

Runtime: `<html data-color-scheme="..." data-accent-color="..." data-gray-color="..." data-radius="..." data-sidebar-style="..." data-heading-style="...">`. CSS-var emission block maps each palette → semantic tokens. Zero rebuild, instant change. Logo = brand asset (save-on-apply only, NOT live re-theme).

## Typography

- **Inter variable font** — preloaded, single typeface
- Weight variants via recipes (no separate display font)
- Semantic text tokens: `fg.default`, `fg.muted`, `fg.subtle` — pick by information importance

## Iconography

- **Lucide React** — consistent 24px stroke-based icons
- No Material Symbols (legacy)

## Layout & Navigation

### App Shell
- `AppShell` in `src/core/ui` is the single app chrome: left `Sidebar` + `PagePanel` + `ErrorBoundary` + `Suspense`. `src/core/router.tsx` mounts it once; ALL authenticated routes nest beneath it.
- Public/unauthenticated routes live OUTSIDE `AppShell`.
- Header: header-main (left, back-chevron) + header-utilities (right, wraps when narrow)
- Kebab pinned top-right: login/account, help, settings

### Page Component (page scaffold)
Every module page is built from the `Page` slot recipe (`src/core/ui/page.tsx`, recipe `src/core/theme/recipes/page.ts`). It replaces the old `PagePanel`/`PageHeader` pair with one scaffold:

- **`Page.Root`** — outer wrapper. `marginLeft: 5px` (sidebar pull-tab), page-gutter `padding`, and vertical `gap` between header/body/footer. Based on the old `PagePanel`.
- **`Page.Header`** — page chrome. Scrolls **with** the page (never fixed). Contains the `BackButton` on sub pages, or the `h1` on dashboard pages. Optional `headerVariant="hero"` on dashboard pages tints the header with the module's accent hue.
- **`Page.Body`** — main content region. `gap` provides the vertical rhythm between cards.
- **`Page.Footer`** — **optional**. `footerVariant="fixed"` pins to the bottom of the screen and stays visible while scrolling — used for whole-page save/apply forms.

**Every page has `Page.Root` + `Page.Header` + `Page.Body`.** `Page.Footer` is optional (only when a whole-page save/apply action is needed).

**Hero variant & module number:** `Page.Header headerVariant="hero"` renders a background with the same saturation/brightness as `--colors-color-palette-solid-bg` but hue shifted by `16deg × module number`. The module number is stored in the module manifest (`number` field, e.g. `peopleManifest.number`). Pass it to the header via Panda's `css` prop: `<Page.Header headerVariant="hero" css={{ '--module-number': peopleManifest.number }}>`. The hue shift is applied to a `::before` background layer so the header's own children (h1, back button) are NOT hue-shifted.

### Responsive spacing (padding & gaps)
Panda responsive object syntax scales spacing on small screens. Use `{ base: '3', md: '6' }` — `base` is the small-screen value (12px), `md` (768px) and up uses the full value (24px):

```ts
// Page recipe (root/body/header)
padding: { base: '3', md: '6' },
gap: { base: '3', md: '6' },
```

Apply the same pattern to other display components (cards, sections) so padding/gaps collapse from `6` (24px) on wide screens to `3` (12px) on small screens. The `Page` recipe already does this for root/header/body; mirror it in card-like components that need to breathe on mobile.

### Sidebar (Primary Nav)
- Mobile-first **left-side** module grid (icons + labels)
- Pins at `xl` (1280px); draggable overlay on narrow screens
- 5px peek when closed; persistent pull-tab top-left (morph)
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

## Cards & Vertical Layout

Cards are **grouping containers**, not padding boxes. Their job is to signal "these N things belong together and are separate from the things above and below."

### Alignment Lines
- **L1** = page gutter (24px): titles, descriptions, alerts, toolbars, card outer edges
- **L2** = card inset (24px, `p:6`): all card-internal text

### Default: full-width cards
A single logical group (one form, one table, one settings section) stretches edge-to-edge within the content column. Shrink to partial width only when two conditions are both true:
1. There are 2+ related but distinct units the user needs to see or act on **simultaneously**.
2. The narrower card width still supports legibility at the app's base font size.

### When to use side-by-side cards (page-level columns)
Split the page into multiple cards when:
- **Dashboard widgets**: 2–4 short stat/action cards the user scans, not sequentially completes. Use a 2-column grid at `md`, 3-column at `xl`.
- **Edit screens with a small secondary section**: e.g. a primary full-width form plus a narrow "Admin" or "Notes" card with < 4 fields. The secondary card must be optional/rarely used — if the user always needs it, stack it below the primary.
- **Never** split a single form into side-by-side cards just to save vertical space. That forces the user to scan left-to-right across unrelated fields and breaks the single-column reading flow.

### When to use multi-column **within** a card
Use 2 columns **only** for paired short fields of predictable height:
- "First name / Last name", "City / State", "Start date / End date".
- Read-only dashlets that are inherently short (e.g. a stat pair).

**Mobile rule**: collapse to 1 column at `sm` (640px) unconditionally.

Do **not** use multi-column for:
- Long text inputs, textareas, or multi-line controls.
- A form with mixed short + long fields (long fields become orphaned).
- Fields whose labels vary in height (misalignment creates visual noise).

### Vertical rhythm
- Between cards on a page, use one consistent gap token. Don't add extra margin to "create breathing room" — if a card needs more space, it probably belongs at the top/bottom of the page or should be split.
- Card internal padding should be one token (e.g. `p="6"` = 24px). Don't vary it per card.
- **Every page has `Page.Root` + `Page.Header` + `Page.Body`.** `Page.Footer` is optional (whole-page save/apply only).
- **Responsive rhythm:** page padding/gaps collapse from `6` (24px) to `3` (12px) on small screens via `{ base: '3', md: '6' }`. Mirror this in card-like display components so they breathe on mobile.

### Card actions
- **One action location per card:** either `Card.Footer` (right, primary last) OR the page toolbar — never both.
- If a card has no actions, it needs no footer.

### Read-only pages
- Carding a read-only profile page can feel heavy. Stacked plain sections with headings are acceptable when the page is purely informational and has no inline editing.
- **If/when inline editing is added**, wrap the editable region in a card so the user's eye knows "this is where I act."

### Decision tree
```
Single logical group?
  → Full-width card.

Two or more groups?
  → Can the user productively scan both at once?
      → YES: side-by-side cards at md+, stacked on sm.
      → NO: stacked full-width cards.

Is it a form?
  → Single entity: 1 full-width card, 1 column.
  → Paired short fields (name, date range): 2 columns inside the card.
  → Long text / mixed lengths: force 1 column.

Is it a dashboard?
  → Short widgets: 2–3 column grid.
  → Tables, forms, editors: full-width cards within the grid.
```

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
| Card everything except title, description, toolbars | Card page chrome |
| Default to full-width cards; use partial width only for simultaneous-scan widgets | Shrink forms to partial width to save vertical space |

## Component Promotion

1. Need a component? Check Park UI catalog first → vendor via `@park-ui/cli add`
2. Not in Park UI? Build as module-local recipe
3. On 2nd reuse → promote to base DS (`src/core/ui`)
