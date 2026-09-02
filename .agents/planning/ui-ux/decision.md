# Decision: UI Architecture & CSS (Design System)

## Aliases
- DS = design system: recipe catalog + tokens + base components under `src/core/ui/*`
- BEM = Block__Element--Modifier class naming (block, block__element, block--modifier)
- Recipe = Panda config recipe (`defineRecipe`/`defineSlotRecipe`) emitting named BEM classes
- Atomic = raw `css()`/`cva`/`sva` utility classes (non-semantic; rare escape hatch only)
- Barrel = locked public export surface `src/core/ui/index.ts` — the only UI import point for modules
- Token→semantic→pattern = token scale → semantic component tokens → recipe patterns (theme pipeline)
- sidebar = module grid (large icon + small label tiles, variable columns)
- content-width = `sizes.6xl` (1152px) max reading width (#page-panel default)
- Panel stack = iOS-Settings-style sliding panels: drill-down nav stack, push in from right / pop back
- SlidePanel = portal overlay modal (variants: normal/fullscreen/immersive) rendered via createPortal
- Pull-tab = sidebar-drag-handle (9-dot grid that morphs to 4-dot when open)
- Peek = 5px of the closed sidebar always visible on the left edge
- NavContext = app-level sidebar open state (React Context)
- Wide desktop = viewport ≥ `xl` (1280px, Park UI breakpoint token) — sidebar pinned
- toolPanel = vertically-expanding region directly under the panel-header that pushes page content down when open (e.g. search/filter fields)
- brand settings = super-admin brand surface: logo + 5 theme knobs (colorScheme/accent/gray/font/radius) + sidebar style + heading style; opened via header kebab → normal SlidePanel
- Card = grouping container for data, NOT a padding mechanism; L1 = page gutter (24px) for chrome + card outer edges; L2 = card inset (24px) for card content
- AppShell = single root shell in `src/core/ui/app-shell.tsx`: Sidebar (left) + PagePanel + ErrorBoundary + Suspense + Outlet; modules have NO layout component

## What & Why
Zero-runtime UI architecture for the CRM: every component/div carries a human-friendly BEM class (Goal 1), 99% consistent app-wide (Goal 2), via Panda config recipes compiled to a single cached `global.css`. Enforced by typed tokens + recipe-only CSS + lint so small-context agents can't escape the framework (Goal 3 → `module-design/decision.md`).

Primary nav = mobile-first left-side sidebar (module tiles) that pins at `xl` (1280px) and becomes a draggable overlay with a persistent pull-tab on narrow screens. Main nav experience = sliding panel stack (iOS-Settings drill-down): tapping a tile/row pushes the next panel in from the right; header back-chevron pops.

## Who
Solo developer; small-context LLM agents building bolt-on modules; future contributors.

## Constraints
- Panda config recipes (`defineRecipe`/`defineSlotRecipe`), `hash:false`
- Park UI (Ark UI headless + Panda recipes, CLI-vendored) under src/core/ui; no shadcn styled layer
- Single cached `global.css`; zero runtime CSS-in-JS; edge bundle gate
- Theme via CSS custom properties (light, church-brand, module-scoped)
- Inter variable font preloaded
- Promote module component to base DS on 2nd reuse
- Sidebar: `xl` breakpoint (1280px — wide pinned / narrow overlay), 5px peek left, persistent pull-tab top-left, app-level open state
- Framer Motion (`motion/react`) for drag/snap AND panel push/pop (AnimatePresence); respect `useReducedMotion`
- `Page` component (slot recipe `src/core/ui/page.tsx`): `Page.Root` (marginLeft 5px + page-gutter padding + gap) + `Page.Header` (scrolls with page; BackButton on sub pages / h1 on dashboard; optional `hero` variant tinted by module hue) + `Page.Body` (gap) + optional `Page.Footer` (`fixed` variant for whole-page save/apply). Every page has Root+Header+Body; Footer optional. Replaces old `PagePanel`/`PageHeader` pair.
- SlidePanel overlay modal (portal, variants normal/fullscreen/immersive) for dialogs/drill-down/immersive; page-level drill-down = #page-panel stack
- toolPanel region under panel-header (#page-panel header + SlidePanel header): vertically-expanding, pushes page content down (not overlay); used for in-flow tools (search/filter fields)
- Theme customizer = Park UI's exact theme drawer: accent + gray + font + radius (preset catalogs only); color scheme (light/dark) is the FIRST choice, super-admin locked platform-wide, NOT per-user
- brand settings surface = logo + 5 theme knobs + sidebar style dropdown + heading style checkboxes (pattern choices, no new tokens); logo = brand ASSET (image URL), not a token knob; radius control = native Slider + discrete Marks over the 7 preset sizes
- Brand settings opens as SlidePanel 'normal' (sizes.3xl) from the header kebab; super-admin gated in the final app, always visible in the lab
- Cards: grouping container, never padding; 2 alignment lines (L1 page gutter 24px / L2 card inset 24px); never card page chrome; no nested cards; one action location per card
- **Single shared `AppShell`**: one root layout in `src/core/ui` renders Sidebar + PagePanel + ErrorBoundary + Suspense + Outlet. `src/core/router.tsx` mounts it once and nests all authenticated routes beneath it. Modules export route children only — no per-module layout, no per-module ErrorBoundary. Public routes (e.g. `/forms/:formId`) live outside `AppShell`.

## Non-Goals
- No hamburger-icon toggle — pull-tab replaces it
- No auto-collapse to icon-only rail on medium screens — 5px peek + overlay instead
- No user-specific theme preference (scheme locked by super admin)
- No arbitrary/custom accent hex (Park UI preset catalog only — avoids palette-generation + WCAG contrast handling)
- No nested cards; no carded page chrome (title, alerts, toolbars, empty states); no carded + uncarded mix at same hierarchy level
- No per-module layout component; no per-module ErrorBoundary; no duplicate shell clones

## Assumptions
- Sidebar width measured at runtime (min 90px) — sidebar is `width: max-content`
- content-width = `sizes.6xl` (1152px); fixed-sidebar breakpoint = `xl` (1280px) — one step up the Park UI size/breakpoint ladder
- `--dynamic-sidebar-width` CSS var drives the main-panel offset via #page-panel margin-left
- Tile count stays small enough that the grid wraps into columns rather than scrolling

## Decision Log: decision → Rationale (hierarchical; parent = decision, sub = dependent)

1 Panda recipe foundation → BEM (Goal 1)
   1.1 Use config recipes (`defineRecipe`/`defineSlotRecipe`) → named BEM classes + typed variants
   1.2 Keep hash:false; never hash:true → readable BEM names in devtools + CSS
   1.3 Restrict atomic css()/cva to rare one-offs; lint-gate recipe-first → BEM everywhere
   1.4 Register DS recipes centrally (panda.config.ts theme.recipes/slotRecipes) → single catalog + lean CSS (Goal 2)
   1.5 Restrict CSS to `.recipe.ts`; no <style>/inline/class literals → nowhere to go rogue
   1.6 Gate invalid variants/tokens via typed recipes → compile-time guardrail (Goal 3)
2 Tokens & theme pipeline
   2.1 Theme via CSS custom properties (light, church-brand, module-scoped) → token→semantic→pattern
   2.2 Preload Inter variable font → fast + consistent typography
   2.3 Module-scoped override via `data-theme-scope` + CSS-var block (colors/radii only) → subtree theme inherits app defaults; not in lab (extends 2.1/10.3/10.5; resolves gap 1)
   2.4 --dynamic-sidebar-width = layout state, NOT theme token → module overrides (2.3) never touch layout vars (resolves gap 4)
3 Design-system source & ownership
   3.1 Vendor Park UI via @park-ui/cli into src/core/ui → free MIT DS, source owned + editable, BEM preserved
   3.2 Lock Barrel = named re-exports (vendored Park UI + DS recipes + layout primitives) → stable surface, no internals leak (resolves gap 2)
   3.3 New component = vendor via CLI if Park UI has it, else module-local recipe → promote on 2nd reuse (resolves gap 3)
   3.4 Promote module component to base DS on 2nd reuse → shared lib stays lean
4 Phase-0 design lab
   4.1 Run bare design lab (Vite+React+Panda+Park UI+styleguide only; no router/modules/aliases/CI/Supabase) → visual design in parallel; output ports wholesale into src/core/ui
5 Layout tokens & breakpoints
   5.1 Content width `sizes.6xl` (1152px, --content-width) → readable line length
   5.2 Breakpoint `xl` (1280px): fixed left on wide, slide-in overlay on narrow → desktop nav + mobile space (one size token derives next breakpoint)
   5.3 Sidebar offset at `xl` = margin-left on #page-panel ONLY; header inherits (6.2) → transform free for push (8.3), no double-offset (resolves gaps 6/9)
6 App shell: #page-panel + header
   6.1 #page-panel = header (52px --header-height) + page header (h1) + content; default max-width content-width; `full` = 100% → readable + full-bleed; offset via margin-left (5.3)
   6.2 header width:100%; header-main left 52px + back-chevron; offset inherited from #page-panel (no own margin) → back affordance + desktop offset
   6.3 header-utilities right; wraps to stacked row below header-main when can't fit → context tools reachable on narrow
   6.4 Kebab pinned top-right of content-width at 52px; login/account, help, settings → app menu always reachable
   6.5 toolPanel region under panel-header (expands, pushes content) on BOTH #page-panel + SlidePanel headers → in-flow tools, never overlay (default closed)
7 Primary nav: sidebar
   7.1 Module grid (grid-auto-flow:column, fill top→bottom then wrap) → variable module columns; sizes.8 icon + text.xs label (12px)
   7.2 5px peek when closed (CLOSED_X = -(width-5)) → persistent affordance, zero space cost
   7.3 Measure sidebar width dynamically (min 90px) + publish --dynamic-sidebar-width → sidebar is width:max-content; offsets by real width
   7.4 Persistent pull-tab top-left (9-dot→4-dot morph) → affordance without hamburger; pure CSS transform
   7.5 Pull-tab = single slot recipe; 9 dots = plain children (not 9 slots) → dots static, no independent theming (YAGNI; extends 7.4/7.11; resolves gap 5)
   7.6 Drag right open / left close; click toggles; click-outside closes (#bodyClick) → mouse + touch
   7.7 Snap: |velocity|>100 wins else nearest half → predictable states; spring 400/35
   7.8 Open state app-level (NavContext); route change closes → any component drives/toggles
   7.9 Wide-desktop ignores open state (always pinned) → no phantom overlay
   7.10 Respect useReducedMotion → accessibility
   7.11 Nav-tile + pull-tab as Park UI recipes → named BEM + DS-consistent
   7.12 Account avatar in sidebar footer (margin-top:auto) → out of main grid (resolves gap 7)
   7.13 Narrow: opening tile closes overlay then pushes stack; hide 5px peek while drilled-in (pull-tab stays) → overlay/peek never fight stack (extends 7.x/8.1; resolves gap 10)
8 Panel stack: iOS drill-down
   8.1 Sliding panel stack; root = sidebar; tap tile pushes sub-panel from right; back-chevron pops → mobile-first depth nav
   8.2 Push/pop via Framer Motion AnimatePresence (custom=direction: enter x 100%→0, exit x 0→-30% parallax; durations.slowest 400ms; useReducedMotion) → no web iOS-settings lib exists; no new dep
   8.3 Whole-page push: entire #page-panel (header included) slides left, next panel in from right → iOS push (extends 8.1)
   8.4 Browser back + back-chevron both pop (reverse); depth URL/history-driven → deep-linkable, back/forward sync; final = nested routes via core router, lab = component-level stack (4.1) (resolves gap 8)
9 SlidePanel overlay
   9.1 SlidePanel = portal modal (createPortal→body, AnimatePresence, spring 220/28, body scroll-lock, useReducedMotion) → reusable overlay shell distinct from page-level stack
   9.2 'normal': centered modal (sizes.3xl 768px, rise/fade/scale .95→1) desktop; bottom-sheet below sm; title + close top-right → dialogs/editors
   9.3 'fullscreen': full-screen slide-in; back-chevron top-left + title + headerActions (+ headerBottom 2nd row) → drill-down pages (reference workhorse)
   9.4 'immersive': full-screen slide-in; close-only top-right, no title bar; dark backdrop; drag-to-close → focus modes
10 Theme customizer & brand settings
   10.1 Customizer = EXACT Park UI theme drawer: accent+gray+font+radius, preset catalogs only → 1:1 Park UI; zero palette-generation/contrast risk (arbitrary hex rejected)
   10.2 Light/Dark FIRST choice, super-admin locked platform-wide (NOT per-user) → brand consistency; Park UI ships _light/_dark per step
   10.3 Runtime switch via <html> data-* (color-scheme/accent/gray/radius) + CSS-var block → mirrors Park UI ThemeTokens; zero rebuild, instant change
   10.4 Customizer = super-admin settings module (settings-schema ext); platform_settings; Realtime broadcast → all clients live
   10.5 Tiny editable surface: 5 knobs + 2 pattern fields; derive rest → no token proliferation
   10.6 Brand settings = whole-app surface (logo + 5 knobs + sidebar style + heading style); SG Page 1 prototypes → design once, port to settings module (extends 10.1–10.5; ties 10.4)
   10.7 Logo = brand ASSET (image URL), not a token: lab local file → object URL → brand slot; final = Storage URL in platform_settings → Realtime (extends 10.4)
   10.8 Discrete radius slider over 7 preset sizes = native Slider + Marks (BorderRadiusSlider) → slider UX + preset-catalog + l1/l2/l3 nesting; continuous = gap (extends 10.1/10.5)
   10.9 Live re-theme = 5 knobs ONLY; logo applies on SAVE → persisted asset, no mid-edit churn (extends 10.3/10.7)
   10.10 Expose brand settings from header kebab → reachable from ANY page (extends 6.4, 10.4)
   10.11 Present brand settings as SlidePanel 'normal' (sizes.3xl) → matches editor pattern; page context stays visible (extends 9.2)
   10.12 Gate brand settings to super-admins (final app, core auth); always visible in lab → consistent with 10.2; lab has no auth (4.1)
   10.13 Style Guide = button at BOTTOM of brand form (NOT sidebar tile) → available via brand form, never clutters sidebar nav (extends 10.10–10.12; resolves SG gap 5)
   10.14 Sidebar Style dropdown: dark/light/brand dark text/brand light text → sidebar recipe appearance variant reusing semantic tokens; live re-theme, no new tokens (extends 10.6/10.5)
   10.15 Heading Style checkboxes: bold/uppercase/accent (independent) → heading recipe variant toggles; live re-theme, no new tokens (extends 10.6/10.5)
11 Gesture library selection → native mobile touch support (use @use-gesture/react + react-pinch)
   11.1 Use @use-gesture/react for drag/swipe/rotate/pinch (lightweight, mobile-first)
   11.2 Use react-pinch for dedicated pinch gestures (zoom/resize)
   11.3 Keep Framer Motion for complex animations (separate concerns)
   11.4 Respect useReducedMotion (accessibility)
   11.5 Zero-runtime compatible (Panda CSS + Park UI)
   11.6 Bundle size ~5KB gzipped (efficient)
   11.7 Mobile-first touch support (iOS/Android UX)
   11.8 Coexists with existing Framer Motion (no conflict)
   11.9 Enables immersive mode drag-to-close (SlidePanel 9.4)
   11.10 Enables sidebar drag (7.6) with better mobile UX
12 Module contract
   12.1 Every module exports exactly: manifest.ts, public.ts, routes.tsx, index.tsx (dashboard), pages/*, settings.ts (optional) → predictable structure
   12.2 routes.tsx = route CHILDREN only (no element layout wrapper, no errorElement) → shared AppShell owns chrome
   12.3 index.tsx = module dashboard (mounted at index route, i.e. /<id>) → consistent entry point naming across modules
   12.4 NO per-module layout, NO per-module ErrorBoundary → AppShell provides both; SettingsLayout and PeopleLayout clones eliminated
   12.5 Public/unauthenticated pages (e.g. FormPublicPage) live OUTSIDE the shell as dedicated routes → correct
13 Single shared app shell
   13.1 AppShell (`src/core/ui/app-shell.tsx`) is the ONLY app chrome → renders Sidebar (left) + PagePanel + ErrorBoundary + Suspense + Outlet/children
   13.2 src/core/router.tsx mounts AppShell once; nests ALL authenticated routes beneath it: / (styleguide), /people, /settings → single shell, no clones
   13.3 Public routes (e.g. /forms/:formId) live OUTSIDE AppShell → unauthenticated surfaces stay bare
   13.4 ErrorBoundary promoted from module-local to src/core/ui/error-boundary.tsx → shared retry surface; Settings previously had NO boundary, now both settings and modules get one
   13.5 Styleguide previously owned its own Sidebar/PagePanel/shellCss; now shares AppShell → third shell eliminated
   13.6 AppShell reads useSettings() and wires onModuleNavigate/onSettingsNavigate itself → modules don't repeat this
14 Sidebar: left-side (was right-side)
   14.1 Sidebar fixed left:0; border-right; shadow mirrored; drag physics mirrored (drag-right-to-open, closedX negative) → left-pinned nav matches conventional reading order
   14.2 PagePanel margin-right → margin-left → content shifts right, not left, to make room for sidebar
   14.3 Pull-tab wrapper: top:left, justifyContent: flex-end → tab sits on the visible 5px peek when closed, on the sidebar's inner edge when open
   14.4 All right-side references in comments/strings replaced with left-side → documentation consistent with runtime
   14.5 SettingsLayout clone of PeopleLayout eliminated; both routes now children of AppShell → no duplicated shell, no asymmetric ErrorBoundary coverage
   14.6 Module routes.tsx no longer wraps children in a layout element → modules are "routes + pages" only
15 Data display: cards & vertical layout best practices
   15.1 Cards = grouping containers, NOT padding boxes → signal "these N things belong together"
   15.2 Default to full-width cards → single logical group stretches edge-to-edge in content column; partial width only when 2+ units are useful simultaneously
   15.3 Side-by-side cards for dashboard widgets (scan mode) and edit screens with a small secondary section (<4 fields, rarely used) → primary full-width + optional side card
   15.4 Two-column within a card only for paired short fields of predictable height (name, date range, city/state) → collapse to 1 column at sm (640px)
   15.5 Never multi-column for long text, mixed lengths, or variable-height controls (textarea, long selects) → avoid orphaned fields and label misalignment
   15.6 Never nest cards → divider / Fieldset / tighter gap instead
   15.7 One action location per card: Card.Footer OR page toolbar, never both → single primary action
   15.8 Read-only profile pages: stacked plain sections acceptable when no inline editing → if editing is added later, wrap editable region in a card
   15.9 Decision tree: single group → full-width; two+ groups scan-able together → side-by-side at md+; dashboard widgets → 2-3 column grid; tables/forms/editors → full-width within grid
16 Page component (page scaffold)
   16.1 Replace PagePanel/PageHeader pair with a single `Page` slot recipe (`src/core/ui/page.tsx`, recipe `src/core/theme/recipes/page.ts`) → one scaffold for every module page
   16.2 `Page.Root` = outer wrapper: marginLeft 5px (sidebar pull-tab), page-gutter padding, vertical gap between header/body/footer → based on old PagePanel
   16.3 `Page.Header` = page chrome; scrolls WITH the page (never fixed); BackButton on sub pages, h1 on dashboard pages → reuses page-header styling
   16.4 `Page.Body` = main content region; gap provides vertical rhythm between cards → consistent card spacing
   16.5 `Page.Footer` = OPTIONAL; `footerVariant="fixed"` pins to bottom of screen, always visible → whole-page save/apply forms
   16.6 Every page has `Page.Root` + `Page.Header` + `Page.Body`; `Page.Footer` optional → mandatory scaffold, optional action bar
   16.7 Hero variant: `Page.Header headerVariant="hero"` tints header with module accent hue → same saturation/brightness as `--colors-color-palette-solid-bg`, hue shifted by `16deg × module number`
   16.8 Module number stored in module manifest (`number` field) → drives hero hue shift; passed to header via Panda's `css` prop (`css={{ '--module-number': peopleManifest.number }}`) so `Page.Header` stays a plain `withContext` like `Card.Header`
   16.9 Hero hue shift applied to a `::before` background layer (not the header itself) → children (h1, back button) NOT hue-shifted
   16.10 Responsive spacing: page padding/gaps collapse from `6` (24px) to `3` (12px) on small screens via `{ base: '3', md: '6' }` → mobile breathing room; mirror in card-like display components
