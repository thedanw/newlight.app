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
- **Heading style outside a heading tag** (grid headers, section titles, labels that read like headings): NEVER hand-roll font CSS. Always consume the shell vars exactly:
  ```ts
  fontFamily: 'var(--heading-font-family, inherit)',
  fontWeight: 'var(--heading-font-weight, 700)',
  ```
  So the BrandForm bold/uppercase/accent knobs re-theme them like real headings.

## Iconography

- **Lucide React** — consistent 24px stroke-based icons
- No Material Symbols (legacy)
- **Icon buttons**: use `IconButton` from `@/core/ui` with lucide icon children (e.g. `<TrashIcon />`, `<CopyIcon />`). Do not use emoji as button icons (e.g. `🗑`, `📋`) — always use the corresponding lucide icon.

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

**Every page has `Page.Root` + `Page.Header` + `Page.Body`.** `Page.Footer` is optional (only when a whole-page save/apply action is needed). The settings split shell (below) is the one wrapper-owned exception.

**Enforced scaffold shape (do not bypass):**
- `Page.Root` is supplied by `AppShell` — pages never render it.
- Every page/subpage renders `<Page.Main>` wrapping `<Page.Header>` (+ optional `Page.HeaderTop`/`Page.HeaderBottom`) and `<Page.Body>`. **Exception — settings split shell:** hosted settings sections/pages render **content only** — the shell in `src/core/settings/dashboard.tsx` owns `Page.Main`/`Header`/`Body` for them (see "Settings split shell" below).
- `Page.Footer` (when used) is a SIBLING of `Page.Main` (directly under `Page.Root`), NOT a child of `Page.Main`.
- Enforcement: `Page.Main` warns in the dev console on structural violations, and `pnpm lint:pages` (script `scripts/lint-pages.mjs`) is a hard gate wired into `pnpm build`. It checks BOTH partial compliance (any `Page.*` usage must include Main+Header+Body) AND total compliance (any file that looks like a routed page — `pages/` dir, `*Page.tsx`, or `dashboard.tsx` — must render the scaffold even if it renders zero `Page.*` slots). Add exceptions to `FILES_ALLOW_RAW` in that script only deliberately (e.g. `LoginPage`, `ErrorPage`). Hosted settings pages need no entry — the gate recognizes them structurally (any file under a `settings/` directory must be content-only).

**Hero variant & module number:** `Page.Header headerVariant="hero"` renders a background with the same saturation/brightness as `--colors-color-palette-solid-bg` but hue shifted by `16deg × module number`. The module number is stored in the module manifest (`number` field, e.g. `peopleManifest.number`). Pass it to the header via Panda's `css` prop: `<Page.Header headerVariant="hero" css={{ '--module-number': peopleManifest.number }}>`. The hue shift is applied to a `::before` background layer so the header's own children (h1, back button) are NOT hue-shifted.

### Settings split shell (hosted sub-pages)

`/settings` uses an iOS-style list + detail layout owned by the settings wrapper (`src/core/settings/dashboard.tsx`) — the one surface where a wrapper, not the page, owns the scaffold. The settings area is a single routed page that owns the scaffold for every `/settings/:section?/:page?` URL:

- **Shell owns the scaffold.** `dashboard.tsx` renders `<Page.Main>` + `<Page.Header>` + `<Page.Body>` once; hosted section/page components (registered via `registerSettingsSection`/`registerSettingsPage`) render **content only** — never their own `Page.*` slots (no nested `Page.Main`, no double headers).
- **Dashboard** (no `:section` param): the standard scaffold hosts the section card list — each card is a solid icon tile (`colorPalette.solid.bg`), title, truncated description, chevron. The icon comes from the section registration (`SettingsSection.icon`, i.e. the module's manifest icon; `SlidersHorizontal` fallback), shared with the shell headings.
- **Padding-free `Page.Body`, column-owned padding.** In the split layout `Page.Body` renders with `p: 0` and splits into two columns; each column applies its own padding (`{ base: '0', lg: '6' }`) — a deliberate exception to the `{ base: '3', md: '6' }` contract (the columns are hidden on mobile, so the `lg`-gated pair is intentional). L1 gutter alignment is restored inside the columns.
- **Two panes.** `lg+`: card list = fixed 280px nav column (`as="nav"`, `gray.subtle.bg`), detail = independent scroll region; `Page.Main` sets `overflowY: 'hidden'` while a selection is active. `<lg`: the card list fills the page; on selection it hides and the detail column takes the full width (iOS push pattern).
- **Selection-driven heading.** `Page.Heading level={hasSelection ? 1 : 0}` — level 0 (icon + title) on the dashboard, level 1 (back-chevron + breadcrumb title) on sub-pages. No extra BackButton in the shell.
- **Dashboard keeps plain scaffold.** The un-split dashboard uses `Page.Header` + `Page.Body` only — no `Page.HeaderTop`/`Page.HeaderBottom` (ui-ux 19).
- **Lint gate.** `lint-pages.mjs` recognizes hosted settings pages structurally — any file under a `settings/` directory must be content-only (zero `Page.*` slots), while `dashboard.tsx` itself stays guarded. New settings sections/pages need no allowlist entry.

### Responsive spacing (padding & gaps) — ENFORCED CONTRACT
Standard pair: `{ base: '3', md: '6' }` (12px mobile / 24px desktop). Defined in `src/core/theme/spacing-contract.ts` (`PAD`, `GAP`). All recipes must import and use these constants — never hand-write token pairs.

```ts
import { PAD, GAP } from '@/core/theme/spacing-contract';

// Page recipe (root/body/header)
padding: PAD,
gap: GAP,
```

Card-level padding uses `PAD` so cards breathe slightly more than body content. Mirror the contract in all display components (cards, sections, stacks) so padding/gaps collapse consistently from `6` (24px) on wide screens to `3` (12px) on small screens.

### Tables on small screens
Tables can exceed viewport width. Wrap tables in a scrollable container to prevent layout breakage:

```tsx
<Box overflowX="auto" minW="0">
  <Table>...</Table>
</Box>
```

Do not shrink table columns to fit — let the container scroll horizontally. Cells use `whiteSpace: nowrap` (from the table recipe) which preserves readability.

### Tabs on small screens
Tabs with many triggers can overflow the viewport. Use `TabScroller` from `@/core/ui` to wrap `Tabs.List` — it provides horizontal scroll with fixed chevron navigation buttons that fade based on scroll position:

```tsx
<TabScroller>
  <Tabs.List>
    <Tabs.Trigger .../>
    ...
  </Tabs.List>
</TabScroller>
```

Each trigger should have `flexShrink: 0` to prevent squishing. `TabScroller` handles scroll detection and chevron rendering — do not manually wrap `Tabs.List` in scroll containers when `TabScroller` is used.

#### Icon tabs
For tab bars with many items, use icon + short text labels. Landscape layout on md+ (icon left, text inline), portrait on small screens (icon above, text below, larger icon). Use `Box` with responsive `display` to swap icon sizes:

```tsx
<Tabs.Trigger value={id} css={{ flexShrink: 0, justifyContent: 'center', ... }}>
  <Stack alignItems="center" gap={{ base: '1', md: '2' }}>
    <Box display={{ base: 'block', md: 'none' }}>
      <Icon size={32} />
    </Box>
    <Box display={{ base: 'none', md: 'block' }}>
      <Icon size={16} />
    </Box>
    <Text textStyle={{ base: '2xs', md: 'sm' }}>{label}</Text>
  </Stack>
</Tabs.Trigger>
```

Use short labels (1-2 words). Pick a lucide icon that concisely describes each tab's content.

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

### Stacked Components — Avoid Double Spacing
When two components share the same background (or none) and no border, their individual padding creates visual double-spacing.

**Solution: `compact` variant + `CardStack`**
- `card` recipe has a `size="compact"` variant (`p: 0`, `gap: GAP`).
- `CardStack` compound component (`src/core/theme/components/card-stack.ts`) applies `gap` to the parent; children use `compact`.

```tsx
<CardStack gap={GAP}>
  <Card size="compact">Content</Card>
</CardStack>
```

**Rules:**
- Parent owns spacing (`gap` or `padding`).
- Children in stacks use `compact` (`p: 0`).
- Single isolated cards keep default `p: PAD`.
- Same applies to rows (`HStack`) — parent `gap`, children `compact`.
New slot in the `page` recipe (`actions`) for page-level actions — separate from the shell-owned `Page.Footer` (dirty-driven save/apply bar).

- **Slot**: `actions` added to `slots` array in `src/core/theme/recipes/page.ts`; component `Page.Actions` exported from `src/core/ui/page.tsx` (`withContext(ark.div, 'actions')`).
- **Position**: below `Page.Body` (inside `Page.Main` after `Body`, or as sibling under `Page.Root`). Never inside `Page.Header`.
- **Padding**: matches `Page.Body` — `padding: { base: '3', md: '6' }` (aligned left/right with body content).
- **Separation**: `pt: '6'` (or `gap` token) separates actions from body/header above.
- **Industry terminology**:
  - **Primary actions** = first-step / entry-point actions (e.g., "Create", "Add", "Search"). Aligned **left** in header/body.
  - **Secondary actions** = supporting actions (e.g., "Filter", "Export", "Edit"). Aligned **right**.
  - **Utility actions** = common cross-page actions (print, share, email). Icon-only; can move to header/right-aligned on `md+` screens.
- **Responsive**: on `md+`, secondary/utility buttons may shift to header right-alignment; primary fields (search) stay left-aligned.
- **Enforcement**: `lint-pages.mjs` allows `Actions` in allowed children; `Page.Main` validation includes `Actions`.
- **Separation from `Page.Footer`**: `Page.Footer` = shell-owned dirty-state save/apply (`useRegisterPageActions`). `Page.Actions` = static page-level actions (print/share/email/page-specific CTAs). Never mix the two.

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
- **Drag & drop is framer-motion only**: use the core `Reorder` compound (`Reorder.Root/Item/Handle`) for sortable lists, or `useMotionValue`/`animate` for shell drag (sidebar). `@use-gesture/react` is **banned** (no `useDrag` anywhere) — it is a gesture primitive, not a sortable-list primitive.
- **useReducedMotion** respected (accessibility)
- Spring physics: sidebar snap 400/35, SlidePanel 220/28
- No waterfall mounting, no breathing loops (legacy patterns removed)

## Do's and Don'ts

| Do | Don't |
|----|-------|
| Use recipes + variants for all UI | Use atomic `css()`/`cva` except for rare one-offs |
| Use framer-motion for drag/drop (`Reorder`, `useMotionValue`) | Import `@use-gesture/react` / `useDrag` |
| Use the heading var pair for heading-style text outside `<h*>` | Hand-roll `fontWeight`/`fontFamily` numbers for heading text |
| Import UI only from `@/core/ui` barrel | Import component files directly |
| Use semantic tokens (`fg.default`, `colorPalette.solid`); runtime palette steps (`colorPalette.3/4/a5`) are allowed for state tinting | Reference named palette values (`accent.9`, `gray.12`) or hard-coded hex |
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
