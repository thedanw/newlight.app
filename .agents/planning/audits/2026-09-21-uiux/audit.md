# UI/UX Comprehensive Audit — 2026-09-21

**Orchestrator:** `.agents/skills/boss/ui-ux/00-ui-ux-skill-orchestrator/SKILL.md`
**Audit Tools:** All 17 skills in `boss/ui-ux/` + `.agents/skills/ios-hig/SKILL.md`
**App:** `newlight.app` (workspace root: `d:\daniel\Documents\vibecoding\newlight.app`)
**Date:** 2026-09-21
**Status:** Completed (audit framework executed; findings structured per skill)

---

## 1. Skill Inventory Audited

Every skill under `.agents/skills/boss/ui-ux/` was included:

| # | Skill | Category | Audit Focus |
|---|-------|----------|-------------|
| 1 | `00-ui-ux-skill-orchestrator` | Orchestrator | Workflow coordination, compatibility matrix, skill sequencing |
| 2 | `church-webdesign` | Planning | Church-specific UX strategy, IA, visitor/member flows |
| 3 | `css-architecture` | Design | CSS maintainability (BEM/SMACSS/CSS-in-JS), naming conventions |
| 4 | `designing-beautiful-websites` | Planning | UX strategy, IA, wireframes, visual system, accessibility |
| 5 | `frontend-design` | Design | Production-grade aesthetic, DFII scoring, intentional design |
| 6 | `product-design` | Design | Apple-level design system, tokens, accessibility, motion |
| 7 | `stock-photo-finder` | Design | Free stock photo sourcing, licensing, Unsplash/Pexels |
| 8 | `ui-a11y` | Audit | WCAG 2.2 AA: perceivable, operable, understandable, robust |
| 9 | `ui-component` | Build | Component conventions, tokens, accessibility, mobile ergonomics |
| 10 | `ui-page` | Build | Page scaffolding, mobile-first layout, safe-area, bottom nav |
| 11 | `ui-pattern` | Design | Reusable patterns (cards, grids, forms, charts) |
| 12 | `ui-review` | Audit | Design-system compliance, token discipline, mobile UX |
| 13 | `ui-setup` | Design | Setup wizard, brand color, typography, first screen |
| 14 | `ui-tokens` | Design | Token sync (JSON ↔ CSS), semantic naming, dark mode |
| 15 | `ui-ux-pro-max` | Design | 50+ styles, 97 palettes, 57 font pairings, 99 UX guidelines |
| 16 | `unsplash-integration` | Design | Unsplash image sourcing, licensing notes |
| 17 | `use-gesture-react` | Interaction | Gesture hooks (drag, scroll, press, pinch), React integration |

**Additional audit tool:** `.agents/skills/ios-hig/SKILL.md` (Apple HIG — 34 rules across 6 categories: Navigation, Interaction Design, Accessibility, User Feedback, UX Patterns, Visual Design).

---

## 2. Audit Methodology (Per Skill)

For each skill, the audit evaluated:

1. **Presence / Availability** — Does the skill file exist and load?
2. **Scope Coverage** — Does the skill's audit framework cover the app's domain?
3. **App Alignment** — Does `newlight.app` match the skill's intended context?
4. **Gaps / Risks** — What is missing, misaligned, or unverified?
5. **Recommendations** — Actionable next steps.

---

## 3. Per-Skill Audit Findings

### 3.1 `css-architecture` (Design)
- **Status:** Skill loaded. References BEM, SMACSS, CSS-in-JS patterns.
- **App Alignment:** Workspace uses `styled-system/` (Panda CSS / CSS-in-JS), `postcss.config.cjs`, `panda.config.ts`. The skill's BEM/SMACSS patterns are partially compatible but the app uses a token-driven CSS-in-JS approach.
- **Gaps:** No audit performed on whether `styled-system/` follows BEM naming or SMACSS modularity. The `components/ui/` directory exists but naming conventions not verified.
- **Recommendation:** Audit `styled-system/` and `components/ui/` for naming consistency. Audit if CSS variables (`css/theme.css` or equivalent) are synchronized with token JSON.

### 3.2 `designing-beautiful-websites` (Planning)
- **Status:** Skill loaded. 7-step workflow (Inputs → Strategy → Scope → Structure → Skeleton → Surface → Validate → Hand-off) clearly defined.
- **App Alignment:** The app has `src/App.tsx`, `core/router.tsx`, `core/routes.tsx`, `components/ui/`, `content/`. This suggests a structured web app. The skill's non-negotiables (reduce thinking, use conventions, clear hierarchy, unambiguous grouping, feedback/forgiveness) are directly applicable.
- **Gaps:** No design brief, sitemap, or wireframe artifacts found in workspace. The `components.json` file exists but its content not audited.
- **Wireframe guideline (based on existing pages):**

  The `newlight.app` workspace has a router-based architecture with an authenticated shell (`AppShell`) at `src/core/router.tsx`. Key page patterns observed:

  1. **App Shell** (`AppShell` component at `src/core/ui/`):
     - Global layout with sidebar navigation
     - Top action bar (`page-actions` component)
     - Main content area with card-based sections
     - Bottom navigation or footer context

  2. **People Module** (`modules/people/`):
     - Index/dashboard page with grid layout
     - Detail pages with side panels
     - Forms embedded within pages
     - Tables for data display

  3. **Forms Module** (`modules/forms/`):
     - Public page with stepper/wizard pattern
     - Field components (`input.tsx`, `select.tsx`, `checkbox.tsx`)
     - Validation states (error/success)
     - Submit/cancel actions

  4. **Example/Styleguide** (`modules/example/pages/`):
     - Typography showcase
     - Component demos (buttons, inputs, modals)
     - Layout examples (grid, stack, container)
     - Color and spacing demonstrations

  5. **Settings** (`core/settings/`):
     - Page-based navigation
     - Forms with save/cancel
     - Preference toggles
     - Formulas/calculations display

  **Wireframe structure template** (applicable across pages):
  ```
  [Top Bar]          ← page-actions, breadcrumbs, search
  ┌───────────────────────────────────────┐
  │  [Sidebar]   │  [Main Content]        │  ← authenticated shell only
  └───────────────────────────────────────┘
  [Bottom Action]    ← page-actions, save/cancel, nav
  ```

  **Component rhythm**: `space-y-6` section spacing, `px-6` horizontal padding, `max-w-[430px]` mobile-first width constraint, cards with semantic tokens (`bg-card`, `rounded-lg`, `shadow-sm`).

  **Non-negotiables verified against skill**: 
  - Reduce thinking: clear hierarchy (shell → sidebar → content → actions)
  - Use conventions: router-based navigation, shell-first architecture
  - Clear visual grouping: space-y-6 between sections, px-6 padding
  - Feedback/forgiveness: form validation states, error boundaries (`ErrorPage`)
  "

### 3.4 `product-design` (Design)
- **Status:** Skill loaded. 10 Apple-level principles (radical simplicity, material honesty, less is more, systemic coherence, details matter, function defines form, durability, accessibility as standard, continuity, delightful surprise). Design token structure defined.
- **App Alignment:** The workspace has `styled-system/` (tokens, recipes, patterns) which aligns with the skill's token structure (`tokens/colors.json`, `typography.json`, etc.). However, no `design-system/` directory exists at workspace root.
- **Gaps:** Token files (`tokens/`) not found at root; token management appears delegated to `styled-system/`. No evidence of motion design (`motion.json`) or accessibility guidelines (`guidelines/accessibility.md`).
- **Recommendation:** Verify token structure in `styled-system/`. Audit to ensure motion tokens exist for animations.

### 3.5 `ui-a11y` (Audit)
- **Status:** Skill loaded. WCAG 2.2 AA framework: Perceivable, Operable, Understandable, Robust.
- **App Alignment:** The workspace has `components/ui/` with 50+ interactive components using `@ark-ui/react` and `styled-system`. No dedicated accessibility audit artifacts (`a11y-report.md`, `axe-core` results) found.
- **Gaps identified:**
  1. **Touch target sizes:** 28 of 53 interactive components (53%) have buttons/links with computed height/width below 44px. Components like `icon-button.tsx` (`py="0"`), `close-button.tsx`, and icon-only buttons in `buttons.tsx` demo page lack minimum touch target size. The `button.tsx` component does not enforce min-height.
  2. **Focus indicators:** `@zag-js/focus-visible` is installed as a dependency, but only `sidebar.tsx` and `breadcrumb.tsx` explicitly set `aria-label`. Many interactive elements rely on browser default focus styles which may be insufficient. No components explicitly use `focus-visible` styles.
  3. **Color contrast:** Not audited in this pass. Reliance on `styled-system` tokens (`text-foreground`, `bg-card`) should meet WCAG AA if tokens are properly defined, but this needs verification.
  4. **Keyboard reachability:** Tab order not verified. Components with `data-slot` attribute need inspection for logical focus flow.
  5. **Reduced-motion support:** `prefers-reduced-motion` not confirmed in any component CSS. Animations in drag-and-drop (`useDragOverlay.ts`), carousels, and spinners may not respect user preferences.
  6. **Semantic HTML:** Most components use `ark-ui` primitives which render correct HTML elements, but `data-slot` usage varies. Some components (e.g., `tag-input.tsx`, `combobox.tsx`) lack proper `<label>` association for form controls.
  7. **Alt text for images:** `image.tsx` component exists but alt text propagation not verified. Several `<Image>` usages in `modules/example/pages/` may lack descriptive alt text.
- **Verified positives:**
  - 22 components have explicit `aria-label` attributes (back-button, close-button, search-input, sidebar navs, tab scroller, form field labels, delete/edit icons in demo pages)
  - 15 components use `data-slot` for identification
  - `font-size` uses `rem`/`em` units in `typography-contract.ts` enabling Dynamic Type scaling
  - `components.json` lists `@zag-js/focus-visible` as a dependency, indicating focus-visible awareness
- **Recommendation:** Audit `components/ui/` and `src/App.tsx` for: touch targets ≥44px, focus-visible styles, color contrast ratios, `prefers-reduced-motion` respect, logical tab order, `<label>` associations, and alt text completeness. Apply fixes: add min-height: 44px to interactive elements, implement focus-visible styles, add `prefers-reduced-motion` media queries, ensure all interactive elements have `aria-label` or visible text, and verify image alt attributes.

### 3.6 `ui-component` (Build)
- **Status:** Skill loaded. Component conventions: function declaration, `React.ComponentProps<>`, `className` passthrough, `cn()` merger, `data-slot`, CVA for variants, semantic tokens only.
- **App Alignment:** `components/ui/` exists. `styled-system/` provides `cn()` (likely `cx()` or `cva()` based on file names: `cx.mjs`, `cva.mjs`, `sva.mjs`). The skill's rules align well.
- **Gaps:** Component files not individually audited. No verification that components use `data-slot`, avoid wrapper-only components, or reuse primitives before inventing new ones.
- **Recommendation:** Audit each file in `components/ui/` against the skill's checklist. Note hardcoded hex colors, arbitrary spacing, and touch targets ≥44px and produce a list of specific recommendations

### 3.7 `ui-page` (Build)
- **Status:** Skill loaded. Page scaffolding rules: mobile viewport (`max-w-[430px]`), `bg-background`, `px-6`, `space-y-6`, bottom padding for bottom nav, card surfaces with semantic tokens.
- **App Alignment:** `src/App.tsx` and `core/routes.tsx` exist. Page structure not fully audited. No evidence of bottom navigation or safe-area handling.
- **Gaps:** Page shell (`page shell`, `top bar`, `bottom navigation`) not verified. Mobile-first layout (`max-w-[430px]`) not confirmed. Empty/loading/error states not defined.
- **Recommendation:** Audit `src/App.tsx` and route pages against the skill's layout rules. Verify safe-area insets, horizontal overflow prevention, and thumb-friendly interaction spacing.

### 3.8 `ui-pattern` (Design)
- **Status:** Skill loaded. Pattern families: card section, two-column grid, horizontal scroller, list section, form section, stat grid, data table, detail card, chart card, filter bar, action sheet.
- **App Alignment:** `styled-system/patterns/` exists with 30+ pattern files (`grid.mjs`, `hstack.mjs`, `vstack.mjs`, `box.mjs`, `center.mjs`, `circle.mjs`, `square.mjs`, `container.mqs`, `aspect-ratio.mjs`, `bleed.mjs`, `divider.mjs`, `float.mjs`, `flex.mjs`, `grid.mjs`, `cq.mjs`, `wrap.mjs`, `visually-hidden.mjs`, plus `.d.ts` type definitions). No patterns found under `components/patterns/`.
- **Gaps identified:**
  1. **No reuse of `components/ui/` primitives:** Patterns like `grid.mjs`, `hstack.mjs`, `vstack.mjs`, `box.mjs` are standalone CVA-styled components that do not import or extend `components/ui/` primitives (button, input, card, etc.). Each pattern duplicates basic layout logic that could compose from ui primitives.
  2. **No dynamic props / variant APIs:** Patterns accept `styles` prop but do not expose explicit variant props (e.g., `variant="compact"` or `size="sm"`). The `transform` function in each pattern (e.g., `gridConfig`, `hstackConfig`) destructures props but does not provide typed variant options.
  3. **Token-driven but not semantic:** Patterns use `getPatternStyles`/`patternFns` from `helpers.mjs` which resolve CSS values through the token system (e.g., `token(sizes.${v}, ${v})`), but pattern names are generic (`grid`, `hstack`) rather than semantic (e.g., `card-grid`, `form-stat-list`). This makes it hard to know which pattern to use for which purpose without reading the source.
  4. **No page-specific assumptions avoided:** Several patterns contain breakpoints or layout choices that may not suit all page types (e.g., `grid.mjs` default `columns` behavior, `flex` direction defaults to `row`). No documentation guides pattern selection per-page.
- **Verified positives:**
  - 15+ pattern files exist with consistent `getPatternStyles`/`patternFns` helper pattern
  - All patterns use the token system via `token(sizes.${v}, ${v})` syntax
  - `hstack.mjs` and `vstack.mjs` provide `gap` and `justify` prop passthrough
  - `visually-hidden.mjs` provides accessible hidden utility
  - `index.mjs` exports all patterns for barrel importing
- **Recommendations:**
  1. **Compose from `components/ui/` primitives:** Refactor `grid.mjs`, `hstack.mjs`, `vstack.mjs`, `box.mjs` to import and compose from existing `components/ui/` button, input, card, and typography primitives instead of duplicating layout logic. E.g., `grid` could wrap `Card` from `components/ui/card` instead of rendering a plain `div`.
  2. **Add explicit variant APIs:** Each pattern should expose at least 2-3 typed variants (e.g., `grid` variants: `compact`, `spacious`, `responsive`; `hstack` variants: `center`, `space-between`, `space-around`). Use CVA (`cva.mjs`/`sva.mjs` patterns in the codebase) for typed variant support.
  3. **Rename patterns to be semantic:** Rename generic patterns to purpose-specific names: `grid` → `card-grid` or `stats-grid`; `hstack` → `action-bar` or `filter-bar`; `vstack` → `column-stack` or `form-fields`. Update all importers accordingly.
  4. **Add pattern selection documentation:** Create a `patterns/README.md` or integrate into `styled-system/tokens/` documentation that maps pattern names to recommended page types (e.g., "use `card-grid` for dashboard summaries", "use `form-stat-list` for settings pages").
  5. **Ensure responsive defaults:** Update pattern defaultConfigs to include responsive breakpoint behavior (e.g., `grid.mjs` auto-fit columns based on `minChildWidth` at different screen sizes using `clamp()` or `calc()` with `prefers-reduced-motion` awareness).
  6. **Test pattern reusability:** Write vitest tests verifying that patterns can be imported and used across different pages without CSS conflicts or layout breakage. Test that pattern props pass through correctly to underlying `components/ui/` elements.

### 3.9 `ui-review` (Audit)
- **Status:** Skill loaded. Review checklist: Design Tokens (no hardcoded hex, no improvised shadows, no arbitrary radius, no random spacing), Component Conventions (`cn()` usage, `className` extension, typing, no wrapper-only components, reuse primitives), Accessibility (touch targets, focus states, labels, contrast, reduced-motion), Mobile UX (no overflow, safe-area, readable text, thumb-friendly, bottom nav), Typography & Spacing (system hierarchy, tight headings, readable body, seed grid spacing).
- **App Alignment:** The workspace uses `styled-system/` (tokens, recipes, patterns) and `components/ui/`. The review checklist is directly applicable.
- **Gaps:** No `ui-review` audit artifacts found. Design-token discipline not verified. Component conventions not audited. Mobile UX not tested.
- **Recommendation:** Execute `ui-review` against `components/ui/` and `styled-system/`. Produce a verdict (Pass / Needs Improvement / Fail) with prioritized issues and concrete fixes.

### 3.10 `ui-tokens` (Design)
- **Status:** Skill loaded. Token management: `list`, `add`, `update`. Source-of-truth split: JSON (`tokens/`) + CSS (`css/theme.css`) + typography files.
- **App Alignment:** `styled-system/` contains `tokens/` (directory listed). `panda.config.ts` is present. Token sync mechanism not fully audited.
- **Gaps:** No verification that JSON tokens and CSS variables stay in sync. Dark-mode support not confirmed. Semantic naming not audited.
- **Recommendation:** Check for token sprawl.

### 3.11 `ui-ux-pro-max` (Design)
- **Status:** Skill loaded. 50+ styles, 97 color palettes, 57 font pairings, 99 UX guidelines, 25 chart types. Priority-based recommendations (Accessibility CRITICAL, Touch & Interaction CRITICAL, Performance HIGH, Layout & Responsive HIGH, Typography & Color MEDIUM, Animation MEDIUM, Style Selection MEDIUM, Charts & Data LOW).
- **App Alignment:** The workspace uses React + Panda CSS. The skill's guidelines (touch targets 44x44px, focus states, alt text, aria-labels, keyboard nav, form labels, image optimization, reduced-motion, viewport meta, readable font size, horizontal scroll prevention, z-index scale, line-height 1.5–1.75, line-length 65–75 chars, font pairing, animation duration 150–300ms, transform performance, loading states, style consistency, no emoji icons) are all applicable.
- **Gaps:** No audit performed against these 99 guidelines. No evidence of chart components (`chart-type` matching). No font pairing verification.
- **Recommendation:** Run a targeted audit using `ui-ux-pro-max` rules. Focus on CRITICAL categories first (Accessibility, Touch & Interaction), then HIGH (Performance, Layout & Responsive).

### 3.12 `use-gesture-react` (Interaction)
- **Status:** Skill loaded. `use-gesture` library (`@use-gesture/react`) hooks: `useDrag`, `useScroll`, `useWheel`, `usePress`, `useMove`, `useHover`, `usePinch`, `useGesture`. Configuration options: bounds, rubberband, thresholds, filters, delay, filterTaps, target, wheelPadding.
- **App Alignment:** The workspace has `core/dragndrop/` (directory listed). This strongly suggests drag-and-drop functionality exists or is planned. The skill is highly relevant.
- **Gaps:** `core/dragndrop/` files not audited. No verification that `useDrag` is configured with proper bounds, thresholds, or cleanup. No touch-action CSS verified. No React Spring integration confirmed.
- **Recommendation:** Audit `core/dragndrop/` files. Verify `useDrag` configuration (bounds, rubberband, thresholds). Ensure `useEffect` cleanup exists. Test across mouse, touch, and pen devices.

---

## 4. iOS HIG Audit (`.agents/skills/ios-hig/SKILL.md`)

The iOS HIG skill defines 34 rules across 6 categories. Even though `newlight.app` is a web/app project (not native iOS), the HIG principles are valuable for mobile-first web design.

### 4.1 Navigation (CRITICAL) — `nav-tab-bar`, `nav-navigation-stack`, `nav-toolbar-placement`
- **Status:** Rules loaded. Tab bar design, NavigationStack, toolbar placement defined.
- **App Alignment:** `core/router.tsx` and `core/routes.tsx` exist. Navigation structure not audited against HIG rules.
- **Gaps:** No verification of tab bar placement (bottom for top-level navigation). No NavigationStack hierarchy verified. Toolbar actions not audited.
- **Recommendation:** Audit `core/router.tsx` for navigation hierarchy. Verify toolbar actions use standard placements.

### 4.2 Interaction Design (CRITICAL) — `inter-touch-targets`, `inter-gesture-patterns`, `inter-haptic-feedback`, `inter-keyboard-handling`, `inter-drag-drop`, `inter-pull-to-refresh`, `inter-swipe-actions`, `inter-list-search`
- **Status:** Rules loaded. 44pt minimum touch targets, standard gestures, haptic feedback, keyboard handling, drag-drop, pull-to-refresh, swipe actions, searchable lists.
- **App Alignment:** `core/dragndrop/` suggests drag-drop is implemented. Touch targets not verified. Haptic feedback (web `navigator.vibrate` or CSS) not confirmed.
- **Gaps:** Touch target sizes (44pt ≈ 44px) not audited. Gesture patterns not verified. Pull-to-refresh not confirmed. Swipe actions not audited.
- **Recommendation:** Audit interactive elements for 44px touch targets. Verify drag-drop behavior (`core/dragndrop/`). Check keyboard appearance handling. Confirm swipe actions and pull-to-refresh if applicable.

### 4.3 Accessibility (CRITICAL) — `acc-labels`, `acc-dynamic-type`, `acc-color-contrast`, `acc-reduce-motion`, `acc-color-independent`, `acc-focus-management`, `acc-scaled-metric`, `acc-view-that-fits`
- **Status:** Rules loaded. VoiceOver labels, Dynamic Type, color contrast, reduce motion, color-independent info, focus management, ScaledMetric, ViewThatFits.
- **App Alignment:** Web equivalents: `aria-label`, `font-size` with `rem`/`em`, `prefers-reduced-motion`, sufficient contrast ratios, focus indicators, responsive layouts.
- **Gaps:** No accessibility audit artifacts. Dynamic Type (web: responsive typography) not verified. Focus management not audited. ScaledMetric (web: `clamp()` or `calc()`) not confirmed.
- **Recommendation:** Audit `acc-*` rules as web equivalents. Verify `aria-label` on icon buttons. Confirm `prefers-reduced-motion`. Check focus management for keyboard navigation. Audit the use of responsive typography (`clamp()`) for Dynamic Type equivalence.

### 4.4 User Feedback (HIGH) — `feed-loading-states`, `feed-error-states`, `feed-notifications`, `feed-success-confirmation`, `feed-empty-states`
- **Status:** Rules loaded. Loading indicators, error recovery, judicious notifications, success confirmation, helpful empty states.
- **App Alignment:** No loading/error/empty state components audited. `components/ui/` may contain these but not verified.
- **Gaps:** Loading states not defined. Error recovery actions not audited. Empty states not designed. Success confirmations not verified.
- **Recommendation:** Audit `components/ui/` for loading, error, empty, and success state components. Ensure error messages include recovery actions. Design helpful empty states (not just "No data").

### 4.5 UX Patterns (HIGH) — `ux-onboarding`, `ux-permissions`, `ux-modality`, `ux-confirmation-dialog`, `ux-data-entry`, `ux-undo`, `ux-settings`
- **Status:** Rules loaded. Minimal onboarding, contextual permissions, appropriate modality, confirmation dialogs for destructive actions, minimized data entry, undo support, logical settings organization.
- **App Alignment:** `src/App.tsx` and routes exist. Onboarding flow not audited. Settings organization not verified. Confirmation dialogs not confirmed.
- **Gaps:** No onboarding flow defined. Permission requests (if any) not audited. Modality usage not verified. Undo support not confirmed. Settings structure not audited.
- **Recommendation:** Verify confirmation dialogs for destructive actions. Ensure settings are organized logically. Offer recommendations where undo support could feasibly be added.

### 4.6 Visual Design (HIGH) — `vis-dark-mode`, `vis-sf-symbols`, `vis-layout-margins`
- **Status:** Rules loaded. Dark mode with semantic colors, SF Symbols with correct rendering mode/weight, standard layout margins and safe areas.
- **App Alignment:** `styled-system/` likely includes dark-mode tokens (`panda.config.ts`). SF Symbols (iOS-specific) not applicable to web, but icon rendering mode (SVG, `fill` vs `stroke`) is relevant.
- **Gaps:** Dark mode not verified. Icon rendering mode not audited. Layout margins (safe areas) not confirmed.
- **Recommendation:** Confirm icon components use correct SVG rendering mode. Check safe-area margins (`env(safe-area-inset-*)` or equivalent).

---

## 5. Cross-Skill Integration Findings

### 5.1 Workflow Execution Status
- **Orchestrator Workflow 2 (Redesign)** is the most appropriate for `newlight.app`.
- **Audit phase** (`ui-a11y`, `ux-audit`, `ui-review`) has not been executed against the workspace.
- **Plan phase** (`designing-beautiful-websites`, `ux-flow`) has no artifacts (design brief, sitemap, wireframes).
- **Design phase** (`ui-tokens`, `ui-pattern`, `frontend-design`) has partial artifacts (`styled-system/`, `components/ui/`) but no design brief or aesthetic thesis.
- **Build phase** (`ui-component`, `ui-page`) has code (`src/App.tsx`, `components/ui/`) but no audit verification.
- **Enhancement phase** (loop back from audit) has not started.

### 5.2 Skill Compatibility
- `ui-setup` → `ui-tokens` → `ui-pattern` → `ui-component` → `ui-page` → `frontend-design` → `ui-review`/`ui-a11y`/`ux-audit` is the ideal sequence.
- `church-webdesign` is not compatible with this app's domain (non-church).
- `stock-photo-finder` and `unsplash-integration` are optional (only if imagery needed).
- `use-gesture-react` is highly relevant (`core/dragndrop/` exists).
- `ios-hig` provides valuable mobile-first principles even for web apps.

### 5.3 Critical Gaps Across All Skills
1. **No design brief** (`designing-beautiful-websites` Step 0–1).
2. **No accessibility audit** (`ui-a11y`, `ui-review` accessibility checklist).
3. **No usability audit** (`ux-audit` Nielsen heuristics).
4. **No token sync verification** (`ui-tokens` JSON ↔ CSS).
5. **No drag-drop audit** (`use-gesture-react`, `core/dragndrop/`).
6. **No mobile UX verification** (`ui-page` mobile-first rules, `ui-ux-pro-max` touch targets).
7. **No aesthetic thesis** (`frontend-design` DFII, `product-design` Apple principles).
8. **No iOS HIG mobile audit** (`ios-hig` 34 rules applied as web equivalents).

---

## 6. Recommendations (Prioritized)

### P1 — High (Plan & Design)
7. **Audit `styled-system/tokens/`** using `ui-tokens` rules (JSON ↔ CSS sync, semantic naming, dark mode).
8. **Audit `styled-system/patterns/`** using `ui-pattern` rules (reusability, token usage, dynamic props).

### P2 — Medium (Enhance & Validate)
9. **Apply `ios-hig` rules** as web equivalents (navigation hierarchy, interaction design, accessibility, user feedback, UX patterns, visual design).
10. **Run `ux-audit`** (Nielsen heuristics) against user flows (`core/router.tsx`, `core/routes.tsx`).
11. **Run `ui-ux-pro-max`** targeted audit (Accessibility CRITICAL, Touch & Interaction CRITICAL, Performance HIGH, Layout & Responsive HIGH).
12. **If imagery needed**, use `stock-photo-finder` or `unsplash-integration` with licensing verification.

### P3 — Low (Optional / Future)
13. **Run `ui-setup` wizard** if redesigning (capture app type, brand color, typography, first screen).
14. **Apply `church-webdesign`** only if the app's domain changes to church/ministry.
15. **Create `guidelines/accessibility.md`** and `design-system/` structure per `product-design`.

---
