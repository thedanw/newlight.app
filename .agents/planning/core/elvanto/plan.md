# Elvanto Sync SSOT Documentation Rebuild — Execution Plan

## Task definition

**Role.** You are a senior software engineer who maintains LLM-agent-facing documentation for the newlight.app codebase, with working knowledge of the Elvanto API, Supabase, and the sync architecture.

**Objective.** Rebuild `.agents\planning\core\elvanto\` as the single source of truth (SSOT) that enables LLM agents to accurately develop and maintain the Elvanto sync plugin at `src\content\plugins\elvanto-sync` — the sync layer between the app (including Supabase) and Elvanto.

**Source precedence — when sources disagree, the higher source wins:**

1. Working code in `src\content\plugins\elvanto-sync\` and `supabase\functions\elvanto-sync-worker\` (the only thing that runs)
2. Handoff document `.agents\planning\core\elvanto\archive\sync-now-fix-summary.md` (newest known fixed state)
3. Skills: `.agents\skills\supabase\SKILL.md` and `.agents\skills\elvanto\elvanto-api\SKILL.md` (including its `references\` folder)
4. Legacy documents in `.agents\planning\core\elvanto\archive\`

**Constraints.**

- Rebuild a SMALL set of live documents at the `.agents\planning\core\elvanto\` folder root. The `archive\` folder remains as the only history.
- Token efficiency by judgement, not by hard cap: maximise density, deduplicate across documents, no filler, no content an agent can read directly from the code.
- "Remove" means hard-delete redundant files from disk; git history is sufficient preservation.
- Documentation-only task: do not modify code, migrations, or skills.
- **No scripts or Python may be written into this plan or into any deliverable.** Execute every step with built-in read/edit/file tools, following the plain-language instructions below.
- `archive\sync-now-fix-summary.md` is never deleted.
- This file, `plan.md`, is never deleted and is not part of the audited document set.

**Progress convention.** Every step and checklist item starts with `- [ ]`. Mark `- [x]` when complete. Work phases in order; a phase may not start until all its subphases are checked.

**Batch discipline.** Each Phase is one Batch (Batch N ≡ Phase N). First task of every batch: run its `Batch N Start: Sync` block, then read `Batch N Context` before touching any subphase.

**Working file.** Record every discovery in `findings.md` (root working file — distinct from legacy `archive\findings.md`) under fixed sections: `#audit`, `#code-evidence`, `#handoff`, `#conflicts`, `#deletions`, `#validation`. Batch 7 extracts the report from it, then deletes it.

- [x] Create `findings.md` with the six section stubs before Batch 1.

---

## Phase 1 — Audit the existing documents

### Batch 1 Start: Sync
- [x] Mark completed tasks in `plan.md` (update checkboxes/status)
- [x] Read `findings.md` for key discoveries
- [x] Context check: if estimated context > 70%, compact before proceeding

### Batch 1 Context
- Goal: Rebuild `.agents\planning\core\elvanto\` as the Elvanto sync SSOT
- This Batch: Read, profile, overlap-map, and verdict all 15 archive docs — touch no files
- Prev: None — first batch; `findings.md` stubbed
- Key: `findings.md#audit`

### Subphase 1.1 — Read and profile each document

- [x] Step 1: Read `archive\sync-now-fix-summary.md` FIRST (it is the handoff document and the anchor for Phases 3 and 7).
- [x] Step 2: Read each remaining document below in full. For each, record in `findings.md#audit`: purpose, recency signals (dates, referenced file names), intended audience, one-line summary, and any claims that look stale.

Exact document checklist (15 files; non-blank line counts as profiled):

- [x] `.agents\planning\core\elvanto\archive\sync-now-fix-summary.md` (107 lines) — HANDOFF, keep always
- [x] `.agents\planning\core\elvanto\archive\AGENTS.md` (28 lines)
- [x] `.agents\planning\core\elvanto\archive\ELVANTO_AGENTS.md` (30 lines)
- [x] `.agents\planning\core\elvanto\archive\elvanto-sync-plugin-plan-compact.md` (17 lines)
- [x] `.agents\planning\core\elvanto\archive\api-audit-2026-08-25.md` (82 lines)
- [x] `.agents\planning\core\elvanto\archive\compatibility-design.md` (129 lines)
- [x] `.agents\planning\core\elvanto\archive\decision-alignment.md` (124 lines)
- [x] `.agents\planning\core\elvanto\archive\sync-design.md` (103 lines)
- [x] `.agents\planning\core\elvanto\archive\ELVANTO_API_REFERENCE.md` (231 lines)
- [x] `.agents\planning\core\elvanto\archive\ELVANTO_MIGRATION_PLAN.md` (185 lines)
- [x] `.agents\planning\core\elvanto\archive\ELVANTO_SYNC_CONTRACT.md` (190 lines)
- [x] `.agents\planning\core\elvanto\archive\ELVANTO_SYNC_PLUGIN_RUNBOOK.md` (277 lines)
- [x] `.agents\planning\core\elvanto\archive\findings.md` (214 lines)
- [x] `.agents\planning\core\elvanto\archive\schema.dbml` (662 lines)
- [x] `.agents\planning\core\elvanto\archive\SYNC_PLUGIN_FIELD_MAPPING_UI.md` (366 lines)

### Subphase 1.2 — Cross-document analysis

- [x] Step 1: Build an overlap map — which documents cover: agent instructions, API reference, database schema, sync design/contract, field mapping UI, runbook/operations, plan history.
- [x] Step 2: Record contradictions between documents (both sides quoted, no resolution yet).
- [x] Step 3: Record duplicated passages that could be consolidated into one live document.
- [x] Step 4: Assign each of the 15 files a provisional verdict: `KEEP-AS-HISTORY`, `MERGE-THEN-DELETE`, or `DELETE (redundant)`. Decisions are recorded now but NOT executed until Phase 5.

### Subphase 1.3 — Audit table deliverable

- [x] Step 1: Produce the audit table in `findings.md#audit`: file → provisional status → reason (report section 1).
- [x] Step 2: Check off every item in subphases 1.1–1.2 before proceeding.

---

## Phase 2 — Compare against the working codebase

### Batch 2 Start: Sync
- [x] Mark completed tasks in `plan.md` (update checkboxes/status)
- [x] Read `findings.md` for key discoveries
- [x] Context check: if estimated context > 70%, compact before proceeding

### Batch 2 Context
- Goal: Rebuild `.agents\planning\core\elvanto\` as the Elvanto sync SSOT
- This Batch: Map every documented claim to code evidence — code wins all conflicts
- Prev: Batch 1 — audit table complete; 15 docs profiled and verdicted
- Key: `findings.md#code-evidence`

### Subphase 2.1 — Plugin client code (`src\content\plugins\elvanto-sync\`, 36 files)

- [x] Step 1: Read the entry points and record how the plugin registers, what the manifest declares, and which settings tabs exist.

  - [x] `src\content\plugins\elvanto-sync\index.ts`
  - [x] `src\content\plugins\elvanto-sync\manifest.json`

- [x] Step 2: Read the API layer and record base URL handling, proxy/dev-server routing, request/response shapes, and which Elvanto endpoints are called.

  - [x] `src\content\plugins\elvanto-sync\api\client.ts`
  - [x] `src\content\plugins\elvanto-sync\api\endpoints.ts`

- [x] Step 3: Read the database layer and record types and the exact schema created by each plugin migration.

  - [x] `src\content\plugins\elvanto-sync\db\types.ts`
  - [x] `src\content\plugins\elvanto-sync\db\migrations\001_create_elvanto_settings.sql`
  - [x] `src\content\plugins\elvanto-sync\db\migrations\002_create_elvanto_sync_config.sql`
  - [x] `src\content\plugins\elvanto-sync\db\migrations\003_create_elvanto_sync_history.sql`
  - [x] `src\content\plugins\elvanto-sync\db\migrations\004_create_elvanto_sync_dead_letter.sql`

- [x] Step 4: Read the sync core and record the flow, trigger mechanism, watermark logic, mapping engine behaviour, and transform rules.

  - [x] `src\content\plugins\elvanto-sync\sync\edge-function.ts`
  - [x] `src\content\plugins\elvanto-sync\sync\elvanto-api.ts`
  - [x] `src\content\plugins\elvanto-sync\sync\trigger-sync.ts`
  - [x] `src\content\plugins\elvanto-sync\sync\watermark.ts`
  - [x] `src\content\plugins\elvanto-sync\sync\mapping-engine.ts`
  - [x] `src\content\plugins\elvanto-sync\sync\transforms.ts`
  - [x] `src\content\plugins\elvanto-sync\sync\transforms.test.ts`

- [x] Step 5: Read the three entity sync flows and record direction, batching, and error handling per entity.

  - [x] `src\content\plugins\elvanto-sync\sync\people-sync.ts`
  - [x] `src\content\plugins\elvanto-sync\sync\household-sync.ts`
  - [x] `src\content\plugins\elvanto-sync\sync\journey-sync.ts`

- [x] Step 6: Read the settings UI and record what each tab configures (this must match what the runbook and field-mapping docs claim).

  - [x] `src\content\plugins\elvanto-sync\settings\ElvantoSyncSettingsPage.tsx`
  - [x] `src\content\plugins\elvanto-sync\settings\ConnectionTab.tsx`
  - [x] `src\content\plugins\elvanto-sync\settings\ScheduleTab.tsx`
  - [x] `src\content\plugins\elvanto-sync\settings\FieldMappingTab.tsx`
  - [x] `src\content\plugins\elvanto-sync\settings\LocationTrackTab.tsx`
  - [x] `src\content\plugins\elvanto-sync\settings\HistoryTab.tsx`
  - [x] `src\content\plugins\elvanto-sync\settings\DeadLetterTab.tsx`
  - [x] `src\content\plugins\elvanto-sync\settings\components\FieldMappingTable.tsx`
  - [x] `src\content\plugins\elvanto-sync\settings\components\MappingRow.tsx`
  - [x] `src\content\plugins\elvanto-sync\settings\components\DirectionSelect.tsx`
  - [x] `src\content\plugins\elvanto-sync\settings\components\LocationTrackPairing.tsx`
  - [x] `src\content\plugins\elvanto-sync\settings\components\SyncHistoryTable.tsx`
  - [x] `src\content\plugins\elvanto-sync\settings\components\DeadLetterTable.tsx`

- [x] Step 7: Read the utilities and the status widget; record cron scheduling, credential encryption, and field discovery behaviour.

  - [x] `src\content\plugins\elvanto-sync\utils\cron.ts`
  - [x] `src\content\plugins\elvanto-sync\utils\encryption.ts`
  - [x] `src\content\plugins\elvanto-sync\utils\field-discovery.ts`
  - [x] `src\content\plugins\elvanto-sync\widgets\ElvantoSyncStatusWidget.tsx`

### Subphase 2.2 — Edge function and Supabase layer

- [x] Step 1: Read the edge function and record CORS handling, auth/gateway headers, credential retrieval, sync orchestration, and error responses.

  - [x] `supabase\functions\elvanto-sync-worker\index.ts`
  - [x] `supabase\functions\elvanto-sync-worker\people-sync.ts`
  - [x] `supabase\functions\elvanto-sync-worker\household-sync.ts`
  - [x] `supabase\functions\elvanto-sync-worker\journey-sync.ts`
  - [x] `supabase\functions\elvanto-sync-worker\mapping-engine.ts`
  - [x] `supabase\functions\elvanto-sync-worker\transforms.ts`
  - [x] `supabase\functions\elvanto-sync-worker\watermark.ts`
  - [x] `supabase\functions\elvanto-sync-worker\db\types.ts`

- [x] Step 2: Read the deployed migrations and record the authoritative remote schema, RLS policies, grants, and the encryption key column.

  - [x] `supabase\migrations\20260829130000_create_elvanto_settings.sql`
  - [x] `supabase\migrations\20260829130001_create_elvanto_sync_config.sql`
  - [x] `supabase\migrations\20260829130002_create_elvanto_sync_history.sql`
  - [x] `supabase\migrations\20260829130003_create_elvanto_sync_dead_letter.sql`
  - [x] `supabase\migrations\20260908100000_fix_elvanto_plugin_authenticated_rls.sql`
  - [x] `supabase\migrations\20260920120100_fix_elvanto_super_admin_write_grants.sql`
  - [x] `supabase\migrations\20260927124952_add_encryption_key_to_elvanto_settings.sql`

### Subphase 2.3 — The `public\` duplicate copy

- [x] Step 1: Establish the relationship between `src\content\plugins\elvanto-sync\` and the tracked copy under `public\content\plugins\elvanto-sync\` (37 git-tracked files): whether it is generated by the build or maintained as a second source.
- [x] Step 2: Compare the two copies for drift in the sync core (`trigger-sync.ts`, `elvanto-api.ts`, `transforms.ts`, `mapping-engine.ts`) and record the finding as a documented fact — the live docs must state which copy agents should edit. Investigation only; do not modify code.

### Subphase 2.4 — Claim → evidence mapping

- [x] Step 1: For every significant claim carried over from the audit, record in `findings.md#code-evidence`: claim → evidence (file path) → verdict (`current` / `stale` / `unsupported`).
- [x] Step 2: Extract the architecture facts the live docs must state: end-to-end sync flow, auth model, scheduling model, table inventory, endpoint inventory, and failure/dead-letter handling.
- [x] Step 3: Check off every item in subphases 2.1–2.3 before proceeding.

---

## Phase 3 — Incorporate the handoff document

### Batch 3 Start: Sync
- [x] Mark completed tasks in `plan.md` (update checkboxes/status)
- [x] Read `findings.md` for key discoveries
- [x] Context check: if estimated context > 70%, compact before proceeding

### Batch 3 Context
- Goal: Rebuild `.agents\planning\core\elvanto\` as the Elvanto sync SSOT
- This Batch: Extract handoff facts, verify each against current code, mark contradicting legacy docs stale
- Prev: Batch 2 — claim→evidence map done; plugin, edge function, migrations, `public\` copy reviewed
- Key: `findings.md#handoff`

### Subphase 3.1 — Extract current-state facts

- [x] Step 1: Re-read `archive\sync-now-fix-summary.md` section by section; record each fact below in `findings.md#handoff` as a candidate statement for the live docs.

  - [x] Original issue: Sync Now button CORS error, 500 on edge function, client "Failed to fetch"
  - [x] Root cause: error responses returned without CORS headers
  - [x] Root cause: variable name typo in `runSync()` (`lastCredentialError` vs `lastCredentialError1`)
  - [x] Root cause: edge function deployed with JWT verification disabled, manual JWT validation instead of gateway headers
  - [x] Root cause: client requests missing the `apikey` header required when JWT verification is on
  - [x] Root cause: incorrect JWT retrieval in client (getUser → getSession), previously fixed
  - [x] Fix: global try/catch wrapper guaranteeing CORS headers on all responses
  - [x] Fix: gateway header authentication (`x-supabase-user-id`, `x-supabase-user-email`, `x-supabase-user-role`) with local-dev fallback
  - [x] Fix: `apikey` header added to trigger and test-connection requests in both `src\` and `public\` copies
  - [x] Deployment state: JWT verification enabled on `elvanto-sync-worker`
  - [x] Verification results: CORS preflight, error responses, build all passing
  - [x] Current behaviour: signed-in users can sync; unauthenticated requests get 401 with CORS; legacy anon/service_role JWTs rejected when verification is on
  - [x] Additional fix: credential errors returned from `getCredentials()` instead of a closure variable
  - [x] Additional fix: legacy JWT payload fallback for local development
  - [x] Additional fix: `encryption_key_encrypted` column missing remotely, added by dedicated migration
  - [x] Additional fix: empty-string encryption key rejected explicitly (null/undefined/blank check)
  - [x] Files modified list, and environment facts (Supabase project id, function URL, dev server) — record as plain text only

### Subphase 3.2 — Verify handoff claims against current code

- [x] Step 1: Confirm the global try/catch and CORS-on-error handling exist in `supabase\functions\elvanto-sync-worker\index.ts`.
- [x] Step 2: Confirm gateway header authentication and the local-dev fallback exist as described.
- [x] Step 3: Confirm the `apikey` header is sent from `src\content\plugins\elvanto-sync\sync\trigger-sync.ts` (and note the state of the `public\` copy).
- [x] Step 4: Confirm session-based token retrieval (getSession) in the client trigger path.
- [x] Step 5: Confirm the encryption key validation logic and that migration `20260927124952_add_encryption_key_to_elvanto_settings.sql` matches the described fix.
- [x] Step 6: Mark any handoff claim that no longer matches the code as `stale (superseded by code)` in the claim → evidence map.

### Subphase 3.3 — Stale-marking

- [x] Step 1: Mark every older archive document that contradicts subphases 3.1–3.2 as stale in the audit table (precedence: code > handoff > skills > legacy docs).
- [x] Step 2: Check off every item in subphases 3.1–3.2 before proceeding.

---

## Phase 4 — Write the live SSOT documents

### Batch 4 Start: Sync
- [x] Mark completed tasks in `plan.md` (update checkboxes/status)
- [x] Read `findings.md` for key discoveries
- [x] Context check: if estimated context > 70%, compact before proceeding

### Batch 4 Context
- Goal: Rebuild `.agents\planning\core\elvanto\` as the Elvanto sync SSOT
- This Batch: Write the 6 live docs (names adjustable if the audit justifies it); every statement precedence-verified
- Prev: Batch 3 — handoff facts verified against code; stale contradictions recorded
- Key: `findings.md#code-evidence`

### Subphase 4.1 — `README.md` (index and orientation)

- [x] Step 1: Write what the Elvanto sync plugin is, where the code lives (`src\`, `public\`, `supabase\functions\`, `supabase\migrations\`), and which copy agents should edit.
- [x] Step 2: Document the source precedence rule for future agents and link to the supabase and elvanto skills instead of restating them.
- [x] Step 3: Add the map of live documents: each file → one-line purpose, plus "start here" guidance for common tasks.
- [x] Step 4: Verify `.agents\planning\core\elvanto\README.md` exists and every link in it resolves.

### Subphase 4.2 — `architecture.md` (sync flow)

- [x] Step 1: Document the end-to-end flow: settings UI → trigger → edge function → Elvanto API → transforms → Supabase tables (and the reverse direction where it exists).
- [x] Step 2: Document the auth model: JWT verification, `apikey` header, gateway headers, local-dev fallback, credential encryption — all per Phase 3 verification.
- [x] Step 3: Document scheduling (cron/watermark), manual Sync Now, history recording, and the dead-letter loop.
- [x] Step 4: Verify `.agents\planning\core\elvanto\architecture.md` exists and matches the code evidence recorded in Phase 2.

### Subphase 4.3 — `database.md` (schema reference)

- [x] Step 1: Document the four sync tables (`elvanto_settings`, `elvanto_sync_config`, `elvanto_sync_history`, `elvanto_sync_dead_letter`) from the deployed migrations — authoritative source is `supabase\migrations\`, not `archive\schema.dbml`.
- [x] Step 2: Document RLS policies and grants from the two fix migrations, and the `encryption_key_encrypted` column including its addition migration.
- [x] Step 3: Note where `schema.dbml` and the plugin-local `db\migrations` disagree with the deployed migrations, if anywhere.
- [x] Step 4: Verify `.agents\planning\core\elvanto\database.md` exists and every table/column it names appears in a migration file.

### Subphase 4.4 — `elvanto-api.md` (integration reference)

- [x] Step 1: List exactly the Elvanto endpoints the plugin calls, sourced from `api\endpoints.ts`, `api\client.ts`, and `sync\elvanto-api.ts` — not from legacy docs.
- [x] Step 2: Document auth flow and field discovery, linking to `.agents\skills\elvanto\elvanto-api\references\auth.md` and `endpoints.md` for the full API surface rather than duplicating it.
- [x] Step 3: Document request/response handling: base URL, dev proxy, pagination, error surfaces, rate-limit behaviour as evidenced in code.
- [x] Step 4: Verify `.agents\planning\core\elvanto\elvanto-api.md` exists; every endpoint listed matches the code.

### Subphase 4.5 — `field-mapping.md` (mapping and transforms)

- [x] Step 1: Document how field mappings are stored, configured in `FieldMappingTab`, and applied by `mapping-engine.ts` — including direction handling and location pairing.
- [x] Step 2: Document transform rules from `transforms.ts` (and confirm the test file's expectations agree).
- [x] Step 3: Salvage still-current mapping tables from `archive\SYNC_PLUGIN_FIELD_MAPPING_UI.md` only after verifying them against code; anything unverified stays out.
- [x] Step 4: Verify `.agents\planning\core\elvanto\field-mapping.md` exists and every documented mapping appears in code or tests.

### Subphase 4.6 — `operations.md` (runbook)

- [x] Step 1: Document operational flows evidenced in code: running a sync, reading history, retrying/replaying dead letters, connection testing, schedule changes.
- [x] Step 2: Document the deployment and environment facts from Phase 3 (function, project, JWT verification state) as plain text — no commands copied verbatim, describe the action instead.
- [x] Step 3: Document troubleshooting paths for the failure classes named in the handoff (CORS, 401, missing encryption key, credential errors).
- [x] Step 4: Salvage still-current runbook content from `archive\ELVANTO_SYNC_PLUGIN_RUNBOOK.md` after code verification; verify `.agents\planning\core\elvanto\operations.md` exists.

### Subphase 4.7 — Density, deduplication, and cross-linking pass

- [x] Step 1: Remove filler, hedging, and any content an agent can read from the code; each fact is stated once across the whole set.
- [x] Step 2: Replace any restated API field/endpoint tables with links to the skill references.
- [x] Step 3: Cross-link related live docs (README ↔ each doc; doc ↔ doc where a claim depends on another).
- [x] Step 4: Confirm no live document contains scripts or Python snippets — describe behaviour in prose and tables only.
- [x] Step 5: Check off every item in subphases 4.1–4.6 before proceeding.

---

## Phase 5 — Remove legacy and redundant documents

### Batch 5 Start: Sync
- [x] Mark completed tasks in `plan.md` (update checkboxes/status)
- [x] Read `findings.md` for key discoveries
- [x] Context check: if estimated context > 70%, compact before proceeding

### Batch 5 Context
- Goal: Rebuild `.agents\planning\core\elvanto\` as the Elvanto sync SSOT
- This Batch: Decide keep/delete per archive file; hard-delete redundant files with file tools only
- Prev: Batch 4 — live doc set written; density/dedup pass done
- Key: `findings.md#deletions`

### Subphase 5.1 — Keep/delete decision per file

- [x] Step 1: For each file below, finalise the verdict from Phase 1 using the Phase 4 result: `DELETE` only if the file is fully superseded by the live set; `KEEP-AS-HISTORY` if it holds unique history or context; the handoff is always `KEEP-AS-HISTORY`.

  - [x] `archive\sync-now-fix-summary.md` — HANDOFF → always KEEP-AS-HISTORY
  - [x] `archive\AGENTS.md` → decide
  - [x] `archive\ELVANTO_AGENTS.md` → decide
  - [x] `archive\elvanto-sync-plugin-plan-compact.md` → decide
  - [x] `archive\api-audit-2026-08-25.md` → decide
  - [x] `archive\compatibility-design.md` → decide
  - [x] `archive\decision-alignment.md` → decide
  - [x] `archive\sync-design.md` → decide
  - [x] `archive\ELVANTO_API_REFERENCE.md` → decide
  - [x] `archive\ELVANTO_MIGRATION_PLAN.md` → decide
  - [x] `archive\ELVANTO_SYNC_CONTRACT.md` → decide
  - [x] `archive\ELVANTO_SYNC_PLUGIN_RUNBOOK.md` → decide
  - [x] `archive\findings.md` → decide
  - [x] `archive\schema.dbml` → decide
  - [x] `archive\SYNC_PLUGIN_FIELD_MAPPING_UI.md` → decide

- [x] Step 2: Record every verdict with its reason in the audit table (file → status → reason).

### Subphase 5.2 — Execute deletions

- [x] Step 1: Delete each file marked `DELETE` from disk using file tools (git history is the preservation mechanism).
- [x] Step 2: Confirm the protected files still exist: `plan.md` and `archive\sync-now-fix-summary.md`.
- [x] Step 3: Scan the live document set for links pointing at deleted files; fix every broken link.

### Subphase 5.3 — Deletion record

- [x] Step 1: Produce the deletion list in `findings.md#deletions`: path → reason (report section 4).
- [x] Step 2: Check off every item in subphases 5.1–5.2 before proceeding.

---

## Phase 6 — Fact-check surviving documents against the skills

### Batch 6 Start: Sync
- [x] Mark completed tasks in `plan.md` (update checkboxes/status)
- [x] Read `findings.md` for key discoveries
- [x] Context check: if estimated context > 70%, compact before proceeding

### Batch 6 Context
- Goal: Rebuild `.agents\planning\core\elvanto\` as the Elvanto sync SSOT
- This Batch: Fact-check endpoints/fields/auth in every surviving doc against both skills; fix conflicts by precedence
- Prev: Batch 5 — deletions executed; protected files intact; links repaired
- Key: `findings.md#conflicts`

### Subphase 6.1 — Supabase skill check

- [x] Step 1: Read `.agents\skills\supabase\SKILL.md` and extract the conventions relevant to this plugin (schema, auth, edge functions, migrations).
- [x] Step 2: Verify every Supabase claim in the live documents conforms to the skill; where code and skill disagree, code wins and the disagreement is logged.
- [x] Step 3: Confirm no live document duplicates skill-internal material (`CHANGELOG.md`, `references\skill-feedback.md`, `assets\feedback-issue-template.md`) — link instead.

### Subphase 6.2 — Elvanto skill check

- [x] Step 1: Read the skill entry point `.agents\skills\elvanto\elvanto-api\SKILL.md` and note how it scopes the references.
- [x] Step 2: Read each reference file and cross-check the corresponding claims in `elvanto-api.md` and any surviving legacy doc:

  - [x] `.agents\skills\elvanto\elvanto-api\references\auth.md` — auth claims in all live docs
  - [x] `.agents\skills\elvanto\elvanto-api\references\endpoints.md` — endpoint list in `elvanto-api.md`
  - [x] `.agents\skills\elvanto\elvanto-api\references\people-fields.md` — people mapping in `field-mapping.md`
  - [x] `.agents\skills\elvanto\elvanto-api\references\group-fields.md` — group/location claims
  - [x] `.agents\skills\elvanto\elvanto-api\references\services-fields.md` — services-related claims
  - [x] `.agents\skills\elvanto\elvanto-api\references\calendar-events-fields.md` — calendar claims, if any survive
  - [x] `.agents\skills\elvanto\elvanto-api\references\peopleFlows-fields.md` — peopleFlows claims, if any survive
  - [x] `.agents\skills\elvanto\elvanto-api\references\song-fields.md` — song claims, if any survive
  - [x] `.agents\skills\elvanto\elvanto-api\references\song-arrangement-fields.md` — arrangement claims, if any survive
  - [x] `.agents\skills\elvanto\elvanto-api\references\song-key-fields.md` — song-key claims, if any survive

- [x] Step 3: For every endpoint/field/auth conflict found: apply precedence (code > handoff > skills > legacy doc), fix the lower source's claim in the surviving document, and record the resolution.

### Subphase 6.3 — Conflict log

- [x] Step 1: Produce the conflict log in `findings.md#conflicts`: what disagreed → which source won → what changed (report section 2).
- [x] Step 2: Check off every item in subphases 6.1–6.2 before proceeding.

---

## Phase 7 — Validate and report

### Batch 7 Start: Sync
- [x] Mark completed tasks in `plan.md` (update checkboxes/status)
- [x] Read `findings.md` for key discoveries
- [x] Context check: if estimated context > 70%, compact before proceeding

### Batch 7 Context
- Goal: Rebuild `.agents\planning\core\elvanto\` as the Elvanto sync SSOT
- This Batch: Validate accuracy, links, and usability; extract report from `findings.md`; delete working file
- Prev: Batch 6 — skill fact-check complete; conflict log complete
- Key: `findings.md#validation`

### Subphase 7.1 — Accuracy validation

- [x] Step 1: Sample every factual statement in each live document and confirm it is supported by code, the handoff, or a skill (record the supporting source in `findings.md#validation`).
- [x] Step 2: Confirm no live document contradicts the precedence order or another live document.
- [x] Step 3: Confirm no live document contains scripts or Python snippets.

### Subphase 7.2 — Link and structure validation

- [x] Step 1: Check every relative link in every live document resolves to an existing file.
- [x] Step 2: Confirm no live document links to a file deleted in Phase 5.
- [x] Step 3: Confirm the final live set matches the README's document map exactly (nothing missing, nothing extra; exclude working file `findings.md`, deleted in 7.4).

### Subphase 7.3 — Fresh-agent usability test

- [x] Step 1: Using only the live documents, answer "how does sync work end-to-end?" — confirm `architecture.md` covers it without opening code.
- [x] Step 2: Using only the live documents, locate where to change each of: field mapping, schedule, dead-letter replay, credentials/encryption, an Elvanto endpoint call — each must map to a specific file path.
- [x] Step 3: Fix any gap found in 7.3.1–7.3.2 and re-run the check.

### Subphase 7.4 — Final report

- [x] Step 1: Extract section 1 from `findings.md#audit`: file → status (rewritten / merged / deleted / kept) → reason.
- [x] Step 2: Extract section 2 from `findings.md#conflicts`: what disagreed → which source won → what changed.
- [x] Step 3: Build section 3 — final live document list: path → one-line purpose.
- [x] Step 4: Extract section 4 from `findings.md#deletions`: path → reason.
- [x] Step 5: Extract section 5 from `findings.md#validation`: each check from 7.1–7.3 with pass/fail and evidence.
- [x] Step 6: Emit the five-section report, then delete the working file `findings.md`.
- [x] Step 7: Mark every remaining `- [ ]` in this plan as `- [x]` so progress is fully recorded.

---

## Definition of done

- [x] Live SSOT set exists at `.agents\planning\core\elvanto\` and passes all Phase 7 checks.
- [x] Redundant archive files hard-deleted; `plan.md` and `archive\sync-now-fix-summary.md` intact.
- [x] All surviving documents fact-checked against both skills with conflicts resolved by precedence.
- [x] Final report produced with all five sections.
- [x] All seven `Batch N Start: Sync` blocks run; working file `findings.md` deleted after report extraction.
- [x] Every checkbox in this plan is marked.
