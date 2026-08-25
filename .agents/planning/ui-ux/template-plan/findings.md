# Findings — UI/UX Design Lab Build (template-plan)

> Build-time research only. Full design decisions: `.agents/planning/ui-ux/decision.md`, `temp-styleguide-pages.md`, `tokens.md`. Full catalog: `.agents/planning/ui-ux/findings.md` (62 Park UI components + allocation).

## Source-of-truth refs (what each batch should read)
- Stack/architecture: `ui-ux/decision.md` 1–4, 6, 8–10
- Styleguide structure: `temp-styleguide-pages.md` #38 (`src/styleguide/App.tsx` + `pages/Dashboard.tsx` + `pages/<category>.tsx` ×8 + `BrandForm.tsx` + `toc.ts`)
- Brand form fields: `temp-styleguide-pages.md` #13/#16/#40–46; `tokens.md` knobs table (rows 1–7)
- Theme mechanism: `tokens.md` (`<html data-color-scheme/accent/gray/radius/sidebar-style/heading-style>` + CSS-var emission block)

## Verified build facts (2026-08-09)
- **Park UI**: `chakra-ui/park-ui` (MIT), React-first, Ark UI headless + Panda config recipes. Since Nov 2025 **no preset** — `@park-ui/cli add <component>` copies component source + recipe INTO the repo (own + edit; add only what you use).
- **Panda**: `defineRecipe`/`defineSlotRecipe` emit NAMED BEM classes under `@layer recipes` (`.button`, `.button--size-lg`, `.checkbox__control--size-sm`); `hash:false` (default) keeps readable. `cva`/`sva` emit ATOMIC classes (not BEM) — avoid in DS components. Dynamic variant props need `staticCss` pre-generation.
- **styled() over config recipe** still emits named classes (canonical Park UI via `createStyleContext`) — the standard pattern.
- **Radius slider**: Park UI's own site ships `BorderRadiusSlider` — `Slider.Root min={0} max={radii.length-1}` + `Slider.Marks` with `radii = ['none','xs','sm','md','lg','xl','2xl']` → discrete 7-stop slider is native (decision.md 10.8).
- **Theme tokens** (from `@park-ui/preset`): zIndex dropdown 1000 → tooltip 1800; durations fastest 50 → slowest 400ms; breakpoints sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536; radii l1/l2/l3 nesting.
- **Fonts**: Inter is the only bundled font in-lab (preloaded statically, no SW). Poppins / Raleway / DM Sans are Select options with fallback only.
- **Logo upload**: FileUpload.Dropzone, 1 file, png/svg/webp/jpg, ≤1MB, square (min 256×256, recommend 512×512); object URL → brand slot; save-on-apply (NOT live re-theme).
- **62 components** (count: 3+4+5+24+6+6+8+6): Layout 3 / Buttons 4 / Typography 5 / Forms 24 / Feedback 6 / Overlays 6 / Navigation 8 / Display 6.

## Per-batch commands (quick ref)
- Scaffold: `pnpm create vite . --template react-ts`
- Panda: install `@pandacss/dev` + PostCSS; `panda.config.ts` `hash:false`, `outdir`, `include: ['src/**']`
- Park UI: `npx @park-ui/cli add <component>` (vendors into `src/core/ui`)
- Verify: `pnpm dev` / `pnpm typecheck` / `pnpm build`
