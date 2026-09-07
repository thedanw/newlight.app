# Progress: People Module Profile Refactor

## Session log

### 2026-09-06 — Planning phase
- Read and consolidated 6 planning docs into 1 decision.md (78 decisions) + 1 peopleFields.md
- Deleted findings.md, plan.md, progress.md, task_plan.md (consolidated into decision.md)
- Created discrepancy-audit.md (audit results)
- Audited decision.md + peopleFields.md against src/modules/people/ implementation
- Found key gaps:
  - people_relationships table missing from database.types.ts (exists in migrations)
  - No INSERT/UPDATE/DELETE RLS policy for people_relationships
  - GuardiansSection is a stub (placeholder text)
  - ChildSafetySection shows 5/17 fields (simplified)
  - No self-view detection in PersonProfilePage
  - Dashboard "New person" button always visible (no RLS gating)
  - PeopleFilters lacks journey track/stage filters (data layer supports them)
  - PersonForm uses native <select> controls (pending Batch 13 polish)
- Established test env: vitest only (no React Testing Library), existing tests are pure-logic only
- Confirmed: contact_channels table exists in schema but ContactSection shows mobile shadow only
- Added UX decisions #79–86 to decision.md based on user answers

### Next: Phase 2 — Plan
- Create plan.md with atomic TDD batches ✅
- Wait for user confirmation → proceeded to execution

### 2026-09-06 — Batch 1 Complete
- ✅ Task 1.1: Installed @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, happy-dom; created vitest.config.ts (happy-dom env + setupFiles); created src/setupTests.ts
- ✅ Task 1.2: Added PersonRelationshipRow TableDefinition to database.types.ts
- ✅ Task 1.3: Added PersonRelationship type to types.ts
- ✅ Task 1.4: Wrote 29 failing tests for deriveProfilePermissions (tdd red)
- ✅ Task 1.5: Implemented deriveProfilePermissions + useProfilePermissions hook (tdd green)
- Tests: 69 passed (40 existing + 29 new)
- Commit: 5ec5f3d
- Errors: jest-dom v7 import path issue → fixed with `/vitest` subpath import
- Budget: Stable 20% | Current 30% | History 30% | Buffer 20%

### 2026-09-06 — Batch 3 Complete
- ✅ Task 3.1: Added migration `20260906215800_add_people_relationships_write_policies.sql` — INSERT/UPDATE/DELETE RLS for authenticated on `people_relationships`
- ✅ Task 3.2: Added `getPersonGuardians(personId)` query — two-query join pattern (relationships → people)
- ✅ Task 3.3: Added `createPersonRelationship()` with self-parenting guard + `createContactOnlyParent()` helper
- ✅ Task 3.4: Wrote 5 tests in `relationships.test.ts` (guardian lookup, empty guardians, create relationship, self-parenting protection, contact-only parent creation)
- ✅ Task 3.5: Implemented `GuardiansSection` — read-only guardian list with View links + Add modal (Dialog) for contact-only parent, RLS-gated via `canManageGuardians`
- Tests: 76 passed (71 existing + 5 new relationship tests)
- Files changed: `supabase/migrations/20260906215800_add_people_relationships_write_policies.sql`, `src/modules/people/lib/queries.ts`, `src/modules/people/lib/hooks.ts`, `src/modules/people/lib/relationships.test.ts`, `src/modules/people/components/sections/GuardiansSection.tsx`
- Errors: `Stack` not exported from `@/core/ui` → imported from `styled-system/jsx`
- Budget: Stable 20% | Current 30% | History 30% | Buffer 20%

### 2026-09-06 — Batch 5 Complete
- ✅ Task 5.2: Added `useProfilePermissions`-based gating to `PersonProfilePage` — passes `canEdit`, `canEditChildSafety`, `canManageGuardians` to sections; `PersonHeader` gates Edit person button
- ✅ Task 5.3: Gated dashboard "New person" button via `useCurrentOperatorPermission()` — visible for admin/super_admin/team_leaders only
- ✅ Task 5.4: Added journey track + stage filter dropdowns to `PeopleFilters` — wired to `journeyTrackId`/`journeyStage` in `PeopleListOptions`
- Tests: 82 passed (no new tests added; gating verified via existing section tests)
- Files changed: `src/modules/people/pages/PersonProfilePage.tsx`, `src/modules/people/components/PersonHeader.tsx`, `src/modules/people/components/sections/*.tsx`, `src/modules/people/dashboard.tsx`, `src/modules/people/components/PeopleFilters.tsx`, `src/modules/people/lib/hooks.ts`, `src/modules/people/lib/queries.ts`
- Errors: `useJourneyStages` missing → added to hooks/queries; unused imports cleaned up
- Budget: Stable 20% | Current 30% | History 30% | Buffer 20%

### 2026-09-06 — Batch 4 Complete
- ✅ Task 4.1: Wrote failing tests for PersonalSection, DemographicsSection, ContactSection inline-edit behavior
- ✅ Task 4.2: Refactored `PersonalSection` to inline-edit — 7 fields: firstname, middle_name, lastname, preferred_name, gender, date_of_birth, marital_status
- ✅ Task 4.3: Refactored `DemographicsSection` to inline-edit — demographic, school_name, kindy_start_year, school_email_permission; school_year remains calculated display
- ✅ Task 4.4: Refactored `ContactSection` to inline-edit — email, mobile
- ✅ Task 4.5: Wired save handler — `updatePerson` + per-field `writePeopleAudit`; self-view uses same path per decision #80
- Tests: 82 passed (76 existing + 6 new inline-edit tests)
- Files changed: `src/modules/people/components/sections/PersonalSection.tsx`, `PersonalSection.test.tsx`, `DemographicsSection.tsx`, `DemographicsSection.test.tsx`, `ContactSection.tsx`, `ContactSection.test.tsx`
- Errors: Test matchers refined for duplicate text; `Stack` import corrected
- Budget: Stable 20% | Current 30% | History 30% | Buffer 20%

### 2026-09-06 — Batch 2 Complete
- ✅ Task 2.1: Fixed failing test — replaced `<details>/<summary>` with Ark UI Collapsible + stable button-role query + `userEvent.click`
- ✅ Task 2.2: Expanded `ChildSafetySection` to all 17 fields: WWCC (6), SMT (3), SMC (5), safe_ministry_* (3)
- ✅ Task 2.3: Implemented collapsible card with `Collapsible.Root` + `Collapsible.Trigger` + `Collapsible.Content` + `Collapsible.Indicator`
- ✅ Task 2.4: Added inline editing + save via `updatePerson` + audit logging via `writePeopleAudit` per changed field
- Tests: 71 passed (69 existing + 2 new ChildSafetySection tests)
- Files changed: `src/modules/people/components/sections/ChildSafetySection.tsx`, `ChildSafetySection.test.tsx`
- Errors: happy-dom `<details>` children leak → fixed with Ark UI Collapsible; nested `<button>` warning → removed inner `Button`, used styled `<span>`
- Budget: Stable 20% | Current 30% | History 30% | Buffer 20%
