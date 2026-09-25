# Module Structure Audit — 2026-09-24

## Executive Summary

This audit compares the three existing modules (`people`, `forms`, `developers`) against the boilerplate template and architecture rules to identify:
1. Inconsistencies in implementation
2. Architectural simplification opportunities
3. Generic patterns for easier module creation
4. Sidebar registration hook design

---

## 1. Current Module Structure Comparison

### File Structure

| File | People | Forms | Developers | Boilerplate |
|------|--------|-------|------------|-------------|
| `manifest.ts` | ✅ | ✅ | ✅ | ✅ |
| `public.ts` | ✅ | ✅ | ✅ | ✅ |
| `routes.tsx` | ✅ | ✅ | ✅ | ✅ |
| `dashboard.tsx` | ✅ (in pages/Dashboard) | ✅ | ✅ | ✅ |
| `settings.ts` | ✅ | ❌ | ✅ | ✅ |
| `lib/` | ✅ | ✅ | ✅ (empty) | ✅ |
| `pages/` | ✅ | ✅ | ✅ | ✅ |
| `components/` | ✅ | ✅ | ✅ (empty) | ✅ |
| `settings/` | ✅ | ❌ | ✅ | ✅ |

### Key Inconsistencies

| Aspect | People | Forms | Developers | Issue |
|--------|--------|-------|------------|-------|
| Manifest export name | `peopleManifest` | `formsManifest` | `developersManifest` | **Not generic** — each module uses different name |
| Manifest type export | `PeopleManifest` | `FormsManifest` | `DevelopersManifest` | **Not generic** |
| Public API export | `peopleManifest` | `formsManifest` | `developersManifest` | **Not generic** |
| Public API type | `PeopleManifest` | `FormsManifest` | `DevelopersManifest` | **Not generic** |
| ModuleApi type | `PeopleModuleApi` | `FormsModuleApi` | `DevelopersModuleApi` | **Not generic** |
| Dashboard location | `pages/Dashboard/Page.tsx` | `dashboard.tsx` | `dashboard.tsx` | **Inconsistent** — people uses pages subfolder |
| Settings registration | ✅ uses `peopleManifest.icon` | N/A | ✅ uses `developersManifest.icon` | Coupled to module-specific name |

---

## 2. Manifest Analysis

### Current Manifest Structure (All Modules)

```typescript
// People
export const peopleManifest = {
  id: 'people',
  name: 'People',
  icon: Users as LucideIcon,
  number: 1,
  alwaysOn: true,
  basePath: '/people',
  nav: { label: 'People', route: '/people' },
} as const

// Forms
export const formsManifest = {
  id: 'forms',
  name: 'Forms',
  icon: ClipboardList as LucideIcon,
  number: 2,
  alwaysOn: true,
  basePath: '/forms',
  nav: { label: 'Forms', route: '/forms' },
} as const

// Developers
export const developersManifest = {
  id: 'developers',
  name: 'Developers',
  icon: PencilRuler as LucideIcon,
  number: 3,
  alwaysOn: true,
  basePath: '/developers',
  nav: { label: 'Developers', route: '/developers' },
} as const
```

### Problems

1. **Export names differ** — `peopleManifest` vs `formsManifest` vs `developersManifest`
2. **Type names differ** — `PeopleManifest` vs `FormsManifest` vs `DevelopersManifest`
3. **`alwaysOn` field** — Only in developers (people/forms don't have it but could use it)
4. **`nav` object** — Redundant with `id`/`name`/`basePath`; could be derived
5. **Boilerplate mismatch** — Boilerplate uses `<module>Manifest` placeholder; real modules use concrete names

---

## 3. Sidebar Registration — Current Problem

### Current Implementation (src/core/ui/sidebar.tsx)

```typescript
const MODULES = [
  { id: 'people', label: 'People', icon: Users },
  { id: 'forms', label: 'Forms', icon: ClipboardList },
  { id: 'example', label: 'Example', icon: Palette },  // ← STALE: should be 'developers'
] as const
```

**Problems:**
1. **Hardcoded in core** — Sidebar knows about specific modules
2. **Stale entry** — Still shows 'example' instead of 'developers'
3. **No dynamic registration** — New modules require editing core sidebar code
4. **Icon duplication** — Icons imported in both manifest AND sidebar
5. **Violates module containment** — Core shouldn't know module internals

---

## 4. Architecture Simplification Opportunities

### 4.1 Generic Manifest Export Pattern

**Proposed:** Every module exports `Manifest` (not `peopleManifest`, etc.)

```typescript
// src/modules/people/manifest.ts
export const Manifest = {
  id: 'people',
  name: 'People',
  icon: Users as LucideIcon,
  number: 1,
  alwaysOn: true,
  basePath: '/people',
} as const

export type Manifest = typeof Manifest
```

**Benefits:**
- Boilerplate becomes copy-paste ready (no find-replace needed)
- Import becomes `import { Manifest } from '@/modules/people/manifest'`
- Core code can use generic types: `ModuleManifest<typeof Manifest>`
- Type-safe without module-specific naming

### 4.2 Generic Public API

```typescript
// src/modules/people/public.ts
export { Manifest } from './manifest'
export type { Manifest } from './manifest'

export type ModuleApi = {
  readonly moduleId: 'people'
}
```

### 4.3 Sidebar Registration Hook

**Design:** Core provides a registration hook; modules call it at load time.

```typescript
// src/core/ui/sidebar-registry.ts
export interface SidebarModuleEntry {
  id: string
  label: string
  icon: LucideIcon
  order?: number
  condition?: () => boolean  // for role-based visibility
}

const modules: SidebarModuleEntry[] = []

export function registerSidebarModule(entry: SidebarModuleEntry) {
  const existing = modules.findIndex(m => m.id === entry.id)
  if (existing >= 0) modules[existing] = entry
  else modules.push(entry)
  modules.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

export function getSidebarModules(): ReadonlyArray<SidebarModuleEntry> {
  return modules
}
```

**Module usage (in routes.tsx or manifest.ts):**

```typescript
// src/modules/people/routes.tsx
import { registerSidebarModule } from '@/core/ui/sidebar-registry'
import { Manifest } from './manifest'

registerSidebarModule({
  id: Manifest.id,
  label: Manifest.name,
  icon: Manifest.icon,
  order: Manifest.number,
})
```

**Sidebar component:**
```typescript
// src/core/ui/sidebar.tsx
import { getSidebarModules } from './sidebar-registry'

const MODULES = getSidebarModules()  // Dynamic!
```

### 4.4 Dashboard Location Consistency

**Current:**
- People: `pages/Dashboard/Page.tsx` (follows naming convention with `+`)
- Forms: `dashboard.tsx` (root level)
- Developers: `dashboard.tsx` (root level)

**Recommendation:** Use root-level `dashboard.tsx` for all modules (simpler, matches boilerplate). The naming convention allows `+DashboardPage.tsx` inside `pages/Dashboard/` but that's for complex pages with sub-components. For simple dashboards, root level is fine.

---

## 5. Proposed Standardized Module Template

### File: manifest.ts (Standardized)

```typescript
import type { LucideIcon } from 'lucide-react'
import { IconName } from 'lucide-react'

export const Manifest = {
  id: 'module-id',
  name: 'Module Name',
  icon: IconName as LucideIcon,
  number: 1,                    // Module number for hue shift
  alwaysOn: true,               // Always show in sidebar (if false, use condition)
  basePath: '/module-id',
  // nav derived from id/name/basePath — no separate nav object needed
} as const

export type Manifest = typeof Manifest
```

### File: public.ts (Standardized)

```typescript
export { Manifest } from './manifest'
export type { Manifest } from './manifest'

export type ModuleApi = {
  readonly moduleId: 'module-id'
}
```

### File: routes.tsx (Standardized)

```typescript
'use client'
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { ModuleBreadcrumbProvider } from '@/core/ui'
import { Manifest } from './manifest'
import { registerSidebarModule } from '@/core/ui/sidebar-registry'

// Register sidebar entry at module load
registerSidebarModule({
  id: Manifest.id,
  label: Manifest.name,
  icon: Manifest.icon,
  order: Manifest.number,
})

// Register settings if needed
import './settings'

const DashboardPage = lazy(() => import('./dashboard'))

function ModuleLayout() {
  return (
    <ModuleBreadcrumbProvider manifest={Manifest}>
      <Outlet />
    </ModuleBreadcrumbProvider>
  )
}

import { Outlet } from 'react-router-dom'

export const routes: RouteObject[] = [
  {
    element: <ModuleLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      // Add routes here
    ],
  },
]
```

### File: dashboard.tsx (Standardized)

```typescript
import { useState, type CSSProperties } from 'react'
import { Manifest } from './manifest'
import { Heading, Page } from '@/core/ui'
import { Stack } from 'styled-system/jsx'

export default function DashboardPage() {
  const moduleNumberStyle = { '--module-number': Manifest.number } as CSSProperties

  return (
    <Page.Main>
      <Page.HeaderTop style={moduleNumberStyle} />
      <Page.Header headerVariant="hero" style={moduleNumberStyle}>
        <Page.Heading level={0} icon={Manifest.icon} title={Manifest.name} />
      </Page.Header>
      <Page.HeaderBottom style={moduleNumberStyle}>
        {/* Dashboard content */}
      </Page.HeaderBottom>
      <Page.Body>
        <Stack gap="6">
          {/* Dashboard widgets */}
        </Stack>
      </Page.Body>
    </Page.Main>
  )
}
```

### File: settings.ts (Standardized, Optional)

```typescript
import { registerSettingsSection } from '@/core/settings/lib/schema'
import SettingsPage from './settings/SettingsPage'
import { Manifest } from './manifest'

registerSettingsSection({
  id: Manifest.id,
  title: `${Manifest.name} Settings`,
  description: `${Manifest.name} module settings.`,
  component: SettingsPage,
  icon: Manifest.icon,
  order: Manifest.number * 10,
  group: 'modules',
})
```

---

## 6. Migration Plan

### Phase 1: Core Infrastructure
1. Create `src/core/ui/sidebar-registry.ts` with `registerSidebarModule` and `getSidebarModules`
2. Update `src/core/ui/sidebar.tsx` to use `getSidebarModules()` instead of hardcoded array
3. Update boilerplate template files to use generic `Manifest` export

### Phase 2: Module Migration (One at a time)
For each module (`people`, `forms`, `developers`):
1. Rename manifest export to `Manifest` (keep `as const` + type export)
2. Update `public.ts` to export generic `Manifest`
3. Update `routes.tsx` to import `Manifest` and call `registerSidebarModule`
4. Update `dashboard.tsx` to use `Manifest`
5. Update `settings.ts` to use `Manifest` (if exists)
6. Update any internal imports from `peopleManifest` → `Manifest`

### Phase 3: Core Router Cleanup
- Core router continues to import `peopleRoutes`, `formsRoutes`, `developersRoutes` explicitly
- This is intentional — router is the composition root; modules don't auto-register routes

---

## 7. Decision Gaps / Questions

| # | Question | Recommendation |
|---|----------|----------------|
| 1 | Should `nav` object be removed from manifest? | Yes — derive from `id`/`name`/`basePath` |
| 2 | Should `alwaysOn` be required or optional? | Optional with default `true`; if `false`, module provides `condition` in sidebar registration |
| 3 | Dashboard location: root `dashboard.tsx` or `pages/Dashboard/+DashboardPage.tsx`? | Root `dashboard.tsx` for simplicity; use `pages/` for complex multi-component pages |
| 4 | Sidebar registration: in `routes.tsx` or `manifest.ts`? | `routes.tsx` — runs at module load, has access to Manifest, keeps manifest pure data |
| 5 | ModuleApi type — keep or remove? | Keep for future plugin/module communication; export generically as `ModuleApi` |
| 6 | Boilerplate `settings.ts` references `@/core/settings/settings-schema` but real modules use `@/core/settings/lib/schema` — which is correct? | Use `@/core/settings/lib/schema` (actual path) |

---

## 8. Files to Create/Update

### New Files
- `.agents/planning/module-design/2026-09-24_module-audit/audit.md` (this file)
- `src/core/ui/sidebar-registry.ts` (new)

### Files to Update
- `src/core/ui/sidebar.tsx` — use dynamic modules
- `.agents/planning/module-design/boilerplate/manifest.ts` — generic `Manifest` export
- `.agents/planning/module-design/boilerplate/public.ts` — generic exports
- `.agents/planning/module-design/boilerplate/routes.tsx` — register sidebar, use `Manifest`
- `.agents/planning/module-design/boilerplate/dashboard.tsx` — use `Manifest`
- `.agents/planning/module-design/boilerplate/settings.ts` — use `Manifest`
- `src/modules/people/manifest.ts` — rename to `Manifest`
- `src/modules/people/public.ts` — generic exports
- `src/modules/people/routes.tsx` — register sidebar, use `Manifest`
- `src/modules/people/dashboard.tsx` (or pages/Dashboard/Page.tsx) — use `Manifest`
- `src/modules/people/settings.ts` — use `Manifest`
- `src/modules/forms/manifest.ts` — rename to `Manifest`
- `src/modules/forms/public.ts` — generic exports
- `src/modules/forms/routes.tsx` — register sidebar, use `Manifest`
- `src/modules/forms/dashboard.tsx` — use `Manifest`
- `src/modules/developers/manifest.ts` — rename to `Manifest`
- `src/modules/developers/public.ts` — generic exports
- `src/modules/developers/routes.tsx` — register sidebar, use `Manifest`
- `src/modules/developers/dashboard.tsx` — use `Manifest`
- `src/modules/developers/settings.ts` — use `Manifest`

---

## 9. Validation Checklist

After migration, verify:
- [ ] All three modules build without TypeScript errors
- [ ] Sidebar shows all three modules with correct icons/labels
- [ ] Module numbers (hue shift) work correctly
- [ ] Settings pages accessible at `/settings/people`, `/settings/developers`
- [ ] `pnpm lint:pages` passes
- [ ] `pnpm build` passes
- [ ] No hardcoded module references remain in `sidebar.tsx`

---

## 10. Appendix: Current File-by-File Diff Map

### people/manifest.ts
```diff
- export const peopleManifest = {
+ export const Manifest = {
```

### people/public.ts
```diff
- export { peopleManifest } from './manifest'
- export type { PeopleManifest } from './manifest'
+ export { Manifest } from './manifest'
+ export type { Manifest } from './manifest'
 
 export type PeopleModuleApi = {
+ export type ModuleApi = {
-   readonly moduleId: 'people'
+   readonly moduleId: 'people'
 }
```

### people/routes.tsx
```diff
- import { peopleManifest } from './manifest'
+ import { Manifest } from './manifest'
+ import { registerSidebarModule } from '@/core/ui/sidebar-registry'
 
+ registerSidebarModule({
+   id: Manifest.id,
+   label: Manifest.name,
+   icon: Manifest.icon,
+   order: Manifest.number,
+ })
 
- function PeopleLayout() {
+ function ModuleLayout() {
   return (
     <ModuleBreadcrumbProvider manifest={Manifest}>
       <Outlet />
     </ModuleBreadcrumbProvider>
   )
 }
 
- export const peopleRoutes: RouteObject[] = [
+ export const routes: RouteObject[] = [
```

### forms/manifest.ts, forms/public.ts, forms/routes.tsx, forms/dashboard.tsx
(Same pattern as people)

### developers/manifest.ts, developers/public.ts, developers/routes.tsx, developers/dashboard.tsx, developers/settings.ts
(Same pattern as people)

### core/ui/sidebar.tsx
```diff
- const MODULES = [
-   { id: 'people', label: 'People', icon: Users },
-   { id: 'forms', label: 'Forms', icon: ClipboardList },
-   { id: 'example', label: 'Example', icon: Palette },
- ] as const
+ import { getSidebarModules } from './sidebar-registry'
+ const MODULES = getSidebarModules()
```

---

*End of audit document*