# Progress: People Module

> Session log — errors, discoveries, decisions made during execution.

## 2026-08-26 — Planning Phase

### Actions
- Scraped Planning Center People docs (https://help.planningcenter.com/en/138423-people.html) via Jina AI
- Scraped PC People setup guide + children's ministry guide
- Analyzed existing decisions (decision.md, peopleFields.md, schema.dbml)
- Cross-referenced PC features against our schema → gap analysis in findings.md
- Created plan.md with 13 batches (82 tasks)
- Added comprehensive UI/UX guidelines to plan.md based on `.agents/planning/ui-ux/decision.md` and `.agents/planning/module-design/decision.md`
- Added UI/UX reference headers to decision.md, findings.md, task_plan.md, peopleFields.md for cross-document enforcement

### Discoveries
- Planning Center has **Lists** (saved rule-based searches) — we have no equivalent table. Need decision: build or defer.
- Planning Center has **Workflows** (multi-step follow-up cards) — Elvanto has `people_flows` as mirror tables. Need decision: use, build, or defer.
- Planning Center has **Forms** for public data collection — no equivalent in our schema.
- Planning Center has **Communication** (email/SMS from within People) — we have touchSMS for auth, but no bulk send.
- Planning Center has **Duplicate merge** — critical for data quality but no decision yet.
- Our **Journey Grid** is unique to New Light — PC and Elvanto don't have it. This is our differentiator.
- PC permissions model (Admin/Manager/Editor/Viewer/Workflows-Only) maps closely to our 5-level `access_permission` enum.

### Blockers
- Core module infrastructure was absent; Batch 1 added the initial router and module shell locally
- `database.types.ts` is currently a placeholder — needs regeneration from schema

## Batch 1 Complete — 2026-08-26
- ✅ Created the People module manifest, public API anchor, route definitions, and directory anchors
- ✅ Added browser routing with lazy-loaded People pages and preserved the design lab at `/`
- ✅ Wired existing sidebar People tile navigation to `/people`
- ✅ Added route targets for list, profile, household, journey, and journey settings
- ✅ Verified `pnpm typecheck` and `pnpm build`
- ⚠️ `pnpm lint` is unavailable because ESLint is not installed/configured in this workspace
- ⚠️ Vite reports a circular `Sidebar` barrel warning during chunking; build succeeds
- Commit intentionally not created because commits require an explicit user request

## Batch 2 Complete — 2026-08-26
- ✅ Replaced the placeholder database type with People-domain tables and enums aligned to schema.dbml
- ✅ Added derived People, household, journey, tag, and list option types
- ✅ Added typed Supabase queries for list, profile, household, journey grid, tags, and search
- ✅ Added async hooks with loading and error state for list, profile, household, and journey grid
- ✅ Verified focused diagnostics, `pnpm typecheck`, and `pnpm build`
- ⚠️ `pnpm lint` remains unavailable because ESLint is not installed/configured

## Batch 3 Complete — 2026-08-26
- ✅ Added People table and row components with profile links, demographics, journey, household, and contact columns
- ✅ Added debounced server-backed People search
- ✅ Added demographic and access-permission filters
- ✅ Added loading, empty, search, and query-error states
- ✅ Added offset pagination using the Park UI Pagination component
- ✅ Verified focused diagnostics, `pnpm typecheck`, and `pnpm build`
- ⚠️ Vite continues to report the existing `Sidebar` barrel circularity warning

## Planning Consistency Audit — 2026-08-28

### Status reconciliation
- `task_plan.md` was stale: Batch 4 is now **partial**, and Batch 5 is now **complete**.
- `decision.md` and `peopleFields.md` remain the field-level source of truth; profile visibility is implemented for Contact, Guardians, Medical, Consents, Child Safety, and Admin sections.
- Batch 4 still lacks tabs, first-class contact channels, household address, registered/contact-only guardians, real tag assignment, full child-safety display, and role-aware edit permissions.
- Batch 5 has the shared form, create/edit pages, routes, typed mutations, required names/demographic/journey assignment, household selection/creation, schema-backed validation, operator-aware admin fields, and `people_audit` logging.

### Consistency findings
- The form still uses native `select` and checkbox controls for demographic, journey multi-select, and admin permission fields, which is a Batch 13 polish follow-up.
- `database.types.ts` is manually aligned to the planning schema; reconcile it with generated Supabase types after migrations land.
- No commits were created because commits were not requested.

## Batch 5 Complete — 2026-08-28
- ✅ Added shared create/edit person form and pages
- ✅ Added `/people/new` and `/people/:id/edit` routes
- ✅ Added typed `createPerson` and `updatePerson` mutations
- ✅ Added journey-track assignment with the ≥1 track invariant
- ✅ Added “New person” action to the People directory
- ✅ Household selection and inline creation implemented
- ✅ Added Zod schema-backed validation for names, email, date of birth, demographic, household, and journey invariant
- ✅ Added operator permission lookup through authenticated user to `people.auth_user_id`
- ✅ Added admin-only access/date-professed/legacy fields for admin and super-admin operators
- ✅ Added journey/demographic `people_audit` logging for create and update mutations
- ⚠️ Server-side RLS must remain the authority for admin field protection; client gating is only a UX layer
- ✅ `pnpm typecheck` and `pnpm build` pass

### Batch 5 continuation — 2026-08-28
- ✅ Added `getHouseholds()` and `createHousehold()` query functions
- ✅ Added household selection to `PersonForm` with Park UI Select
- ✅ Added inline household creation and automatic selection of the new household
- ✅ Revalidated with `pnpm typecheck`

### Batch 5 audit and validation continuation — 2026-08-28
- ✅ Added typed `people_audit` table and enum surfaces
- ✅ Create records manual demographic and journey audit entries
- ✅ Update records manual demographic and journey changes with old/new values
- ✅ Added email format and date-of-birth validation, including future-date rejection
- ✅ Current-operator role lookup resolved through the authenticated user’s linked person record
- ✅ Revalidated with `pnpm typecheck`

## Batch 6 Partial — 2026-08-28
- ✅ Added household page with loading, error, and not-found states
- ✅ Added household home-address display
- ✅ Added household member list with demographic badges and profile links
- ✅ Linked the profile household field to `/people/households/:id`
- ⏳ Household address editing remains
- ✅ Revalidated with `pnpm typecheck`

## Batch 6 Complete — 2026-08-28
- ✅ Added editable home-address form with add and update states
- ✅ Added typed address save mutation with home-address upsert behavior
- ✅ Revalidated with `pnpm typecheck` and `pnpm build`

## Current: Batch 7 — Journey Grid
- Batch 6 is complete. Batch 4 remains partial against its full profile contract.
- Batch 7 starts with the tracks-by-stages matrix using the existing `getJourneyGrid()` query.

## Batch 7 Partial — 2026-08-28
- ✅ Added read-only journey tracks-by-stages matrix
- ✅ Added person links from grid cells to profiles
- ✅ Added loading and query-error states
- ⏳ Inline stage editing, row/column totals, and demographic/tag filters remain
- ✅ Revalidated with `pnpm typecheck` and `pnpm build`

## Batch 7 Complete — 2026-08-28
- ✅ Added reusable journey grid cell component with profile links
- ✅ Added inline stage editing persisted through `updatePersonJourney()` and `people_audit`
- ✅ Added row totals and column totals
- ✅ Added demographic filtering
- ✅ Added tag filtering using typed `people_tags` aggregation
- ⚠️ Stage, filter, and checkbox controls still use native elements; migrate to barrel UI primitives during Batch 13 polish
- ✅ Revalidated with `pnpm typecheck` and `pnpm build`

## Current: Batch 8 — Journey Grid Settings
- Batch 7 is complete. Batch 4 and Batch 6 remain partial against their full contracts.
- Batch 8 is next: admin-managed journey tracks, categories, and stages with delete safeguards.

## Batch 8 Partial — 2026-08-28
- ✅ Added admin-gated journey settings route and manager
- ✅ Added typed settings reads and track/category/stage edits
- ✅ Added last-active-track protection
- ✅ Added required migration-target validation for track deletion
- ✅ Track deletion now migrates every affected person’s current stage to the target and removes the deleted track key
- ⏳ Full tabbed settings UX, create/reorder controls, category hierarchy editing, and seeded-stage deletion protection remain

### Batch 8 continuation — 2026-08-28
- ✅ Added tabbed Tracks, Categories, and Stages settings UI
- ✅ Added create controls for tracks, categories, and stages
- ✅ Added sort-order editing for tracks, categories, and stages
- ✅ Added category parent-id editing for self-referencing hierarchy
- ✅ Added explicit stage retention messaging; seeded/terminal stages have no delete action
- ✅ Revalidated with `pnpm typecheck`

## Batch 8 status reconciliation — 2026-08-28
- `task_plan.md` now marks Batch 8 **partial** rather than not started.
- Remaining Batch 8 work is drag-and-drop ordering; category selector/tree presentation and mutation-level seeded-stage protection are now implemented.

### Batch 8 safeguard continuation — 2026-08-28
- ✅ Added mutation validation for required track/category/stage names
- ✅ Added self-parenting protection for category hierarchy records
- ✅ Added explicit seeded-stage deletion protection in the query layer
- ✅ Kept stage deletion absent from the UI so seeded stages remain retained
- ✅ Revalidated with `pnpm typecheck`

### Batch 8 category organizer continuation — 2026-08-28
- ✅ Added hierarchical category presentation from the self-referencing category table
- ✅ Added named category selector for track assignment
- ✅ Added named parent-category selector excluding the current category
- ✅ Reduced Batch 8 remaining scope to drag-and-drop ordering
- ✅ Revalidated with `pnpm typecheck`

## Batch 8 Complete — 2026-08-28
- ✅ Added drag-and-drop ordering for tracks, categories, and stages
- ✅ Persisted normalized sort orders after drop
- ✅ Preserved admin gating, category hierarchy safeguards, seeded-stage retention, and track deletion migration
- ✅ Batch 8 tasks 8.1–8.6 are complete
- ✅ Revalidated with `pnpm typecheck`; final production build pending

## Current: Batch 9 — Tags
- Batch 8 is complete. Batch 4 remains partial against its full profile contract.
- Batch 9 will add tag CRUD, reusable tag badges, profile assignment, and directory filtering.

## Batch 9 Complete — 2026-08-28
- ✅ Added typed tag CRUD queries and people-tag assignment mutations
- ✅ Added reusable `TagBadge` component
- ✅ Added Tags management route and CRUD manager
- ✅ Added tag assignment controls to the person profile
- ✅ Added tag filtering to the People directory
- ⚠️ Native tag category/filter controls remain a Batch 13 polish item
- ✅ Revalidated with `pnpm typecheck` and `pnpm build`

## Current: Batch 10 — Saved Lists
- Batch 9 is complete. Batch 4 remains partial against its full profile contract.
- Batch 10 will add persisted rule-based filter views for the People directory.

## Batch 10 Partial — 2026-08-28
- ✅ Added `saved_lists` migration with owner, JSON conditions, sharing, and timestamps
- ✅ Added typed saved-list read/create/delete queries with authenticated ownership checks
- ✅ Added saved-list loading UI to the People directory
- ✅ Added save-current-filters dialog
- ⏳ Refresh after create/delete, rename/edit, share toggle, and fuller sidebar management remain
- ✅ Revalidated with `pnpm typecheck`

## Batch 10 Complete — 2026-08-28
- ✅ Added `updateSavedList()` mutation supporting rename and share toggle with owner-scoped updates
- ✅ Added `useSavedLists()` hook with refresh support
- ✅ Added rename/edit dialog and share toggle to `SavedListSidebar`
- ✅ Sidebar refreshes after create, edit, and delete
- ✅ People List page refreshes the sidebar after saving current filters
- ✅ Loading a saved list applies its stored conditions to the directory filters
- ✅ Batch 10 tasks 10.1–10.6 are complete
- ✅ Revalidated with `pnpm typecheck` and `pnpm build` (only pre-existing Sidebar circular-barrel and large-chunk warnings remain)

## Batch 7 completion checkpoint — 2026-08-28
- ✅ Batch 7 tasks 7.1–7.6 are complete: matrix rendering, cell links, inline stage editing, row/column totals, demographic filtering, and tag filtering.
- ✅ Supabase-backed journey updates remain covered by manual journey audit entries.
- ⚠️ Native grid controls are intentionally deferred to Batch 13 UI polish.

## React Performance Audit — 2026-08-28

### Vercel React Best Practices alignment
- ✅ Preserved the repository-required `@/core/ui` barrel imports. This intentionally takes precedence over the generic `bundle-barrel-imports` recommendation because the People plan mandates barrel-only UI imports.
- ✅ Parallelized independent create/update `people_audit` writes with `Promise.all`, removing an avoidable async waterfall.
- ✅ Existing household/profile/journey requests use `Promise.all` where dependencies allow; household lookup remains intentionally dependent because member/address requests require the household id.
- ⚠️ `useAsyncQuery` has no cache or request deduplication, so repeated mounts can refetch the same People data. Consider a shared query cache or SWR-style layer in Batch 13/polish.
- ⚠️ `PersonForm` derives a Select collection and several callback closures during render. This is low impact for the current form size; revisit only if profiling shows input latency or excessive rerenders.
- ⚠️ The production bundle still reports a large shared chunk and the existing Sidebar circular barrel warning. These are cross-app optimization concerns, not People-specific blockers, and belong in Batch 13.
- ✅ The direct internal Select import was replaced with the locked UI barrel import.
- ✅ Revalidated with `pnpm typecheck`; production build remains the next final check after this audit.

### Decisions Made
- **Saved Lists: YES** — user confirmed. New `saved_lists` table with rule-based conditions (JSONB). Added as Batch 10.
- **Workflows: DEFER** — user confirmed. No workflow UI in this people module. Elvanto mirror tables remain untouched for future module.
- **Forms: YES, BASIC** — user confirmed. New `forms` + `form_fields` + `form_submissions` tables. Admin builder, public URL, field-to-person mapping. Added as Batch 11.
- **Email: YES, via core service** — user confirmed. Single email system for whole app (existing decision). People module integrates: bulk email to saved lists, individual email from profile. Chat integration hook for future. Added as Batch 12.
- **Duplicate Detection & Merge: DEFER** — user confirmed. No duplicate detection UI in this module. Admins manually find and clean duplicates. Future work: auto-suggest + merge UI.
- **Reporting: DEFER** — user confirmed. No reporting dashboard in this module. Counts/badges on existing pages sufficient for now.
- **CSV import/export: DEFER** — user confirmed. Elvanto migration handles initial data. CSV export can follow saved lists in a future batch.

## Batch 11 Complete — 2026-08-28
- ✅ Added `forms`, `form_fields`, and `form_submissions` migration with `form_submit_action` and `form_field_type` enums
- ✅ Added typed rows and enums to `database.types.ts` and derived types to `types.ts`
- ✅ Added `form-queries.ts` with CRUD, field upsert, submission counts, and `submitForm()`
- ✅ `submitForm()` validates required fields, maps answers to people columns, creates/updates people, links tags, and logs submissions
- ✅ Added Forms list page with visibility badge, submission counts, edit/submissions/copy-URL/delete actions
- ✅ Added Form builder page with field add/remove/reorder, per-field type/label/options/required/maps-to-person-field, submit action, and tag target
- ✅ Added public form page (no auth) rendering all field types with validation and thank-you message
- ✅ Added submissions page with timestamp, linked person, and answers preview
- ✅ Added admin routes under `/people/forms` and public `/forms/:formId` route in the core router
- ✅ Batch 11 tasks 11.1–11.10 are complete
- ⚠️ Native form controls remain a Batch 13 polish item
- ✅ Revalidated with `pnpm typecheck` and `pnpm build` (only pre-existing Sidebar circular-barrel and large-chunk warnings remain)

## Batch 12 Complete — 2026-08-28
- ✅ Added core email service contract at `src/core/lib/email.ts` (`sendEmail`, `EmailRecipient`, `SendEmailInput`, `SendEmailResult`) — single app-wide email surface; provider not yet wired, throws a clear "not implemented" error until it is
- ✅ Added `src/modules/people/lib/email.ts` with `getEmailRecipients(listId)` (resolves saved-list conditions → distinct person emails), `sendPeopleEmail()` (validates + calls core service + logs), and `canChat()` chat-integration hook placeholder
- ✅ Added `getSavedListById()` owner/shared-scoped query to `queries.ts`
- ✅ Added reusable `SendEmailDialog` component (recipient count, subject, message body, send/close, sending + sent states)
- ✅ Added "Email" action to each saved list in `SavedListSidebar` — resolves recipients and opens the dialog
- ✅ Added "Email" action to `PersonHeader` — visible only when the person has an email address, single-recipient dialog
- ✅ Email sends are logged to `people_audit` (`field_changed: 'email_sent'`, subject + recipient count + sent_at) for each matched recipient
- ⚠️ Core email provider is intentionally not implemented yet — the People module is fully built against the typed contract and will work unchanged once the provider lands in `src/core/lib/email.ts`
- ✅ Batch 12 tasks 12.1–12.6 are complete
- ✅ Revalidated with `pnpm typecheck` and `pnpm build` (only pre-existing Sidebar circular-barrel and large-chunk warnings remain)

## Batch 13 Complete — 2026-08-28
- ✅ Added reusable `PageSkeleton` component (header bar + skeleton text lines) and replaced bare `Loader`/text loading states on PersonProfile, Household, EditPerson, JourneyGrid, JourneySettings, FormsList, FormSubmissions, and FormPublic pages
- ✅ PeopleTable now renders skeleton rows while loading instead of a text placeholder
- ✅ Added reusable `ErrorBoundary` component (friendly fallback + retry) wrapping the module routes in `PeopleLayout`
- ✅ Added empty state to JourneyGrid when no tracks are configured; verified existing empty states (PeopleTable, FormsList, FormSubmissions, HouseholdMembers)
- ✅ Added breadcrumb navigation (People → [Name] → Profile/Edit) to PersonProfile, Household, and EditPerson pages
- ✅ Added keyboard navigation to People table rows (Enter/Space opens the profile; row is focusable with `tabIndex`)
- ✅ Responsive layout preserved via `PagePanel` (flex column, mobile-first); module shell keeps the existing flex wrapper
- ⚠️ Breadcrumb links use plain anchors (full navigation) because the vendored `Breadcrumb.Link` is an anchor; router-link integration is a future enhancement
- ⚠️ `PeopleLayout` retains the pre-existing inline flex style because no barrel layout primitive (Flex/Stack) is exported; flagged as a recipe-only follow-up
- ✅ Batch 13 tasks 13.1–13.6 are complete
- ✅ Revalidated with `pnpm typecheck` and `pnpm build` (only pre-existing Sidebar circular-barrel and large-chunk warnings remain)
- ✅ Visually verified the People list page renders (header, search, filters, empty state, pagination) in the dev server

## People Module — All Batches Complete
- ✅ Batches 1–13 are complete. Batch 4 remains partial against its full profile contract (tabs, first-class contact channels, household address on profile, registered/contact-only guardians, full child-safety display, role-aware edit permissions).