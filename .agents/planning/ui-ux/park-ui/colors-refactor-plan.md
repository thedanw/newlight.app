# Plan: Park UI Color-Only Refactor (dynamic color-scheme loading)

**Goal:** Make every app color come exclusively from Park UI color packages. The app defines only base-level vars (`--colors-color-palette-*`) that a **dynamically loaded** color scheme re-maps at runtime. No hex/rgb literals outside the Park UI token files. Default scheme = **orange** accent + **neutral** gray, both applied via dynamic loading (not hard-coded in static CSS).

**Branch:** `feat/ui-design-lab` (current)

## Decision Gaps & Resolutions

| # | Gap | Resolution |
|---|-----|-----------|
| 1 | Which accent schemes? | **Orange (default), Green, Violet, Mint** — user-confirmed. Installed via `npx @park-ui/cli add`. |
| 2 | Which gray/neutral? | **neutral** (goal: "neutral gray"). `sand` removed as default; `sand.ts` deleted. |
| 3 | Attribute model | `data-color-scheme="orange|green|violet|mint"` carries the **accent** (matches user's literal `:root, [data-color-scheme="orange"]` example). Light/dark **moves to `data-mode="light|dark"`** (avoids collision). Gray stays `data-gray-color`. |
| 4 | Where do raw hex values live at runtime? | **Panda codegen only.** The `.ts` packages emit `--colors-{name}-*` into the bundle; runtime scheme `.css` files contain **only var re-maps, no hex**. |
| 5 | Default (orange) not hard-coded? | Wire up the currently-orphaned `theme-loader.js`; `main.tsx` calls `initializeTheme('orange','neutral')` before render. `index.html` carries no hard-coded palette attrs. |
| 6 | Custom `black`/`white` tokens (`tokens/colors.ts`)? | **Keep** — they are Park UI base tokens (Radix blackA/whiteA) that stock recipes (`dialog`, `drawer`, `carousel`, `shadows`) depend on. Values already match the Park UI preset. |
| 7 | `error` semantic | Keep `red` installed (native) for `error: {colors.red.9}` — supporting color, NOT a selectable accent scheme. |
| 8 | `data-color-scheme=dark` used by Panda (`conditions.ts`) | Update `conditions.ts` `dark` condition to `&[data-mode=dark]`; `pnpm panda` re-emits `_dark` values under the new attr. |
| 9 | Stale/duplicate CSS | Delete hand-authored hex palette files in `public/core/theme/colors/` not in the set; delete `public/core/theme/theme.css` (loader stops loading base; static import covers it). |

## Action Items (atomic — one per TODO)

### Batch 1: Install Park UI color packages (CLI-native)
- [ ] **1.1** `npx @park-ui/cli add orange green violet mint neutral red`
      → creates/refreshes `src/core/theme/colors/{orange,green,violet,mint,neutral,red}.ts` (canonical Radix values).
- [ ] **1.2** Verify each new `.ts` has full native structure (`1..12`, `a1..a12`, `solid/subtle/surface/outline/plain`). Create `src/core/theme/colors/index.ts` barrel exporting all.
- [ ] **1.3** Remove `src/core/theme/colors/sand.ts` (gray default moves to neutral).

### Batch 2: Wire packages in Panda config
- [ ] **2.1** `panda.config.ts`: replace dangling `green`/`red`/`sand` imports with the colors barrel; set `gray: neutral`, register `orange green violet mint red`.
- [ ] **2.2** Keep `fg`/`border`/`error` semantics (`error` = `{colors.red.9}`). No custom hex added.

### Batch 3: Attribute model — light/dark → data-mode
- [ ] **3.1** `src/core/theme/conditions.ts`: `dark: '&[data-mode=dark]'`.
- [ ] **3.2** `src/core/theme/theme.css`: `[data-color-scheme='dark']` → `[data-mode='dark']` (base shell section).

### Batch 4: Base vars + remove hard-coded remaps from theme.css
- [ ] **4.1** Rewrite `src/core/theme/theme.css` to **base shell only**: `[data-mode]` color-scheme, font, canvas, radius/sidebar/heading/utility sections. **Delete** the `:root` orange palette defaults + all `[data-accent-color=...]` / `[data-gray-color=...]` remap blocks (move to dynamic files). No hex.
- [ ] **4.2** Delete `public/core/theme/theme.css` (base is served statically via `main.tsx` import).

### Batch 5: Dynamic color-scheme CSS files (remap-only, no hex)
- [ ] **5.1** `public/core/theme/colors/orange.css` — `:root, [data-color-scheme="orange"] { --colors-color-palette-*: var(--colors-orange-*); }` (full 1–12, a1–a12, solid/subtle/surface/outline/plain).
- [ ] **5.2** `green.css` — `[data-color-scheme="green"] { … var(--colors-green-*) }`.
- [ ] **5.3** `violet.css` — `[data-color-scheme="violet"] { … }`.
- [ ] **5.4** `mint.css` — `[data-color-scheme="mint"] { … }`.
- [ ] **5.5** `neutral.css` — `[data-gray-color="neutral"] { --colors-gray-*: var(--colors-neutral-*) }`.
- [ ] **5.6** Delete stale hex files: `red.css teal.css sand.css mauve.css olive.css sage.css slate.css`.

### Batch 6: Wire dynamic default loading
- [ ] **6.1** `src/core/theme/theme-loader.js`: default `accent:'orange', gray:'neutral'`; set `data-color-scheme` (accent), `data-gray-color`, `data-mode`; stop loading `/core/theme/theme.css` (base is static).
- [ ] **6.2** `src/main.tsx`: call `initializeTheme({ accent:'orange', gray:'neutral' })` before render.
- [ ] **6.3** `index.html`: remove hard-coded `data-accent-color`/`data-gray-color`/`data-color-scheme`; keep structural `data-mode="light"`.

### Batch 7: Styleguide BrandForm knobs
- [ ] **7.1** `src/styleguide/BrandForm.tsx`: accent knob → `data-color-scheme` (options: orange/green/violet/mint); light/dark knob → `data-mode`; gray knob → `data-gray-color` (options: neutral). Update attribute read-back.

### Batch 8: Sweep remaining hard-coded colors
- [ ] **8.1** `recipes/progress.ts`: re-run `npx @park-ui/cli add progress` if its `rgba(255,255,255,0.3)` is non-canonical; otherwise leave (native). Confirm `dialog`/`drawer`/`carousel` `black.a7` refs are canonical (no change).

### Batch 9: Verify
- [ ] **9.1** `pnpm panda`; grep generated output for `--colors-orange-9` (raw tokens present → scheme files can be remap-only). If missing → plan amendment (generation script).
- [ ] **9.2** `pnpm typecheck` — clean.
- [ ] **9.3** `pnpm build` — clean.
- [ ] **9.4** Browser smoke: default orange loads dynamically; switch green/violet/mint; dark via `data-mode`; gray = neutral; no console errors.

## Validation
- [ ] No hex/rgb literals outside `src/core/theme/colors/*.ts` (+ Park UI base `black`/`white` in `tokens/colors.ts`)
- [ ] Default orange applied via dynamic loader, not static CSS
- [ ] `pnpm panda` + `pnpm typecheck` + `pnpm build` pass
- [ ] App renders with correct scheme switching in browser
