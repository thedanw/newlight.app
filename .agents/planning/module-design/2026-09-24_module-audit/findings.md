# Module Structure Audit — Findings

## Inconsistencies Found

### 1. Manifest Export Names (Critical)
| Module | Current Export | Expected |
|--------|---------------|----------|
| people | `peopleManifest` | `Manifest` |
| forms | `formsManifest` | `Manifest` |
| developers | `developersManifest` | `Manifest` |

**Impact:** Boilerplate cannot be copy-pasted; requires find-replace on every new module.

### 2. Manifest Type Names (Critical)
| Module | Current Type Export | Expected |
|--------|-------------------|----------|
| people | `PeopleManifest` | `Manifest` |
| forms | `FormsManifest` | `Manifest` |
| developers | `DevelopersManifest` | `Manifest` |

### 3. Public API Exports (Critical)
| Module | Current Exports | Expected |
|--------|----------------|----------|
| people | `peopleManifest`, `PeopleManifest`, `PeopleModuleApi` | `Manifest`, `ModuleApi` |
| forms | `formsManifest`, `FormsManifest`, `FormsModuleApi` | `Manifest`, `ModuleApi` |
| developers | `developersManifest`, `DevelopersManifest`, `DevelopersModuleApi` | `Manifest`, `ModuleApi` |

### 4. Dashboard Location (Medium)
| Module | Location | Convention |
|--------|----------|------------|
| people | `pages/Dashboard/Page.tsx` | Naming convention (`+Page.tsx`) |
| forms | `dashboard.tsx` | Boilerplate default |
| developers | `dashboard.tsx` | Boilerplate default |

**Note:** People module follows the naming convention from `.agents/planning/module-design/naming-convention.md` which uses `+PeopleDashboardPage.tsx` in `pages/Dashboard/`. Forms and Developers use the simpler root-level `dashboard.tsx`. Both are valid; recommend standardizing on root-level for simplicity.

### 5. Settings Registration (Medium)
- People: Has `settings.ts` using `peopleManifest.icon`
- Forms: No settings.ts
- Developers: Has `settings.ts` using `developersManifest.icon`

### 6. Sidebar Hardcoded (Critical)
**File:** `src/core/ui/sidebar.tsx`
```typescript
const MODULES = [
  { id: 'people', label: 'People', icon: Users },
  { id: 'forms', label: 'Forms', icon: ClipboardList },
  { id: 'example', label: 'Example', icon: Palette },  // STALE
] as const
```

**Issues:**
- 'example' should be 'developers' with PencilRuler icon
- Icons duplicated in sidebar (also in manifests)
- New modules require core code change
- Violates module containment principle

### 7. Manifest Field Inconsistencies (Low)
| Field | People | Forms | Developers |
|-------|--------|-------|------------|
| alwaysOn | ✅ | ✅ | ✅ |
| nav | ✅ | ✅ | ✅ |
| number | 1 | 2 | 3 |

All three have consistent fields now (developers was updated to match).

### 8. Boilerplate vs Reality (Medium)
Boilerplate uses `<module>Manifest` placeholders but real modules use concrete names. The boilerplate should use `Manifest` as the actual export name.

---

## Architecture Violations

### 1. Core Knows Module Internals (Architecture Rule #2)
**Rule:** "Cross-module imports only via declared manifest deps; ESLint no-restricted-imports + CI enforce"
**Violation:** Sidebar imports Lucide icons for specific modules (`Users`, `ClipboardList`, `Palette`)

### 2. Single Source of Truth (Architecture Rule #7)
**Rule:** "ONLY `src/core/router.tsx` calls `createBrowserRouter`... modules contribute their own `routes.tsx` children"
**Status:** ✅ Followed — router imports module routes explicitly

### 3. Module Containment (Architecture Rule #11)
**Rule:** "Each module under `src/modules/<id>/` exports exactly: manifest.ts, public.ts, routes.tsx, index.tsx, pages/*, settings.ts"
**Status:** ✅ Mostly followed — people uses `pages/Dashboard/Page.tsx` instead of root `dashboard.tsx`

---

## Simplification Opportunities

### 1. Remove `nav` from Manifest
Currently:
```typescript
nav: {
  label: 'People',
  route: '/people',
}
```
Can be derived: `label = name`, `route = basePath`

### 2. Derive Sidebar Entry from Manifest
Instead of separate registration, sidebar entry = `{ id: Manifest.id, label: Manifest.name, icon: Manifest.icon, order: Manifest.number }`

### 3. Generic Type for ModuleBreadcrumbProvider
Currently accepts `ModuleManifest` interface. Could accept `typeof Manifest` directly.

### 4. Unified ModuleApi
Currently each module has `PeopleModuleApi`, `FormsModuleApi`, etc. All have same shape:
```typescript
export type ModuleApi = {
  readonly moduleId: 'module-id'
}
```
Can be generic in boilerplate.

---

## Recommended Pattern

### Manifest (per module)
```typescript
// src/modules/<id>/manifest.ts
export const Manifest = {
  id: '<id>',
  name: '<Name>',
  icon: IconName as LucideIcon,
  number: N,
  alwaysOn: true,
  basePath: '/<id>',
} as const

export type Manifest = typeof Manifest
```

### Public API (per module)
```typescript
// src/modules/<id>/public.ts
export { Manifest } from './manifest'
export type { Manifest } from './manifest'

export type ModuleApi = {
  readonly moduleId: '<id>'
}
```

### Routes (per module)
```typescript
// src/modules/<id>/routes.tsx
import { registerSidebarModule } from '@/core/ui/sidebar-registry'
import { Manifest } from './manifest'

registerSidebarModule({
  id: Manifest.id,
  label: Manifest.name,
  icon: Manifest.icon,
  order: Manifest.number,
})

export const routes: RouteObject[] = [
  {
    element: (
      <ModuleBreadcrumbProvider manifest={Manifest}>
        <Outlet />
      </ModuleBreadcrumbProvider>
    ),
    children: [{ index: true, element: <DashboardPage /> }],
  },
]
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing imports | High | Medium | Search/replace all `peopleManifest` → `Manifest` etc. |
| Sidebar registration timing | Low | High | Register in routes.tsx (runs at module load, before render) |
| TypeScript errors | Medium | High | Run `tsc -b` after each module migration |
| Build failures | Low | High | Run `pnpm build` after all migrations |

---

## Effort Estimate

| Task | Effort |
|------|--------|
| Create sidebar-registry.ts | 30 min |
| Update sidebar.tsx | 15 min |
| Update boilerplate (5 files) | 30 min |
| Migrate people module (5 files) | 45 min |
| Migrate forms module (4 files) | 30 min |
| Migrate developers module (5 files) | 45 min |
| Validation & testing | 30 min |
| **Total** | **~3.5 hours** |

---

*Findings documented: 2026-09-24*