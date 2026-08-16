# Decision: UI Architecture & CSS (Design System)

## Aliases
- DS = design system: recipe catalog + tokens + base components under `src/core/ui/*`
- BEM = Block__Element--Modifier class naming (block, block__element, block--modifier)
- Recipe = Panda config recipe (`defineRecipe`/`defineSlotRecipe`) emitting named BEM classes
- Atomic = raw `css()`/`cva`/`sva` utility classes (non-semantic; rare escape hatch only)
- Barrel = locked public export surface `src/core/ui/index.ts` — the only UI import point for modules
- Token→semantic→pattern = token scale → semantic component tokens → recipe patterns (theme pipeline)
- waffle menu = sidebar module grid (large icon + small label tiles, variable columns)
- content-width = `sizes.6xl` (1152px) max reading width (#page-panel default)
- Panel stack = iOS-Settings-style sliding panels: drill-down nav stack, push in from right / pop back
- SlidePanel = portal overlay modal (variants: normal/fullscreen/immersive) rendered via createPortal
- Pull-tab = sidebar-drag-handle (9-dot grid that morphs to 4-dot when open)
- Peek = 5px of the closed sidebar always visible on the left edge
- NavContext = app-level sidebar open state (React Context)
- Wide desktop = viewport ≥ `xl` (1280px, Park UI breakpoint token) — sidebar pinned
- toolPanel = vertically-expanding region directly under the panel-header that pushes page content down when open (e.g. search/filter fields)
- brand settings = super-admin brand surface: logo + 5 theme knobs (colorScheme/accent/gray/font/radius) + sidebar style + heading style; opened via header kebab → normal SlidePanel; SG dashboard is its lab prototype; Style Guide = button at its bottom (10.13)

## What & Why
Zero-runtime UI architecture for the CRM: every component/div carries a human-friendly BEM class (Goal 1), 99% consistent app-wide (Goal 2), via Panda config recipes compiled to a single cached `global.css`. Enforced by typed tokens + recipe-only CSS + lint so small-context agents can't escape the framework (Goal 3 → `module-design/decision.md`).

Primary nav = mobile-first left waffle menu (module tiles) that pins at `xl` (1280px) and becomes a draggable overlay with a persistent pull-tab on narrow screens (7.x). Main nav experience = sliding panel stack (iOS-Settings drill-down): tapping a tile/row pushes the next panel in from the right; header back-chevron pops (8.x).

## Who
Solo developer; small-context LLM agents building bolt-on modules; future contributors.

## Constraints
- Panda config recipes (`defineRecipe`/`defineSlotRecipe`), `hash:false` (core #2)
- Park UI (Ark UI headless + Panda recipes, CLI-vendored) under src/core/ui; no shadcn styled layer (core #3)
- Single cached `global.css`; zero runtime CSS-in-JS; edge bundle gate (core #45)
- Theme via CSS custom properties (light, church-brand, module-scoped) — core #35
- Inter variable font preloaded — core #36
- Promote module component to base DS on 2nd reuse — core #42
- Sidebar: `xl` breakpoint (1280px — wide pinned / narrow overlay), 5px peek, persistent pull-tab top-left, app-level open state
- Framer Motion (`motion/react`) for drag/snap AND panel push/pop (AnimatePresence); respect `useReducedMotion`
- `#page-panel`: default `max-width: content-width` (`sizes.6xl` 1152px); `full` = 100% (or `100% - sidebar-width` at `xl` fixed-sidebar breakpoint); header 52px (`--header-height`, app extension token — header-main + header-utilities + kebab); page header = h1 title
- SlidePanel overlay modal (portal, variants normal/fullscreen/immersive) for dialogs/drill-down/immersive; page-level drill-down = #page-panel stack (8.x)
- toolPanel region under panel-header (#page-panel header + SlidePanel header): vertically-expanding, pushes page content down (not overlay); used for in-flow tools (search/filter fields)
- Theme customizer = Park UI's exact theme drawer: accent + gray + font + radius (preset catalogs only); color scheme (light/dark) is the FIRST choice, super-admin locked platform-wide, NOT per-user
- brand settings surface = logo + 5 theme knobs + sidebar style dropdown + heading-style checkboxes (pattern choices, no new tokens — 10.14–10.15; extends 10.5); logo = brand ASSET (image URL), not a token knob; radius control = native Slider + discrete Marks over the 7 preset sizes (10.1, 10.8)
- Brand settings opens as SlidePanel 'normal' (sizes.3xl) from the header kebab; super-admin gated in the final app, always visible in the lab (10.10–10.12); Style Guide = button at the bottom of the brand form (10.13)

## Non-Goals
- No hamburger-icon toggle — pull-tab replaces it
- No auto-collapse to icon-only rail on medium screens — 5px peek + overlay instead
- No user-specific theme preference (scheme locked by super admin)
- No arbitrary/custom accent hex (Park UI preset catalog only — avoids palette-generation + WCAG contrast handling)

## Assumptions
- Sidebar width measured at runtime (min 90px) — waffle menu is `width: max-content`
- content-width = `sizes.6xl` (1152px); fixed-sidebar breakpoint = `xl` (1280px) — one step up the Park UI size/breakpoint ladder
- `--dynamic-sidebar-width` CSS var drives the main-panel offset via #page-panel margin-left (5.3)
- Tile count stays small enough that the grid wraps into columns rather than scrolling

## Decision Log: decision → Rationale (hierarchical; parent = decision, sub = dependent)
1 Panda recipe foundation → BEM (Goal 1)
  1.1 Use config recipes (`defineRecipe`/`defineSlotRecipe`) → named BEM classes + typed variants (core #2)
  1.2 Keep hash:false; never hash:true → readable BEM names in devtools + CSS
  1.3 Restrict atomic css()/cva to rare one-offs; lint-gate recipe-first → BEM everywhere
  1.4 Register DS recipes centrally (panda.config.ts theme.recipes/slotRecipes) → single catalog + lean CSS (Goal 2)
  1.5 Restrict CSS to `.recipe.ts`; no <style>/inline/class literals → nowhere to go rogue
  1.6 Gate invalid variants/tokens via typed recipes → compile-time guardrail (Goal 3)
2 Tokens & theme pipeline
  2.1 Theme via CSS custom properties (light, church-brand, module-scoped) → token→semantic→pattern (core #35)
  2.2 Preload Inter variable font → fast + consistent typography (core #36)
  2.3 Module-scoped override via `data-theme-scope` + CSS-var block (colors/radii only) → subtree theme inherits app defaults; not in lab (extends 2.1/10.3/10.5; resolves gap 1)
  2.4 --dynamic-sidebar-width = layout state, NOT theme token → module overrides (2.3) never touch layout vars (resolves gap 4)
3 Design-system source & ownership
  3.1 Vendor Park UI via @park-ui/cli into src/core/ui → free MIT DS, source owned + editable, BEM preserved (core #3)
  3.2 Lock Barrel = named re-exports (vendored Park UI + DS recipes + layout primitives) → stable surface, no internals leak (core #3/#10; resolves gap 2)
  3.3 New component = vendor via CLI if Park UI has it, else module-local recipe → promote on 2nd reuse (core #42/#9; resolves gap 3)
  3.4 Promote module component to base DS on 2nd reuse → shared lib stays lean (core #42)
4 Phase-0 design lab
  4.1 Run bare design lab (Vite+React+Panda+Park UI+styleguide only; no router/modules/aliases/CI/Supabase) → visual design in parallel; output ports wholesale into src/core/ui (plan.md)
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
7 Primary nav: waffle sidebar
  7.1 waffle grid (grid-auto-flow:column, fill top→bottom then wrap) → variable module columns; sizes.8 icon + text.xs label (12px)
  7.2 5px peek when closed (CLOSED_X = -(width-5)) → persistent affordance, zero space cost
  7.3 Measure sidebar width dynamically (min 90px) + publish --dynamic-sidebar-width → waffle is width:max-content; offsets by real width
  7.4 Persistent pull-tab top-left (9-dot→4-dot morph) → affordance without hamburger; pure CSS transform
  7.5 Pull-tab = single slot recipe; 9 dots = plain children (not 9 slots) → dots static, no independent theming (YAGNI; extends 7.4/7.11; resolves gap 5)
  7.6 Drag right open / left close; click toggles; click-outside closes (#bodyClick) → mouse + touch
  7.7 Snap: |velocity|>100 wins else nearest half → predictable states; spring 400/35
  7.8 Open state app-level (NavContext); route change closes → any component drives/toggles
  7.9 Wide-desktop ignores open state (always pinned) → no phantom overlay
  7.10 Respect useReducedMotion → accessibility
  7.11 Nav-tile + pull-tab as Park UI recipes → named BEM + DS-consistent
  7.12 Admin tiles = pinned bottom block (margin-top:auto), super-admin gated → out of main grid (resolves gap 7)
  7.13 Narrow: opening tile closes overlay then pushes stack; hide 5px peek while drilled-in (pull-tab stays) → overlay/peek never fight stack (extends 7.x/8.1; resolves gap 10)
8 Panel stack: iOS drill-down
  8.1 Sliding panel stack; root = waffle menu; tap tile pushes sub-panel from right; back-chevron pops → mobile-first depth nav
  8.2 Push/pop via Framer Motion AnimatePresence (custom=direction: enter x 100%→0, exit x 0→-30% parallax; durations.slowest 400ms; useReducedMotion) → no web iOS-settings lib exists; no new dep
  8.3 Whole-page push: entire #page-panel (header included) slides left, next panel in from right → iOS push (extends 8.1)
  8.4 Browser back + back-chevron both pop (reverse); depth URL/history-driven → deep-linkable, back/forward sync; final = nested routes via core router (core #48), lab = component-level stack (4.1) (resolves gap 8)
9 SlidePanel overlay
  9.1 SlidePanel = portal modal (createPortal→body, AnimatePresence, spring 220/28, body scroll-lock, useReducedMotion) → reusable overlay shell distinct from page-level stack (reference analysis)
  9.2 'normal': centered modal (sizes.3xl 768px, rise/fade/scale .95→1) desktop; bottom-sheet below sm; title + close top-right → dialogs/editors
  9.3 'fullscreen': full-screen slide-in; back-chevron top-left + title + headerActions (+ headerBottom 2nd row) → drill-down pages (reference workhorse)
  9.4 'immersive': full-screen slide-in; close-only top-right, no title bar; dark backdrop; drag-to-close → focus modes
10 Theme customizer & brand settings
  10.1 Customizer = EXACT Park UI theme drawer: accent+gray+font+radius, preset catalogs only → 1:1 Park UI; zero palette-generation/contrast risk (arbitrary hex rejected)
  10.2 Light/Dark FIRST choice, super-admin locked platform-wide (NOT per-user) → brand consistency; Park UI ships _light/_dark per step (core #35)
  10.3 Runtime switch via <html> data-* (color-scheme/accent/gray/radius) + CSS-var block → mirrors Park UI ThemeTokens; zero rebuild, instant change
  10.4 Customizer = super-admin settings module (settings-schema ext, core #41); platform_settings (core #20/#23); Realtime broadcast (core #27) → all clients live
  10.5 Tiny editable surface: 5 knobs + 2 pattern fields (10.14/10.15); derive rest → no token proliferation
  10.6 Brand settings = whole-app surface (logo + 5 knobs + sidebar style + heading style); SG Page 1 prototypes → design once, port to settings module (extends 10.1–10.5; ties 10.4)
  10.7 Logo = brand ASSET (image URL), not a token: lab local file → object URL → brand slot; final = Storage URL in platform_settings → Realtime (extends 10.4)
  10.8 Discrete radius slider over 7 preset sizes = native Slider + Marks (BorderRadiusSlider) → slider UX + preset-catalog + l1/l2/l3 nesting; continuous = gap (extends 10.1/10.5)
  10.9 Live re-theme = 5 knobs ONLY; logo applies on SAVE → persisted asset, no mid-edit churn (extends 10.3/10.7)
  10.10 Expose brand settings from header kebab → reachable from ANY page (extends 6.4, 10.4)
  10.11 Present brand settings as SlidePanel 'normal' (sizes.3xl) → matches editor pattern; page context stays visible (extends 9.2)
  10.12 Gate brand settings to super-admins (final app, core auth); always visible in lab → consistent with 10.2; lab has no auth (4.1)
  10.13 Style Guide = button at BOTTOM of brand form (NOT sidebar tile) → available via brand form, never clutters waffle nav (extends 10.10–10.12; resolves SG gap 5)
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

## Findings (verified)
- Park UI's own website ships a `BorderRadiusSlider` (website/src/components/docs/border-radius-slider.tsx): `Slider.Root min={0} max={radii.length-1}` + `Slider.Marks marks={radii.map(...)}` with `radii = ['none','xs','sm','md','lg','xl','2xl']` → a DISCRETE 7-stop radius slider is a native Park UI Slider pattern (verified 2026-08-09). Implementation = 10.8
- Whole-theme live re-theme is FREE by design: every DS component consumes semantic tokens → CSS vars, so flipping <html> data-* (10.3) re-resolves ALL vars app-wide instantly (sidebar/header/components) — no per-component work. SG page IS the app shell, so the shell itself is the live preview (no separate preview pane needed)
- Panda config recipes (defineRecipe/defineSlotRecipe) emit NAMED BEM classes under `@layer recipes` (`.button`, `.button--size-lg`, `.checkbox__control--size-sm`); `hash:false` (default) keeps readable
- `cva`/`sva` (atomic recipes) emit ATOMIC utility classes (`.d_flex`, `.bg_red_200`) — NOT BEM; compound-variant css atomizes into `@layer utilities` (e.g. `.px_2`) alongside named classes
- Dynamic variant props need `staticCss` pre-generation (JIT)
- `styled()` over a config recipe still emits named classes (canonical Park UI pattern via createStyleContext); the earlier 'class-based Radix conflict' note was Svelte/Radix-era — with Ark UI, styled() over config recipes is the standard
- Park UI (chakra-ui/park-ui, MIT): React-first, Ark UI headless + Panda config recipes; since Nov 2025 no preset — `@park-ui/cli add <component>` copies component source + recipe into your repo (own + edit; only add what you use = no bloat)
- Park UI recipes are defineSlotRecipe with className → named BEM classes, hash:false compatible (matches 1.1–1.2)
- No maintained web library clones the iOS Settings menu (searched 2026-08-08): npm `react-ios-settings-menu`/`ios-settings-menu` 404; GitHub clones are native-only (SwiftUI, Flutter, RN, Unity) or Ionic demos (e.g. julescript/ios-wifi-settings-ionic) → implement the pattern ourselves
- iOS Settings push/pop mechanics: entering panel slides in from right (x 100%→0), outgoing panel slides left with parallax (x 0→-30%); ~400ms ease-out; back = reverse
- Framer Motion (motion/react) supports direction-aware push/pop natively: AnimatePresence `custom` prop + dynamic variants (hidden: direction => ({x: ±300})), usePresenceData in exiting children, modes sync/wait/popLayout → no new dependency (motion.dev docs, verified)
- Ionic is the only web framework with built-in iOS push/pop transitions, but a heavyweight full framework (Web Components + runtime CSS) — conflicts with zero-runtime lean constraints
- SlidePanel (reference runsheets): portal modal (createPortal→body, motion/react AnimatePresence, spring damping 28/stiffness 220, useReducedMotion); props isOpen/onClose/title/children/width(750)/headerActions/headerBottom/showHeader; body scroll-lock while open except 'control'
- SlidePanel real variant behaviour: 'default'/'control' = CENTERED modal on desktop (rise+fade+scale .95→1, NOT slide-from-right), full-width bottom-sheet on mobile (<576px); 'immersive'/'fullscreen' = full-screen slide-in from right (x 100%→0) + drag-to-close (offset>100 & vel>0)
- SlidePanel headers: default/control = spacer + centered title + close (top-right); immersive = floating close only (top-right); fullscreen = back-chevron (top-left) + title + headerActions (+ headerBottom 2nd row)
- SlidePanel usage in reference: default (1x files modal), fullscreen (drill-down workhorse: ServiceDetail/ConnectGroups/TeamsAdmin), immersive (video embed), control (0 usages) → control dropped; DS trio = normal/fullscreen/immersive
- SlidePanel CSS: z-index 1060 (header 1070) → Park UI `zIndex.popover` (1500); widths default 750px → `sizes.3xl` (768px) / control 400px; backdrops glass 0.4/0.6, immersive 0.85/0.95, control transparent pointer-events:none; <576px → below `sm` (640px) all full-screen
- Park UI token scales verified from `@park-ui/preset` source (2026-08-09): zIndex dropdown 1000 / sticky 1100 / banner 1200 / overlay 1300 / modal 1400 / popover 1500 / toast 1700 / tooltip 1800; durations fastest 50 / faster 100 / fast 150 / normal 200 / slow 250 / slower 300 / slowest 400ms; breakpoints sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536; radii l1/l2/l3 nesting via `[data-radius]`; semantic aliases fg.default/muted/subtle, canvas, border, error

## Decision Gap Log
1 Module-theme override token allowlist (which CSS vars a module may set via `data-theme-scope`, 2.3) → deferred to module-design/decision.md
2 Admin-block tile source + role-gating config (which waffle tiles are admin-gated, 7.12) → deferred to Phase-1 (core auth)
