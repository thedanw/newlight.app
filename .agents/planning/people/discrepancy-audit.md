# Discrepancy Audit: People Module Planning Docs vs Implementation

> Audit date: 2026-09-06  
> Scope: `.agents/planning/people/` (decision.md, peopleFields.md) vs `src/modules/people/`  
> Non-goal: does NOT modify the people module or peopleFields.md. Documents only.

## Summary

| Doc section | Status | Notes |
|---|---|---|
| Decision Log #1–48 (foundational) | ✅ matches | Data model, journey grid, child safety, RLS all reflected in code |
| Decision Log #49–51 (saved lists, forms, email) | ✅ matches | saved_lists, forms, email.ts all implemented as documented |
| Decision Log #52–60 (deferred) | ✅ matches | not implemented; explicitly deferred |
| Decision Log #62 (create flow) | ✅ matches | PersonForm, Zod schema, household selection, admin gating |
| Decision Log #63 (edit flow) | ✅ matches | EditPersonPage, RLS own-profile, audit logging |
| Decision Log #64 (search UX) | ⚠️ partial | Filters cover demographic/tag/access but NOT journey track/stage in UI |
| Decision Log #65 (tags UI) | ✅ matches | TagsPage, CRUD, assignment |
| Decision Log #66 (Journey Grid Settings) | ✅ matches | JourneySettingsPage + JourneySettingsManager with tabs, drag-and-drop |
| Decision Log #40 (assignable permissions) | ⚠️ simplified | Hard-coded `admin`/`super_admin` check, not configurable permissions |
| Decision Log #67–78 (migration & sync) | ✅ matches | Dual-key, journey seeding algorithm, deny-list all in queries.ts |

---

## Detailed discrepancies

### A. peopleFields.md — Section organization

| peopleFields.md | Implementation (`PersonProfilePage.tsx` + section components) | Decision ref |
|---|---|---|
| **Personal Details [All]**: First Name · Preferred Name · Last Name | `PersonalSection.tsx` shows: firstname, **middle_name**, lastname, preferred_name, **gender**, **date_of_birth**, **marital_status** | #6 personal |
| **Demographics [All]**: demographic, gender, date_of_birth, marital_status, school_name, kindy_start_year, school_email_permission | `DemographicsSection.tsx` shows: demographic, school_name, school_year (calculated), school_email_permission. Gender/DOB/marital_status moved to PersonalSection. `kindy_start_year` not displayed directly (calculated into school_year) | #23–25 |
| **Address [All]**: Home Address · Suburb · State · Post code | No `AddressSection` component. Address is on `HouseholdPage.tsx` (`HouseholdAddress` component). Profile page has no address section. | #2 |

### B. peopleFields.md — Field coverage

| peopleFields.md | Implementation (`ChildSafetySection.tsx`, `ContactSection.tsx`, etc.) | Decision ref |
|---|---|---|
| **Contact [Adult]**: Email · Phone Number → contact channel · Mobile Number → contact channel | `ContactSection.tsx` shows only `email` + `person.mobile` (shadow column). No `contact_channels` table query. Full first-class contact channel support exists in schema but is not surfaced in the profile view. | #34 |
| **Consents [Youth+Child]**: includes "Youth School Email Permission" | `ConsentsSection.tsx` shows 4 consents only. `school_email_permission` is in Demographics section only (duplicate removed per #35). peopleFields.md line 86 still lists it as a Consents field with a duplicate note. | #35 |
| **Child Safety [Youth+Adult]**: lists WWCC number, verification date, exemption, SMT certificate no, SMC exemption/reviewer/result date | `ChildSafetySection.tsx` shows simplified subset: safe_ministry_leader_type, wwcc_expiry_date, wwcc_verification_outcome, smt_completion_date, smc_result. Full field set exists in schema (`database.types.ts` lines 33–48) but not displayed. | #7, #36 |
| **Admin [Admin role]**: lists `date_professed`, `legacy_date_added`, `legacy_member_id` | `AdminSection.tsx` shows: access_permission, date_professed, legacy_member_id. `legacy_date_added` is in schema but not displayed in profile. | #8 |
| **Guardians [Youth+Child]**: Registered (via people_relationships) + Contact-only (auto-reconciled journey) | `GuardiansSection.tsx` is a **stub** — shows household link, primary contact email, and placeholder text: "Linked guardians will appear here once the relationship data is available." No actual guardian linking UI. | #46–47 |

### C. peopleFields.md — Missing sections

| Missing from peopleFields.md | Implementation component | Decision ref |
|---|---|---|
| Journey section (display of `people.journey` track→stage map) | `JourneySection.tsx` | #17, #43 |
| Tags section (assigned tags + toggle assignment) | `TagsSection.tsx` | #11, #65 |
| People Table columns (Name, Demographic, Journey, Household, Contact) | `PeopleTable.tsx` + `PersonRow.tsx` | #73, #75, #79 |

### D. decision.md — Implementation refinements

| Decision | Document says | Implementation reality | Status |
|---|---|---|---|
| #40 (assignable permissions) | "Gate Journey Grid Settings by assignable permissions (not hard-coded super_admin)" | `JourneySettingsPage.tsx` line 10: `permission.data === 'admin' \| \| permission.data === 'super_admin'` — hard-coded role check | Simplified; fine-grained permission system deferred |
| #64 (search UX) | "global search bar + per-page filtering; debounced server-backed; offset pagination" | `PeopleFilters.tsx` has demographic/tag/access_permission filters. Journey track/stage filters exist in `PeopleListOptions` type and `getPeopleList()` query (queries.ts line 127–129) but are NOT exposed in the UI | Partially implemented |
| #61 (contact-only parent UX) | "PARTIALLY RESOLVED" | `GuardiansSection.tsx` is a stub (see A.4 above). People data model supports it (`people_relationships`, journey auto-reconciliation in queries.ts `createPerson`) but UI not built | Matches "partially resolved" note |
| #66 (Journey Grid Settings UI) | "tabbed Tracks/Categories/Stages; drag-and-drop; delete safeguards; seeded/terminal stages have no delete action; category tree with self-parenting protection" | `JourneySettingsManager.tsx` uses Tabs.Root with tracks/categories/stages tabs, draggable rows, `deleteJourneyStage` blocks seeded stages, `deleteJourneyTrack` requires migration target, `saveJourneyCategory` blocks self-parenting | ✅ matches |
| #62 (person create flow) | "Zod validation (names, email, DOB range); operator-aware admin fields (server-side RLS is authority)" | `validation.ts` + `PersonForm.tsx`: Zod schema validates firstname/lastname required, email format, DOB not future, ≥1 journey track. Admin fields gated by `canEditAdminFields` (operator permission check). RLS is server authority. | ✅ matches |
| #51 (email integration) | "via core platform email service; bulk email to saved lists; audit logged" | `email.ts`: `getEmailRecipients(listId)` resolves saved list → emails; `sendPeopleEmail()` calls `sendEmail` from `@/core/lib/email`; `logEmailActivity()` writes to `people_audit` (field_changed='email_sent'). Core `sendEmail` throws "not configured" until provider wired. | ✅ matches |

### E. decision.md — Additional implementation notes (not in decision.md)

| Topic | Implementation | Decision ref |
|---|---|---|
| Form native controls | `PersonForm.tsx` uses native `<select>` and `<input type="number">` for demographic, access_permission, journey tracks, household — not barrel UI primitives. Progress.md noted this as "Batch 13 polish" (still pending). | #50 (forms) |
| People list page naming | Route is `dashboard.tsx` (`PeopleDashboardPage`), not `PeopleListPage` as named in plan.md. | Plan-level, not a decision |
| Search component | No `PeopleSearch.tsx` component. Search is integrated via core `SearchInput` directly in `dashboard.tsx`, calling `searchPeople()`. | #64 |
| TagsPage route | `/people/tags` route exists in `routes.tsx` (line 42) | #65 |

### F. database.types.ts vs schema.dbml

| Field | schema.dbml | database.types.ts | Status |
|---|---|---|---|
| people.country | varchar | ❌ missing | Types file behind schema |
| people.timezone | varchar | ❌ missing | Types file behind schema |
| people.elvanto_* shadow columns | 15 shadow columns | ❌ not in types | Types file behind schema |
| people.relationship_type guardian/carer | in enum | ✅ in enum | matches |
| people.people_tags PK | (person_id, tag_id) composite | ✅ matches | matches |
| people.journey | JSONB | Record<string, string> | ✅ matches |
| saved_lists.conditions | jsonb | Json | ✅ matches |
| forms.submit_target | jsonb | Json | ✅ matches |

---

## Recommendation

The core data model decisions (#1–48, #67–78) are fully reflected in the implementation. The main document drift is in **peopleFields.md**, which describes the planned profile section layout but the implementation has reorganized fields (gender/DOB/marital_status moved to Personal Details) and is running a simplified/stub profile view for several sections (Contact, Child Safety, Guardians, Address). The **decision.md** itself is accurate — the discrepancies are implementation simplifications of planned designs, not decision reversals.</
