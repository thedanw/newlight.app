# Plan: People Module — Multipurpose Profile & Remaining Decisions

**Goal:** Refactor people module profile into single multipurpose inline-edit view (admin view, admin edit, self-view) with RLS-gated actions; implement guardians section; expand child safety to full inline; add dashboard RLS gating.

**Approach:** Permission-aware profile shell (`useProfilePermissions`) detects self-view + operator role → compose inline-editable section components using existing PersonForm patterns (display → edit-in-place toggle). Gate UI actions at component layer; RLS is server-side authority. Add `people_relationships` table type + RLS write policies.

**Branch:** `feature/people-profile-inline-edit` (from `main`)

## Scope

### In
- Multipurpose profile: single `PersonProfilePage` toggles read/inline-edit for admin + self-view contexts
- Inline-edit `PersonalSection`, `DemographicsSection`, `ContactSection` (email + mobile)
- Child Safety: expand to full inline (all WWCC/SMT/SMC fields in collapsible card)
- Guardians: implement from stub — list of linked guardians with View (opens profile) + Add (modal)
- RLS-gated profile actions: hide edit journey/tags/child safety/delete/add guardian for non-admin
- Dashboard: hide "New person" button for operators without admin/team_leaders permission
- PeopleFilters: add journey track + stage filter dropdowns
- Types: add `people_relationships` to `database.types.ts` + `PersonRelationship` type
- Migrations: add INSERT/UPDATE/DELETE RLS policy for `people_relationships` (authenticated)
- TDD for all new logic (permission hooks, relationship queries, gating)

### Out
- Full contact_channels CRUD — deferred (#85)
- Address on profile (HouseholdPage) — deferred (#84)
- Form native controls → barrel UI migration — deferred (Batch 13 polish)
- PWA offline cache — deferred (core #33)
- Core email provider wiring — deferred (#51)
- Welcome email automation — deferred (#58)
- `getWithValidWWCC`, `getWithSafeMinistry`, `getGuardians` — deferred

## Arch Decisions (Stable)
- #79: Single inline-edit view (one hook handles admin/self-view)
- #80: Broad self-view edit scope — `canEdit = isAdmin || isSelf`
- #81: RLS-gated actions — admin-only flags: `canManageTags`, `canManageJourney`, `canManageGuardians`, `canEditChildSafety`, `canEditAdminFields`; `canDelete = isAdmin && !isSelf`

## Batch Template (Reusable)
- TDD: write failing test → implement → verify green → commit
- Git commit format: `<type>(<scope>): <subject>` — e.g., `test(people): ...`, `feat(people): ...`
- File paths: `src/modules/people/components/sections/<Section>.tsx`, `src/modules/people/lib/<module>.ts`
- See `plan-refs/` for masking rules, KV-cache ordering, partitioning guidance, budget triggers

---

## Batch 1: Test infrastructure + types + permission hook (TDD)

## Batch 1 Start: Sync
- [x] Mark completed tasks in `progress.md` (Batch 1 Complete logged)
- [x] Read `findings.md` for key discoveries (environment, table gaps, component state)
- [x] **Context Check**: Context clean (batch 1 complete, no overflow)

## Batch 1 Context
- Overall Goal: Refactor people module profile into single multipurpose inline-edit view
- Current Batch Goal: ✅ DONE — setup React test infra + profile permissions hook
- Previous Batch: Planning phase — consolidated 6 planning docs, audited implementation gaps
- Key Findings: No React Testing Library installed; `people_relationships` table missing from types; no INSERT/UPDATE/DELETE RLS policies
- Current State: ✅ Complete — 69 tests passing (40 existing + 29 new), commit `5ec5f3d`
- Budget: Stable 20% | Current 30% | History 30% | Buffer 20%
- Optimization Status: Clean

## Batch 1 Tools
- **Use `todowrite`** — Atomic tasks, max 1 in-progress
- **Update `progress.md`** — Log actions, errors, decisions, completions
- **Apply Observation Masking** — After tool calls, summarize keys in progress.md
- **Monitor Context** — If > 70%, trigger compaction

## Batch 1 Compaction
- ✅ Summarized in `progress.md` — "69 tests passed (40 existing + 29 new)"
- Finding stored in `findings.md#testing` — test env details
- `[Obs:1 elided. Key: jest-dom v7 import path fixed with /vitest subpath]`
- Cache-friendly ordering: stable (arch decisions) → reusable (TDD pattern) → unique (test counts)

## Batch 1 Budget Monitoring
- Context utilization: ~15% — no compaction needed
- Test pass/fail: 69 passed, 0 failed
- File changes: 5 files (vitest.config.ts, setupTests.ts, database.types.ts, types.ts, profile-permissions.ts)

---

## Batch 2: Child Safety section — full inline (TDD)

## Batch 2 Start: Sync
- [x] Mark completed tasks in `plan.md` (Batch 1 ✅ complete)
- [x] Update `progress.md` with Batch 1 summary
- [x] Read `findings.md` for key discoveries (ChildSafetySection shows 5/17 fields)
- [ ] **Context Check**: If estimated context > 70%, run compaction before proceeding

## Batch 2 Context
- Overall Goal: Refactor people module profile into single multipurpose inline-edit view
- Current Batch Goal: Expand ChildSafetySection to full inline (all 17 WWCC/SMT/SMC fields in collapsible card)
- Previous Batch: Batch 1 complete — test infra + permission hook, 69 tests passing
- Key Findings: Ref `findings.md#component-state` — ChildSafetySection shows 5/17 fields (simplified); Ref `findings.md#people-relationships-rls` — relationships table exists in migrations but no INSERT/UPDATE/DELETE RLS policies
- Current State: Blocked — `ChildSafetySection.test.tsx` failing due to multiple element matches for 'WWCC' text (existing component has partial implementation)
- Budget: Stable 20% | Current 30% | History 30% | Buffer 20%
- Optimization Status: Clean

## Batch 2 Tools
- **Use `todowrite`** — Create atomic tasks: (1) fix failing test, (2) expand 17 fields, (3) add collapsible card, (4) inline editing + save
- **Use subagents** — For independent subtasks: test writing + component expansion in parallel
- **Update `progress.md`** — Log test failure detail, fix approach, completion
- **Apply Observation Masking** — After vitest output, extract pass/fail counts
- **Monitor Context** — If > 70% utilized, trigger compaction

## Batch 2 Observation Masking
- See `plan-refs/MASKING.md` — never mask active test failures; mask verbose vitest output after extracting counts
- `[Obs:1 elided. Key: ChildSafetySection.test.tsx — 2 matches for 'WWCC' text, multiple elements found at line 68]`

## Batch 2 KV-Cache Optimization
- Stable prefix: Arch decisions #79–86, TDD pattern, git conventions
- Reusable middle: Batch template structure, collapsible card pattern, field mapping table
- Unique suffix: Current field list (WWCC/SMT/SMC), test assertions
- See `plan-refs/KV-CACHE.md` for cache stability rules

## Batch 2 Context Partitioning
- See `plan-refs/PARTITIONING.md` — Batch 2: test writing + component expansion as parallel sub-agents
- Sub-Agent template:
  ```
  Task: Expand ChildSafetySection to 17 fields with collapsible card
  Context: Batch 2 — ChildSafetySection shows 5/17 fields (findings.md#component-state)
  Deliverable: ChildSafetySection.tsx with all 17 WWCC/SMT/SMC fields
  Constraints: TDD — write/expand test first, use existing patterns from PersonalSection.tsx
  Update: Write full results to findings.md, log summary to progress.md
  ```

## Batch 2 Tasks
- [x] **Task 2.1:** Fix failing test — resolve multiple-element matches for 'WWCC' in collapsed state (use more specific query)
- [x] **Task 2.2:** Expand `ChildSafetySection`: all 17 fields — WWCC number/expiry/verification/made_by/outcome/exemption, SMT certificate/date/type, SMC exemption/reviewer/result_date/result, safe_ministry_notes, safe_ministry_start_date, safe_ministry_leader_type
- [x] **Task 2.3:** Add collapsible card (Ark UI Collapsible) — collapsed shows summary, expanded shows all fields
- [x] **Task 2.4:** Add inline editing (edit-in-place) + save + audit logging via `writePeopleAudit`
- [x] **Run tests** → verify pass

## Batch 2 Compaction
- Summarize in `progress.md` — "ChildSafetySection expanded to 17 fields, N tests passing"
- Store detailed findings in `findings.md#child-safety-expanded`
- Mask verbose vitest output: `[Obs:N elided. Key: N passed, M failed]`
- If context > 70%: compact before Batch 3

## Batch 2 Budget Monitoring
- Triggers: Check after each task — [ ] >70% → compact, [ ] >80% → emergency, [ ] errors → resolve
- Track: test counts, file changes, error resolutions

## Batch 2 Validation
- [x] All vitest tests pass (≥70% coverage for new logic)
- [x] ChildSafetySection renders all 17 WWCC/SMT/SMC fields
- [x] Collapsible card: collapsed shows summary, expanded shows all fields
- [x] Inline editing + save + audit logging works

---

## Batch 3: Guardians section — implement (TDD)

## Batch 3 Start: Sync
- [ ] Mark completed tasks in `plan.md` (Batch 2 ✅/⏳)
- [ ] Update `progress.md` with Batch 2 summary
- [ ] Read `findings.md` for key discoveries (GuardianSection is stub)
- [ ] **Context Check**: If > 70%, run compaction

## Batch 3 Context
- Overall Goal: Refactor people module profile into single multipurpose inline-edit view
- Current Batch Goal: Implement GuardiansSection from stub — list linked guardians with View + Add modal
- Previous Batch: Batch 2 — expanded ChildSafetySection to 17 fields, collapsible card, inline editing
- Key Findings: Ref `findings.md#component-state` — GuardiansSection is ❌ stub (placeholder text); Ref `findings.md#people-relationships-rls` — needs INSERT/UPDATE/DELETE RLS policy
- Current State: [Blocked/In progress] pending Batch 2
- Budget: Stable 20% | Current 30% | History 30% | Buffer 20%
- Optimization Status: Clean

## Batch 3 Tools
- **Use `todowrite`** — Atomic tasks: (1) migration, (2) query, (3) mutation, (4) tests, (5) component
- **Use subagents** — Migration + query + tests in parallel (independent subtasks)
- **Update `progress.md`** — Log each step
- **Apply Observation Masking** — See `plan-refs/MASKING.md`
- **Monitor Context** — See `plan-refs/BUDGET.md` triggers

## Batch 3 KV-Cache Optimization
- Stable: Arch decisions #79–86, TDD pattern, git conventions
- Reusable: Batch template, migration pattern, query helper pattern
- Unique: Guardian relationship types, modal structure
- See `plan-refs/KV-CACHE.md`

## Batch 3 Context Partitioning
- See `plan-refs/PARTITIONING.md` — Batches 3+: 3+ independent areas → sub-agents
- Sub-Agent template:
  ```
  Task: [Migration | Query | Tests] for guardians
  Context: Batch 3 — GuardiansSection is stub (findings.md#component-state)
  Deliverable: [Migration file | getPersonGuardians query | GuardiansSection.test.tsx]
  Constraints: TDD red phase, RLS per decision #83, file paths in src/modules/people/
  Update: findings.md + progress.md
  ```

## Batch 3 Tasks
- [x] **Task 3.1:** Add migration — INSERT/UPDATE/DELETE RLS policy for `people_relationships` (authenticated role)
- [x] **Task 3.2:** Add `getPersonGuardians(personId)` query — join `people_relationships` + `people`
- [x] **Task 3.3:** Add `createPersonRelationship()` mutation + `createContactOnlyParent()` helper
- [x] **Task 3.4:** Write failing tests for relationship queries (guardian lookup, self-parenting protection)
- [x] **Task 3.5:** Implement `GuardiansSection` — read-only guardian list (link to profile), Add button (modal for new contact-only parent), RLS-gated per decision #83
- [x] **Run tests** → verify pass
- [ ] **Commit:** `feat(people): guardians section with view/add modal`

## Batch 3 Compaction
- [x] Summarize completed tasks in `progress.md`
- [x] Store detailed findings in `findings.md#guardians-implementation`
- [ ] Mask observations — `[Obs:N elided. Key: ...]`
- [ ] If context > 70%: compact before Batch 4

## Batch 3 Budget Monitoring
- Triggers: [ ] >70% → compact, [ ] >80% → emergency, [ ] errors → resolve, [ ] sub-agent results too large → summarize
- Track: test counts, migration files, error resolutions

## Batch 3 Validation
- [x] All vitest tests pass
- [x] `people_relationships` has INSERT/UPDATE/DELETE RLS policies
- [x] `getPersonGuardians` returns linked guardians
- [x] GuardiansSection shows list with View (link) + Add (modal)
- [x] RLS-gated per decision #83

---

## Batch 4: Inline-edit profile sections (TDD)

## Batch 4 Start: Sync
- [x] Mark Batch 3 complete in `plan.md`
- [x] Update `progress.md` with Batch 3 summary
- [x] Read `findings.md#profile-sections` for current section state
- [x] **Context Check**: Context clean, proceeding to Batch 4

## Batch 4 Context
- Overall Goal: Refactor people module profile into single multipurpose inline-edit view
- Current Batch Goal: Refactor PersonalSection/DemographicsSection/ContactSection to inline-edit (display → edit-in-place)
- Previous Batch: Batch 3 — implemented GuardiansSection with View + Add modal
- Key Findings: Ref `findings.md#component-state` — all 3 sections currently read-only; no inline-edit pattern exists; PersonForm has separate edit page
- Current State: [Blocked/In progress] pending Batch 3
- Budget: Stable 20% | Current 30% | History 30% | Buffer 20%
- Optimization Status: Clean

## Batch 4 Tools
- **Use `todowrite`** — 3 sections → 3 parallel tasks
- **Use subagents** — 3 parallel sub-agents (PersonalSection, DemographicsSection, ContactSection) per `plan-refs/PARTITIONING.md`
- **Update `progress.md`** — Log each section completion
- **Apply Observation Masking** — See `plan-refs/MASKING.md`
- **Monitor Context** — See `plan-refs/BUDGET.md`

## Batch 4 KV-Cache Optimization
- Stable: Arch decisions #79–86, TDD pattern, git conventions
- Reusable: Inline-edit pattern (once established in PersonalSection), field mapping table, save handler
- Unique: Specific fields per section
- See `plan-refs/KV-CACHE.md`

## Batch 4 Context Partitioning
- 3 independent sections → 3 sub-agents per `plan-refs/PARTITIONING.md`
- Sub-Agent template:
  ```
  Task: Refactor [Section] to inline-edit (display → edit-in-place)
  Context: Batch 4 — sections are read-only (findings.md#component-state)
  Deliverable: [Section].tsx with inline edit + save handler
  Constraints: TDD red phase, reuse PersonForm field configs, writePeopleAudit on save
  Update: findings.md + progress.md
  ```

## Batch 4 Tasks
- [x] **Task 4.1:** Write failing tests for inline-edit behavior (display → edit → save)
- [x] **Task 4.2:** Refactor `PersonalSection` → display + edit-in-place (firstname, lastname, preferred_name, middle_name, gender, date_of_birth, marital_status)
- [x] **Task 4.3:** Refactor `DemographicsSection` → inline edit (demographic, school_name, kindy_start_year, school_email_permission; school_year is calculated display)
- [x] **Task 4.4:** Refactor `ContactSection` → inline edit (email, person.mobile shadow)
- [x] **Task 4.5:** Wire save handler — calls `updatePerson` + `writePeopleAudit`; self-view uses same save path per decision #80
- [x] **Run tests** → verify pass
- [ ] **Commit:** `feat(people): inline-edit profile sections for adult/youth/child`

## Batch 4 Compaction
- [ ] Summarize completed tasks in `progress.md`
- [ ] Store findings in `findings.md#inline-edit-sections`
- [ ] Mask observations per `plan-refs/MASKING.md`
- [ ] If context > 70%: compact before Batch 5

## Batch 4 Budget Monitoring
- Triggers: See `plan-refs/BUDGET.md` — check after each task
- Track: test counts per section, save handler logic, audit logging

## Batch 4 Validation
- [x] All vitest tests pass
- [x] PersonalSection/DemographicsSection/ContactSection have display + edit-in-place modes
- [x] Save handler calls `updatePerson` + `writePeopleAudit`
- [x] Self-view uses same save path (decision #80)

---

## Batch 5: RLS-gated UI + dashboard (TDD)

## Batch 5 Start: Sync
- [x] Mark Batch 4 complete in `plan.md`
- [x] Update `progress.md` with Batch 4 summary
- [x] Read `findings.md#permission-checks` for current gating state
- [x] **Context Check**: Context clean, proceeding to Batch 5

## Batch 5 Context
- Overall Goal: Refactor people module profile into single multipurpose inline-edit view
- Current Batch Goal: RLS-gate profile actions + dashboard button + journey filters
- Previous Batch: Batch 4 — 3 inline-edit sections with save handlers
- Key Findings: Ref `findings.md#permission-checks` — no self-view detection; `getCurrentOperatorPermission()` exists but not used for gating; dashboard "New person" always visible
- Current State: [Blocked/In progress] pending Batch 4
- Budget: Stable 20% | Current 30% | History 30% | Buffer 20%
- Optimization Status: Clean

## Batch 5 Tools
- **Use `todowrite`** — 3 independent gating areas → 3 tasks
- **Use subagents** — Profile gating + dashboard gating + filters in parallel per `plan-refs/PARTITIONING.md`
- **Update `progress.md`** — Log each gating implementation
- **Apply Observation Masking** — See `plan-refs/MASKING.md`
- **Monitor Context** — See `plan-refs/BUDGET.md`

## Batch 5 KV-Cache Optimization
- Stable: Arch decisions #79–86 (especially #81 RLS-gated actions), TDD pattern
- Reusable: Gating pattern (`useProfilePermissions` → conditional render), `useCurrentOperatorPermission()` usage
- Unique: Specific buttons hidden per role
- See `plan-refs/KV-CACHE.md`

## Batch 5 Context Partitioning
- 3 independent UI areas → 3 sub-agents per `plan-refs/PARTITIONING.md`
- Sub-Agent template:
  ```
  Task: Gate [profile actions | dashboard button | filters] by RLS permissions
  Context: Batch 5 — no self-view detection, dashboard always visible (findings.md#permission-checks)
  Deliverable: Gated UI that hides actions for non-admin operators
  Constraints: Use useProfilePermissions hook, decisions #81, file paths in src/modules/people/
  Update: findings.md + progress.md
  ```

## Batch 5 Tasks
- [x] **Task 5.1:** Write failing tests for RLS gating (non-admin can't see edit journey/tags/child safety/delete/add guardian)
- [x] **Task 5.2:** Add `useProfilePermissions`-based gating to `PersonProfilePage` — conditionally render section edit buttons + PersonHeader actions
- [x] **Task 5.3:** Gate dashboard "New person" button via `useCurrentOperatorPermission()` (hide for non-admin/team_leader)
- [x] **Task 5.4:** Add journey track + stage filter dropdowns to `PeopleFilters` (wired to `journeyTrackId`/`journeyStage` in `PeopleListOptions`)
- [x] **Run tests** → verify pass
- [ ] **Commit:** `feat(people): RLS-gated profile actions + dashboard + journey filters`

## Batch 5 Compaction
- [ ] Summarize completed tasks in `progress.md`
- [ ] Store findings in `findings.md#rls-gating`
- [ ] Mask observations per `plan-refs/MASKING.md`
- [ ] If context > 70%: compact before Batch 6

## Batch 5 Budget Monitoring
- Triggers: See `plan-refs/BUDGET.md`
- Track: gating coverage, test counts, permission flag usage

## Batch 5 Validation
- [x] All vitest tests pass
- [x] Profile edit buttons hidden for non-admin (decision #81)
- [x] Dashboard "New person" hidden for public/member_area (decision #83)
- [x] Journey track + stage filter dropdowns work

---

## Batch 6: Test + polish

## Batch 6 Start: Sync
- [x] Mark Batch 5 complete in `plan.md`
- [x] Update `progress.md` with Batch 5 summary
- [x] Read `findings.md` for final state
- [x] **Context Check**: Context clean, proceeding to Batch 6

## Batch 6 Context
- Overall Goal: Refactor people module profile into single multipurpose inline-edit view
- Current Batch Goal: Full test suite pass, typecheck, lint, build — all green
- Previous Batch: Batch 5 — RLS-gated profile + dashboard + journey filters
- Budget: Stable 20% | Current 30% | History 30% | Buffer 20%
- Optimization Status: Clean

## Batch 6 Tools
- **Use `todowrite`** — Run tests, typecheck, lint, build sequentially
- **Update `progress.md`** — Log each validation result
- **Apply Observation Masking** — Mask verbose tsc/eslint/vitest output, keep summary numbers
- **Monitor Context** — If > 70%, compact

## Batch 6 Tasks
- [x] **Task 6.1:** Run `npx vitest run` → verify all tests pass; check coverage ≥ 70% for new logic
- [x] **Task 6.2:** Run `npx tsc -b` → typecheck, fix errors
- [x] **Task 6.3:** Run `npx eslint src/modules/people --max-warnings 0` → fix warnings
- [x] **Task 6.4:** Run `npx vite build` → verify success
- [ ] **Commit:** `test(people): full test suite + polish`
- [ ] **Push:** `git push origin feature/people-profile-inline-edit`

## Batch 6 Compaction
- Summarize: "Batches 1–5 complete, all validation green"
- Store final findings in `findings.md#implementation-complete`
- Mask: `[Obs:N elided. Key: all tests passed, tsc clean, eslint clean, build successful]`

## Batch 6 Budget Monitoring
- Final check: [ ] context < 80%, [ ] all validations green

## Batch 6 Validation
- [ ] All vitest tests pass (≥70% coverage for new logic)
- [ ] `tsc -b` typecheck clean
- [ ] `eslint --max-warnings 0` clean
- [ ] `vite build` succeeds
- [ ] Manual: Profile switches view/edit/self-view for adult, youth, child
- [ ] Manual: Admin actions hidden for non-admin operators
- [ ] Manual: "New person" hidden on dashboard for public/member_area
- [ ] Manual: Guardians section shows linked guardians with View + Add
- [ ] Manual: Child Safety shows all 17 fields in collapsible card

---

## Refs
- `plan-refs/BUDGET.md` — budget monitoring & triggers
- `plan-refs/KV-CACHE.md` — context ordering & cache stability rules
- `plan-refs/MASKING.md` — observation masking decision matrix + format
- `plan-refs/PARTITIONING.md` — when to spawn sub-agents + template
- `findings.md` — detailed discoveries (environment, component state, permission checks)
- `progress.md` — batch-level execution log
- `decision.md` — UX decisions #79–86
- `peopleFields.md` — field mapping per section
