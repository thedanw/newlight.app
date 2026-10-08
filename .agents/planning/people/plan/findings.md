# Findings — People Settings: Tabs + Custom Demographics + Icons + Elvanto Map-Journeys Integration

Research compiled 2026-10-08 (audit of working tree @ `fe5818e`). Executor: read this before every batch.

## Locked decisions (user-confirmed 2026-10-08)
1. **Schema = Option A**: `people.demographic` becomes `varchar` storing a readable **slug** (`adult`), FK → `demographics.slug`. Saved lists, audit jsonb, tests, and `people_public` keep readable values.
2. **`profile_type`**: each demographic row carries `profile_type enum('adult','youth','child')`; all visibility/behaviour rules key off `profile_type`, never off the value.
3. **Elvanto = Option A**: the **Map Journeys tab** becomes the one stop for Elvanto→app conversions. Each rule group gains a "set demographic" output (picked from custom demographics). Old built-in name matcher is deleted. **This feature is developed further as part of this plan.**
4. **Icons**: lucide icon OR uploaded image per demographic. Reuse `brand-assets` bucket under `demographics/` prefix; accept `image/png,image/svg+xml,image/webp,image/jpeg`, max 1MB (copy `ChurchAppearancePage.tsx:280-282`).
5. **Slug immutable** after create (name editable) — avoids stale refs in `saved_lists.conditions` and sync config. `ON UPDATE` not needed.
6. **Delete = migrate**: deleting a demographic REQUIRES a migration target (mirror `deleteJourneyTrack`, `queries.ts:310-325`), then soft-delete the row (`deleted_at`, like `journey_tracks`).

## Why the enum must go
- `create type demographic as enum ('adult','youth','child')` (`20260825221018_create_enums.sql:3`); `people.demographic ... default 'adult'` (`20260826002000_create_people_table.sql:14`).
- PG enums cannot delete/rename values or hold icon data → cannot meet features 2/3.
- Aligns with `core/database/decision.md` **A.7**: "PG enums for fixed domains; admin-customizable lists = table rows, not enums".
- No pg_cron demographic-progression job exists yet (only the `auto_progression` audit enum value) — future cron must resolve via `profile_type`.

## Schema target (one migration)
```sql
create type profile_type as enum ('adult','youth','child');
create table demographics (
  id uuid primary key default gen_random_uuid(),
  name varchar not null,
  slug varchar not null unique,
  profile_type profile_type not null default 'adult',
  icon_type varchar not null default 'lucide' check (icon_type in ('lucide','image')),
  icon_name varchar,              -- lucide export name OR public URL of uploaded image
  sort_order integer not null default 0,
  deleted_at timestamptz
);
create unique index demographics_slug_active on demographics(slug) where deleted_at is null;
-- seed: adult (User), youth (GraduationCap), child (Baby) — verify names exist in lucide-react@1.30
alter table people alter column demographic type varchar using demographic::text;
alter table people add constraint people_demographic_fk foreign key (demographic) references demographics(slug);
alter table people alter column demographic set default 'adult';
-- recreate people_public view (exposes demographic; anon-facing) + RLS/grants + drop type demographic
```
- Grants: authenticated rw + **anon SELECT** (public directory filter lists are dynamic now) + service_role (edge fn); RLS enable + permissive read policy (mirror journey tables pattern).
- Fallback rule (sync + UI): no valid value → keep existing if still active, else first active demographic by `sort_order`.
- **Enum dependency grep (Batch 2.1)**: 13 `demographic` hits in migrations, ALL accounted for — `20260825221018:3` type def (dropped at migration step 8), `20260826002000:14` column, `20260908120000:14` + `20260919100200:65` view cols (recreated), `20260908130000` search_people = `setof people`/`p.*` (no explicit ref, unaffected), `20260826003527:46` `groups.demographics` jsonb (Elvanto raw, unrelated), `tag_category` enum *value* `'demographic'` (unrelated type). **No `::demographic` casts anywhere.** Only `people_public` view depends on the column → drop-before-alter (step 4→7 in migration).

## Existing patterns to copy
- **Tabs**: `src/core/email/settings/EmailSettingsPage.tsx:286+` and `ElvantoSyncSettingsPage.tsx:19-67` (`TABS` array, `Tabs.Root/List/Trigger/Content` + `TabScroller`); component `src/core/ui/tabs.tsx` (ParkUI-vendored Ark UI). Note `Tabs.Root` throws in dev if no `Tabs.Content` child.
- **Delete-with-migration precedent**: `queries.ts:300-325` (`deleteJourneyCategory`, `deleteJourneyTrack` — rewrites `people.journey`, then soft-deletes). UI currently uses `prompt()` (`JourneySettingsManager.tsx:149,174`) — demographics MUST use `Dialog` (`src/core/ui/dialog.tsx`).
- **FileUpload**: `ChurchAppearancePage.tsx:149-155` (`uploadLogo` → `storage.from('brand-assets').upload(path, file)` + `getPublicUrl`), `:279-283` (accept/maxFileSize/reject messages).
- **Settings hooks**: `useJourneySettings` (`lib/settings-hooks.ts`); general hooks use `useAsyncQuery` (`lib/hooks.ts`) — new `useDemographics` goes in `lib/hooks.ts` (consumers outside settings).
- **CRUD query style**: `queries.ts:238-325` — plain supabase calls, throw on error, `crypto.randomUUID()` ids.
- **Test mocking**: `settings/__tests__/JourneySettingsManager.test.tsx` mocks `../lib/queries` + `../lib/hooks`; `lib/search.test.ts` shows supabase mock style.

## Elvanto custom-transforms architecture (Option A integration points)
- **UI**: `src/content/plugins/elvanto-sync/settings/MapJourneysTab.tsx` — `TransformGroup {id,name,conditions[ConditionRow{field:category|demographic|location|status_*,operator,value}],transforms[TransformRow{trackId,stageId}]}`; saved via `settings.setConfig('journey_transform_groups')` → `elvanto_sync_config` key **`elvanto-sync_journey_transform_groups`** (old format `journey_grid_mappings` migrated on load, line 113). `ConditionRow.field='demographic'` already exists; output is journey-only today.
- **Edge worker (authoritative)**: `supabase/functions/elvanto-sync-worker/people-sync.ts` — `loadJourneyTransformGroups` (:438, same key), `evaluateJourneyCondition` (:447+, already reads `elvantoRecord.demographics.demographic[].name/id`), `applyJourneyTransformGroups` (:528-539) returns `{trackId:stageId}` only → **the extension point**: also return matched `demographicSlug`, applied to `appRecord.demographic` BEFORE sanitize; later matching group wins (same as journey updates).
- **Old matcher to DELETE**: `category_to_demographic` (`src/content/.../sync/transforms.ts:43-71`; edge `transforms.ts` `demographics_array_to_enum` ~:307-343), `sanitizeDemographic` whitelist (`edge people-sync.ts:756-760`; src `people-sync.ts:387-391`), default mapping `{appField:'demographic', transform:'category_to_demographic'}` (`settings/components/FieldMappingTable.tsx:73`), transform option entry `:284`.
- **Replace with**: `resolveDemographicSlug(supabase, candidate)` — load active `demographics` slugs once per sync run; candidate valid → use; else keep existing person value if active, else first active by `sort_order`.
- **Legacy**: `loadCategoryDemographicTrackStageMappings` (`edge people-sync.ts:211,617`; config `category_demographic_track_stage_mappings`) — `CategoryTrackStageTab` is **NOT** in `ElvantoSyncSettingsPage.tsx:19-25` TABS (orphaned UI). Verify then remove loader or leave dormant (task 1.3).
- **Edge fallback today**: `people-sync.ts:728` `demographic: sanitizeDemographic(appRecord.demographic ?? mapCategoryToDemographic(person.category_id))`.

## Code impacted (compact map — audit 2026-10-08)
### Database objects
| Object | Change |
|---|---|
| `demographics` (NEW) | lookup + icons + profile_type; seed 3 rows; RLS/grants |
| `people.demographic` | enum → varchar FK → `demographics.slug`, default `'adult'` |
| `demographic` enum | drop after column swap |
| `people_public` view | recreate (`20260908120000:14`, `20260919100200:65`) — anon boundary |
| `people_audit` | per-person rows `change_reason='migration'` on bulk migrate (decision B.6/#4.9) |
| `saved_lists.conditions` | jsonb `{demographic: slug}` rewrite on delete-migrate |
| `elvanto_sync_config` | `journey_transform_groups` demographic outputs rewritten on delete-migrate |
| `brand-assets` bucket | reuse, `demographics/` prefix (no new bucket) |

### App files (change type)
- **Types/validation**: `src/core/lib/database.types.ts:21,286` (+ new Tables entry, `profile_type` enum) · `lib/types.ts:7,45` · `lib/validation.ts:10` (z.enum → z.string; FK = integrity).
- **Data layer** `lib/queries.ts`: `:7` PersonInput · `:45,62-63` audit · `:124,173` filters · `:617` default `'adult'` (valid post-seed) · new `getDemographics/createDemographic/saveDemographic/deleteDemographic(targetSlug)` · `SavedListConditions :333`.
- **Hooks**: new `useDemographics()` in `lib/hooks.ts` (consumers outside settings) + `resolveProfileType(demographics, slug)` pure helper.
- **Settings UI**: `settings/PeopleSettingsPage.tsx` (→ Tabs) · new `settings/DemographicsSettingsManager.tsx` · `JourneySettingsManager.tsx` (tab wrap only) · tests in `settings/__tests__/`.
- **Hardcoded option lists → dynamic**: `CreatePerson/Form.tsx:29,49-54,69,157-170` · `Dashboard/Filters.tsx:19-21,46-52` · `JourneyGrid/Page.tsx:14,18,20-25,49-57` · `components/sections/Demographics.tsx:16,89` (free-text → Select).
- **Behaviour branching → profile_type**: `EditPerson/Page.tsx:74,91-98,106` · `core/auth/AccountPage.tsx:80-87,92` · `lib/email.ts:120-122` (`canChat` child ban).
- **Display**: `Dashboard/Row.tsx:47-48` · `Household/Members.tsx:17` · `PersonProfile/Header.tsx:31` (keep blue/orange/green but key by profile_type) · `PersonProfile/Page.tsx:56` · `Dashboard/Table.tsx:19`.
- **Other consumers**: `core/email/lib/audience.ts:5,38,47` · `modules/forms/lib/queries.ts:17`.
- **Elvanto src copy**: `sync/transforms.ts:43-71,152-156` (`kindy_year_to_school_grade` youth/child check stays — keyed by slug; note if slugs renamed) · `transforms.test.ts:155-159` · `sync/people-sync.ts:387-391` · `FieldMappingTable.tsx:27,73,284` · `MapJourneysTab.tsx` (demographic output) · `utils/field-discovery.ts` (unchanged).
- **Edge worker**: `people-sync.ts` (section above) · `transforms.ts` registry · `index.ts:894-925` `list_demographics` (keep).
- **Tests with `demographic:'adult'` fixtures** (slug keeps them compiling): sections tests (Demographics/Personal/Contact/ChildSafety/Journey), `lib/{search,relationships}.test.ts`, `core/email/__tests__/audience.test.ts`, plugin `transforms.test.ts`; `Demographics.test.tsx` BREAKS (text input → Select).

## Sync copies (3-copy rule)
- `supabase/functions/elvanto-sync-worker/*` — **authoritative** (Deno; deploy to verify, no local run).
- `src/content/plugins/elvanto-sync/*` — plugin source; keep in sync with edge worker.
- `public/content/plugins/elvanto-sync/*` — generated by `node scripts/copy-plugins.mjs`; never hand-edit.

## Git state (2026-10-08)
- `main` **clean** @ `b047abd` (= `fe5818e` + `60a35ce` MapJourneysTab stage-UUID fix + `b047abd` JourneySection slug-keys fix); remote `origin` github.com/thedanw/newlight.app. Prior journey-UUID plan committed (`aeccfed`, `fe5818e`); journey map tab landed `d8cb404`.
- Work directly on existing `main` → `origin` (user directive 2026-10-08: no feature branch).

## Open verifications (Batch 1.3 — answers recorded 2026-10-08)
1. ✅ `search_people` returns `setof people` via `select p.*` (`20260908130000:161-170`) — no explicit `demographic` ref, no cast → keeps working after column type change; authenticated-only already (`20260919100200:73-76` revokes anon). `people_public` DOES expose `demographic` (`20260908120000:14`, recreated `20260919100200:65`) → view recreation REQUIRED (recipe has it). No other RPC touches demographic.
2. ✅ Apply workflow = **`npx supabase db push`** to linked hosted project (evidence: `supabase/.temp/project-ref` + `linked-project.json` + `SUPABASE_ACCESS_TOKEN` in `.env`; no local stack). `decision.md` A.1.2 = CLI + versioned migrations. Last applied migration `20260927124952`; our `20261008090000` sorts after → push applies only ours.
3. ✅ Registry removal list: edge `supabase/functions/elvanto-sync-worker/transforms.ts` — fns `demographics_array_to_enum` (:28-56) + `category_to_demographic` (:58-100), registry entries `TRANSFORMS` :320-321. src `sync/transforms.ts` — fn `category_to_demographic` (:43-70) + registry :315 (**src has NO `demographics_array_to_enum` fn**; but `FieldMappingTable.tsx:284` offers it as a dropdown option → remove option). Defaults state: `DEFAULT_MAPPINGS_BASE` `FieldMappingTable.tsx:66-85`, demographic rule at `:73` (`category_id` → `category_to_demographic` pull) → remove rule, keep `APP_FIELDS` `demographic` entry (:27) for display.
4. ✅ `category_demographic_track_stage_mappings`: writer component `CategoryTrackStageMapping.tsx:131` is **ORPHANED** — `CategoryTrackStageTab` is never imported by `ElvantoSyncSettingsPage` (grep: only self-references). → **keep dormant with comment** (plan's option B); do NOT remove loader/param (avoids applyMappings churn; config may hold stale values harmlessly).
5. ✅ lucide-react exports confirmed in `node_modules/lucide-react/dist/lucide-react.d.ts`: `Baby`, `GraduationCap`, `User` all exist → seed icons valid as planned.

## Baseline (Batch 1.2 — captured 2026-10-08, HEAD `9538675`)
- `pnpm typecheck` (`tsc -b`): **FAIL, exit 2, 75 pre-existing errors** (zero source changes made before capture). Hot spots: `elvanto-sync/settings/MapJourneysTab.tsx` (~15 incl. real bug `TS2304 Cannot find name 'STAGE_OPTIONS'` :305), `settings/__tests__/JourneySettingsManager.test.tsx` (~16 TS6133/TS7006), `settings/JourneySettingsManager.tsx` (2× TS2352), `settings/PeopleSettingsPage.tsx` (3× TS6133), elvanto settings misc (~15), forms (~4), rest scattered.
- `pnpm test` (`vitest run`): **PASS, exit 0 — 53/53 files, 0 failed**, 21.09s.
- Gate decision (Error Log #1): Batch 8.1 typecheck gate amended to **"0 errors in files touched by this plan; total ≤ baseline 75"** — fixing unrelated pre-existing errors (forms/routes etc.) is out of scope. Files we touch MUST end clean.

## Verification SQL (post-migration) — ✅ ALL PASS 2026-10-08 (applied via `npx supabase db push`, verified via Management API `POST /v1/projects/rupujdsalfekudambviu/database/query`)
```sql
select slug, profile_type, icon_name from demographics where deleted_at is null order by sort_order;  -- → adult/youth/child, profile_type matching, icons User/GraduationCap/Baby
select p.firstname, p.demographic, d.profile_type from people p join demographics d on d.slug = p.demographic where p.deleted_at is null limit 20; -- 0 orphans (LEFT JOIN anti-check returned empty)
select conname from pg_constraint where conname = 'people_demographic_fk'; -- → people_demographic_fk
select * from people_public limit 1; -- demographic column = slug text (information_schema: character varying)
```
Extra evidence: `people.demographic` = varchar default `'adult'` · RLS on + policies `Authenticated full access`, `Public read access` · grants authenticated=ALL-CRUD, anon=SELECT, service_role=ALL-CRUD · enum `demographic` dropped (pg_type count=0) · people distribution adult 4673 / child 276 / youth 113 (all valid slugs).

## Batch 3 progress (2026-10-08)
- 3.1 DONE: TDD red (demographics.test.ts 2 failed: getDemographics is not a function) then green after impl -- 3 files green 9/9 (demographics 2, demographic-helpers 3, validation 4). New: getDemographics() in lib/queries.ts, resolveProfileType in lib/demographic-helpers.ts, useDemographics() in lib/hooks.ts.
- Out of plan scope (left uncommitted): EditPerson/CreatePerson/PersonProfile/routes drift, Demographics.tsx hardcoded select + combobox test tweak (Batch 4/5 territory). Full-repo typecheck times out in this env; vitest transform covers touched files.

