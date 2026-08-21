# Plan: Park UI Native Refactor

**Goal:** Make the app run entirely on **native, CLI-downloaded Park UI** components + native tokens. The only custom-built components that remain are the **sidebar / pull tab**. Delete `SlidePanel` entirely; delete and re-download every Park UI component fresh via `npx @park-ui/cli add`; do **not** hand-edit any component file.

**Branch:** `feat/ui-design-lab` (current)

## Scope

- **In:** Re-vendor all 62 Park UI components fresh via CLI; delete `SlidePanel.tsx`; rewire `App.tsx` + `Dashboard.tsx` to native `Dialog` / `Drawer` / `Table`; verify native tokens + typecheck + build.
- **Out (Do NOT touch):** `Sidebar`, `NavTile`, `PullTab`, `NavProvider`/`useNavContext` + their recipes (`nav-tile.ts`, `pull-tab.ts`). No new custom components. No hand-edits to any `src/core/ui/*` Park UI file. No router/history work.

## Decision Gaps & Resolutions

| # | Gap | Resolution |
|---|-----|-----------|
| 1 | SlidePanel (custom framer-motion overlay) | **Delete entirely.** Native `Dialog` + `Drawer` cover all overlay needs. |
| 2 | Are vendored Park UI components pristine? | **No guarantee** — `file-upload.tsx`, `index.ts`, `heading.ts`, `slider.ts` show as modified; memory documents hand-edits. **Re-download ALL fresh via CLI.** |
| 3 | "Do not edit any components" | Respect: only app code (`App.tsx`, `Dashboard.tsx`) is edited. Glue files (`src/core/ui/index.ts`, `src/core/theme/recipes/index.ts`) are restored only to re-register the custom sidebar stack. |
| 4 | Native tokens | Accept **stock CLI-generated recipes**; app must work with them (drop reliance on hand-tuned recipe hacks). |
| 5 | Custom sidebar stack | Preserved (`sidebar.tsx`, `nav-tile.tsx`, `pull-tab.tsx`, `nav-context.tsx` + recipes). Re-export/re-register after CLI regenerates barrels. |
| 6 | CLI output paths | `components.json`: components → `src/core/ui`, recipes → `src/core/theme/recipes`. CLI rewrites both `index.ts` files. |

## CLI Component List (62 ids — VERIFIED against registry index `park-ui.com/registry/react/index.json`)

`absolute-center accordion alert avatar badge breadcrumb button card carousel checkbox clipboard close-button code collapsible color-picker combobox date-picker dialog display-value drawer editable field fieldset file-upload group heading hover-card icon icon-button image input input-addon input-group kbd link loader menu number-input pagination pin-input popover progress radio-card-group radio-group rating-group scroll-area segment-group select skeleton slider span spinner splitter switch table tabs tags-input text textarea toast toggle-group tooltip`

> **Finding (2026-08-16):** `separator` is NOT in the registry (verified 404 + index check). The old `src/core/ui/separator.tsx` was **LLM-authored**, confirming the user's suspicion about non-pristine vendored files. `Separator` is used in `BrandForm.tsx` + `Dashboard.tsx` → replace `<Separator />` with a native-token styled element (`Box`/`css()` with `border` token). No custom component.

## Action Items (atomic — one per TODO)

### Batch 1: Safe teardown
- [ ] **1.1** Backup custom sidebar stack → `.agents/planning/ui-ux/park-ui/backup/` (files are untracked in git, no VCS safety net):
  `src/core/ui/{sidebar,nav-tile,pull-tab,nav-context}.tsx` + `src/core/theme/recipes/{nav-tile,pull-tab}.ts`
- [ ] **1.2** Delete all 62 Park UI component files in `src/core/ui/*.tsx` (keep `index.ts` + the 4 custom files).
- [ ] **1.3** Delete all Park UI recipe files in `src/core/theme/recipes/*.ts` (keep `nav-tile.ts`, `pull-tab.ts`).

### Batch 2: Fresh CLI download
- [ ] **2.1** Run `npx @park-ui/cli add <62 ids>` (regenerates components + recipes + both `index.ts`).
- [ ] **2.2** Restore custom glue:
  - `src/core/ui/index.ts`: re-add `NavTile`, `PullTab`, `NavProvider`, `useNavContext`, `Sidebar` exports.
  - `src/core/theme/recipes/index.ts`: re-add `navTile` + `pullTab` imports and registry entries.

### Batch 3: Remove SlidePanel
- [ ] **3.1** Rewire `src/styleguide/App.tsx`: drop `SlidePanel` import/state/instance; mount native `Dialog` + `Drawer` for overlay demos.
- [ ] **3.2** Rewire `src/styleguide/pages/Dashboard.tsx`: drop `SlidePanelVariant` trio; replace raw `<table>` with Park UI `Table`; replace trio buttons with native `Dialog`/`Drawer` demos.
- [ ] **3.3** Delete `src/styleguide/SlidePanel.tsx`.

### Batch 4: Verify (native Park UI + tokens)
- [ ] **4.1** `src/styleguide/BrandForm.tsx` — confirm all imports resolve against fresh components; no component edits.
- [ ] **4.2** `pnpm panda` (regenerate `styled-system` from fresh recipes).
- [ ] **4.3** `pnpm typecheck` — fix only app-code type mismatches (never edit component files).
- [ ] **4.4** `pnpm build` + dev-server/browser smoke test (Dashboard, BrandForm, overlays, sidebar).

## Known Trade-offs (native tokens)
- Stock `heading` recipe no longer consumes `var(--heading-*...)` → the BrandForm "Heading style" knob becomes visual no-op unless styled natively. Acceptable per "native tokens natively" (feature stays wired).
- Stock components are the registry versions; any LLM fixes to vendored files are intentionally discarded.

## Validation
- [ ] No custom components remain except sidebar/pull-tab
- [ ] `SlidePanel.tsx` gone; no `framer-motion` overlay left
- [ ] `pnpm panda` + `pnpm typecheck` + `pnpm build` all pass
- [ ] App renders in browser: sidebar, Dashboard, BrandForm, Dialog/Drawer overlays
