# UI/UX Design Lab — Boilerplate + Styleguide Implementation Plan

Goal: Ship a bare Vite + React + Panda + Park UI boilerplate with a runnable Styleguide (Dashboard TOC + brand form + 8 category subpages) that developers/agents use to refine the ui/ux design system **before any app module exists**.

Approach: Phase-0 design lab (ui-ux decision #11). Minimal scaffold, Panda config recipes (`hash:false`), Park UI vendored in-repo via `@park-ui/cli`, styleguide under `src/styleguide/*` using a component-level panel stack (no router). The styleguide shell IS the live re-theme preview (5 theme knobs + sidebar style + heading style; logo save-on-apply). Lab output ports wholesale into future `src/core/ui`.

Branch: `feat/ui-design-lab` (from `main`; remote `origin` = thedanw/newlight.app)

## Scope

In:
- Vite + React + TypeScript strict + pnpm scaffold (core #1/#4)
- Panda CSS config recipes, `hash:false`, single cached `global.css` (core #2)
- Park UI vendored via `@park-ui/cli` into `src/core/ui` (core #3/#10)
- Static theme emission (`<html data-*>` + CSS-var block) + Inter font (ui-ux #38/#36)
- Styleguide: `src/styleguide/App.tsx` shell + `pages/Dashboard.tsx` + `pages/<category>.tsx` (8) + `BrandForm.tsx` + `toc.ts` (temp-styleguide #38)
- Brand form = 8 fields (logo + 5 knobs + sidebar style + heading style) — SlidePanel 'normal' from header kebab, live whole-shell re-theme, logo save-on-apply (temp-styleguide #13/#16/#45/#46)

Out (YAGNI):
- Router / modules / registry / barrel / aliases / CI / Supabase / PWA / service worker / auth / persistence (ui-ux #11)
- Per-component polish of all 62 — the catalog expands **iteratively** in Batch 7
- Super-admin gating + admin-customizer persistence (final-app concerns)

## Small-Context Protocol (applies to every batch)

- One fresh subagent per batch (context partitioning). It reads ONLY: this plan's batch slice + `task_plan.md` status + `findings.md` refs — never the full planning docs.
- `manage_todo_list` = single source of truth for the current step; exactly ONE `in_progress` at a time; update status immediately on completion.
- 2-Action Rule: write key findings/errors to `progress.md` every 2 operations.
- Batch end: compact the batch to ≤3 bullets in `progress.md` (observation masking). Never carry raw tool output across batches.
- Context budget: 20% goals/approach · 30% current batch · 30% recent history · 20% buffer.

## Action Items

### Batch 1: Scaffold
Goal: Vite + React + TS-strict app boots via pnpm on `feat/ui-design-lab`.
**YAGNI yet: no router, no aliases, no lint/CI — just a runnable dev server.**
- [x] Create branch `feat/ui-design-lab` from `main`
- [x] Scaffold Vite react-ts (`pnpm create vite . --template react-ts`)
- [x] `pnpm install`; confirm `tsconfig` strict
- [x] Verify `pnpm dev` boots (expected: Vite ready URL)
- [x] Commit: `chore: scaffold vite react-ts boilerplate`

**Context prompt (paste to a fresh subagent):**
> Read `.agents/planning/ui-ux/template-plan/plan.md` Batch 1 + `task_plan.md` + `findings.md` (refs only). Create branch `feat/ui-design-lab`, scaffold Vite react-ts with pnpm, confirm `pnpm dev` boots and tsconfig is strict. Track steps with `manage_todo_list` (one in_progress at a time). Every 2 ops, append outcomes to `progress.md`; end by compacting this batch to ≤3 bullets there. Build only the bare bones — YAGNI yet.

### Batch 2: Panda CSS wiring
Goal: Panda configured (`hash:false`, central recipe registration) emitting one `global.css`; a smoke recipe renders.
**YAGNI yet: no custom token scale beyond what Park UI needs — no app-specific recipes.**
- [x] Install `@pandacss/dev` + PostCSS; add `postcss.config` + `panda.config.ts` (`hash:false`, outdir, `include: ['src/**']`)
- [x] Register recipes centrally in `panda.config.ts` `theme.recipes` (empty to start)
- [x] Verify `panda` generates `global.css` and the dev server compiles
- [x] Commit: `chore: wire panda css (hash:false)`

**Context prompt:**
> Read `template-plan/plan.md` Batch 2 + `task_plan.md`. Configure Panda CSS with `hash:false` and central recipe registration; verify a single `global.css` is generated and the dev server compiles. Track via `manage_todo_list`. Every 2 ops, log to `progress.md`; compact at end. Bare bones only — YAGNI yet.

### Batch 3: Park UI base components
Goal: Vendor the Park UI components the shell + Dashboard need (NOT all 62) via `@park-ui/cli` into `src/core/ui`.
**YAGNI yet: add only what the shell and Dashboard render now — Button, IconButton, Heading, Text, Card, Badge, Avatar, Separator, Kbd, Menu, Tooltip, FileUpload, Slider, Checkbox, Select, Field, Tabs, Accordion, Carousel, Breadcrumb, Clipboard, Dialog, Popover, HoverCard, Drawer, Toaster as triggered by the next batches.**
- [x] Init `@park-ui/cli` in the repo (no preset — CLI copies source + recipe in-repo, per findings)
- [x] Add the Batch-3 base set under `src/core/ui` (relative imports only — no barrel yet)
- [x] Smoke-render a Button/Heading/Card on a temp page; confirm named BEM classes appear
- [x] Commit: `feat: vendor park-ui base components`

**Context prompt:**
> Read `template-plan/plan.md` Batch 3 + `findings.md` (Park UI CLI facts). Vendor only the listed base Park UI components into `src/core/ui` via `@park-ui/cli add`; confirm named BEM classes in devtools. Track via `manage_todo_list`; log every 2 ops to `progress.md`; compact at end. Bare bones only — YAGNI yet.

### Batch 4: Static theme emission + Inter font
Goal: `<html data-*>` theme emission block (color-scheme/accent/gray/radius/sidebar-style/heading-style → CSS vars) + Inter variable font so the whole shell can re-theme live.
**YAGNI yet: only Inter loads in-lab (Poppins/Raleway/DM Sans stay listed in the Select but are NOT bundled); no service worker — static preload only.**
- [x] Add theme emission block (mirrors Park UI ThemeTokens/ThemeAttributes; tokens.md mechanism)
- [x] Preload Inter variable font statically in `index.html`
- [x] Smoke: flip a `data-*` attr → shell re-themes instantly
- [x] Commit: `feat: add static theme emission + inter font`

**Context prompt:**
> Read `template-plan/plan.md` Batch 4 + `tokens.md` (mechanism + brand asset sections). Add the `<html data-*>` CSS-var emission block and static Inter preload; verify flipping a data attr re-themes the shell. Track via `manage_todo_list`; log every 2 ops to `progress.md`; compact at end. Bare bones only — YAGNI yet.

### Batch 5: Styleguide shell + Dashboard
Goal: `src/styleguide/App.tsx` shell (sidebar waffle mock + `#page-panel` header + component-level panel stack via AnimatePresence, no router), Dashboard page (TOC Cards + Table index, breadcrumbs, toolPanel), `toc.ts` index.
**YAGNI yet: no router/history depth; `toc.ts` indexes only the components built so far (grows in Batch 7); no real modules — mock tiles + 'not-built' SlidePanel.**
- [x] `src/styleguide/toc.ts` (category → components, start with vendored set)
- [x] `App.tsx`: waffle sidebar mock + `#page-panel` header + push/pop stack (AnimatePresence, `durations.slowest`, `useReducedMotion`)
- [x] `pages/Dashboard.tsx`: TOC Cards + Table index + SlidePanel trio demo buttons + featured strip
- [x] Breadcrumbs on every page header; toolPanel search/filter demo
- [x] Commit: `feat: styleguide shell + dashboard toc`

**Context prompt:**
> Read `template-plan/plan.md` Batch 5 + `temp-styleguide-pages.md` decisions #1–11/#19–28 (refs only) + `findings.md` SG layout. Build the component-level panel stack, Dashboard TOC, breadcrumbs, toolPanel — NO router. Track via `manage_todo_list`; log every 2 ops to `progress.md`; compact at end. Bare bones only — YAGNI yet.

### Batch 6: Brand form
Goal: Brand form (8 fields) as SlidePanel 'normal' from the header kebab: logo upload (FileUpload.Dropzone, 1 file, png/svg/webp/jpg ≤1MB, square), light/dark, font (Inter/Poppins/Raleway/DM Sans), gray, accent, radius (native Slider + Marks), sidebar style dropdown, heading style checkboxes. Live whole-shell re-theme; logo save-on-apply.
**YAGNI yet: no persistence, no super-admin gate — pure local emulation writing `<html>` data-* attrs.**
- [x] Header kebab (Menu + Avatar) with brand-settings entry (decision.md #29/#46)
- [x] `BrandForm.tsx`: 8 fields wired to `<html>` data-* (theme knobs live)
- [x] Logo upload: Dropzone, 1 file, type/size guard (png/svg/webp/jpg, ≤1MB) → object URL → brand slot; save-on-apply only (decision.md #45)
- [x] Radius Slider + Marks (7 labeled stops) (decision.md #49)
- [x] Commit: `feat: brand form with live whole-shell re-theme`

**Context prompt:**
> Read `template-plan/plan.md` Batch 6 + `temp-styleguide-pages.md` decisions #12–18/#40–46 + `tokens.md` (knobs table). Build the 8-field brand form in a normal SlidePanel from the kebab; wire knobs to `<html>` data-*; logo = save-on-apply asset. Track via `manage_todo_list`; log every 2 ops to `progress.md`; compact at end. Bare bones only — YAGNI yet.

### Batch 7: Category subpages + catalog expansion
Goal: Per-subpage template (one Card per component, Accordion for long pages) + build the 8 category subpages progressively (Layout / Buttons / Typography / Forms / Feedback / Overlays / Navigation / Display), vendor + catalogue the remaining 62 components in natural contexts.
**YAGNI yet: each subpage is a template — one natural context per component, no over-engineered demos; expand iteratively, don't polish everything at once.**
- [x] Subpage template component (Card grid + Accordion groups for long pages)
- [x] Build the 8 subpages; vendor remaining Park UI components per category
- [x] `toc.ts` count check: all components present (actual 63 = Layout 3 + Buttons 5 + Typography 5 + Forms 24 + Feedback 6 + Overlays 6 + Navigation 8 + Display 6 — plan's "62" miscounted Buttons/Typography at 4 each)
- [ ] Commit: `feat: category subpages + full catalog`

**Context prompt:**
> Read `template-plan/plan.md` Batch 7 + `findings.md` (62-component catalog + allocation) + `temp-styleguide-pages.md` decisions #21–35. Build the subpage template + 8 category subpages, vendor the remaining components, verify the 62 count in `toc.ts`. Track via `manage_todo_list`; log every 2 ops to `progress.md`; compact at end. Bare bones only — YAGNI yet.

### Batch 8: Verify + push
Goal: Type-check/build clean, styleguide navigable end-to-end, branch pushed.
**YAGNI yet: no CI, no deployment, no tests beyond the smoke/type-check gates — just ship the lab branch.**
- [ ] `pnpm typecheck` + `pnpm build` pass
- [ ] Manual smoke: Dashboard → subpages → brand form re-themes whole shell → logo applies on save
- [ ] `git push origin feat/ui-design-lab`
- [ ] Commit: `chore: verify + push design lab`

**Context prompt:**
> Read `template-plan/plan.md` Batch 8 + `task_plan.md`. Run typecheck + build, smoke the full styleguide flow, push the branch. Log results to `progress.md`. Bare bones only — YAGNI yet.

## Finalization

Open Questions
- [x] None blocking — assumed current `@park-ui/cli` + Vite template defaults; verified at Batch 1/3.

Verification
- [ ] `pnpm dev` serves the styleguide
- [ ] TypeScript strict passes (`pnpm typecheck`)
- [ ] Brand form re-themes the whole shell live; logo applies on save
- [ ] All 62 Park UI components catalogued in `toc.ts`
