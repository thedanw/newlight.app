
# Simple Token Design System

> Decided 2026-08-09 (decision.md 10.1–10.5, 10.14–10.15). Model: **5 theme knobs + 2 pattern fields (sidebar style, heading style) → Park UI derives the rest** (token→semantic→pattern, core #35).

## Brand Customisation Settings — globally applied settings

Super-admin customizer = Park UI's exact theme drawer, plus Light/Dark as the **first, locked** choice, plus two brand pattern fields: **sidebar style** + **heading style** (decision.md 10.14–10.15).

| # | Knob | Catalog (Park UI presets) | Default | Editable? |
|---|---|---|---|---|
| 1 | `colorScheme` | `light` \| `dark` — **FIRST choice, locked by global settings, NOT per-user** | `light` | Super-admin only |
| 2 | `accent` | 26 presets (orange, blue, teal, red, …) | `orange` (brand) | global settings |
| 3 | `gray` | 6 neutrals (neutral, sand, slate, sage, mauve, olive) | `sand` (warm, matches legacy `#f4f3ef`) | Super-admin only |
| 4 | `font` | family list (Inter default) | `Inter` | Super-admin only |
| 5 | `radius` | none, xs, sm, md, lg, xl, 2xl | `md` | Super-admin only |
| 6 | sidebar style | `dark` (dark bg/light fg) \| `light` (light bg/dark fg) \| `brand dark text` (accent bg/dark fg) \| `brand light text` (accent bg/light fg) | `light` | Super-admin only |
| 7 | heading style | checkboxes: bold \| uppercase \| accent color (independent) | off | Super-admin only |

## Derived semantic tokens — Park UI emits these from the knobs (NOT editable)

These are the "shades of the bare minimum": every step, alpha, and variant slot is generated from the accent/gray/radius/font knobs.

**From `accent` + `gray`:**
- `accent.1–12` + `accent.a1–a12` (12-step + alpha scale, `_light`/`_dark` pairs)
- `gray.1–12` + `gray.a1–a12`
- Semantic aliases: `fg.default` (=gray.12), `fg.muted` (=gray.11), `fg.subtle` (=gray.10), `canvas` (=gray.1), `border` (=gray.4), `error` (=red.9)
- `colorPalette.*` variant slots (consumed by recipes): `solid` (bg + hover/active + fg), `subtle` (bg + hover/active + fg), `surface` (bg + hover/active, border + hover/active, fg), `outline`, `plain`

**From `radius`:** `radii.l1 / l2 / l3` (nesting: l3 wraps l2 wraps l1)

**From `font`:** `fonts.body`, `fonts.heading`, `fonts.code`

## Fixed system tokens — no knob, never editable

| Group | Values |
|---|---|
| `spacing` | 4px scale (1–8): 4, 8, 12, 16, 24, 32, 48, 64 |
| `durations` | fastest→slowest: 50 / 100 / 150 / 200 / 250 / 300 / 400ms |
| `zIndex` | consistent layering scale |
| `shadows` | xs→2xl, light/dark adaptive |
| `breakpoints` | raw `@media` — never `var()` (CSS limitation) |

## Mechanism (runtime, zero rebuild)

```html
<html data-color-scheme="light" data-accent-color="orange" data-gray-color="sand" data-radius="md" data-sidebar-style="light" data-heading-style="bold accent">
```

- A CSS-var emission block (mirrors Park UI `ThemeTokens` + `ThemeAttributes`) maps each palette → `--colors-color-palette-*` and `--radii-l1/l2/l3`.
- Super-admin saves → `platform_settings` (DB, core #20/#23) → Realtime (core #27) → applied app-wide. No user-specific scheme.

## Brand asset (logo) — NOT a token knob

- Logo = image brand asset surfaced via a brand slot (sidebar + header); set from a local object URL (lab) or Supabase Storage URL (final app) → `platform_settings` → Realtime (decision.md 10.7).
- **Logo applies on SAVE only** (decision.md 10.9) — NOT part of the live re-theme. The 5 theme knobs + sidebar style + heading style re-theme live via `<html>` data-attrs; the logo appears after save/refresh (persisted asset, not a runtime knob).
- Radius knob = Park UI **native Slider with discrete Marks** (min 0, max 6, labeled marks for the 7 preset sizes) — same pattern as Park UI's own `BorderRadiusSlider` (decision.md 10.8, findings). Preset catalog preserved.

---

## Semantic usage legend — which token to use where

> The mapping an LLM agent (or human) follows when writing a component. **First match wins** — run the decision flow top to bottom, stop at the first hit.

### Decision flow (first match wins)
1. **Is there a recipe?** (`Button`, `Badge`, `Card`, `Input`, …) → use the recipe and pick a **variant** (`solid`/`subtle`/`surface`/`outline`/`plain`). Stop — never reach for raw tokens inside a recipe component.
2. **Layout / page background?** → `canvas` (page), `colorPalette.surface` (containers/cards).
3. **Text?** → by importance: `fg.default` (primary) → `fg.muted` (secondary) → `fg.subtle` (tertiary/placeholder/disabled).
4. **Divider / border?** → `border`.
5. **Status / error?** → `error` / `success` / `warning` (status semantics — never from `accent`).
6. **Colored emphasis on an interactive element?** → `colorPalette.solid` (strongest) → `subtle` → `surface` → `outline` → `plain` (weakest), by emphasis.
7. **Stuck?** → find the closest existing component in `src/core/ui` and mirror its token usage (the code is the reference).

### Intent → token map
| Intent | Token |
|---|---|
| Page background | `canvas` |
| Card / panel / container | `colorPalette.surface.bg` + `.border` |
| Primary text | `fg.default` |
| Secondary text | `fg.muted` |
| Tertiary / placeholder / disabled text | `fg.subtle` |
| Dividers / default borders | `border` |
| Errors / destructive | `error` (destructive buttons use the error palette's `colorPalette`) |
| Primary action (high emphasis) | `colorPalette.solid` |
| Tag / badge / secondary (soft emphasis) | `colorPalette.subtle` |
| Ghost / outline button | `colorPalette.outline` |
| Text button / link | `colorPalette.plain` |
| Focus ring / selection | `--global-color-focus-ring` / `--global-color-selection` (resolved from `colorPalette`) |

### Structural rules
- **Foreground precedence** (fixed ladder): `fg.default` > `fg.muted` > `fg.subtle` — pick by information importance, not by eyeballing contrast.
- **Radius nesting**: an element nested inside a rounded container drops one level — container `l2` → inner `l1`; modals/drawers `l3`.
- **Spacing**: only the 4px scale (4, 8, 12, 16, 24, 32, 48, 64). Never invent values.
- **No primitives in components**: never reference `accent.9`, `gray.12`, `red.9` directly — semantic aliases/recipes only. (Primitives exist only as sources the knobs derive.)
- **No `var()` in media queries**: breakpoints are raw `@media`.
- **Status ≠ accent**: errors always `error`, never the accent color.

### Why agents can mostly skip token choice
Recipes + variants already encode the mapping, so the agent's job reduces to picking **semantic intent** (`variant="subtle"` for a tag) — the recipe wires the tokens. This is why the system keeps the editable surface tiny (5 theme knobs + 2 pattern fields) and the semantic surface stable.

