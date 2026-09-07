# Findings: People Module Profile Refactor

Audit date: 2026-09-06

## Audit scope
Cross-referenced `.agents/planning/people/` (decision.md, peopleFields.md) against `src/modules/people/` implementation. Full discrepancy table in `discrepancy-audit.md`.

## Environment

### Testing
- Framework: Vitest `^4.1.11` (no dedicated config — uses Vite defaults, node environment)
- Existing tests: `src/content/plugins/elvanto-sync/sync/transforms.test.ts` (pure logic only)
- **No React Testing Library** installed — component TDD requires setup
- No jsdom/happy-dom configured

### Build & lint
- TypeScript `~5.8.3` with strict mode (`tsconfig.json`)
- ESLint on `src/**` with `--max-warnings 0`
- PandaCSS + Ark UI React components
- Build: `tsc -b && vite build`
- No `tsc --noEmit` in scripts; `typecheck` runs `tsc -b`

## Implementation state

### Tables in database.types.ts
- ✅ people, households, addresses, contact_channels, tags, people_tags
- ✅ journey_tracks, journey_track_categories, journey_stages, people_audit
- ✅ saved_lists, forms, form_fields, form_submissions
- ✅ platform_settings, plugins
- ❌ **people_relationships** — exists in migrations + schema.dbml but **missing from database.types.ts** TableDefinitions

### Enums in database.types.ts
- ✅ demographic (adult | youth | child), gender (male | female)
- ✅ marital_status, access_permission (5 levels), relationship_type (includes guardian | carer)
- ✅ phone_type, yes_no, tag_category, audit_change_reason
- ✅ safe_ministry_leader_type, smt_type, smc_result
- ✅ form_submit_action, form_field_type

### people_relationships RLS
- Table exists in migrations (`20260826002000_create_people_table.sql` + `20260828120000_add_rls_policies.sql`)
- RLS: `Public read access` (select using true) — **no INSERT/UPDATE/DELETE policies**
- Grants: `authenticated` has table-level CRUD, but RLS blocks writes
- **Gap:** Need new RLS policy for authenticated INSERT/UPDATE/DELETE on people_relationships

### Module API coverage (decision.md line 47)
| API function | Implemented? | File |
|---|---|---|
| getById(s) | ✅ | queries.ts: `getPersonById` |
| getByHousehold | ✅ | queries.ts: `getHouseholdById` |
| getGuardians | ❌ | — (no relationship query exists) |
| getByDemographic | ✅ via filter | queries.ts: `getPeopleList(options.demographic)` |
| getByJourneyTrack | ✅ via filter | queries.ts: `getPeopleList(options.journeyTrackId, .journeyStage)` |
| getWithValidWWCC | ❌ | — |
| getWithSafeMinistry | ❌ | — |
| getJourneyGrid | ✅ | queries.ts: `getJourneyGrid` |
| search | ✅ | queries.ts: `searchPeople` |

### Component state
| Component | Status | Notes |
|---|---|---|
| DashboardPage | ✅ functional | List + search + saved lists + filters (demographic, tag, access) |
| PersonProfilePage | ✅ functional | Read-only profile with demographic gating |
| PersonForm | ✅ functional | Separate create/edit page; native `<select>` controls (pending Batch 13 polish) |
| PersonalSection | ✅ | Inline-edit: firstname, middle_name, lastname, preferred_name, gender, date_of_birth, marital_status |
| DemographicsSection | ✅ | Inline-edit: demographic, school_name, kindy_start_year, school_email_permission; school_year calculated display |
| ContactSection | ✅ | Inline-edit: email, mobile |
| GuardiansSection | ✅ | Read-only guardian list + Add modal, `getPersonGuardians`, RLS-gated |
| MedicalSection | ✅ | 3 fields (anaphylaxis, other, regular medication) |
| ConsentsSection | ✅ | 4 fields (external_photo, internal_photo, biscuit_under5, girl_guide_offsite) |
| ChildSafetySection | ✅ | 17 fields, Ark UI Collapsible, inline edit + `writePeopleAudit` |
| AdminSection | ✅ | Shows access_permission, date_professed, legacy_member_id (omits legacy_date_added) |
| JourneySection | ✅ | Read-only display of people.journey JSONB map |
| TagsSection | ✅ | Assigned tags + toggle buttons for available tags |
| JourneyGrid | ✅ | Matrix with row/column totals, inline stage editing |
| JourneySettingsManager | ✅ | Tabs (Tracks/Categories/Stages), drag-and-drop, delete safeguards |
| TagManager | ✅ | CRUD tags by category |
| SendEmailDialog | ✅ | Email dialog (uses core sendEmail — provider not configured yet) |
| HouseholdAddress | ✅ | Inline read/edit address on HouseholdPage |
| HouseholdMembers | ✅ | List of household members |

### Permission checks currently in code
- `getCurrentOperatorPermission()` — queries people.access_permission by auth_user_id (queries.ts:9)
- `useCurrentOperatorPermission()` — hook wrapper (hooks.ts:69)
- `useProfilePermissions()` — derives full permission set including isSelf, canEdit, canManageTags, canManageJourney, canManageGuardians, canEditChildSafety, canEditAdminFields, canDelete (profile-permissions.ts:62)
- Gate pattern: `operatorPermission.data === 'admin' || operatorPermission.data === 'super_admin'` (used in PersonForm, JourneySettingsPage)
- Self-view detection: `person.auth_user_id === authUserId && authUserId !== null` (profile-permissions.ts:76)
- Profile gating: sections receive `canEdit`/`canEditChildSafety`/`canManageGuardians` props; `PersonHeader` receives `canEdit`
- Dashboard gating: "New person" button visible for admin/super_admin/team_leaders only (dashboard.tsx)
