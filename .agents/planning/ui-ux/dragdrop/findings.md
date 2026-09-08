# Findings: Core Drag-and-Drop Ordering (Reorder)

Research digest gathered 2026-09-08. Sources: `motion.dev/docs/react-reorder` (via jina.ai), `package.json`, `node_modules/framer-motion` probe, `src/core/plugins/*`, `src/core/settings/lib/schema.ts`, `src/modules/people/**`, `supabase/migrations/*`, repo memory (`framework-stack.md`, `module-system.md`, `ui-design-lab.md`, `ui-ux-decision-hierarchy.md`).

## 1. Library landscape (what's installed vs. what's out there)

| Option | Installed? | Mobile | Keyboard/a11y | React 19 + Ark portal safety | Notes |
|---|---|---|---|---|---|
| **`framer-motion` `Reorder`** | ✅ `framer-motion@13.1.1` | Good (pointer events) | Partial (no built-in keyboard) | Safe — Reorder Group/Item don't use Ark portals; the known incompat is `AnimatePresence`+Ark portals, avoidable | **Verified** `Reorder.Group` (object) + `useDragControls` (function) exported. Same API as `motion.dev/docs/react-reorder`. Zero new dep. |
| `@dnd-kit/core` | ❌ | Excellent (TouchSensor) | Excellent (keyboard sensor) | Clean, no portal coupling | Best-in-class but new dep; fallback if keyboard-first a11y becomes hard requirement |
| `@hello-pangea/dnd` | ❌ | Good | Good | Heavier | New dep |
| `sortablejs` | ❌ | Good | Weak | jQuery-ish | New dep |
| Hand-rolled `@use-gesture/react` | ✅ `@use-gesture/react@10.3.1` | Good | Weak | Full control | Already used by waffle sidebar; reinvents sortable-list mechanics |

**Verified probe (terminal):**
```
version 13.1.1
exports keys: ., ./debug, ./dom/mini, ./dom, ./client, ./m, ./mini, ./projection, ./package.json
Reorder? object function   ← Reorder.Group + useDragControls present
contains Reorder           ← dist bundle contains Reorder
```

**motion.dev/docs/react-reorder key facts (via jina.ai):**
- `Reorder.Group` renders `<ul>` by default (`as` prop to change); auto-detects drag axis (x / y / xy); `values` + `onReorder` are the controlled contract.
- `Reorder.Item` takes `value`; accepts all `motion` component props; `as` defaults to `li`.
- `useDragControls` + `dragListener={false}` + `dragControls` → dedicated drag handle (the `Reorder.Handle` pattern).
- Auto-scroll: if the Group is inside a scrollable container, it auto-scrolls when dragging near top/bottom.
- z-index: dragged item gets `z-index` automatically — requires `position !== 'static'` (set `relative`).
- `AnimatePresence` works for enter/exit — **but we forbid it around Ark portals (see §4).**

## 2. Existing ordering implementations (the problem)

1. **`src/modules/people/components/JourneySettingsManager.tsx`** — hand-rolled HTML5 `draggable` DnD. Maintains `trackOrder`/`categoryOrder`/`stageOrder` id-arrays, `moveItem(ids, draggedId, targetId)` splice util, `onDragStart/onDragOver/onDrop`, persists `sort_order: index`. **No library, no mobile support, no a11y.**
2. **`src/modules/people/pages/FormBuilderPage.tsx`** — manual Up/Down buttons (`moveField(index, -1/+1)`), maps draft `sort_order` ↔ `form_fields.sort_order`. **No drag at all.**
3. **`src/core/plugins/HookRegistry.ts`** + **`src/core/settings/lib/schema.ts`** — in-memory `(a, b) => (a.order ?? 0) - (b.order ?? 0)` sort-on-register for nav items, settings sections/pages/links. **No persistence, no UI.** Note: `registerPluginDashboardWidget` does NOT sort (insertion order).

## 3. Supabase ordered-collection candidates

Tables with explicit `sort_order` column:
- `journey_track_categories`, `journey_tracks`, `journey_stages` — `20260826005400_create_journey_tables.sql`
- `form_fields` (`sort_order int not null default 0`) — `20260828100000_create_forms.sql`
- `service_plan_items` (`sort_order integer`) — `20260826003532_create_services_songs.sql`

Plausible future ordered collections (no sort col yet): `custom_fields`, `people_categories`, `people_flow_steps`, `service_types`, `song_categories`, `calendars`, `saved_lists`, dashboard widgets, nav items.

## 4. Framework constraints (from repo memory — must not be violated)

- **React 19 + Ark UI portal incompatibility:** `framer-motion` `AnimatePresence` is INCOMPATIBLE with Ark UI `Portal` components (Select/Dialog) under React 19 → "Invalid hook call"/blank page. House pattern = **pure CSS keyframe animations** (settings panel stack). → Reorder enter/exit must use CSS keyframes, NOT `AnimatePresence` around portal-bearing content.
- **Reduced motion:** OS `prefers-reduced-motion: reduce` is ON for the user. Direct-manipulation drag tracking must NEVER be gated on reduced motion; only the release animation is suppressed (waffle-sidebar lesson).
- **`@park-ui/cli add` regenerates `src/core/ui/index.ts`** and drops custom exports → re-add custom exports after any CLI use.
- **Dynamic custom properties** must go in the `style` prop, not `css` (Panda static extraction can't resolve dynamic values — `--module-number` lesson).
- **Token enforcement:** `pnpm lint:tokens` flags raw px/hex on tokenized props; `strictPropertyValues: true` in panda.config.ts.
- **`Page.Body` is a `withContext` slot** requiring `Page.Root` ancestor; public/standalone routes keep semantic `<main>`.
- **`tsc -b` is ground truth** (plain `npx tsc --noEmit` false-passes on solution-style tsconfig).
- **Hidden automation browser:** rAF never fires, CSS transitions frozen → verify reorder state via React state/DOM, not animation. Physical clicks can be swallowed by use-gesture drag handlers → use `dispatchEvent('click')`/programmatic clicks.

## 5. Plugin system surface (integration seam)

- **Loading:** `PluginLoader.tsx` wraps children in nested `PluginProvider`s; `pluginManager.ts` validates manifests (Zod), builds `apiContext` via `createPluginAPIContext(...)`, invokes manifest-declared hooks.
- **Extension points (HookRegistry):** settings sections, settings pages, dashboard widgets, nav items, settings links — all sorted by `order??0` except widgets.
- **`PluginAPIContext` shape:** `{ supabase, settings, router, toast, i18n, pluginName, pluginVersion }` — the `reorder` API slots in here.
- **Manifest schema:** `PluginManifest` with `settings?`, `dashboardWidgets?`, `navItems?`, `hooks?`, `permissions` (zod enum incl. people/journey/tags/forms/platform/elvanto r+w).
- **Barrel:** `src/core/plugins/index.ts` re-exports `manifest-schema`, `HookRegistry`, `PluginAPI`, `PluginLoader`.

## 6. Naming & component conventions (from repo memory)

- Compound slot pattern: `Page.Root/Header/Body/Footer` (createStyleContext + slot recipe). Reorder should mirror: `Reorder.Root/Item/Handle`.
- Flat primitives: `BackButton`, `IconButton`, `Card`, etc. in `src/core/ui/*.tsx`, exported alphabetically from `src/core/ui/index.ts`.
- Recipes in `src/core/theme/recipes/*.ts` via `defineSlotRecipe`; recipe files must NOT export runtime values (build-time-only `@pandacss/dev` import).
- `Stack`/`HStack` come from `styled-system/jsx`, NOT the core/ui barrel.
- Semantic/hierarchical naming is a stated app principle (user requirement #1).