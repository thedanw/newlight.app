# Decision: UI Architecture & CSS (Design System)

## Aliases
- DS = design system: recipe catalog + tokens + base components under `src/core/ui/*`
- BEM = Block__Element--Modifier class naming
- Recipe = Panda config recipe (`defineRecipe`/`defineSlotRecipe`) emitting named BEM classes
- Atomic = raw `css()`/`cva`/`sva` utility classes (rare escape hatch only)

## What & Why
Zero-runtime UI architecture: every component carries a human-friendly BEM class (Goal 1), 99% consistent app-wide (Goal 2), via Panda recipes compiled to a single cached `global.css`; enforced by typed tokens + recipe-only CSS + lint so small-context agents can't escape the framework (Goal 3 → `module-design/decision.md`).

## Who
Solo developer; small-context LLM agents building bolt-on modules; future contributors.

## Constraints
- Panda config recipes (`defineRecipe`/`defineSlotRecipe`), `hash:false`
- Park UI (Ark UI headless + Panda recipes, CLI-vendored) under src/core/ui; no shadcn styled layer

## Non-Goals
- No hamburger-icon toggle — pull-tab replaces it
- No auto-collapse to icon-only rail on medium screens — 5px peek + overlay instead
- No user-specific theme preference (scheme locked by super admin)

## Assumptions
- Sidebar width measured at runtime (min 90px) — sidebar is `width: max-content`

## Decision Log: decision → Rationale (hierarchical; parent = decision, sub = dependent)

1 Panda recipe foundation → BEM (Goal 1)
   1.1 Use config recipes (`defineRecipe`/`defineSlotRecipe`) → named BEM classes + typed variants
   1.2 Keep hash:false → readable BEM names in devtools + CSS
   1.3 Restrict atomic css()/cva to rare one-offs; lint-gate recipe-first → BEM everywhere
   1.4 Register DS recipes centrally (panda.config.ts theme.recipes/slotRecipes) → single catalog + lean CSS (Goal 2)
   1.5 Restrict CSS to `.recipe.ts`; no <style>/inline/class literals → nowhere to go rogue
   1.6 Gate invalid variants/tokens via typed recipes → compile-time guardrail (Goal 3)
2 Tokens & theme pipeline
   2.1 Theme via CSS custom properties (light, church-brand, module-scoped) → token→semantic→pattern
   2.2 Preload Inter variable font → fast + consistent typography
   2.3 Module-scoped override via `data-theme-scope` + CSS-var block (colors/radii only) → subtree inherits app defaults; not in lab (ext 2.1/10.3/10.5; gap 1)
   2.4 --dynamic-sidebar-width = layout state, NOT theme token → module overrides (2.3) never touch layout vars (gap 4)
3 Design-system source & ownership
   3.1 Vendor Park UI via @park-ui/cli into src/core/ui → free MIT DS, owned + editable, BEM preserved
   3.2 Lock Barrel = named re-exports (vendored Park UI + DS recipes + layout primitives) → stable surface, no internals leak (gap 2)
   3.3 New component = vendor via CLI if Park UI has it, else module-local recipe → promote on 2nd reuse (gap 3)
   3.4 Promote module component to base DS on 2nd reuse → shared lib stays lean
4 Phase-0 design lab
   4.1 Run bare design lab (Vite+React+Panda+Park UI+styleguide only; no router/modules/aliases/CI/Supabase) → visual design in parallel; output ports into src/core/ui
5 Layout tokens & breakpoints
   5.1 Content width `sizes.6xl` (1152px, --content-width) → readable line length
   5.2 Breakpoint `xl` (1280px): fixed left on wide, slide-in overlay on narrow → desktop nav + mobile space (one size token derives next breakpoint)
   5.3 Sidebar offset at `xl` = margin-left on #page-panel ONLY; header inherits (6.2) → transform free for push (8.3), no double-offset (gaps 6/9)
6 App shell: #page-panel + header
   6.1 #page-panel = header (52px --header-height) + page header (h1) + content; max-width content-width default, `full` = 100% → readable + full-bleed; offset via margin-left (5.3)
   6.2 header width:100%; header-main left 52px + back-chevron; offset inherited from #page-panel (no own margin) → back affordance + desktop offset
   6.3 header-utilities right; wraps below header-main when tight → context tools reachable on narrow
   6.4 Kebab pinned top-right of content-width at 52px; login/account, help, settings → app menu always reachable
   6.5 toolPanel region under panel-header (expands, pushes content) on BOTH #page-panel + SlidePanel headers → in-flow tools, never overlay (default closed)
7 Primary nav: sidebar
   7.1 Module grid (grid-auto-flow:column, fill top→bottom then wrap) → variable module columns; sizes.8 icon + text.xs label (12px)
   7.2 5px peek when closed (CLOSED_X = -(width-5)) → persistent affordance, zero space cost
   7.3 Measure sidebar width dynamically (min 90px) + publish --dynamic-sidebar-width → offsets by real width
   7.4 Persistent pull-tab top-left (9-dot→4-dot morph) → affordance without hamburger; pure CSS transform
   7.5 Pull-tab = single slot recipe; 9 dots = plain children → dots static, no independent theming (YAGNI; ext 7.4/7.11; gap 5)
   7.6 Drag right open / left close; click toggles; click-outside closes (#bodyClick) → mouse + touch
   7.7 Snap: |velocity|>100 wins else nearest half → predictable states; spring 400/35
   7.8 Open state app-level (NavContext); route change closes → any component drives/toggles
   7.9 Wide-desktop ignores open state (always pinned) → no phantom overlay
   7.10 Respect useReducedMotion
   7.11 Nav-tile + pull-tab as Park UI recipes → named BEM + DS-consistent
   7.12 Account avatar in sidebar footer (margin-top:auto) → out of main grid (gap 7)
   7.13 Narrow: opening tile closes overlay then pushes stack; hide 5px peek while drilled-in (pull-tab stays) → overlay/peek never fight stack (ext 7.x/8.1; gap 10)
8 Panel stack: iOS drill-down
   8.1 Sliding panel stack; root = sidebar; tap tile pushes sub-panel from right; back-chevron pops → mobile-first depth nav
   8.2 Push/pop via Framer Motion AnimatePresence (custom=direction, durations.slowest 400ms; useReducedMotion) → no web iOS-settings lib exists
   8.3 Whole-page push: entire #page-panel (header included) slides left, next panel in from right → iOS push (ext 8.1)
   8.4 Browser back + back-chevron both pop (reverse); depth URL/history-driven → deep-linkable, back/forward sync; final = nested routes via core router, lab = component-level stack (4.1) (gap 8)
9 SlidePanel overlay
   9.1 SlidePanel = portal modal (createPortal→body, AnimatePresence, spring 220/28, body scroll-lock, useReducedMotion) → reusable overlay shell distinct from page-level stack
   9.2 'normal': centered modal (sizes.3xl 768px, rise/fade/scale) desktop; bottom-sheet below sm; title + close top-right → dialogs/editors
   9.3 'fullscreen': full-screen slide-in; back-chevron top-left + title + headerActions (+ headerBottom 2nd row) → drill-down pages (reference workhorse)
   9.4 'immersive': full-screen slide-in; close-only top-right, no title bar; dark backdrop; drag-to-close → focus modes
10 Theme customizer & brand settings
   10.1 Customizer = EXACT Park UI theme drawer: accent+gray+font+radius, preset catalogs only → 1:1 Park UI; zero palette-generation/contrast risk (arbitrary hex rejected)
   10.2 Light/Dark FIRST choice, super-admin locked platform-wide (NOT per-user) → brand consistency; Park UI ships _light/_dark per step
   10.3 Runtime switch via <html> data-* (color-scheme/accent/gray/radius) + CSS-var block → mirrors Park UI ThemeTokens; zero rebuild, instant change
   10.4 Customizer = super-admin settings module (settings-schema ext); platform_settings; Realtime broadcast → all clients live
   10.5 Tiny editable surface: 5 knobs + 2 pattern fields; derive rest → no token proliferation
   10.6 Brand settings = whole-app surface (logo + 5 knobs + sidebar style + heading style); SG Page 1 prototypes → design once, port to settings module (ext 10.1–10.5; ties 10.4)
   10.7 Logo = brand ASSET (image URL), not a token: lab local file → object URL → brand slot; final = Storage URL in platform_settings → Realtime (ext 10.4)
   10.8 Discrete radius slider over 7 preset sizes = native Slider + Marks (BorderRadiusSlider) → slider UX + preset-catalog + l1/l2/l3 nesting; continuous = gap (ext 10.1/10.5)
   10.9 Live re-theme = 5 knobs ONLY; logo applies on SAVE → persisted asset, no mid-edit churn (ext 10.3/10.7)
   10.10 Expose brand settings from header kebab → reachable from ANY page (ext 6.4, 10.4)
   10.11 Present brand settings as SlidePanel 'normal' (sizes.3xl) → matches editor pattern; page context stays visible (ext 9.2)
   10.12 Gate brand settings to super-admins (final app, core auth); always visible in lab → consistent with 10.2; lab has no auth (4.1)
   10.13 Style Guide = button at BOTTOM of brand form (NOT sidebar tile) → available via brand form, never clutters sidebar nav (ext 10.10–10.12; SG gap 5)
   10.14 Sidebar Style dropdown: dark/light/brand dark text/brand light text → sidebar recipe appearance variant reusing semantic tokens; live re-theme, no new tokens (ext 10.6/10.5)
   10.15 Heading Style checkboxes: bold/uppercase/accent (independent) → heading recipe variant toggles; live re-theme, no new tokens (ext 10.6/10.5)
11 Gesture library selection → native mobile touch support (use @use-gesture/react + react-pinch)
   11.1 @use-gesture/react for drag/swipe/rotate/pinch (lightweight, mobile-first)
   11.2 react-pinch for dedicated pinch gestures (zoom/resize)
   11.3 Framer Motion stays for complex animations (separate concerns)
   11.4 Respect useReducedMotion
   11.5–11.8 Zero-runtime compatible, ~5KB gzipped, mobile-first, coexists with Framer Motion
   11.9 Enables immersive drag-to-close (9.4)
   11.10 Enables sidebar drag (7.6) with better mobile UX
12 Module contract
   12.1 Every module exports exactly: manifest.ts, public.ts, routes.tsx, index.tsx (dashboard), pages/*, settings.ts (optional) → predictable structure
   12.2 routes.tsx = route CHILDREN only (no element layout wrapper, no errorElement) → shared AppShell owns chrome
   12.3 index.tsx = module dashboard (mounted at index route, i.e. /<id>) → consistent entry point naming across modules
   12.4 NO per-module layout, NO per-module ErrorBoundary → AppShell provides both; SettingsLayout and PeopleLayout clones eliminated
   12.5 Public/unauthenticated pages (e.g. FormPublicPage) live OUTSIDE the shell as dedicated routes
13 Single shared app shell
   13.1 AppShell (`src/core/ui/app-shell.tsx`) is the ONLY app chrome → renders Sidebar (left) + PagePanel + ErrorBoundary + Suspense + Outlet/children
   13.2 src/core/router.tsx mounts AppShell once; nests ALL authenticated routes beneath it: / (styleguide), /people, /settings → single shell, no clones
   13.3 Public routes (e.g. /forms/:formId) live OUTSIDE AppShell → unauthenticated surfaces stay bare
   13.4 ErrorBoundary promoted from module-local to src/core/ui/error-boundary.tsx → shared retry surface; Settings previously had NO boundary, now both do
   13.5 Styleguide previously owned its own Sidebar/PagePanel/shellCss; now shares AppShell → third shell eliminated
   13.6 AppShell reads useSettings() and wires onModuleNavigate/onSettingsNavigate itself → modules don't repeat this
14 Sidebar: left-side (was right-side)
   14.1 Sidebar fixed left:0; border-right; shadow mirrored; drag physics mirrored (drag-right-to-open, closedX negative) → left-pinned nav matches reading order
   14.2 PagePanel margin-right → margin-left → content shifts right, not left, to make room for sidebar
   14.3 Pull-tab wrapper: top:left, justifyContent: flex-end → tab sits on the visible 5px peek when closed, on the sidebar's inner edge when open
   14.4 All right-side references in comments/strings replaced with left-side → documentation consistent with runtime
   14.5 SettingsLayout clone of PeopleLayout eliminated; both routes now children of AppShell → no duplicated shell, no asymmetric ErrorBoundary coverage
   14.6 Module routes.tsx no longer wraps children in a layout element → modules are "routes + pages" only
15 Data display: cards & vertical layout best practices
   15.1 Cards = grouping containers, NOT padding boxes → signal "these N things belong together"
   15.2 Default to full-width cards → single logical group stretches edge-to-edge; partial width only when 2+ units are useful simultaneously
   15.3 Side-by-side cards for dashboard widgets (scan mode) and edit screens with a small secondary section (<4 fields, rarely used) → primary full-width + optional side card
   15.4 Two-column within a card only for paired short fields of predictable height (name, date range, city/state) → collapse to 1 column at sm (640px)
   15.5 Never multi-column for long text, mixed lengths, or variable-height controls (textarea, long selects) → avoid orphaned fields and label misalignment
   15.6 Never nest cards
   15.7 One action location per card: Card.Footer OR page toolbar, never both → single primary action
   15.8 Read-only profile pages: stacked plain sections acceptable when no inline editing → if editing is added later, wrap editable region in a card
   15.9 Decision tree: single group → full-width; two+ groups scan-able together → side-by-side at md+; dashboard widgets → 2-3 column grid; tables/forms/editors → full-width within grid
16 Page component (page scaffold)
   16.1 Replace PagePanel/PageHeader pair with a single `Page` slot recipe (`src/core/ui/page.tsx`, recipe `src/core/theme/recipes/page.ts`) → one scaffold for every module page
   16.2 `Page.Root` = outer wrapper: marginLeft 5px (sidebar pull-tab), page-gutter padding, vertical gap between header/body/footer → based on old PagePanel
   16.3 `Page.Header` = page chrome; scrolls WITH the page (never fixed); BackButton on sub pages, h1 on dashboard pages
   16.4 `Page.Body` = main content region
   16.5 `Page.Footer` = shell-owned slot; rendered ONCE by AppShell inside `Page.Root` (absolute, out of flow, `inert` when idle) → whole-page save/apply forms hook in via `useRegisterPageActions` (supersedes `footerVariant="fixed"`; see 17)
   16.6 Every page has `Page.Root` + `Page.Header` + `Page.Body`; `Page.Footer` optional → mandatory scaffold, optional action bar. EXCEPTION: settings hosted sub-pages are content-only — the settings split shell owns their scaffold (19.2)
   16.7 Hero variant: `Page.Header headerVariant="hero"` tints header with module accent hue → same saturation/brightness as `--colors-color-palette-solid-bg`, hue shifted by `16deg × module number`
   16.8 Module number stored in module manifest (`number` field) → drives hero hue shift; passed to header via Panda's `css` prop (`css={{ '--module-number': peopleManifest.number }}`) keeps `Page.Header` a plain `withContext`
   16.9 Hero hue shift applied to a `::before` background layer (not the header itself) → children (h1, back button) NOT hue-shifted
   16.10 Responsive spacing: page padding/gaps collapse from `6` (24px) to `3` (12px) on small screens via `{ base: '3', md: '6' }` → mobile breathing room; mirror in card-like display components
17 Shell-owned action footer (dirty-driven)
   17.1 `PageActionsProvider` + `useRegisterPageActions` (core/ui) — forms register `{ cancel, apply, isSaving, isDirty, applyLabel? }`; cleanup on unmount → no stale footer across routes
   17.2 `ActionFooter` rendered once by AppShell; visible = `actions && actions.isDirty`; `inert` + `aria-hidden` when hidden → keyboard/screen-reader safe
   17.3 `position: absolute` in `Page.Root` (relative), NOT fixed → never overlaps sidebar; `--footer-height` → `Page.Main` `scrollPaddingBottom` → last field never occluded
   17.4 `env(safe-area-inset-bottom)` + `interactive-widget=resizes-content` viewport → mobile keyboard safe
   17.5 `prefers-reduced-motion` → no slide
   17.6 lint-pages.mjs bans `Page.Footer` in routed pages → single source of truth
18 Page actions (`page.actions`) — page-level action slot
   18.1 New slot `actions` in `page` recipe (`slots` array); component `Page.Actions` (`withContext(ark.div, 'actions')`) exported from `src/core/ui/page.tsx`.
   18.2 Position: below `Page.Body` (inside `Page.Main` after `Body`, or sibling under `Page.Root`). Never inside `Page.Header`.
   18.3 Padding: matches `Page.Body` — `{ base: '3', md: '6' }` (aligned left/right with body content). `pt: '6'` separates from body/header above.
   18.4 Industry terminology: **Primary** (first-step/entry: Create, Add, Search) → left-aligned; **Secondary** (supporting: Filter, Export) → right-aligned; **Utility** (cross-page common: print, share, email) → icon-only, can move to header/right-aligned on `md+`.
   18.5 Responsive: on `md+`, secondary/utility buttons may shift to header right-alignment; primary fields stay left-aligned.
   18.6 Enforcement: `lint-pages.mjs` allows `Actions` in allowed children; `Page.Main` validation includes `Actions`.
   18.7 Separation from `Page.Footer`: `Page.Footer` = shell-owned dirty-state save/apply (`useRegisterPageActions`). `Page.Actions` = static page-level actions. Never mix the two.
19 Settings split shell (iOS list + detail)
   19.1 `/settings` dashboard = standard scaffold (Main > Header level-0 > Body) with a section card list; cards = solid icon tile + title + truncated description + chevron → iOS settings list; icon from `SettingsSection.icon` (module manifest icon, `SlidersHorizontal` fallback)
   19.2 Selected section/page renders `SettingsSplitShell` (`src/core/settings/dashboard.tsx`) — the ONLY wrapper that owns `Page.Main`/`Header`/`Body` on behalf of hosted content; hosted sections/pages are content-only (no `Page.*` slots) → one scaffold owner, no nested scaffolds
   19.3 Shell heading level conditional (`level={hasSelection ? 1 : 0}`) → level 1 = back-chevron + breadcrumb title on mobile (16.3 pattern) without per-page headers
   19.4 `Page.Body` padding-free (`p: 0`); the two hosted columns own their padding (`{ base: '0', lg: '6' }`) → L1 alignment restored inside columns; documented exception to the `{ base: '3', md: '6' }` contract (columns are hidden at `base`)
   19.5 `lg+`: 280px `as="nav"` column (`gray.subtle.bg`) persists and the page scrolls in the right panel (`Page.Main` gets `overflowY: 'hidden'` while a selection is active); `base`: list hides, page fills viewport → list+detail without the panel stack (8.x)
   19.6 Card states use runtime palette steps (`colorPalette.3` bg, `colorPalette.4` hover, `colorPalette.a5` border, `colorPalette.9` focus ring) → tinted iOS-style states, zero new tokens
   19.7 lint-pages `FILES_ALLOW_RAW` exempts hosted settings pages → gate stays strict elsewhere; new settings pages must be added to the allowlist
