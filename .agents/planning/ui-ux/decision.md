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
- brand settings = super-admin brand surface: logo + 5 theme knobs (colorScheme/accent/gray/font/radius) + sidebar style + heading style; opened via header kebab → normal SlidePanel; SG dashboard is its lab prototype; Style Guide = button at its bottom (decision.md #50)

## What & Why
Zero-runtime UI architecture for the CRM: every component/div carries a human-friendly BEM class (Goal 1), 99% consistent app-wide (Goal 2), via Panda config recipes compiled to a single cached `global.css`. Enforced by typed tokens + recipe-only CSS + lint so small-context agents can't escape the framework (Goal 3 → `module-design/decision.md`).

Primary nav = mobile-first left waffle menu (module tiles) that pins on wide desktop (≥1300px) and becomes a draggable overlay with a persistent pull-tab on narrow screens (decisions #12+). The main nav experience = sliding panel stack (iOS-Settings drill-down): tapping a tile/row pushes the next panel in from the right; header back-chevron pops (decisions #24+).

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
- SlidePanel overlay modal (portal, variants normal/fullscreen/immersive) for dialogs/drill-down/immersive; page-level drill-down = #page-panel stack (decisions #30+)
- toolPanel region under panel-header (#page-panel header + SlidePanel header): vertically-expanding, pushes page content down (not overlay); used for in-flow tools (search/filter fields)
- Theme customizer = Park UI's exact theme drawer: accent + gray + font + radius (preset catalogs only); color scheme (light/dark) is the FIRST choice, super-admin locked platform-wide, NOT per-user
- brand settings surface = logo + 5 theme knobs + sidebar style dropdown + heading-style checkboxes (pattern choices, no new tokens — #60–61; extends the 5-knob model, ui-ux #40); logo is a brand ASSET (image URL), not a token knob; radius control = native Slider + discrete Marks over the 7 preset sizes (ui-ux #36, #49)
- Brand settings opens as SlidePanel 'normal' (sizes.3xl) from the header kebab; super-admin gated in the final app, always visible in the lab (#46–48); Style Guide = button at the bottom of the brand form (#50)

## Non-Goals
- No hamburger-icon toggle — pull-tab replaces it
- No auto-collapse to icon-only rail on medium screens — 5px peek + overlay instead
- No user-specific theme preference (scheme locked by super admin)
- No arbitrary/custom accent hex (Park UI preset catalog only — avoids palette-generation + WCAG contrast handling)

## Assumptions
- Sidebar width measured at runtime (min 90px) — waffle menu is `width: max-content`
- content-width = `sizes.6xl` (1152px); fixed-sidebar breakpoint = `xl` (1280px) — one step up the Park UI size/breakpoint ladder
- `--dynamic-sidebar-width` CSS var drives the main-panel offset via #page-panel margin-left (#56)
- Tile count stays small enough that the grid wraps into columns rather than scrolling

## Decision Log: decision → Rationale
1 Use Panda config recipes (defineRecipe/defineSlotRecipe) → named BEM classes in compiled CSS + typed variants (extends core #2)
2 Keep hash:false (Panda default); never hash:true → readable BEM names in devtools + CSS (Goal 1)
3 Restrict atomic css()/cva to rare layout one-offs; lint-gate recipe-first in components → BEM preserved everywhere (Goal 1)
4 Register DS recipes centrally in panda.config.ts (theme.recipes/slotRecipes) → single typed catalog + JIT lean CSS (Goal 2)
5 Restrict CSS to .recipe.ts files; no <style>/inline style/class literals in components → nowhere in a component to go rogue
6 Gate invalid variants/tokens via typed recipes → compile-time guardrail survives agent context loss (Goal 3)
7 Theme via CSS custom properties (light, church-brand, module-scoped) → token→semantic→pattern pipeline (core #35)
8 Preload Inter variable font via service worker → fast + consistent typography (core #36)
9 Promote module component to base DS on 2nd reuse → shared lib stays lean (core #42)
10 Vendor Park UI components + recipes into src/core/ui via @park-ui/cli → free MIT DS, source owned + editable in-repo, BEM preserved (extends core #3)
11 Run Phase-0 as a bare 'design lab' (Vite+React+Panda+Park UI+styleguide only; no router/modules/aliases/CI/Supabase) → visual design proceeds in parallel with open architecture decisions; lab output ports wholesale into future src/core/ui (see plan.md Phase 0)
12 Use waffle-menu grid (grid-auto-flow:column; fill top→bottom then wrap) → variable module columns; mobile-first density (`sizes.8` 32px icon + `text.2xs` 10px label)
13 Breakpoint `xl` (1280px, Park UI token): fixed left on wide, slide-in overlay on narrow → desktop persistent nav + mobile screen space (was custom 1300px)
14 Keep 5px peek when closed (CLOSED_X = -(width-5)) → persistent affordance, zero space cost
15 Measure sidebar width dynamically (min 90px) + publish --dynamic-sidebar-width → waffle menu is width:max-content; main-panel offsets by real width
16 Persistent pull-tab top-left (9-dot→4-dot morph) → affordance without hamburger; pure CSS transform
17 Drag right open / left close; click toggles; click-outside closes (#bodyClick overlay) → mouse + touch paths
18 Snap on drag end: |velocity|>100 wins else nearest half → predictable states; spring 400/35
19 Keep open state app-level (NavContext) → any component drives/toggles; route change closes
20 Wide-desktop ignores open state (always pinned) → no phantom overlay
21 Respect useReducedMotion → accessibility
22 Implement nav-tile + pull-tab as Park UI recipes → named BEM + DS-consistent; promote on 2nd reuse (core #42)
23 Content width `sizes.6xl` (1152px, --content-width token); fixed-sidebar breakpoint = `xl` (1280px) — one Park UI size token derives the next breakpoint token (keeps #13 at `xl`)
24 Main nav = sliding panel stack (iOS-Settings drill-down): root = waffle menu; tap tile/row pushes sub-panel in from right; header back-chevron pops → mobile-first depth nav
25 Panel push/pop via Framer Motion AnimatePresence (custom=direction variants: enter x 100%→0, exit x 0→-30% parallax; `durations.slowest` 400ms; useReducedMotion) → verified: no web iOS-settings lib exists; Framer Motion already in stack (no new dep)
26 #page-panel = header (52px `--header-height`) + page header (h1) + content; default max-width: content-width (`sizes.6xl`); `full` = max-width 100% → readable line length + full-bleed option; sidebar offset at `xl` = #page-panel margin-left, not a width calc (see #56)
27 header width:100% inside #page-panel; header-main left, 52px (`--header-height`), back-chevron; sidebar offset inherited from #page-panel margin-left at `xl` (no own margin — see #56) → back affordance + desktop offset
28 header-utilities right; wraps to stacked row below header-main when it can't fit side-by-side → context tools (omni search, print, share, kebab) reachable on narrow
29 Kebab dropdown pinned top-right of content-width at `--header-height` (52px); items login/account, help, settings → app-level menu always reachable
30 Module content = #page-panel stack; link push slides ENTIRE page-panel (header included) left, next panel slides in from right → whole-page iOS push (extends #24)
31 Browser back + header back-chevron both pop (reverse animation); panel depth URL/history-driven → deep-linkable, chevron & back in sync (architecture lock in #58)
32 Add SlidePanel overlay = portal modal (createPortal→body, AnimatePresence, spring 220/28, body scroll-lock, useReducedMotion) → reusable overlay shell distinct from page-level stack (reference analysis)
33 SlidePanel variant 'normal'(default): centered modal (`sizes.3xl` 768px, rise/fade/scale .95→1) desktop; full-width bottom-sheet below `sm` (640px); header = title + close top-right → transactional dialogs/editors
34 SlidePanel variant 'fullscreen': full-screen slide-in from right (x 100%→0); header = back-chevron top-left + title + headerActions (+ headerBottom 2nd row) → drill-down pages (reference workhorse)
35 SlidePanel variant 'immersive': full-screen slide-in from right (x 100%→0); close button only top-right, no title bar; dark backdrop; drag-to-close → focus modes (video/reader)
36 Implement the theme customizer EXACTLY as Park UI's theme drawer: accent + gray + font + radius, preset catalogs only (26 accents, 6 grays, font list, 7 radius sizes) → 1:1 Park UI behavior; hand-tuned 12-step + alpha palettes preserved; zero palette-generation/contrast risk (arbitrary hex would force regenerating scales + taking over WCAG contrast — rejected)
37 Light/Dark is the FIRST choice in the customizer and locked by the super admin (platform setting, NOT per-user) → brand consistency, no per-user scheme; Park UI ships _light/_dark for every step so no extra scale work (extends core #35 light + church-brand)
38 Runtime theme switch via <html> data attributes (data-color-scheme / data-accent-color / data-gray-color / data-radius) + a CSS-var emission block → mirrors Park UI ThemeTokens/ThemeAttributes/use-theme; zero rebuild, instant brand change, single cached global.css
39 Customizer = super-admin settings module via settings-schema extension point (core #41); stored DB-only in platform_settings (core #20/#23); Realtime broadcast (core #27 — branding is UI-critical) → all clients update live
40 Keep the editable surface tiny: 5 theme knobs + 2 pattern fields (sidebar style, heading style — #60–61) and derive everything else (token→semantic→pattern); no token proliferation → small admin surface, single source of truth per color
41 Add toolPanel region under the panel-header (vertically-expanding, pushes page content down; e.g. search/filter fields) on BOTH #page-panel header and SlidePanel header → contextual tools stay in-flow, never overlay content; open state lives with the panel (default closed)
42 Make brand settings the whole-app brand surface: logo + 5 theme knobs (colorScheme/accent/gray/font/radius) + sidebar style + heading style; SG Page 1 prototypes it in-lab → design once, port to the super-admin settings module (extends #36–40; ties #39)
43 Treat logo as a brand ASSET, not a token: lab = local file → object URL → brand slot (sidebar+header); final = Supabase Storage → URL in platform_settings → Realtime → brand identity propagates like the knobs (extends #20/#23/#27/#39)
44 Use a DISCRETE radius slider snapping to the 7 preset sizes (none..2xl) → slider UX while keeping the preset-catalog constraint + l1/l2/l3 nesting (extends #36/#40); continuous radius = gap (would reverse #36)
45 Live whole-theme re-theme applies to the 5 knobs ONLY; logo applies on SAVE (refresh) → logo is a persisted asset (Storage URL) not a runtime knob; avoids mid-edit visual churn (extends #38/#43)
46 Expose brand settings from the header kebab menu (alongside login/account/help/settings) → customizer reachable from ANY page without leaving context (extends #29, #39)
47 Present the brand settings panel as SlidePanel variant 'normal' (centered modal, sizes.3xl) → matches the reference customizer/editor pattern; page context stays visible (extends #33)
48 Gate brand settings to super-admins in the final app (role via core auth); always visible in the lab → consistent with #36–37 lock; lab has no auth (ui-ux #11)
49 Radius control = Park UI native Slider with discrete Marks (min 0, max 6, radii[7], labeled marks) → VERIFIED 1:1 against Park UI's own BorderRadiusSlider (findings, 2026-08-09); native component, no custom slider (extends #44)
50 Mount the Style Guide behind a BUTTON at the BOTTOM of the brand customiser form (NOT a sidebar tile) → always available to super-admins via the brand form, never clutters the user waffle nav; keeps the dev tool discoverable but out of the user nav (extends #46–48; resolves SG gap #5)
51 Add optional `data-theme-scope` wrapper + CSS-var override block per module (colors/radii only) → scoped subtree theme, inherits app-root defaults; not in the lab (Phase-1 concern) (extends #7/#38/#40; resolves gap #1)
52 Lock the Barrel to named re-exports of vendored Park UI components + DS recipes + layout primitives only; PascalCase components, kebab-case `.recipe.ts` files → stable public surface, no internals leak (core #3/#10; resolves gap #2)
53 New component = vendor via @park-ui/cli when Park UI has it, else module-local recipe → promote to base DS on 2nd reuse (core #42/#9) → shared lib stays lean (resolves gap #3)
54 Treat --dynamic-sidebar-width as layout state, NOT a theme token → module theme overrides touch colors/radii only (#51), never layout vars → no interaction by construction (resolves gap #4)
55 Pull-tab = single slot recipe; 9 dots = plain children (not 9 slot recipes) → dots are static visuals, no independent theming (YAGNI; extends #16/#22; resolves gap #5)
56 Sidebar offset at `xl` = margin-left on #page-panel ONLY (single source); header inherits via parent (drop its own margin, #27) → transform stays free for whole-page push (#30) → no double-offset (resolves gaps #6/#9)
57 Admin tiles = pinned bottom block (margin-top:auto) in the waffle menu, super-admin gated → admin out of the main module grid (findings; ties #48; resolves gap #7)
58 Final app = URL/history-driven panel stack: each depth = nested route segment via the single core router (core #48); lab = component-level stack (no router, #11) → deep-linkable + back/forward sync (#31); architecture lock for Phase 1 (resolves gap #8)
59 Narrow: opening a tile closes the sidebar overlay then pushes the panel stack; hide the 5px peek while drilled-in (pull-tab stays) → overlay/peek never fight the stack (extends #12–21/#24–25; resolves gap #10)
60 Add Sidebar Style dropdown on the brand form: dark (dark bg/light fg) / light (light bg/dark fg) / brand dark text (accent bg/dark fg) / brand light text (accent bg/light fg) → sidebar recipe `appearance` variant reusing semantic tokens (canvas/fg.default/colorPalette.solid); live re-theme, no new tokens (extends #42/#40)
61 Add Heading Style checkboxes on the brand form: bold / uppercase / accent color (independent) → heading recipe variant toggles; live re-theme, no new tokens (extends #42/#40)

## Findings (verified)
- Park UI's own website ships a `BorderRadiusSlider` (website/src/components/docs/border-radius-slider.tsx): `Slider.Root min={0} max={radii.length-1}` + `Slider.Marks marks={radii.map(...)}` with `radii = ['none','xs','sm','md','lg','xl','2xl']` → a DISCRETE 7-stop radius slider is a native Park UI Slider pattern (verified 2026-08-09). This is the implementation of ui-ux #44/#49
- Whole-theme live re-theme is FREE by design: every DS component consumes semantic tokens → CSS vars, so flipping <html> data-* (ui-ux #38) re-resolves ALL vars app-wide instantly (sidebar/header/components) — no per-component work. SG page IS the app shell, so the shell itself is the live preview (no separate preview pane needed)
- Panda config recipes (defineRecipe/defineSlotRecipe) emit NAMED BEM classes under `@layer recipes` (`.button`, `.button--size-lg`, `.checkbox__control--size-sm`); `hash:false` (default) keeps readable
- `cva`/`sva` (atomic recipes) emit ATOMIC utility classes (`.d_flex`, `.bg_red_200`) — NOT BEM; compound-variant css atomizes into `@layer utilities` (e.g. `.px_2`) alongside named classes
- Dynamic variant props need `staticCss` pre-generation (JIT)
- `styled()` over a config recipe still emits named classes (canonical Park UI pattern via createStyleContext); the earlier 'class-based Radix conflict' note was Svelte/Radix-era — with Ark UI, styled() over config recipes is the standard
- Park UI (chakra-ui/park-ui, MIT): React-first, Ark UI headless + Panda config recipes; since Nov 2025 no preset — `@park-ui/cli add <component>` copies component source + recipe into your repo (own + edit; only add what you use = no bloat)
- Park UI recipes are defineSlotRecipe with className → named BEM classes, hash:false compatible (matches ui-ux #1/#2)
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

## Park UI compatibility mapping (dimensions → tokens)

Every hardcoded dimension below moved onto Park UI tokens (no raw px/ms literals in the DS). "Custom" = app layout extension token — deliberate, not on a Park UI scale.

### Breakpoints
| App concept | Old (raw) | Park UI token |
|---|---|---|
| Pinned-sidebar switch | 1300px | `xl` (1280px) |
| Bottom-sheet / full-screen switch | 576px | `sm` (640px) |

### Sizes
| App concept | Old (raw) | Park UI token |
|---|---|---|
| `--content-width` (#page-panel) | 1200px | `sizes.6xl` (1152px) |
| SlidePanel 'normal' modal width | 750px | `sizes.3xl` (768px) |
| Waffle tile icon | 32px | `sizes.8` (32px) |
| Header height | 52px | `--header-height` (custom; between spacing 11=44 / 14=56) |
| Sidebar min width | 90px | `--sidebar-min-width` (custom) |
| Waffle cell / tile | 90px / 70×70 | custom (layout) |
| 5px peek | 5px | custom (off-grid, deliberate) |

### Spacing
| App concept | Old (raw) | Park UI token |
|---|---|---|
| Waffle grid gap | 10px | `spacing.2.5` (10px) |
| Pull-tab top inset | 8px | `spacing.2` (8px) |
| Pull-tab right offset | -48px | `spacing.12` (48px) |

### Radii & typography
| App concept | Old (raw) | Park UI token |
|---|---|---|
| Waffle tile radius | 16px | `radii.2xl` (16px) |
| All container nesting | — | `radii.l1/l2/l3` (via `[data-radius]`) |
| Waffle tile label | 10px | `text.2xs` (10px — Park UI min) |

### Durations
| App concept | Old (raw) | Park UI token |
|---|---|---|
| Panel push/pop | ~400ms | `durations.slowest` (400ms) |
| General transitions | 300ms | `durations.slower` (300ms) |
| Fast transitions | 150ms | `durations.fast` (150ms) |
| Snap (400/35) / SlidePanel (220/28) springs | — | Framer `spring` physics — NOT Park UI duration tokens (keep) |

### Z-index layer stack
| Layer | Old (raw) | Park UI token | Value |
|---|---|---|---|
| `#bodyClick` overlay (behind sidebar) | 1040 | `zIndex.overlay` | 1300 |
| Sidebar slide-in overlay (narrow) | 1050 | `zIndex.modal` | 1400 |
| Pull-tab handle | 1051 | `zIndex.modal` (later DOM) | 1400 |
| SlidePanel modal + header | 1060 / 1070 | `zIndex.popover` | 1500 |

Park UI reserves `zIndex.dropdown` (1000) / `sticky` (1100) / `banner` (1200) for its own components, and `toast` (1700) / `tooltip` (1800) must float above ours — never reuse those bands.

### Focus ring / selection
- Use Park UI globals — do not redefine: `--global-color-focus-ring` = `colors.colorPalette.solid.bg`, `--global-color-selection` = `colorPalette.subtle.bg`.

## Decision Gap Log
1 Module-theme override token allowlist (which CSS vars a module may set via `data-theme-scope`, #51) → deferred to module-design/decision.md
2 Admin-block tile source + role-gating config (which waffle tiles are admin-gated, #57) → deferred to Phase-1 (core auth)
