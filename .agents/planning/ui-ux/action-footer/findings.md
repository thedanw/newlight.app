# Findings: Action Footer (Path B)

Research consolidated for the implementation plan. Refs: `plan.md` phases.

## Current State (2026-09-09)
- `AppShell` (`src/core/ui/app-shell.tsx`) renders `Page.Root` → `ErrorBoundary` → `Suspense` → outlet. **No footer today.**
- `Page.Footer` (`src/core/ui/page.tsx`) is a **page-rendered sibling** of `Page.Main` under `Page.Root`, in-flow (`flexShrink: 0`). Recipe has an unused `footerVariant: 'fixed'` (`position: fixed; bottom: 0`).
- **Only 2 pages render `Page.Footer`:** `src/core/settings/pages/ChurchInformationPage.tsx` (Cancel/Apply, already has `isDirty` + `isDirtyRef`) and `src/modules/people/pages/EditPersonPage.tsx` (Save changes/Cancel, multi-section via refs). Both render the footer **unconditionally** (even when pristine).
- `SettingsActionsProvider` / `useSettingsActions` (`src/core/settings/lib/actions-context.tsx`) + `SettingsActions` type (`section-actions.ts`) **already exist but are completely unused** — the seed of the "hook into it" mechanism.
- `useOrderedCollection` (`src/core/lib/useOrderedCollection.ts`) already exposes `isDirty` / `save` / `reset` — used by `FormBuilderPage`, elvanto `FieldMappingTable`, etc.
- `ModuleBreadcrumbProvider` renders **no DOM** (a wrapper `<div>` breaks the flex height chain) — any shell footer must be a direct child of `Page.Root` and **out of flow**.
- **Enforcement reality:** `scripts/lint-pages.mjs` (zero-dep static gate, runs in `pnpm build`) is the working gate. **No ESLint config exists** (not in devDependencies; `pnpm lint` is aspirational per `module-design/decision.md`).
- Viewport meta is `width=device-width, initial-scale=1.0` — no `viewport-fit=cover` or `interactive-widget=resizes-content`.

## Forms Inventory
| File | Current | Migrate |
|------|---------|---------|
| `src/core/settings/pages/ChurchInformationPage.tsx` | `Page.Footer` (Cancel/Apply), `isDirty` | YES (2.2) |
| `src/modules/people/pages/EditPersonPage.tsx` | `Page.Footer` (Save/Cancel), multi-section | YES (2.2) |
| `src/modules/people/components/PersonForm.tsx` | inline submit/cancel props, `saving` | YES (2.3) |
| `src/modules/people/pages/CreatePersonPage.tsx` | passes props to `PersonForm` | no change (PersonForm registers) |
| `src/modules/people/pages/FormBuilderPage.tsx` | save in `Card.Footer`, `useOrderedCollection` `isDirty` | YES (2.3) |
| `src/core/auth/AccountPage.tsx` | inline change-password submit | YES (2.3) |
| `src/content/plugins/elvanto-sync/settings/*Tab.tsx` | per-tab inline save | DEFER (Tabs mount behavior) |
| `src/modules/people/pages/FormPublicPage.tsx` | public submission | EXCLUDE (not in shell) |
| `src/core/auth/LoginPage.tsx` | public | EXCLUDE (not in shell) |

## Architecture
### API
`PageActions = { cancel, apply, isSaving, isDirty, applyLabel? }`. `register(actions)` returns a cleanup; forms call it in a `useEffect` so route unmount clears the footer (no stale footer on next route). Re-register on `isDirty` change is cheap (React batches cleanup+register in the same flush — no flicker). Ref-based `isDirty` read is a fallback optimization only.

### Positioning
`position: absolute` within `Page.Root` (`position: relative`) — out of flow, spans the page panel. **NOT `fixed`** (would overlap the sidebar). `--footer-height` var → `Page.Main` `scrollPaddingBottom` so the last field isn't occluded.

### Dirty semantics
`visible = actions && actions.isDirty`. `EditPersonPage` registers `isDirty: true` first pass (multi-section dirty aggregation = follow-up: expose `isDirty` on `EditableSectionHandle` and aggregate).

## Traps (must handle)
1. **Off-screen ≠ hidden:** `inert` + `aria-hidden` when hidden (keyboard focus). React 19 supports `inert` as a boolean prop.
2. **Layout:** absolute, never in-flow (flex chain).
3. **Route cleanup:** register on mount, clear on unmount.
4. **Mobile keyboard:** `interactive-widget=resizes-content` + `env(safe-area-inset-bottom)`.
5. **Reduced motion:** `prefers-reduced-motion` → no transform.
6. **Occlusion:** `--footer-height` → `Page.Main` `scrollPaddingBottom`.

## Enforcement
- `lint-pages.mjs` check 1: ban `Page.Footer` in routed pages (allowlist `page.tsx` + `app-shell.tsx`).
- `lint-pages.mjs` check 2: routed pages with `<form`/`onSubmit=` must import `usePageActions` (allowlist `LoginPage`/`FormPublicPage`).
- ESLint: not installed; `no-restricted-imports` is a future gate (gap log in `module-design/decision.md`).

## Docs to Update
- `module-design/decision.md` (Page Layout Structure + Decision Log entry 9 + gap log)
- `ui-ux/heading-breadcrumb/decision.md` (decision 2.1 — footer no longer "outside scroll container")
- `ui-ux/decision.md` + `core/settings/decision.md` + `README.md`
- New: `action-footer/decision.md` (canonical)

## ADR — Locked Decisions (Batch 1, 2026-09-09)
- **API:** `PageActions = { cancel, apply, isSaving, isDirty, applyLabel? }`; `register(actions)` → cleanup; forms call in `useEffect` (route unmount clears footer). LOCKED.
- **Positioning:** `position: absolute` in `Page.Root` (relative), out of flow, spans page panel; NOT `fixed` (sidebar overlap). `--footer-height` → `Page.Main` `scrollPaddingBottom`. LOCKED.
- **Dirty semantics:** `visible = actions && actions.isDirty`; `EditPersonPage` registers `isDirty: true` first pass (multi-section aggregation = follow-up). LOCKED.
- **Branch:** NO branch — implement on current branch `feat/people-module` (user decision 2026-09-09).