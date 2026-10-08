# People Settings: Tabs + Custom Demographics + Icons — Implementation Plan

Goal: Give the People settings page ParkUI tabs (Journey | Demographics) with fully user-manageable demographics (add / edit / delete-with-migration, each with a lucide icon or uploaded image), and make the Elvanto **Map Journeys tab** the single place where Elvanto values convert to app demographics.

Approach: Replace the `demographic` PG enum with a seeded `demographics` lookup table (slug FK + `profile_type` for behaviour rules + icon columns) in one migration; build CRUD/delete-with-migration TDD-first; restructure settings into Tabs with a new `DemographicsSettingsManager`; convert every hardcoded Adult/Youth/Child consumer to dynamic lists keyed by `profile_type`; add icon picker/upload; extend Map Journeys transform groups with a "set demographic" output and delete the old built-in name matcher.

Branch: `main` @ `fe5818e` (existing branch; work and commits go directly to `main` → `origin` — no feature branch)
Scope: In: `supabase/migrations/`, `src/modules/people/**`, `src/core/{lib,auth,email}` demographic consumers, `src/content/plugins/elvanto-sync/` + `supabase/functions/elvanto-sync-worker/`, planning docs. Out: new storage bucket (reuse `brand-assets`), pg_cron auto-progression (not yet built — future work keys on `profile_type`), contact_channels migration, per-flag granular visibility (profile_type instead), per-demographic color column (existing blue/orange/green keyed by `profile_type`).

> Deviation from skill default: plan lives in `.agents/planning/people/plan/` (user-specified) instead of `docs/plans/`. Companion research: `findings.md` (read it; this plan refs it instead of inlining detail).

## 5-Question Reboot Test
1. Where am I? — Current batch/subphase (update line below)
2. Where am I going? — Next subphase in this plan
3. What's the goal? — Header Goal
4. What have I learned? — `findings.md`
5. What have I tried? — Completed checkboxes + Error Log

Current: Batch 1, Subphase 1.1

## Error Log
| # | Batch | Error | Fix Attempted | Resolution |
|---|-------|-------|---------------|------------|
| 1 | | | | |

## Batch Protocol (shared — applies to every batch)
- **Tools**: maintain an atomic todo list, max 1 in-progress; spawn subagents where a subphase says Yes (independent >5 min, parallel file ops, research)
- **Task Completion Sync**: at each Batch Start mark completed checkboxes in this file; re-read `findings.md`
- **Observation Masking**: summarize tool output here; details → `findings.md#section`; never re-paste verbose output
- **KV-Cache Ordering**: stable (this plan, findings) → reusable (patterns) → unique (current task)
- **Context Partitioning**: spawn for independent >5 min / parallel file ops / research; not for sequential deps, <2 min edits, shared mutable state
- **Context Check**: if estimated context > 70%, compact before next batch — never exceed 80%
- **TDD**: failing test first in every implementation subphase; migrations verified via `findings.md#verification-sql`
- **3-Strike Error Protocol**: fix → alternative → STOP/revert/ask; every error → Error Log table
- **Deploy order**: apply the Batch 2 migration BEFORE deploying app code (old code works on new column — plain strings; new code fails on old enum)

---

## Batch 1: Setup & Foundation

**Start: Sync**
- [ ] Mark completed tasks in `plan.md` (update checkboxes/status)
- [ ] Read `findings.md` for key discoveries
- [ ] **Context Check**: If estimated context > 70%, run compaction before proceeding

**Context**
- Goal: ParkUI tabs + custom demographics + icons; Map Journeys tab owns Elvanto→demographic conversion
- This Batch: Verify clean `main`, capture baseline, answer open questions, freeze migration recipe
- Prev: None — fresh plan; `findings.md` pre-populated from 2026-10-08 audit
- Key: findings.md#locked-decisions, findings.md#git-state

### Subphase 1.1: Git verification
Context: `main` clean @ `fe5818e` (findings#git-state); work directly on existing `main`/`origin` — no feature branch.
Todo:
- [ ] Verify `git status --short` empty and HEAD = `fe5818e` on `main`
- [ ] Confirm remote `origin` = https://github.com/thedanw/newlight.app (`git remote -v`)
Subagent: No
Deliverable: clean `main` verified against `origin`

### Subphase 1.2: Baseline verification
Context: executor must know pre-existing failures before touching code.
Todo:
- [ ] `pnpm typecheck` — capture output
- [ ] `pnpm test` — capture pass/fail counts
- [ ] Paste into `findings.md#baseline`; pre-existing failures → Error Log row, do NOT fix here
Subagent: No
Deliverable: documented baseline

### Subphase 1.3: Open verifications
Context: 5 unknowns gate migration + sync work; answers may adjust Batches 2/7.
Todo:
- [ ] Answer `findings.md#open-verifications` items 1–5 (search_people columns; migration apply workflow; transform registry names; legacy config usage; lucide seed exports)
- [ ] Write answers into findings.md beside each item
- [ ] If an answer contradicts a task below: re-read plan, edit affected subphase, add "Plan Change" row to Error Log
Subagent: Yes — research >5 min (prompt: "Answer items 1–5 in .agents/planning/people/plan/findings.md#open-verifications; deliverable: answers written into that file; constraints: read-only, cite file:line")
Deliverable: 5 answers recorded, plan reconciled

### Subphase 1.4: Freeze migration recipe
Context: read-before-decide; Batch 2 must not improvise schema.
Todo:
- [ ] Re-read `findings.md#schema-target`; reconcile with 1.3 answers (view/RPC recreation, apply workflow, seed icons)
- [ ] Confirm unchanged or edit findings.md (recipe = SSOT for the SQL)
Subagent: No
Deliverable: frozen migration recipe

**Compaction**
- Summarize completed tasks in one line; details → findings.md
- Mask verbose output with refs; if context > 70%: compact before Batch 2

---

## Batch 2: Database schema & types

**Start: Sync**
- [ ] Mark completed tasks in `plan.md` (update checkboxes/status)
- [ ] Read `findings.md` for key discoveries
- [ ] **Context Check**: If estimated context > 70%, run compaction before proceeding

**Context**
- Goal: ParkUI tabs + custom demographics + icons; Map Journeys tab owns Elvanto→demographic conversion
- This Batch: `demographics` table live (seeded, RLS/grants), `people.demographic` = slug FK, types compile
- Prev: B1 — clean `main` verified, baseline + 5 answers recorded, recipe frozen
- Key: findings.md#schema-target, findings.md#verification-sql

### Subphase 2.1: Write migration
Context: recipe frozen; mirror idempotent patterns (`drop policy if exists`, `create or replace view`) from existing migrations.
Todo:
- [ ] Create `supabase/migrations/20261008090000_create_demographics.sql`: `profile_type` enum; `demographics` table + partial unique slug index + RLS + grants (authenticated rw, **anon select** for public filters, service_role all — mirror journey tables); seed adult/youth/child (profile_type matching; icons per 1.3.5; sort_order 0/1/2)
- [ ] Same file: `alter people.demographic` → varchar `using`, FK → `demographics.slug`, default `'adult'`; recreate `people_public` (keep anon column list + `security_invoker = off` + GRANT — copy `20260919100200:57-70`); `drop type demographic` last
- [ ] Grep migrations for other `::demographic` / enum dependencies; record hits in findings.md
Subagent: No (single file, serial)
Deliverable: migration file matches recipe

### Subphase 2.2: Apply + verify schema
Todo:
- [ ] Apply per 1.3.2 answer (local `supabase db reset` or hosted push to dev project)
- [ ] Run every query in `findings.md#verification-sql`; paste results beside them
- [ ] Failure → fix migration idempotently, log Error Log; 3-strike → STOP/ask
Subagent: No
Deliverable: verified schema — 0 orphans, FK exists, view returns slug

### Subphase 2.3: Types + validation (TDD)
Context: `database.types.ts` is hand-maintained; integrity now comes from the FK, not zod.
Todo:
- [ ] FAILING test `src/modules/people/lib/validation.test.ts`: schema accepts custom slug `young-adult`, rejects `''` (currently fails — z.enum)
- [ ] `src/core/lib/database.types.ts`: `PersonRow.demographic: string` (:21); remove `Enums.demographic` (:286), add `profile_type`; add `demographics` Tables entry
- [ ] `lib/types.ts`: export `Demographic = Tables<'demographics'>`; `PeopleListOptions['demographic']` stays string (:45)
- [ ] `lib/validation.ts:10` → `z.string().min(1, 'Demographic is required')`; test passes
Subagent: Yes — types file and validation test are independent (parallel)
Deliverable: validation test green

### Subphase 2.4: Fallout triage
Todo:
- [ ] `pnpm typecheck` + `pnpm test`; classify failures: expected (hardcoded option lists, Demographics.test — cleared in Batches 4/5) vs unexpected
- [ ] Record expected-failure list in findings.md; unexpected → Error Log
Subagent: No
Deliverable: triage list; typecheck clean except known list

**Compaction**
- Summarize completed tasks in one line; SQL detail → findings.md#verification-sql
- If context > 70%: compact before Batch 3

---

## Batch 3: Data layer (TDD — queries, hooks, helpers)

**Start: Sync**
- [ ] Mark completed tasks in `plan.md` (update checkboxes/status)
- [ ] Read `findings.md` for key discoveries
- [ ] **Context Check**: If estimated context > 70%, run compaction before proceeding

**Context**
- Goal: ParkUI tabs + custom demographics + icons; Map Journeys tab owns Elvanto→demographic conversion
- This Batch: demographics CRUD + delete-with-migration tested; profile_type resolver exists
- Prev: B2 — schema live + verified; types/validation updated; expected-failure list recorded
- Key: findings.md#code-impacted, findings.md#existing-patterns-to-copy

### Subphase 3.1: Read + profile_type helpers (TDD)
Todo:
- [ ] FAILING tests: `getDemographics()` returns active rows ordered by `sort_order` (filters `deleted_at`); `resolveProfileType(demographics, 'adult')` → `'adult'`, unknown slug → `'adult'` (safe default = today's behaviour), custom slug → its `profile_type`
- [ ] Implement `getDemographics()` in `lib/queries.ts` (mirror `getJourneySettings` :238 style)
- [ ] Implement pure `resolveProfileType` in new `src/modules/people/lib/demographic-helpers.ts`
- [ ] Add `useDemographics()` to `lib/hooks.ts` (via `useAsyncQuery` — consumers live outside settings)
Subagent: No (one domain, serial)
Deliverable: tested read path + resolver

### Subphase 3.2: create/save (TDD)
Context: slug generated once from name and never edited (findings#locked-decisions 5); extract `slugify` from `JourneySettingsManager.tsx:38-44` into shared `lib/slug.ts` (DRY) and re-import there.
Todo:
- [ ] FAILING tests: create requires name; slug = slugify(name); duplicate active slug → clear error ("already exists"); save edits name/profile_type/icon but never slug; profile_type defaults `'adult'`
- [ ] Implement `createDemographic(input)` + `saveDemographic(demographic)` in `lib/queries.ts`; extract `slugify` to `lib/slug.ts`, update JourneySettingsManager import (existing tests stay green)
- [ ] Tests pass
Subagent: No (same file as 3.1)
Deliverable: tested create/save + shared slugify

### Subphase 3.3: delete-with-migration (TDD) — feature 2 core
Context: mirror `deleteJourneyTrack` (`queries.ts:310-325`) + audit decisions B.6/#4.9; re-read findings#code-impacted DB rows.
Todo:
- [ ] FAILING tests for `deleteDemographic(sourceId, targetSlug)`:
  - missing/foreign target or target = source → throws ("Choose a different demographic")
  - last active demographic → throws ("The last active demographic cannot be deleted")
  - happy path call sequence: update `people.demographic` (source→target, `deleted_at is null`), `writePeopleAudit(id, 'demographic', source, target, 'migration')` per affected person (chunked), rewrite `saved_lists.conditions.demographic`, rewrite `elvanto_sync_config` key `elvanto-sync_journey_transform_groups` outputs, soft-delete row (`deleted_at`)
  - returns `{ peopleMigrated: number }` for the success message
- [ ] Implement in `lib/queries.ts`; `.range()` batching for people updates (church scale)
- [ ] Tests pass
Subagent: Yes — test file independent of 3.2 impl (parallel)
Deliverable: tested delete-with-migration

### Subphase 3.4: Data-layer gate
Todo:
- [ ] `pnpm test` green except findings expected-failure list; `pnpm typecheck` green
- [ ] Clear applicable items from the expected-failure list
Subagent: No
Deliverable: green people-lib suite

**Compaction**
- Summarize completed tasks in one line; test details → findings.md
- If context > 70%: compact before Batch 4

---

## Batch 4: Settings page — Tabs + Demographics manager UI (features 1 & 2 UI)

**Start: Sync**
- [ ] Mark completed tasks in `plan.md` (update checkboxes/status)
- [ ] Read `findings.md` for key discoveries
- [ ] **Context Check**: If estimated context > 70%, run compaction before proceeding

**Context**
- Goal: ParkUI tabs + custom demographics + icons; Map Journeys tab owns Elvanto→demographic conversion
- This Batch: /settings/people shows Journey | Demographics tabs; CRUD + delete-migrate usable by admins
- Prev: B3 — data layer tested (get/create/save/delete-with-migration, useDemographics, resolveProfileType)
- Key: findings.md#existing-patterns-to-copy (Tabs, Dialog, prompt() anti-pattern)

### Subphase 4.1: PeopleSettingsPage → Tabs (feature 1)
Todo:
- [ ] FAILING test `settings/__tests__/PeopleSettingsPage.test.tsx`: renders two triggers ("Journey", "Demographics"); both contents render for admin; permission-denied path shows message (mock `../lib/hooks` + `@/core/plugins/HookRegistry` per JourneySettingsManager.test style)
- [ ] Refactor `settings/PeopleSettingsPage.tsx`: header card stays; wrap manager area in `Tabs.Root` + `TabScroller` + `Tabs.List/Trigger/Content` (copy `ElvantoSyncSettingsPage.tsx:37-67`; icons `GitBranch` / `Users`); Journey tab = existing `<JourneySettingsManager />` card unchanged; Demographics tab = `<DemographicsSettingsManager />` (4.2); keep permission gate + Integrations section
- [ ] Note: `src/core/ui/tabs.tsx` throws in dev when Root lacks a Content child — every trigger needs one
Subagent: No
Deliverable: tabbed settings page, test green

### Subphase 4.2: DemographicsSettingsManager — list/add/edit (TDD)
Todo:
- [ ] FAILING test `settings/__tests__/DemographicsSettingsManager.test.tsx`: lists demographics (name + profile_type); add form (name + profile_type select) calls `createDemographic`; edit calls `saveDemographic`; errors surface as message
- [ ] Build `settings/DemographicsSettingsManager.tsx` — mirror JourneySettingsManager structure (message state, error wrapper, inline edit with Pencil/Save/X icons, `useDemographics`); profile_type via `Select` (adult/youth/child); icon column placeholder (wired in Batch 6)
- [ ] Tests pass
Subagent: Yes — component independent of 4.1 files (parallel after 4.1 merge if split)
Deliverable: working list/add/edit UI

### Subphase 4.3: Delete dialog with migration target (TDD) — feature 2 core UX
Context: findings#existing-patterns-to-copy — use `Dialog`, NOT the `prompt()` anti-pattern at `JourneySettingsManager.tsx:149,174`.
Todo:
- [ ] FAILING tests: trash → Dialog "Delete <name>?" with Select "Move people to…" (other active demographics, exclude self); confirm disabled until target chosen; confirm calls `deleteDemographic(sourceId, targetSlug)`; success shows `peopleMigrated` count; guard error surfaces
- [ ] Implement Dialog flow (`Dialog` from `@/core/ui`; Select pattern from `CreatePerson/Form.tsx:159-171`)
- [ ] Tests pass
Subagent: No (same component as 4.2)
Deliverable: delete-with-migration UX complete

### Subphase 4.4: Manual verification
Todo:
- [ ] `pnpm dev` → `/settings/people`: tabs switch; Journey tab unchanged behaviour; add/edit/delete a demographic (delete migrates a test person); non-admin sees permission message
- [ ] Tick boxes; one-line result in findings.md
Subagent: No
Deliverable: verified settings UI

**Compaction**
- Summarize completed tasks in one line; UI details → findings.md
- If context > 70%: compact before Batch 5

---

## Batch 5: Consumers — dynamic options + profile_type behaviour

**Start: Sync**
- [ ] Mark completed tasks in `plan.md` (update checkboxes/status)
- [ ] Read `findings.md` for key discoveries
- [ ] **Context Check**: If estimated context > 70%, run compaction before proceeding

**Context**
- Goal: ParkUI tabs + custom demographics + icons; Map Journeys tab owns Elvanto→demographic conversion
- This Batch: no hardcoded Adult/Youth/Child left; visibility, badges, filters driven by data + profile_type
- Prev: B4 — tabs + DemographicsSettingsManager + delete dialog working
- Key: findings.md#code-impacted (App files — option lists, branching, display)

### Subphase 5.1: Form selects (TDD)
Context: tests in the expected-failure list break first (update test → red → fix → green).
Todo:
- [ ] Update/FAIL `CreatePerson/Form.test.tsx` (new file exists) + `Demographics.test.tsx`: demographic select lists `useDemographics()` items (labels = name); submit posts selected slug; profile section shows Select not free-text
- [ ] Fix `CreatePerson/Form.tsx:29,49-54,69,157-170`: default = first active demographic slug (or `'adult'` if present); collection from `useDemographics()`
- [ ] Fix `components/sections/Demographics.tsx:16,89`: replace text `Input` for demographic with `Select` of active demographics; save posts slug
- [ ] Tests pass
Subagent: Yes — Form and DemographicsSection are independent files (parallel)
Deliverable: create/edit use dynamic demographics

### Subphase 5.2: Filters (TDD)
Todo:
- [ ] FAILING tests: Dashboard Filters + JourneyGrid filter render dynamic options with "All" sentinel prepended (value `'all'` unchanged)
- [ ] Fix `Dashboard/Filters.tsx:19-21,46-52` and `JourneyGrid/Page.tsx:20-25` collections from `useDemographics()`; keep `:14,18` compare logic (slug === slug)
- [ ] Tests pass
Subagent: Yes — two independent files (parallel)
Deliverable: dynamic filters

### Subphase 5.3: Behaviour branching → profile_type (TDD)
Context: findings#code-impacted "Behaviour branching" rows; `resolveProfileType` from 3.1; unknown slug → `'adult'` keeps current behaviour.
Todo:
- [ ] FAILING tests: `canChat` false only when `resolveProfileType(...) === 'child'` (custom slug with profile_type child → blocked; profile_type adult → allowed) — add to `lib/email` tests if none
- [ ] Fix `lib/email.ts:120-122` (`canChat`), `EditPerson/Page.tsx:91-98` (+ titles `:74,106`), `core/auth/AccountPage.tsx:80-87,92`: replace `person.demographic === 'x'` with `resolveProfileType(demographics, person.demographic)`; components fetch demographics via `useDemographics()`
- [ ] Tests pass
Subagent: Yes — independent files (parallel)
Deliverable: profile_type drives all section visibility

### Subphase 5.4: Display + remaining consumers
Todo:
- [ ] Fix badges: `Dashboard/Row.tsx:47-48`, `Household/Members.tsx:17`, `PersonProfile/Header.tsx:31` — keep blue/orange/green but key colorPalette by `profile_type`; label = demographic **name** (via useDemographics, slug fallback); `PersonProfile/Page.tsx:56` `profileType` = resolved profile_type
- [ ] Verify `core/email/lib/audience.ts` + `modules/forms/lib/queries.ts` still compile/pass (string type — expected no code change; run tests)
- [ ] Clear remaining expected-failure list in findings.md; `pnpm test` fully green; `pnpm typecheck` green
Subagent: Yes — display files parallel; final gate No
Deliverable: zero expected failures left

**Compaction**
- Summarize completed tasks in one line; per-file notes → findings.md
- If context > 70%: compact before Batch 6

---

## Batch 6: Icons — lucide picker + image upload (feature 3)

**Start: Sync**
- [ ] Mark completed tasks in `plan.md` (update checkboxes/status)
- [ ] Read `findings.md` for key discoveries
- [ ] **Context Check**: If estimated context > 70%, run compaction before proceeding

**Context**
- Goal: ParkUI tabs + custom demographics + icons; Map Journeys tab owns Elvanto→demographic conversion
- This Batch: every demographic shows a lucide icon or uploaded image everywhere it's displayed
- Prev: B5 — all consumers dynamic; suite green
- Key: findings.md#locked-decisions (4: brand-assets, `demographics/` prefix, accept types, 1MB), findings.md#existing-patterns-to-copy

### Subphase 6.1: Upload helper + icon list (TDD)
Todo:
- [ ] FAILING tests for `lib/icon-upload.ts`: `uploadDemographicIcon(file)` uploads to `brand-assets` path `demographics/<uuid>-<name>` and returns public URL (mock supabase storage); rejects non-image/oversized before upload (shared constants: `accept = 'image/png,image/svg+xml,image/webp,image/jpeg'`, `maxFileSize = 1024 * 1024` — copy ChurchAppearance values)
- [ ] Create `lib/lucide-icons.ts`: curated ~40 `Record<string, LucideIcon>` via **named imports** (never `import *` — bundle size; include the 3 seed icons from 1.3.5) + `getLucideIcon(name)` fallback icon for unknown names
- [ ] Tests pass
Subagent: Yes — two independent new files (parallel)
Deliverable: tested upload helper + curated icon registry

### Subphase 6.2: LucideIconPicker component (TDD)
Todo:
- [ ] FAILING test `components/__tests__/LucideIconPicker.test.tsx`: renders grid from curated list; search box filters by name; selecting fires callback with icon name
- [ ] Build `components/LucideIconPicker.tsx` (Dialog or Popover grid + Input search; pattern refs: `src/modules/developers/pages/demos` for icon grids if present, Select/Popover styles)
- [ ] Tests pass
Subagent: No (depends on 6.1 registry)
Deliverable: picker component

### Subphase 6.3: Manager icon UI (TDD)
Todo:
- [ ] FAILING tests in `DemographicsSettingsManager.test.tsx`: icon cell shows current icon; edit offers two modes — "Choose icon" (opens LucideIconPicker) / "Upload image" (FileUpload with accept/maxFileSize + reject messages); save persists `icon_type`/`icon_name` via `saveDemographic` (upload first → URL)
- [ ] Implement icon editing UI in `settings/DemographicsSettingsManager.tsx` (replace 4.2 placeholder); validate upload errors like `ChurchAppearancePage.tsx:230-238`
- [ ] Tests pass
Subagent: No
Deliverable: icon CRUD in settings

### Subphase 6.4: DemographicIcon renderer + wire-up (TDD)
Todo:
- [ ] FAILING tests for `components/DemographicIcon.tsx`: `icon_type='lucide'` → named icon renders; `icon_type='image'` → `<img src=... alt=name>`; unknown lucide name → fallback icon (never crash)
- [ ] Wire renderer into: DemographicsSettingsManager list, `Dashboard/Row.tsx` badge, `Household/Members.tsx`, `PersonProfile/Header.tsx`, CreatePerson + Filters + JourneyGrid select items, profile `DemographicsSection`
- [ ] `pnpm test` green; manual: upload PNG + pick lucide, both render across sites
Subagent: Yes — wire-up files parallel after renderer lands
Deliverable: icons visible everywhere

**Compaction**
- Summarize completed tasks in one line; icon notes → findings.md
- If context > 70%: compact before Batch 7

---

## Batch 7: Elvanto — Map Journeys "set demographic" output + remove old matcher

**Start: Sync**
- [ ] Mark completed tasks in `plan.md` (update checkboxes/status)
- [ ] Read `findings.md` for key discoveries
- [ ] **Context Check**: If estimated context > 70%, run compaction before proceeding

**Context**
- Goal: ParkUI tabs + custom demographics + icons; Map Journeys tab owns Elvanto→demographic conversion
- This Batch: Map Journeys rules set demographics end-to-end (UI → config → edge worker); old matcher deleted
- Prev: B6 — icons done; suite green
- Key: findings.md#elvanto-architecture (`applyJourneyTransformGroups` edge people-sync.ts:528; key `elvanto-sync_journey_transform_groups`)

### Subphase 7.1: MapJourneysTab — demographic output (TDD)
Context: user decision (locked #3): rules say "conditions → track/stage + set demographic"; one stop for conversions.
Todo:
- [ ] FAILING tests for pure helpers (extract group build/update logic to testable functions if needed; component test optional per sync-batch.test.ts pattern): group saves `demographicSlug`; load round-trips legacy groups without the field (undefined, no crash); remove-group clears it
- [ ] `MapJourneysTab.tsx`: `TransformRow` unchanged for journey rows — add **group-level** `demographicSlug?: string` + UI "Then set demographic to →" Select fed by active `demographics` (load via `supabase.from('demographics').select(...)....is('deleted_at', null)` from `usePluginAPIContext().supabase`); persist via existing `setConfig('journey_transform_groups')` (:212)
- [ ] Tests pass; save/load manual check
Subagent: No
Deliverable: UI saves demographic outputs

### Subphase 7.2: Edge worker — apply + validate + delete old matcher (TDD where runnable)
Context: edge worker is Deno — **cannot run locally**; TS logic extracted for tests must be pure-imported by edge code or tested in the src copy (note approach in findings).
Todo:
- [ ] `supabase/functions/elvanto-sync-worker/people-sync.ts`:
  - `applyJourneyTransformGroups` (:528-539) → also return `demographicSlug` from the LAST matching group that sets one (same override semantics as journey updates)
  - in `applyMappings` (:211/:268) set `appRecord.demographic = demographicSlug` when present, BEFORE `:728` sanitize line
  - add `loadDemographics(supabase)` (active slugs) + `resolveDemographicSlug(candidate, validSlugs, existing, fallbackSlugs[0])` implementing findings fallback rule; replace `sanitizeDemographic` (:756-760) + `mapCategoryToDemographic` call
  - per 1.3.4 answer: remove dead `loadCategoryDemographicTrackStageMappings` loader + its `applyMappings` param, or keep dormant with comment
- [ ] Remove old matcher from registries/defaults (mirror BOTH copies):
  - edge `transforms.ts`: delete `demographics_array_to_enum` + `category_to_demographic` if present (registry + tests)
  - src `sync/transforms.ts:43-71` delete `category_to_demographic`; `sync/transforms.test.ts` remove its tests (kindy tests :152-159 STAY — keyed by slug)
  - src `sync/people-sync.ts:387-391` `sanitizeDemographic` → same resolve logic
  - `settings/components/FieldMappingTable.tsx:73` remove default demographic mapping; `:284` remove transform option; keep `:27` APP_FIELDS entry only if field-mapping row still valid for display — per 1.3.3 answer
- [ ] Update src `mapping-engine.ts` if it special-cases demographic (grep); keep dormant copy consistent with edge worker
- [ ] Run `pnpm test` (src plugin tests) — green
Subagent: Yes — (a) edge worker files vs (b) src plugin files are independent (parallel), coord via shared diff description
Deliverable: new matcher live in both copies, old one gone

### Subphase 7.3: Regenerate public copy + deploy
Todo:
- [ ] `node scripts/copy-plugins.mjs` — regenerate `public/content/plugins/elvanto-sync/`; `git diff --stat public/` shows only expected files; NEVER hand-edit public/
- [ ] `supabase functions deploy elvanto-sync-worker`
Subagent: No
Deliverable: public regenerated, edge deployed

### Subphase 7.4: End-to-end sync verification
Todo:
- [ ] In Map Journeys tab create rule: condition demographic equals "Adults" (test church value) → set demographic = adult; run sync for a matching test person
- [ ] Verify SQL: `select firstname, demographic from people where id = '<test>';` → `adult`; person with no matching rule → fallback rule applied (existing value kept, else first active); delete rule → re-sync keeps value
- [ ] Remove test rule; record results in findings.md
Subagent: No
Deliverable: verified end-to-end (findings.md evidence)

**Compaction**
- Summarize completed tasks in one line; sync evidence → findings.md
- If context > 70%: compact before Batch 8

---

## Batch 8: Testing & Quality, Docs, Delivery

**Start: Sync**
- [ ] Mark completed tasks in `plan.md` (update checkboxes/status)
- [ ] Read `findings.md` for key discoveries
- [ ] **Context Check**: If estimated context > 70%, run compaction before proceeding

**Context**
- Goal: ParkUI tabs + custom demographics + icons; Map Journeys tab owns Elvanto→demographic conversion
- This Batch: all 3 features + Map Journeys integration verified, documented, committed to `main`
- Prev: B7 — end-to-end sync verified; old matcher removed
- Key: findings.md#baseline (compare test counts; expected-failure list must be empty)

### Subphase 8.1: Full quality gate
Todo:
- [ ] `pnpm typecheck` — 0 errors
- [ ] `pnpm test` — all green; compare counts to `findings.md#baseline` (no unexpected regressions)
- [ ] `pnpm lint` — 0 warnings (repo uses `--max-warnings 0`)
- [ ] Failures → fix → Error Log rows; 3-strike → STOP/ask
Subagent: Yes — fixes by area are independent (parallel), gate reruns serial
Deliverable: three green commands

### Subphase 8.2: Manual E2E checklist (features acceptance)
Todo:
- [ ] **Tabs**: /settings/people → Journey | Demographics switch; admin-only gate; Integrations render
- [ ] **CRUD**: add "Young Families" (profile_type adult) → appears in Create Person, Filters, JourneyGrid selects
- [ ] **Delete+migrate**: delete it targeting Adult → test person moved, `people_audit` rows (`change_reason='migration'`), `saved_lists.conditions` rewritten, transform-group outputs rewritten, row soft-deleted (SQL checks)
- [ ] **Icons**: lucide pick + PNG upload → render in badges/selects/profile; >1MB or wrong type rejected with message
- [ ] **Behaviour**: custom demographic with profile_type child → no Contact, guardians/medical/consents shown, canChat false; profile_type adult → contact shown
- [ ] **Public**: logged-out directory filters load (anon SELECT works)
- [ ] Record pass/fail per item in findings.md
Subagent: No (single manual stream)
Deliverable: acceptance evidence

### Subphase 8.3: Documentation updates
Todo:
- [ ] `peopleFields.md` §"Handling People Categories": PG enum → `demographics` table (name/slug/profile_type/icon), visibility keyed by profile_type, delete+migrate rule; §Demographics field line
- [ ] `people/decision.md`: Aliases (Profile type → `demographics.profile_type`), Scope tables list += `demographics`, Constraints demographic-progression note → future pg_cron keys on profile_type, §4.12-like settings note (tabs + delete migration), Elvanto pull note 3.1/3.4 → Map Journeys owns demographic conversion
- [ ] `schema.dbml`: `demographics` table + `people.demographic` type change (lags migrations — keep it close)
- [ ] `core/database/decision.md` A.7: add "(e.g. `demographics`)" + enums count note if stated
Subagent: Yes — docs files independent (parallel)
Deliverable: docs match shipped reality

### Subphase 8.4: Delivery
Todo:
- [ ] Logical commits on `main`: (1) migration+types, (2) data layer, (3) settings tabs+manager, (4) consumers, (5) icons, (6) elvanto src+edge+public regen, (7) docs+planning files — conventional style per repo history (`feat(people):`, `fix(people):`)
- [ ] Final `git status` clean; update `Current:` line + tick final boxes in this plan
- [ ] Push to existing origin: `git push origin main` (repo history = direct commits to main)
Subagent: No
Deliverable: committed and pushed on `main`/`origin`

**Compaction**
- Final one-line summary per batch in this file; all evidence → findings.md
- Planning docs stay in `.agents/planning/people/plan/` as the record

---

## Execution Handoff
1. **Subagent-driven (this session)**: execute batch by batch — fresh subagent per batch where Subagent: Yes; parent keeps this plan + findings.md updated.
2. **Parallel session**: new session with the `executing-plans` skill, start at `Current:` line; inputs = this file + `findings.md`.

Reboot before every batch: 5-Question Test at top; if lost → re-read header Goal + findings.md#locked-decisions + last completed batch.
