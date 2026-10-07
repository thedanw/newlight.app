# Journey UUID Integrity Fixes — Implementation Plan

Goal: Make `people.journey` always store UUID track keys and UUID stage values — whether stages/tracks are created via JourneySettingsManager (the definitive mechanism) or any other path — by removing all slug/placeholder assumptions in the core people module and the Elvanto sync worker.

Approach: Fix the plugin-independent core first (default stage resolution, slug-based delete protection), then fix the sync worker's placeholder track-key and hardcoded stage-UUID assumptions with runtime slug→id lookups. No seed INSERTs — JourneySettingsManager is the definitive mechanism for stages/tracks. Docs updated to match reality.

Branch: `main`
Scope: In: `src/modules/people/` (journey handling), `supabase/functions/elvanto-sync-worker/` (authoritative sync), `src/content/plugins/elvanto-sync/sync/` (dormant copy), planning docs. Out: contact_channels table migration, new Module API methods, seed migrations, in-progress elvanto-sync settings UI work on `main`.

> Deviation from skill default: plan lives in `.agents/planning/people/plan/` (user-specified) instead of `docs/plans/`. Supersedes the deleted `.agents/planning/people/{plan,findings,progress,task_plan,discrepancy-audit}.md` (deleted in working tree, uncommitted).

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

## Batch Protocol (shared — applies to every batch; consolidates deleted `plan-refs/`)
- **Tools**: `todowrite` — atomic tasks, max 1 in-progress; subagents for independent subtasks >5 min
- **Observation Masking**: after each tool call, summarize key findings in plan.md; replace verbose output with `findings.md#section` ref
- **KV-Cache Ordering**: stable (plan, arch) → reusable (templates, patterns) → unique (current task)
- **Context Partitioning**: spawn when independent >5 min / parallel file ops / research; don't spawn for sequential deps, <2 min edits, shared mutable state
- **Context Check**: if estimated context > 70%, compact before next batch — never exceed 80%

---

## Batch 1: Setup & Foundation

### Batch 1 Start: Sync
- [ ] Mark completed tasks in `plan.md` (update checkboxes/status)
- [ ] Read `findings.md` for key discoveries
- [ ] **Context Check**: If estimated context > 70%, run compaction before proceeding

### Batch 1 Context
- Overall Goal: Make `people.journey` always store UUID track keys and UUID stage values
- Current Batch Goal: Clean `main` tree, baseline green, findings initialized
- Previous Batch: None — fresh plan
- Key Findings: `findings.md#root-cause`
- Current State: Not started
- Budget: Stable 20% | Current 30% | History 30% | Buffer 20%
- Optimization Status: Clean

### Subphase 1.1: Git assessment
Context: `main` is dirty with unrelated in-progress elvanto-sync settings work (ActivityTab, SemanticStatusBadge, sync-batch — see `git status`). This plan's changes must not mix with that work.
Todo:
- [ ] Review `git status`; commit or stash the in-progress elvanto-sync settings work (unrelated to journey UUID fixes)
- [ ] Confirm on `main` and working tree clean except new `.agents/planning/people/plan/`
Subagent: No
Deliverable: Clean `main` working tree

### Subphase 1.2: Initialize findings.md
Todo:
- [ ] Create `.agents/planning/people/plan/findings.md` (root cause, seeds decision, sync-copy locations)
- [ ] Record seeds decision: NO seed INSERTs; JourneySettingsManager is definitive
Subagent: No
Deliverable: `findings.md`

### Subphase 1.3: Baseline verification
Todo:
- [ ] `pnpm typecheck` — capture current output
- [ ] `pnpm test` — capture pass/fail baseline
- [ ] Record baseline in `findings.md#baseline`
Subagent: No
Deliverable: Green (or documented) baseline

### Batch 1 Compaction
- Summarize completed tasks in plan.md (not full history)
- Store detailed findings in findings.md, reference by summary
- Mask observations: replace verbose outputs with plan.md refs
- Cache-friendly ordering: stable → reusable → unique

---

## Batch 2: Core people module (plugin-independent)

### Batch 2 Start: Sync
- [ ] Mark completed tasks in `plan.md` (update checkboxes/status)
- [ ] Read `findings.md` for key discoveries
- [ ] **Context Check**: If estimated context > 70%, run compaction before proceeding

### Batch 2 Context
- Overall Goal: Make `people.journey` always store UUID track keys and UUID stage values
- Current Batch Goal: `people.journey` values are always stage UUIDs on the app path
- Previous Batch: Batch 1 completed — clean `main` tree, baseline green, `findings.md` initialized
- Key Findings: `findings.md#root-cause` — CreatePerson defaults to slug `contact`; delete-protection guards deterministic UUIDs that UI-created stages never have
- Current State: Batch 1 complete; starting core fixes
- Budget: Stable 20% | Current 40% | History 20% | Buffer 20%
- Optimization Status: Clean

### Subphase 2.1: Stage-resolution helper (TDD)
Context: JourneySettingsManager creates stages with `crypto.randomUUID()` (`queries.ts:281`), so the app must resolve stage IDs by slug at runtime, never hardcode.
Todo:
- [ ] Write FAILING test in `src/modules/people/lib/journey-grid-helpers.test.ts`: `resolveStageId(stages, 'contact')` returns matching `stage.id`; unknown slug → `null`
- [ ] Implement `resolveStageId(stages: JourneyStage[], slug: string): string | null` in `src/modules/people/lib/journey-grid-helpers.ts`
- [ ] Test passes
Subagent: No (pure helper, <5 min)
Deliverable: Tested pure helper

### Subphase 2.2: Fix CreatePerson default stage
Context: `Form.tsx:76` writes `journey[track] ?? 'contact'` (slug) — matches no `journey_stages.id` post-migration; created people show no stage selected in `Journey.tsx:156,162`.
Todo:
- [ ] Write FAILING test: submit create-person form with a track and no explicit stage → journey value equals the contact stage's `id` (mock supabase per existing patterns in `src/modules/people/lib/search.test.ts`)
- [ ] Fix `src/modules/people/pages/CreatePerson/Form.tsx:76` — resolve contact stage id via `resolveStageId(stagesQuery.data, 'contact')`; fall back to first non-terminal stage id; if no stages exist, block submit with "Configure journey stages first"
- [ ] Test passes
Subagent: No
Deliverable: Create-person writes UUID stage values

### Subphase 2.3: Slug-based seeded-stage protection
Context: `queries.ts:284-294` hardcodes 6 deterministic UUIDs; UI-created stages never match. Protection should key on slug (semantic constant), not id.
Todo:
- [ ] Write FAILING test: `deleteJourneyStage` refuses a stage whose slug is in the protected set (`contact|guest|linked|regular|archived|deleted_privacy_data`) regardless of id; allows custom slugs
- [ ] Refactor `src/modules/people/lib/queries.ts:284-297` — fetch stage by id, protect by slug set
- [ ] Test passes
Subagent: No (same file as 2.1/2.2 — serial)
Deliverable: Slug-based protection

### Subphase 2.4: Verify core flows
Todo:
- [ ] `pnpm test` — people module green
- [ ] Manual: Journey Grid Settings → add/edit/delete stage; Create Person → journey defaults to Contact; Journey section shows badge
Subagent: No
Deliverable: Verified core flows

### Batch 2 Compaction
- Summarize completed tasks in plan.md (not full history)
- New findings → `findings.md#phase-2`
- Mask observations: replace verbose outputs with plan.md refs
- If context > 70%: compact before Batch 3

---

## Batch 3: Elvanto sync worker

### Batch 3 Start: Sync
- [ ] Mark completed tasks in `plan.md` (update checkboxes/status)
- [ ] Read `findings.md` for key discoveries
- [ ] **Context Check**: If estimated context > 70%, run compaction before proceeding

### Batch 3 Context
- Overall Goal: Make `people.journey` always store UUID track keys and UUID stage values
- Current Batch Goal: Sync writes UUID track keys and resolvable UUID stage values
- Previous Batch: Batch 2 completed — core module writes UUID stage values; slug-based protection in place
- Key Findings: `findings.md#sync-copies` — 3 copies of sync logic; edge worker is authoritative, `public/` is generated
- Current State: Batch 2 complete; starting sync fixes
- Budget: Stable 20% | Current 40% | History 20% | Buffer 20%
- Optimization Status: Clean

### Subphase 3.1: Track-key resolution (UUID keys)
Context: `people-sync.ts:229` calls `resolveJourneyTrackId()` which returns placeholder slug `journey-track-sunday-services` (`people-sync.ts:364-368`). `loadJourneyTrackMap` (`people-sync.ts:108-136`) already loads the real Sunday Services track UUID into `journeyTrackMap.sundayService` but never passes it to `applyMappings`. Same placeholder in dormant `src/content/plugins/elvanto-sync/sync/mapping-engine.ts:174,250-256`.
Todo:
- [ ] Fix `supabase/functions/elvanto-sync-worker/people-sync.ts`: pass `journeyTrackMap` into `applyMappings`; replace line 229 with `const trackId = journeyTrackMap?.sundayService`; delete `resolveJourneyTrackId` (lines 364-368)
- [ ] Mirror fix in `src/content/plugins/elvanto-sync/sync/mapping-engine.ts:174,250-256` (dormant copy — keep in sync)
- [ ] Do NOT hand-edit `public/content/plugins/elvanto-sync/` — regenerated by `node scripts/copy-plugins.mjs`
Subagent: Yes (independent files)
Deliverable: Sync writes UUID track keys

### Subphase 3.2: Stage-value resolution (slug→id at runtime)
Context: `transforms.ts:39-42` and `journey-sync.ts:285-292` hardcode the 6 deterministic stage UUIDs ("must match migration seed values"). Under UI-created stages these IDs don't exist → sync writes orphan UUIDs. `DEFAULT_JOURNEY` (`people-sync.ts:11`) also hardcodes the contact stage UUID.
Todo:
- [ ] Add `loadStageMap(supabase)` to the sync worker: `SELECT id, slug FROM journey_stages` → slug→id map
- [ ] Replace `STAGE_UUIDS` usage in `supabase/functions/elvanto-sync-worker/journey-sync.ts:285-325` and `transforms.ts:39-42` with map lookups; on missing slug: skip track + `console.warn`, never write orphan UUID
- [ ] Fix `DEFAULT_JOURNEY` (`people-sync.ts:11,703-705`) to build from the stage map (contact slug → resolved id)
- [ ] Mirror in src plugin copies (`src/content/plugins/elvanto-sync/sync/{transforms,journey-sync}.ts`)
Subagent: Yes (independent files from 3.1)
Deliverable: Sync writes UUID stage values that exist in `journey_stages`

### Subphase 3.3: Verify sync output
Context: Deno edge functions cannot run locally (correction: `supabase.edge_function_environment`) — deploy to verify.
Todo:
- [ ] `supabase functions deploy elvanto-sync-worker`
- [ ] Run sync for a test person; verify with SQL:
  ```sql
  SELECT jt.name AS track, js.label AS stage
  FROM people p, jsonb_each_text(p.journey) je(key, val)
  LEFT JOIN journey_tracks jt ON jt.id = je.key::uuid
  LEFT JOIN journey_stages js ON js.id = je.val::uuid
  WHERE p.firstname = 'Rachel' AND p.lastname = 'Li';
  ```
  Expected: every row has non-null track AND stage (previously null).
Subagent: No
Deliverable: Verified sync writes resolvable UUID pairs

### Batch 3 Compaction
- Summarize completed tasks in plan.md (not full history)
- New findings → `findings.md#phase-3`
- Mask observations: replace verbose outputs with plan.md refs
- If context > 70%: compact before Batch 4

---

## Batch 4: Testing & Quality

### Batch 4 Start: Sync
- [ ] Mark completed tasks in `plan.md` (update checkboxes/status)
- [ ] Read `findings.md` for key discoveries
- [ ] **Context Check**: If estimated context > 70%, run compaction before proceeding

### Batch 4 Context
- Overall Goal: Make `people.journey` always store UUID track keys and UUID stage values
- Current Batch Goal: Changed code covered; full gate green
- Previous Batch: Batch 3 completed — sync writes UUID keys + resolvable UUID values
- Key Findings: `findings.md` (all sections)
- Current State: Batch 3 complete; running quality gate
- Budget: Stable 20% | Current 40% | History 20% | Buffer 20%
- Optimization Status: Clean

### Subphase 4.1: Unit coverage
Todo:
- [ ] ≥70% coverage on changed lines: `journey-grid-helpers.ts`, `Form.tsx` default, `queries.ts` protection
Subagent: Yes (parallel)
Deliverable: Coverage report

### Subphase 4.2: Integration checks
Todo:
- [ ] Journey grid renders stages as columns; settings manager CRUD works end-to-end
- [ ] Sync mapping output verified (Batch 3.3 SQL)
Subagent: Yes (parallel)
Deliverable: Passing integration checks

### Subphase 4.3: Full gate
Todo:
- [ ] `pnpm typecheck` — zero errors
- [ ] `pnpm test` — all green
- [ ] `pnpm build` — succeeds
Subagent: No
Deliverable: Green gate

### Batch 4 Compaction
- Summarize completed tasks in plan.md (not full history)
- Mask observations: replace verbose outputs with plan.md refs
- If context > 70%: compact before Batch 5

---

## Batch 5: Docs & Decisions

### Batch 5 Start: Sync
- [ ] Mark completed tasks in `plan.md` (update checkboxes/status)
- [ ] Read `findings.md` for key discoveries
- [ ] **Context Check**: If estimated context > 70%, run compaction before proceeding

### Batch 5 Context
- Overall Goal: Make `people.journey` always store UUID track keys and UUID stage values
- Current Batch Goal: Docs match reality; open decisions resolved
- Previous Batch: Batch 4 completed — full gate green
- Key Findings: `findings.md`
- Current State: Batch 4 complete; updating docs
- Budget: Stable 20% | Current 40% | History 20% | Buffer 20%
- Optimization Status: Clean

### Subphase 5.1: Update peopleFields.md (SSOT)
Todo:
- [ ] `:23` example → UUID keys/values: `{ "<track-uuid>": "<stage-uuid>" }`
- [ ] `:27` complete `journey_tracks` columns: add `elvanto_location_id`, `follow_elvanto`, `deleted_at`
- [ ] `:29` `people.journey` documented as `{journey_track_id → journey_stage_id}` (UUIDs), not slugs
Subagent: Yes (parallel)
Deliverable: Accurate SSOT

### Subphase 5.2: Fix migration comment
Todo:
- [ ] `supabase/migrations/20260908200000_journey_stages_uuid_pk.sql:13-14` claims "Creates a slug→id mapping function" but defines none — either add `CREATE FUNCTION slug_to_stage_id(slug text)` or correct the comment
Subagent: No
Deliverable: Comment matches file contents

### Subphase 5.3: Decision gate A — contact_channels
Context: Type referenced (`database.types.ts:263`, `people/lib/types.ts:14`) but no migration creates the table (decision.md B.1/E.11: designed, not migrated; `people.mobile` is the implemented field).
Todo:
- [ ] DECIDE: remove type references (YAGNI) vs migrate table. Recommendation: remove refs; re-add when contact-channel CRUD is built (E.11)
Subagent: No
Deliverable: Resolved decision, logged in findings.md

### Subphase 5.4: Decision gate B — Module API list
Context: `people/decision.md:41` lists `getWithValidWWCC`/`getWithSafeMinistry` which don't exist in `queries.ts`.
Todo:
- [ ] DECIDE: implement vs remove from docs. Recommendation: remove from docs; implement when a consumer needs them
Subagent: No
Deliverable: Resolved decision, logged in findings.md

### Subphase 5.5: Record seeds decision
Todo:
- [ ] Confirm `findings.md#seeds-decision`: no INSERTs; UI definitive; deterministic-UUID delete-protection replaced by slug-based (Batch 2.3)
Subagent: No
Deliverable: Decision recorded

### Subphase 5.6: Commits & handoff
Todo:
- [ ] One commit per batch (5 commits), conventional messages (`fix(people): ...`, `fix(elvanto-sync): ...`, `docs(people): ...`)
- [ ] Push `main`
Subagent: No
Deliverable: Ready-to-merge PR

### Batch 5 Compaction
- Summarize completed tasks in plan.md (not full history)
- Final: update "Current:" line in 5-Question Reboot Test to "Complete"

---

## Execution Handoff
- Subagent-driven: fresh subagent per batch this session, OR
- New session: hand off `plan.md` + `findings.md` paths; execute Batch 1 → 5 in order
