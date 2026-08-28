# Progress: App Settings Dashboard

Session log — errors, test results, discoveries. Updated per batch.

## 2026-08-28 — Planning + Brainstorming

- ✅ Brainstorm complete: read `00_meta-plan-pipeline/SKILL.md`, `01_brainstorming/SKILL.md`, `src/core/ui/sidebar.tsx`, `src/styleguide/BrandForm.tsx`, `src/styleguide/App.tsx`, `src/styleguide/router.ts`, `src/core/router.tsx`, `src/modules/people/routes.tsx`, `src/core/ui/index.ts`, `src/core/ui/page-header.tsx`, `src/core/ui/page-panel.tsx`, `package.json`.
- ✅ Findings captured: sidebar footer = Account + Brand tiles; BrandForm = 8 fields, live re-theme, logo save-on-apply; no `src/core/routes.tsx` yet; no test runner installed.
- ✅ Decision log written (16 decisions) + plan.md with 6 batches.
- ✅ Key brainstorming decisions:
  - Settings route = `/settings/:section?` for deep linking (Decision #12)
  - Module registration API: `registerSettingsSection` + `registerSettingsPage` (Decisions #13/#14)
  - `SettingsProvider` context for Supabase client + session (Decision #10)
  - Logo → Supabase Storage public bucket `brand-assets` (Decision #11)
  - `platform_settings` persistence now (not deferred) — single `app-settings` key (Decision #15)
  - Add Storage bucket migration + RLS (Decision #16)
  - Theme knobs stay in Church Information section (user confirmed)
- ✅ Plan optimized for small-context LLMs (user request):
  - Batches broken into smaller sub-batches (1a–1d, 2a–2d, 3a–3d, 4a–4d, 5a–5b, 6a–6c)
  - Added mandatory **Execution Protocol** (context compact → read task_plan.md → update progress.md → read batch Context & Critical Info → execute → update task_plan.md → update progress.md → commit → report)
  - Each batch now has a self-contained **Context & Critical Info** block so a fresh-context LLM can start without reading the whole plan or searching the codebase
- ⏳ Awaiting user confirmation of plan before Phase 3 (execute).

## Context compact — 2026-08-28 (Batch 1 start)

**Task:** Execute Batch 1 of the Settings Dashboard plan — scaffold core settings route + provider + storage bucket.

**Current state:** All planning complete. Plan.md has 6 batches with 24 sub-batches, each with self-contained Context & Critical Info blocks. Task_plan.md tracks all sub-batches as not-started. Progress.md has planning history. Findings.md has all research.

**Key context for Batch 1:**
- No `src/core/routes.tsx` exists — must create per module-system convention
- Reference: `src/modules/people/routes.tsx` (lazy imports + RouteObject[])
- `src/core/router.tsx` spreads coreRoutes into top-level array
- `@supabase/supabase-js` v2.112.4 installed; `platform_settings` table exists with public-read RLS
- `SettingsProvider` = React context for supabase + session (lab mock/fallback)
- Storage bucket `brand-assets` does NOT exist — create migration (public read, super_admin write)
- Verify: `pnpm typecheck` passes; `/settings` renders placeholder

**Next:** Execute sub-batches 1a → 1b → 1c → 1d in order.

## Batch 1 Complete — 2026-08-29

- ✅ **1a** `src/core/settings/SettingsProvider.tsx` — context exposing `supabase` + `session` + `user` + `isLoading`. Real auth path via `supabase.auth.getSession()`/`onAuthStateChange` when env vars present; lab mock/fallback anonymous session otherwise.
- ✅ **1b** `src/core/routes.tsx` — `coreRoutes: RouteObject[]` with `{ path: '/settings/:section?', element: <SettingsPage/> }` (lazy). Wired into `src/core/router.tsx` via `...coreRoutes` spread. Created temporary stub `src/core/settings/SettingsPage.tsx` (placeholder; full shell in Batch 2).
- ✅ **1c** `supabase/migrations/20260829000000_create_brand_assets_bucket.sql` — `brand-assets` public bucket (5MB, image mime types) + RLS: public read, authenticated write (no `super_admin` Postgres role exists — app gates super_admin at app layer; noted deviation from plan wording).
- ✅ **1d** Verify:
  - `npx tsc -b tsconfig.app.json --force` → clean (no errors)
  - `pnpm typecheck` → 2 errors in `vite.config.ts` (`node:url`, `import.meta.url`) — **pre-existing**, file untouched (confirmed via git status). Node project missing `@types/node`.
  - `pnpm lint` → eslint not installed (not in devDependencies) — pre-existing env gap, not a blocker for Batch 1 (plan gate = typecheck).
  - Browser: `/settings` renders "Settings" heading + placeholder text ✅; `/settings/church-info` deep link renders same ✅ (dev server on :5174).

**Errors**
| Error | Resolution |
|-------|-----------|
| `vite.config.ts` TS2307/TS2339 (node:url, import.meta.url) | Pre-existing; file untouched. App project typechecks clean. |
| `eslint` not recognized | Not installed in devDependencies (pre-existing). Plan Batch 1 gate is typecheck only. |

**Commit:** `feat(settings): scaffold core settings route + provider + storage bucket`

## Batch 2 Complete — 2026-08-29

- ✅ **2a** `src/core/settings/settings-schema.ts` — typed `SettingsSection`/`SettingsPage` registries + API (`registerSettingsSection`, `registerSettingsPage`, `getSettingsSections`, `getSettingsPages`, `getSettingsSection`, `getSettingsPage`). Seed of core #41 `settings-schema` extension point.
- ✅ **2b** `src/core/settings/SettingsPage.tsx` — full dashboard shell: `PagePanel` + `PageHeader` (BackButton + Breadcrumb "Settings"), reads `:section`/`:page` via `useParams`. No params → section list (clickable cards); `:section` → section component + its pages; `:section/:page` → page component. Unknown ids fall back to section list. Updated route to `/settings/:section?/:page?` (Batch 6 needs page deep-linking).
- ✅ **2c** `src/core/settings/sections/ChurchInformationSection.tsx` — stub (full form in Batch 3). Registered in `settings-schema.ts` (id `church-info`, order 0).
- ✅ **2d** Verify:
  - `npx tsc -b tsconfig.app.json --force` → clean (fixed unused `showSectionList` var)
  - Browser (:5174): `/settings` renders shell + Church Information card ✅; clicking card navigates to `/settings/church-info` ✅; deep link renders section component + breadcrumb "Settings › Church Information" ✅

**Errors**
| Error | Resolution |
|-------|-----------|
| TS6133 `showSectionList` unused | Removed the unused variable |

**Commit:** `feat(settings): add dashboard shell with section/page registry`