# Decision: Temporary Styleguide Pages (Design-Lab)

## Aliases
- SG = temporary styleguide pages (design-lab only, never shipped as-is)
- Dashboard / Page 1 / Home = main SG panel: TOC hub + whole-app-shell live preview; brand settings entry point
- TOC = table of contents on the Dashboard (category → component index) so any component is findable
- Brand form = 8-field brand-settings surface (logo + 5 theme knobs + sidebar style + heading style) — opens as SlidePanel 'normal' from the header kebab; groundwork for the final super-admin brand settings panel (decision.md 10.6, 10.10–10.11)
- SG button = the Style Guide entry at the BOTTOM of the brand form (NOT a sidebar tile) — opens the SG Dashboard (whole-app decision — decision.md 10.13)
- Subpage = drill-down panel in the SG panel stack (iOS push/pop, ui-ux 8.1–8.2); 8 category subpages (not limited to 3)
- Knobs = 5 Park UI theme knobs (colorScheme / accent / gray / font / radius) — emulated locally, NOT the admin customizer (ui-ux 10.1–10.5); re-theme the WHOLE shell live
- Live preview = the entire SG app shell (sidebar mock + panel headers + visible components) re-theming in real time as knobs change (free via token→CSS-var, ui-ux 10.3); logo NOT in the live preview (save-on-apply)
- Kebab = header-utilities menu (decision.md 6.4) with Avatar + brand settings + login/account/help/settings
- Mock tile = static sidebar module tile (module not built yet)
- Not-built placeholder = SlidePanel 'normal' stating "module not built yet"
- Category = Park UI storybook grouping (Layout / Buttons / Typography / Forms / Feedback / Overlays / Navigation / Display)
- toolPanel = vertically-expanding region directly under the panel-header that pushes page content down (whole-app decision — decision.md 6.5)

## What & Why
Temporary styleguide pages inside the Phase-0 design lab (ui-ux 4.1) that let a developer/agent refine the DS against the real Park UI catalog before any app module exists. The Dashboard is a TOC hub: it indexes every shipped component by category so anything is findable in ≤2 taps, and the whole SG app shell is the live preview (knobs re-theme sidebar/header/visible components instantly). 8 category subpages (one per Park UI category, NOT limited to 3) catalogue every component in a natural context; the brand form opens as a normal SlidePanel from the header kebab, exactly as it will on the final app — proving the vendored DS (ui-ux 3.1) covers 100% of the catalog and validating the panel stack / SlidePanel / kebab / breadcrumb / toolPanel patterns with real content.

## Who
Solo developer + small-context LLM agents refining the DS; future contributors.

## Constraints
- Lab-only: no router, no modules/registry/barrel, no aliases, no CI, no Supabase (ui-ux 4.1); SG lives under `src/styleguide/*` (temporary)
- Navigation exercises the planned panel stack (ui-ux 8.1–8.4) + SlidePanel (ui-ux 9.1–9.4) so patterns are proven in-lab before Phase 1
- Sidebar = static mock with icons + labels (ui-ux 7.1–7.13); tapping a not-built module opens a 'not-built' SlidePanel; the Style Guide is NOT a sidebar tile — it is the SG button at the bottom of the brand form (decision.md 10.13)
- SG button (bottom of brand form) opens the SG Dashboard → always reachable via the customizer, same as the final app
- Every Park UI component (62, from `@park-ui/cli` barrel) appears across the Dashboard + 8 category subpages, grouped by Park UI category; each appears in a natural context (overlays attached to buttons/iconButton/Clipboard; e.g. Toast on copy)
- Layout = Dashboard (TOC hub) + 8 category subpages, NOT limited to 3; breadcrumb on EVERY page header
- Brand form = 8 fields: logo + light/dark + font + gray + accent + radius + sidebar style dropdown + heading-style checkboxes (decision.md 10.6–10.8, 10.14–10.15); opens as SlidePanel 'normal' from the header kebab (decision.md 10.10–10.11)
- Whole-app re-theme is the approach: the 5 knobs write `<html>` data-attrs and re-theme the whole shell live (tokens.md, ui-ux 10.3); logo upload is the ONLY exception — applies on save/refresh (decision.md 10.9)
- Radius knob = Park UI native Slider with discrete Marks (7 labeled presets) — verified pattern (decision.md 10.8, findings)
- Brand settings always visible in-lab; super-admin gate is final-app only (decision.md 10.12)
- Logo upload in-lab = local file → object URL → brand slot (no Supabase, ui-ux 4.1); ports to Storage later (decision.md 10.7)
- SlidePanel variant demo buttons (normal/fullscreen/immersive) live on the Dashboard
- toolPanel (decision.md 6.5) available on SG headers to prove in-flow filter/tool expansion

## Non-Goals
- No admin customizer / super-admin persistence (ui-ux 10.1–10.5 — later settings module); brand form is emulated locally in a SlidePanel
- No role gating in the lab — brand settings ALWAYS visible (super-admin gate is final-app, decision.md 10.12)
- No real module screens — only mock tiles + 'not-built' placeholder
- No router/history-driven panel depth (ui-ux 8.4 deferred; SG uses component-level stack, ties ui-ux gap 8)
- No PWA/service-worker font preload for the lab
- Logo does NOT live-re-theme (save-on-apply only, decision.md 10.9)

## Assumptions
- 62 Park UI React components shipped (verified from repo barrel `components/react/src/components/ui/index.ts`, 2026-08-09)
- Category split in findings.md is stable enough for the lab; exact grouping is low-risk and moves freely
- Lucide icons for mock tiles (matches Park UI's own examples)
- Dashboard TOC renders a curated category/component index; the 8 subpages hold the full catalog
- Breadcrumb appears on every page header (Module / Sub / Item path)

## Decision Log: decision → Rationale
1 Use Dashboard + 8 category subpages (NOT limited to 3) in the panel stack → TOC hub + full-catalog drill-down; proves push/pop with real content (ui-ux 8.1–8.2)
2 Make the Dashboard the TOC hub + whole-app-shell live preview → any component findable in ≤2 taps; the shell itself proves zero-rebuild theming (ui-ux 10.3)
3 Group components by Park UI category across 8 subpages (one per category) → mirrors upstream storybook; easy cross-reference
4 Catalog ALL 62 shipped Park UI components (every component appears ≥ once) → proves vendored DS is complete + surfaces missing/edge recipes (ui-ux 3.1)
5 Allocate: Dashboard = TOC hub (Cards per category); 8 subpages = Layout / Buttons / Typography / Forms / Feedback / Overlays / Navigation / Display → balanced panel depth; each component shown in a natural context
6 Sidebar mock = People / Groups / Services / Calendar tiles (icons+labels) with account avatar in footer; NO Style Guide tile → styleguide is a brand-form button (decision.md 10.13); sidebar proven with the planned module set (ui-ux 7.1)
7 Tapping a not-built module → SlidePanel 'normal' "not built yet" placeholder → reuses DS overlay; no dead UI
8 Style Guide button at the bottom of the brand form opens SG Dashboard → styleguide always reachable via the customizer, not a user-facing nav tile (decision.md 10.13)
9 Put SlidePanel variant demo buttons on the Dashboard (normal/fullscreen/immersive) → proves the DS trio (ui-ux 9.1–9.4) with live examples
10 Use component-level panel stack (no router) in SG → lab constraint; router/history depth (ui-ux 8.4) deferred to Phase 1
11 Use toolPanel on SG headers to demonstrate in-flow filter/tool expansion → validates decision.md 6.5 before app modules rely on it
12 Emulate brand settings locally only (no persistence) → lab-only; real persistence is the admin customizer later (ui-ux 10.4)
13 Brand form = 8 fields: logo upload + light/dark + font + gray + accent + radius + sidebar style + heading style → this page IS the groundwork for the final brand settings panel (decision.md 10.6); the form layout ports directly
14 Logo upload in-lab = local file input → object URL → brand slot (sidebar + header) → no Supabase in the lab (ui-ux 4.1); swaps to Storage URL on the final app (decision.md 10.7)
15 Radius field = Park UI native Slider + discrete Marks over the 7 preset sizes (none..2xl) → slider UX without breaking the preset-catalog constraint (decision.md 10.8)
16 Whole-theme re-theme IS the approach: the 5 theme knobs + sidebar style + heading style re-theme the entire shell (sidebar/header/visible components) live; logo is the ONLY save-on-apply field → matches final app exactly (decision.md 10.9); no separate preview pane
17 Open the brand form as SlidePanel 'normal' from the header kebab (with Avatar) → customizer reachable from any page, same as final app (decision.md 10.10–10.11); kebab proven with real menu + Avatar
18 Keep brand settings ALWAYS visible in-lab (no gate) → final-app super-admin gate is a phase-1 auth concern (decision.md 10.12)
19 Add a Dashboard TOC (category → components) so users can find any component → navigable catalog, not a blind scroll
20 Put breadcrumbs on EVERY SG page header → orientation inside the panel stack (Module / Sub / Item)
21 Use ONE subpage per Park UI category (8 subpages: Layout / Buttons / Typography / Forms / Feedback / Overlays / Navigation / Display) → mirrors Park UI storybook 1:1; consistent with the findings allocation (was merged in first draft)
22 Attach overlays to natural triggers: Dialog on reset-confirm, Popover on a demo Button, HoverCard on a TOC Card preview, Tooltip on every IconButton, Menu = kebab, Drawer on a quick-access Button → overlays proven in realistic spots, not a bare gallery
23 Trigger Toast from Clipboard copy + brand-save → proves Toast/Toaster via a real action (extends #9)
24 Show Feedback in context: Alert banner + Loader/Skeleton/Spinner/Progress demo strip → feedback reads as real app states, not isolated boxes
25 Build the TOC as per-category Cards (Icon + name + count + open Button) AND a full Table index of all 62 → overview + findable-by-name (resolves gap #2's core)
26 Group component examples on Cards within a subpage; use Accordion/Collapsible for long pages (Forms = 24) → scannable sections, no wall of components
27 Use Tabs on the Dashboard to switch TOC views (All / by category) → parallel organization without extra depth
28 Use Carousel for a featured-component strip + Pagination for long index + ScrollArea for long panels → real list patterns where they fit
29 Use Splitter for a resizable layout demo; Layout subpage = AbsoluteCenter / Group / Span demos → layout primitives proven
30 Kebab = Avatar row (Avatar + name) + brand settings + login/account/help/settings → proves Menu + Avatar in the app entry point (extends #17, decision.md 6.4/10.10)
31 Header actions = IconButton + Tooltip (search / print / share) → proves the header-utilities pattern with real tooltips (decision.md 6.2–6.4)
32 Make the toolPanel a search/filter demo with Input + Field + Button + IconButton → proves decision.md 6.5 with a realistic in-flow tool
33 Render the logo in the sidebar brand slot AND the Dashboard header brand slot → brand slot pattern proven where the final app uses it (decision.md 10.7/10.9)
34 Use AbsoluteCenter for the empty / no-results state → natural home for the layout primitive
35 Lock a per-subpage template: one Card per component in a responsive grid; Forms (24) grouped into Accordion sections by sub-group → consistent, scannable catalog (resolves gap #1)
36 Add TOC search via the toolPanel filter (Input + Field) that live-filters the TOC Cards/Table → find any component by name (resolves gap #2)
37 Use lucide icons for mock tiles: People=Users, Groups=UsersRound, Services=Wrench, Calendar=CalendarDays → matches Park UI examples + module semantics (resolves gap #3)
38 Structure `src/styleguide/` as: `App.tsx` (SG shell + panel stack), `pages/Dashboard.tsx` + `pages/<category>.tsx` (8), `BrandForm.tsx`, `toc.ts` (index data) → patterns port into `src/core/ui` (resolves gap #4)
39 Keep the SG in the final app as a dev aid: mounted behind the brand form's SG button, super-admin gated → aligns with decision.md 10.13; not a user nav tile (resolves gap #5)
40 Logo upload = Park UI FileUpload.Dropzone (drag-drop + click), 1 file, size-limited, preview in the brand slot; object URL in-lab → ports to Storage (resolves gap #6)
41 Font field lists the full Park UI font catalog in the Select; only Inter loads in-lab (fallback for others) → preset catalog respected; final app preloads the chosen font (resolves gap #7)
42 Dashboard beyond the TOC: Carousel featured strip + loading demo strip + SlidePanel trio buttons + Toast-on-copy; full catalog stays in the 8 subpages → balanced shell demo (resolves gap #8)
43 Logo upload limits = png/svg/webp/jpg only, max 1MB, square (min 256×256, recommend 512×512) → logo files are small + SVG scales crisp; fast upload, sharp brand slot (extends #40; resolves gap #1)
44 Font catalog = Inter / Poppins / Raleway / DM Sans (4 presets); only Inter loads in-lab, others fall back → covers neutral + display + rounded + geometric looks; final app preloads the chosen font (extends #41; resolves gap #2)
45 Add Sidebar Style dropdown to the brand form: dark (dark bg/light fg) / light (light bg/dark fg) / brand dark text (accent bg/dark fg) / brand light text (accent bg/light fg) → sidebar recipe appearance variant reusing semantic tokens; live re-theme (extends #13/#16; decision.md 10.14)
46 Add Heading Style checkboxes to the brand form: bold / uppercase / accent color (independent toggles) → heading recipe variant toggles; live re-theme (extends #13/#16; decision.md 10.15)

## Decision Gap Log
— none (gaps 1–2 resolved by decisions #43–44) —
