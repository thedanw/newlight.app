 # Decision: UI Architecture & CSS (Design System)

 ## Aliases
 - DS: design system = recipes + tokens + base components (`src/core/ui/*`)
 - BEM: Block__Element--Modifier naming; recipe-generated class surface
 - Barrel: single UI import surface `src/core/ui`
 - PEEK: closed sidebar visible edge = 5px
 - XL: wide breakpoint = 1280px

 ## Final Decisions (concise)
 1. DS_RECIPES+BEM > use Panda `defineRecipe`/`defineSlotRecipe` to emit readable BEM classes; `hash:false`; enforce recipe-first CSS only; typed variants.
 2. TOKENS_CSSVARS > theme via CSS custom properties on `<html>`; support light/dark presets; allow module-scoped overrides via `data-theme-scope` (colors/radii only).
 3. ZERO_RUNTIME_CSS > ship a single cached `global.css`; avoid runtime CSS-in-JS; enforce via lint/build gate.
 4. BARREL_EXPORT > expose UI only through `src/core/ui` barrel; modules must not import UI internals.
 5. PARK_UI_VENDOR > vendor Park UI into `src/core/ui` via `@park-ui/cli`; edit locally when needed.
 6. PAGEPANEL_LAYOUT > `#page-panel` uses `sizes.6xl` (1152px) max-width; header height `--header-height:52px`; at `XL` apply `margin-right: var(--dynamic-sidebar-width)`.
 7. SIDEBAR_RIGHT > right-side sidebar mobile-first; `XL` pinned; narrow = overlay; closed state leaves `PEEK` visible; min width 90px.
 8. SIDEBAR_WIDTH_DYNAMIC > measure sidebar width at runtime and publish `--dynamic-sidebar-width` for layout offsets.
 9. SIDEBAR_GRID > implement module grid with `grid-auto-flow: column`; responsive columns computed from viewport height/columns algorithm; footer contains avatar + brand tiles.
 10. SIDEBAR_INTERACTION > toggle on click; drag to open/close; snap rule: if |velocity|>100px/s use direction else nearest half; click-outside closes; route change closes overlay.
 11. PULL_TAB > persistent pull-tab at top-right; CSS-morph icon; tab is drag handle; pointer-events enabled; suppressed click after drag to avoid toggle bounce.
 12. PANEL_STACK > implement iOS-style drill-down (full-page push/pop) using Framer Motion `AnimatePresence` with history-backed routing; respect `prefers-reduced-motion`.
 13. SLIDEPANEL_OVERLAY > overlay variants: `normal` (centered modal), `fullscreen`, `immersive`; portal to body; body scroll-lock while open; use Framer Motion springs.
 14. TOOLPANEL_INLINE > `toolPanel` is inline under panel headers and pushes page content (never overlays) for in-flow controls (search/filters).
 15. BRAND_SETTINGS > expose from header kebab as SlidePanel/Drawer `sizes.3xl`; form = logo (asset URL) + 5 theme knobs + sidebar-style + heading-style; logo commits on Apply.
 16. THEME_CUSTOMIZER > match Park UI theme drawer: preset-only accent/gray/font/radius; live re-theme by flipping `<html>` data-* CSS vars; no arbitrary hex inputs.
 17. NO_USER_THEME > color-scheme selection is platform-level (super-admin) not per-user; enforce via settings module.
 18. GESTURES > use `@use-gesture/react` for drag gestures; keep Framer Motion for complex animations; ensure low bundle impact and no conflicts.
 19. PROMOTE_COMPONENTS > promote a module-local component into DS after its 2nd reuse (avoid premature bloat).
 20. ACCESSIBILITY > honor `prefers-reduced-motion`; ensure keyboard focusability and semantic roles; BEM classes support agent reasoning.
 21. BUILD_CONSTRAINTS > Panda recipes + `hash:false`; typed recipes; avoid atomic escapes; single CSS output enforced by build.
 22. ASSET_LOGO > logo is an asset URL stored by settings; commit on Apply; update favicon on commit.
 23. TOKENS_SCALES > standard token scales: breakpoints `sm/md/lg/xl(1280)/2xl`; durations per Park UI preset; radii = 7 discrete presets.

 ## Notes
 - These entries are the canonical, final decisions. No legacy decision history is retained here.

 ## Rationale (hierarchical; parent = decision, sub = dependent)
 1 DS_RECIPES+BEM
	1.1 Use Panda `defineRecipe`/`defineSlotRecipe` to emit readable BEM classes.
	1.2 Keep `hash:false` to preserve readable names for debugging and agent reasoning.
	1.3 Enforce recipe-first CSS; atomic `css()/cva` only as escape hatch.
 2 TOKENS_CSSVARS
	2.1 Centralize theme via `<html>` CSS custom properties for instant live re-theme.
	2.2 Support light/dark presets; restrict module overrides to color/radius via `data-theme-scope`.
 3 ZERO_RUNTIME_CSS
	3.1 Single cached `global.css` reduces runtime cost and agent surface variability.
 4 BARREL_EXPORT
	4.1 Single import surface prevents module coupling to internals; simplifies agent imports.
 5 PARK_UI_VENDOR
	5.1 Vendor Park UI into `src/core/ui` to own source and enable small edits.
 6 PAGEPANEL_LAYOUT
	6.1 `#page-panel` max-width `sizes.6xl` preserves readable line lengths.
	6.2 Header fixed height 52px ensures consistent chrome for push/pull animations.
	6.3 `--dynamic-sidebar-width` margin-right avoids layout thrash at XL breakpoint.
 7 SIDEBAR_RIGHT
	7.1 Mobile-first right-side sidebar improves small-screen affordances.
	7.2 Keep 5px `PEEK` for persistent discoverability without layout cost.
 8 SIDEBAR_WIDTH_DYNAMIC
	8.1 Runtime measure publishes `--dynamic-sidebar-width` so layout aligns with actual sidebar width.
 9 SIDEBAR_GRID
	9.1 Grid-auto-flow:column enables column wrapping and predictable tile layout.
	9.2 Footer reserved for avatar + brand tiles to separate account actions.
 10 SIDEBAR_INTERACTION
	10.1 Click toggles, drag gestures provide direct manipulation; snap rule yields predictable endpoints.
	10.2 Click-outside and route-change close overrides prevent overlay persistence.
 11 PULL_TAB
	11.1 Pull-tab is both click toggle and drag handle; suppress post-drag click to avoid bounce.
 12 PANEL_STACK
	12.1 iOS-style full-page push/pop via `AnimatePresence` provides clear depth metaphors; history sync enables deep links.
 13 SLIDEPANEL_OVERLAY
	13.1 Three variants (normal/fullscreen/immersive) cover dialogs, drill-down and focus modes; portal+scroll-lock isolates layer.
 14 TOOLPANEL_INLINE
	14.1 Inline toolPanel pushes content so tools remain in-flow and measurable for agents.
 15 BRAND_SETTINGS
	15.1 Drawer sized `3xl` hosts logo+knobs; commit-on-Apply prevents mid-edit churn and centralizes persistence.
 16 THEME_CUSTOMIZER
	16.1 Preset-only knobs avoid palette-generation and WCAG pitfalls; live re-theme via HTML data-* is zero-rebuild.
 17 NO_USER_THEME
	17.1 Platform-level scheme maintains brand consistency and simplifies real-time broadcasting.
 18 GESTURES
	18.1 Use `@use-gesture/react` for low-level drag; Framer Motion for animated transitions; respect reduced-motion.
 19 PROMOTE_COMPONENTS
	19.1 Promote after 2nd reuse to balance shareability vs. bloat.
 20 ACCESSIBILITY
	20.1 `prefers-reduced-motion` and semantic roles keep UI accessible and agent-predictable.
 21 BUILD_CONSTRAINTS
	21.1 Typed recipes and single CSS output enforce guardrails for small-context agents.
 22 ASSET_LOGO
	22.1 Logo as committed asset URL centralizes branding and enables favicon update.
 23 TOKENS_SCALES
	23.1 Park UI token scales provide consistent breakpoints, durations and radii for predictable UX behavior.

