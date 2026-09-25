# Module Structure Standardization Implementation Plan

**Goal:** Standardize module manifests, public APIs, and sidebar registration across all modules using a generic `Manifest` export pattern and dynamic sidebar registry hook.

**Approach:** Create sidebar registry hook, update sidebar component to use dynamic modules, update boilerplate templates, migrate 3 existing modules (people, forms, developers) to generic Manifest pattern with sidebar self-registration.

**Branch:** `feat/module-standardization` (from `main`)

**Scope:**
- In: sidebar-registry.ts, sidebar.tsx, boilerplate/*, people/*, forms/*, developers/*
- Out: Router composition (core/router.tsx stays explicit), naming convention file renames (e.g., Page.tsx → +Page.tsx)

---

## Phase 1: Setup & Foundation

| Subphase | Goal | Context (Prev → Current) | Todo | Subagent | Deliverable |
|----------|------|--------------------------|------|----------|-------------|
| 1.1 Create Sidebar Registry | New `sidebar-registry.ts` with register/get functions | Audit complete → Need core infra | Create file with `SidebarModuleEntry`, `registerSidebarModule`, `getSidebarModules` | No | `src/core/ui/sidebar-registry.ts` |
| 1.2 Update Sidebar Component | Replace hardcoded MODULES with `getSidebarModules()` | Registry exists → Sidebar uses it | Remove Lucide imports, replace MODULES const, add import | No | Updated `src/core/ui/sidebar.tsx` |
| 1.3 Update Boilerplate Templates | 5 template files use generic `Manifest` | Core infra ready → Templates ready for new modules | Update manifest.ts, public.ts, routes.tsx, dashboard.tsx, settings.ts | No | Updated `.agents/planning/module-design/boilerplate/*` |

---

## Phase 2: People Module Migration

| Subphase | Goal | Context (Prev → Current) | Todo | Subagent | Deliverable |
|----------|------|--------------------------|------|----------|-------------|
| 2.1 Migrate People Manifest | Rename export to `Manifest` | Core infra done → Migrate 1st module | `peopleManifest` → `Manifest`, keep `as const` + type | No | Updated `src/modules/people/manifest.ts` |
| 2.2 Migrate People Public API | Generic exports | Manifest done → Public API | Export `Manifest` + `ModuleApi` | No | Updated `src/modules/people/public.ts` |
| 2.3 Migrate People Routes | Import Manifest, register sidebar, export as `routes` | Public API done → Routes updated | Import `registerSidebarModule`, call with Manifest, use in provider, export `routes` | No | Updated `src/modules/people/routes.tsx` |
| 2.4 Migrate People Dashboard | Use Manifest for number/icon/name | Routes done → Dashboard updated | Import from `../../manifest`, use `Manifest.number`, `Manifest.icon`, `Manifest.name` | No | Updated `src/modules/people/pages/Dashboard/Page.tsx` |
| 2.5 Migrate People Settings | Use Manifest for id/name/icon/number | Dashboard done → Settings updated | Import Manifest, use in `registerSettingsSection` | No | Updated `src/modules/people/settings.ts` |

---

## Phase 3: Forms Module Migration

| Subphase | Goal | Context (Prev → Current) | Todo | Subagent | Deliverable |
|----------|------|--------------------------|------|----------|-------------|
| 3.1 Migrate Forms Manifest | Rename export to `Manifest` | People done → Migrate 2nd module | `formsManifest` → `Manifest` | No | Updated `src/modules/forms/manifest.ts` |
| 3.2 Migrate Forms Public API | Generic exports | Manifest done → Public API | Export `Manifest` + `ModuleApi` | No | Updated `src/modules/forms/public.ts` |
| 3.3 Migrate Forms Routes | Import Manifest, register sidebar, export as `routes` | Public API done → Routes updated | Import `registerSidebarModule`, call with Manifest, use in provider, export `routes` | No | Updated `src/modules/forms/routes.tsx` |
| 3.4 Migrate Forms Dashboard | Use Manifest for number/icon/name | Routes done → Dashboard updated | Import Manifest, use `Manifest.number`, `Manifest.icon`, `Manifest.name` | No | Updated `src/modules/forms/dashboard.tsx` |

---

## Phase 4: Developers Module Migration

| Subphase | Goal | Context (Prev → Current) | Todo | Subagent | Deliverable |
|----------|------|--------------------------|------|----------|-------------|
| 4.1 Migrate Developers Manifest | Rename export to `Manifest` | Forms done → Migrate 3rd module | `developersManifest` → `Manifest` | No | Updated `src/modules/developers/manifest.ts` |
| 4.2 Migrate Developers Public API | Generic exports | Manifest done → Public API | Export `Manifest` + `ModuleApi` | No | Updated `src/modules/developers/public.ts` |
| 4.3 Migrate Developers Routes | Import Manifest, register sidebar, export as `routes` | Public API done → Routes updated | Import `registerSidebarModule`, call with Manifest, use in provider, export `routes` | No | Updated `src/modules/developers/routes.tsx` |
| 4.4 Migrate Developers Dashboard | Use Manifest for number/icon/name | Routes done → Dashboard updated | Import Manifest, use `Manifest.number`, `Manifest.icon`, `Manifest.name` | No | Updated `src/modules/developers/dashboard.tsx` |
| 4.5 Migrate Developers Settings | Use Manifest for id/name/icon/number | Dashboard done → Settings updated | Import Manifest, use in `registerSettingsSection` | No | Updated `src/modules/developers/settings.ts` |

---

## Phase 5: Testing & Quality

| Subphase | Goal | Context (Prev → Current) | Todo | Subagent | Deliverable |
|----------|------|--------------------------|------|----------|-------------|
| 5.1 TypeScript Build | Verify no type errors | All modules migrated → Type check | Run `pnpm tsc -b`, fix any errors | No | Clean `tsc -b` output |
| 5.2 Lint & Build | Verify lint + full build pass | Types clean → Lint/build | Run `pnpm lint`, `pnpm build`, fix failures | No | Passing `pnpm build` |
| 5.3 Runtime Verification | Manual dev server check | Build passes → Runtime test | Start dev, verify sidebar shows 3 modules, dashboards load, settings accessible | No | Verified runtime behavior |
| 5.4 Cleanup | Remove unused imports, stale refs | Runtime verified → Clean | Remove Lucide imports from sidebar, any stale 'example' refs | No | Clean codebase |

---

## Acceptance Criteria

| Criterion | Verification |
|-----------|--------------|
| All modules export `Manifest` | `grep -r "export const Manifest" src/modules/` shows 3 matches |
| Sidebar uses dynamic registry | `grep "getSidebarModules" src/core/ui/sidebar.tsx` exists |
| No hardcoded module list | `grep "MODULES = " src/core/ui/sidebar.tsx` returns no hardcoded array |
| All modules register sidebar | `grep "registerSidebarModule" src/modules/*/routes.tsx` returns 3 matches |
| Build passes | `pnpm build` exits 0 |
| TypeScript clean | `pnpm tsc -b` exits 0 |

---

## Rollback Plan
1. Revert `sidebar.tsx` to hardcoded MODULES
2. Revert module manifests to original names
3. Sidebar registry can remain (harmless if unused)

---

## Context Budget (Per Phase)
- **Stable 20%**: Plan header, architecture rules, manifest pattern
- **Current 30%**: Current phase subphases, file paths
- **History 30%**: Completed phase summaries, key decisions
- **Buffer 20%**: Error handling, unexpected findings

---

*Plan created: 2026-09-24*