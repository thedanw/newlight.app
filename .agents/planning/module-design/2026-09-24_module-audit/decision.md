# Decision: Module Structure Standardization

## Context
Audit of existing modules (`people`, `forms`, `developers`) revealed inconsistencies in manifest naming, sidebar registration, and boilerplate alignment. This decision standardizes the module pattern for consistency and easier module creation.

## Decisions

### 1. Generic Manifest Export Name
**Decision:** Every module exports `Manifest` (not `peopleManifest`, `formsManifest`, etc.)

**Rationale:**
- Boilerplate becomes copy-paste ready
- Import is consistent: `import { Manifest } from '@/modules/<id>/manifest'`
- Type references are uniform across modules
- Reduces cognitive load when switching between modules

### 2. Generic Public API Exports
**Decision:** `public.ts` exports `Manifest`, `ModuleApi` (not module-prefixed names)

**Rationale:**
- Same as above — consistency enables tooling and mental model reuse
- `ModuleApi` shape is identical across modules; no need for unique names

### 3. Dynamic Sidebar Registration via Hook
**Decision:** Core provides `registerSidebarModule()` hook; modules call it in `routes.tsx`

**Rationale:**
- Removes hardcoded module list from `sidebar.tsx` (core no longer knows module internals)
- Modules self-register at load time (import side effect in `routes.tsx`)
- Single source of truth for module metadata (the manifest)
- Enables conditional visibility via `condition` callback in future

### 4. Sidebar Entry Derived from Manifest
**Decision:** Sidebar registration uses `Manifest.id`, `Manifest.name`, `Manifest.icon`, `Manifest.number`

**Rationale:**
- Eliminates duplication between manifest and sidebar
- Module number drives both hue shift AND sidebar order
- Icon defined once in manifest

### 5. Remove `nav` from Manifest
**Decision:** Drop `nav` object; derive `label` from `name`, `route` from `basePath`

**Rationale:**
- Redundant data
- `basePath` already encodes the route
- `name` already encodes the label

### 6. Dashboard Location: Root-Level `dashboard.tsx`
**Decision:** Standardize on `dashboard.tsx` at module root (not `pages/Dashboard/+Page.tsx`)

**Rationale:**
- Simpler for simple dashboards
- Matches boilerplate
- `pages/` folder reserved for complex multi-component pages per naming convention
- People module can migrate later if needed

### 7. Boilerplate Updated to Match
**Decision:** All boilerplate files in `.agents/planning/module-design/boilerplate/` use `Manifest` export

**Rationale:**
- New modules created from boilerplate will be correct by default
- No find-replace needed on scaffold

---

## Consequences

### Positive
- New modules: copy boilerplate, change 3 values (id, name, icon) → done
- Sidebar auto-updates when modules added/removed
- Type-safe manifest access across codebase
- Easier code review (consistent patterns)

### Negative
- One-time migration of 3 existing modules
- Temporary inconsistency during migration

### Neutral
- Core router still explicitly imports module routes (unchanged)
- Settings registration still explicit per module (unchanged)

---

## Implementation Order

1. Create `src/core/ui/sidebar-registry.ts`
2. Update `src/core/ui/sidebar.tsx` to use registry
3. Update boilerplate templates (5 files)
4. Migrate `people` module (5 files)
5. Migrate `forms` module (4 files)
6. Migrate `developers` module (5 files)
7. Validate: `pnpm tsc -b`, `pnpm lint`, `pnpm build`

---

## Related Decisions
- [Architecture Rules: Module Contract](../rules/architecture.md#module-contract)
- [Module Design: Decision Log](../planning/module-design/decision.md)
- [Naming Convention](../planning/module-design/naming-convention.md)

---

*Decision recorded: 2026-09-24*