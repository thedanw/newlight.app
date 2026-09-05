# Plan: People Module — UI Implementation

**Goal:** Build the People module UI — the first full module in the New Light CRM, delivering person profiles, journey grid, households, relationships, tags, and search. Foundation for all other modules.

**Approach:** Build as `src/modules/people/` following core module architecture (manifest + public API + routes). Data model already decided (decision.md + peopleFields.md + schema.dbml). This plan covers the **frontend module**, not the data model — the schema and migrations are a separate workstream.

**Branch:** `feature/people-module` (from `main`)

> ⚠️ **Dependency Note:** This plan assumes the core module infrastructure (registry, manifest system, router with `createBrowserRouter`, path aliases, `src/core/` module scaffolding) is built as part of core platform work. If not yet complete, Batch 1 must be preceded by core module setup. The plan below starts from that assumption.

---

## UI/UX Guidelines (MANDATORY)
> **All UI implementation MUST strictly adhere to the design system decisions in `.agents/planning/ui-ux/decision.md` and `.agents/planning/module-design/decision.md`. These are not suggestions — they are enforced constraints.**

### Core Principles
1. **Recipe-only CSS**: All components MUST use Panda config recipes (`defineRecipe`/`defineSlotRecipe`) with BEM naming. No atomic `css()`, `cva`, `sva`, or inline styles. (ui-ux #1.1–1.5)
2. **Barrel imports only**: UI components MUST be imported from `@/core/ui` (the locked barrel). No imports from `styled-system/*` or internal Park UI paths. (module-design #2)
3. **Park UI foundation**: Use vendored Park UI components from `src/core/ui/`. New components = vendor via CLI if Park UI has it, else module-local recipe. (ui-ux #3.1–3.3)
4. **Token hierarchy**: Token→semantic→pattern pipeline. Never use raw atomic classes. (ui-ux #2.1)

### Layout & Navigation
5. **Sidebar**: 5px peek, pull-tab toggle, grid layout with `sizes.8` icons + `text.xs` labels. Wide desktop (`xl` breakpoint = 1280px) = pinned. (ui-ux #7.1–7.13)
6. **#page-panel**: Default `max-width: content-width` (1152px), header 52px, offset via `margin-right` at `xl`. (ui-ux #6.1–6.5)
7. **Panel stack**: iOS Settings-style drill-down. Push from right, pop back. Framer Motion `AnimatePresence` with direction-aware transitions. (ui-ux #8.1–8.4)
8. **SlidePanel**: Portal modal for dialogs/drill-down. Variants: `normal` (centered, 768px), `fullscreen` (full slide-in), `immersive` (drag-to-close). (ui-ux #9.1–9.4)

### Component Patterns
9. **toolPanel**: Vertically-expanding region under panel-header that pushes content down (for search/filter fields). (ui-ux #6.5)
10. **Page headers**: h1 title within #page-panel header. (ui-ux #6.1)
11. **Responsive**: Mobile-first. `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px), `2xl` (1536px) breakpoints. (ui-ux #5.2)

### Theme & Customization
12. **Theme knobs**: `colorScheme` (light/dark, super-admin locked), `accent` (26 presets), `gray` (6 presets), `font`, `radius`. (tokens.md)
13. **Runtime theming**: `<html>` `data-*` attributes + CSS-var block. No rebuild required. (ui-ux #10.3)
14. **Brand settings**: SlidePanel `normal` variant, accessed from header kebab. Super-admin gated. (ui-ux #10.10–10.12)

### Enforcement
- **ESLint**: `no-restricted-imports` blocks `styled-system/*` and atomic CSS. (module-design #3)
- **CI**: ESLint + tsc + bundle + Playwright gates. (module-design #6)
- **Recipe registration**: All recipes registered in `panda.config.ts` centrally. (ui-ux #1.4)

### Quick Reference for People Module
| Pattern | Implementation |
|---------|---------------|
| People List Page | #page-panel with toolPanel for filters, Park UI Table recipe |
| Person Profile Page | Panel stack drill-down (push from list), SlidePanel `fullscreen` for edit |
| Journey Grid | Park UI Table or custom recipe with BEM grid classes |
| Forms | SlidePanel `normal` for builder, public page = #page-panel |
| Settings | SlidePanel `normal` variant, accessed from list header |

---

## Scope

### In
- **People List page** — searchable, filterable table of all people with demographic/journey badges
- **Person Profile page** — tabbed/sectioned view with all fields per peopleFields.md, gated by demographic
- **Household view** — see household members, address
- **Journey Grid page** — tracks × stages matrix with inline stage editing
- **Journey Grid Settings** — manage tracks, categories, stages (drag-and-drop organizer)
- **Tags management** — create/edit/delete tags, assign to people
- **Saved Lists** — persist filtered views of people (rule-based conditions), reuse for quick access
- **Basic Forms** — admin-created forms (text/select/checkbox fields), public URL, submissions create/update people records
- **Search** — global search bar + per-page filtering
- **Email Integration** — bulk email to saved lists, individual email from profile (via core platform email service)
- **Create/Edit person** — form for creating new people, editing existing
- **Relationships** — view/link guardians, manage household membership
- **Module API** — public `index.ts` exposing typed functions for other modules

### Out (deferred to later batches or other modules)
- Workflows / follow-up cards
- Reporting / dashboard
- Duplicate detection / merge UI
- CSV export (follows naturally from saved lists but deferred)
- PWA offline cache implementation
- Check-In / kiosk
- Self-service (Church Center) member profile editing
- Automation / triggers

---

## Action Items

### Batch 1: Module Skeleton + Navigation
> **Goal reminder:** Build the People module UI — the first full module in the New Light CRM, delivering person profiles, journey grid, households, relationships, tags, and search. Foundation for all other modules. **CRITICAL: All UI MUST strictly follow `.agents/planning/ui-ux/decision.md` — recipe-only CSS, barrel imports, Park UI foundation, token hierarchy.**
> Wire the people module into the app shell.

- [ ] **Task 1.1:** Create `src/modules/people/` directory structure: `manifest.ts`, `public.ts`, `routes.tsx`, `lib/`, `components/`, `pages/`
- [ ] **Task 1.2:** Write `manifest.ts` — module metadata (id: `'people'`, name, icon, alwaysOn: true, routes, nav entry)
- [ ] **Task 1.3:** Write `public.ts` — re-export module API types + functions for cross-module consumption
- [ ] **Task 1.4:** Write `routes.tsx` — React Router route definitions (thin glue): `/people` (list), `/people/:id` (profile), `/people/households/:id` (household), `/people/journey` (grid), `/people/journey/settings` (settings)
- [ ] **Task 1.5:** Register people module in core router (`src/core/router.tsx`) — lazy-load routes into `createBrowserRouter`
- [ ] **Task 1.6:** Verify sidebar nav tile `people` links to `/people`
- [ ] **Commit:** `feat(people): scaffold module skeleton with routes and manifest`

### Batch 2: Supabase Queries + Types Layer
> **Goal reminder:** Build the People module UI — the first full module in the New Light CRM, delivering person profiles, journey grid, households, relationships, tags, and search. Foundation for all other modules. **CRITICAL: All UI MUST strictly follow `.agents/planning/ui-ux/decision.md` — recipe-only CSS, barrel imports, Park UI foundation, token hierarchy.**
> Build the data access layer against the Supabase schema.

- [ ] **Task 2.1:** Regenerate `src/core/lib/database.types.ts` from Supabase (or write types manually matching schema.dbml)
- [ ] **Task 2.2:** Create `src/modules/people/lib/queries.ts` — typed Supabase query functions: `getPeopleList()`, `getPersonById()`, `getHouseholdById()`, `getJourneyGrid()`, `getTags()`, `searchPeople()`
- [ ] **Task 2.3:** Create `src/modules/people/lib/types.ts` — derived TypeScript types from database types (Person, Household, JourneyGrid, Tag, etc.)
- [ ] **Task 2.4:** Create `src/modules/people/lib/hooks.ts` — React hooks wrapping queries with loading/error state: `usePeopleList()`, `usePerson()`, `useHousehold()`, `useJourneyGrid()`
- [ ] **Commit:** `feat(people): add Supabase query layer and typed hooks`

### Batch 3: People List Page
> **Goal reminder:** Build the People module UI — the first full module in the New Light CRM, delivering person profiles, journey grid, households, relationships, tags, and search. Foundation for all other modules. **CRITICAL: All UI MUST strictly follow `.agents/planning/ui-ux/decision.md` — recipe-only CSS, barrel imports, Park UI foundation, token hierarchy.**
> The main people directory — searchable, filterable table.

- [ ] **Task 3.1:** Create `src/modules/people/pages/PeopleListPage.tsx` — page shell with PageHeader ("People"), search input, filter controls, people table
- [ ] **Task 3.2:** Create `src/modules/people/components/PeopleTable.tsx` — sortable table: name, demographic badge, journey summary (primary track stage), household, tags. Use Park UI `Table` component.
- [ ] **Task 3.3:** Create `src/modules/people/components/PersonRow.tsx` — single table row with avatar placeholder, name (link to profile), demographic color badge, journey stage badge, household name
- [ ] **Task 3.4:** Create `src/modules/people/components/PeopleFilters.tsx` — filter bar: demographic (multi-select), journey track + stage, tags, access_permission. Use Park UI `SegmentGroup` or `ToggleGroup`.
- [ ] **Task 3.5:** Create `src/modules/people/components/PeopleSearch.tsx` — search input debounced, queries `searchPeople()` via hook
- [ ] **Task 3.6:** Implement pagination (cursor or offset) — `Pagination` component from Park UI
- [ ] **Commit:** `feat(people): build people list page with search and filters`

### Batch 4: Person Profile Page
> **Goal reminder:** Build the People module UI — the first full module in the New Light CRM, delivering person profiles, journey grid, households, relationships, tags, and search. Foundation for all other modules. **CRITICAL: All UI MUST strictly follow `.agents/planning/ui-ux/decision.md` — recipe-only CSS, barrel imports, Park UI foundation, token hierarchy.**
> Detailed person view with all sections.

- [ ] **Task 4.1:** Create `src/modules/people/pages/PersonProfilePage.tsx` — page shell: back button, person header (name, avatar, demographic badge), tabbed sections
- [ ] **Task 4.2:** Create `src/modules/people/components/PersonHeader.tsx` — name, preferred name, demographic badge, journey stage badges (primary tracks), edit button
- [ ] **Task 4.3:** Create `src/modules/people/components/sections/PersonalSection.tsx` — first/last/preferred name, gender, DOB, marital status
- [ ] **Task 4.4:** Create `src/modules/people/components/sections/DemographicsSection.tsx` — demographic, school, kindy_start_year (calculated year display), school_email_permission
- [ ] **Task 4.5:** Create `src/modules/people/components/sections/ContactSection.tsx` — email, contact channels (phone/mobile list), address. **Adult-only visibility** per peopleFields.md.
- [ ] **Task 4.6:** Create `src/modules/people/components/sections/GuardiansSection.tsx` — linked guardians (registered via relationships + contact-only). **Youth+Child only.**
- [ ] **Task 4.7:** Create `src/modules/people/components/sections/MedicalSection.tsx` — anaphylaxis, allergies, medication. **Youth+Child only.**
- [ ] **Task 4.8:** Create `src/modules/people/components/sections/ConsentsSection.tsx` — photo consents, biscuit permission (child <5), school email. **Youth+Child only.**
- [ ] **Task 4.9:** Create `src/modules/people/components/sections/ChildSafetySection.tsx` — WWCC, SMT, SMC subsections. **Youth+Adult only.** Admin-gated for edit.
- [ ] **Task 4.10:** Create `src/modules/people/components/sections/AdminSection.tsx` — access_permission, date_professed, legacy fields. **Admin role only.**
- [ ] **Task 4.11:** Create `src/modules/people/components/sections/JourneySection.tsx` — journey grid mini-view for this person (track → stage display)
- [ ] **Task 4.12:** Create `src/modules/people/components/sections/TagsSection.tsx` — assigned tags with add/remove
- [ ] **Task 4.13:** Implement demographic-based section visibility logic (Adult sees Contact+ChildSafety; Youth sees Medical+Consents+ChildSafety; Child sees Medical+Consents+Guardians)
- [ ] **Commit:** `feat(people): build person profile page with demographic-gated sections`

### Batch 5: Create / Edit Person
> **Goal reminder:** Build the People module UI — the first full module in the New Light CRM, delivering person profiles, journey grid, households, relationships, tags, and search. Foundation for all other modules. **CRITICAL: All UI MUST strictly follow `.agents/planning/ui-ux/decision.md` — recipe-only CSS, barrel imports, Park UI foundation, token hierarchy.**
> Forms for creating and editing people.

- [ ] **Task 5.1:** Create `src/modules/people/components/PersonForm.tsx` — shared form component for create + edit, using Park UI Form/Field/Input/Select components
- [ ] **Task 5.2:** Create `src/modules/people/pages/CreatePersonPage.tsx` — form with required fields (firstname, lastname, demographic, household selection/creation, ≥1 journey track per #42)
- [ ] **Task 5.3:** Create `src/modules/people/pages/EditPersonPage.tsx` — pre-filled form, admin-only fields conditionally shown
- [ ] **Task 5.4:** Implement household selection: pick existing or create new inline
- [ ] **Task 5.5:** Implement journey track assignment at creation: multi-select from available tracks (required ≥1 per #42)
- [ ] **Task 5.6:** Add form validation (Zod schemas) — required fields, email format, date ranges
- [ ] **Task 5.7:** Wire create/edit mutations to Supabase (insert/update + people_audit logging)
- [ ] **Commit:** `feat(people): add create and edit person forms with validation`

### Batch 6: Household View
> **Goal reminder:** Build the People module UI — the first full module in the New Light CRM, delivering person profiles, journey grid, households, relationships, tags, and search. Foundation for all other modules. **CRITICAL: All UI MUST strictly follow `.agents/planning/ui-ux/decision.md` — recipe-only CSS, barrel imports, Park UI foundation, token hierarchy.**
> See household details and members.

- [ ] **Task 6.1:** Create `src/modules/people/pages/HouseholdPage.tsx` — page: household name, address, member list
- [ ] **Task 6.2:** Create `src/modules/people/components/HouseholdMembers.tsx` — list of people in household with relationship type badges, link to each profile
- [ ] **Task 6.3:** Create `src/modules/people/components/HouseholdAddress.tsx` — display/edit household address
- [ ] **Task 6.4:** Link from person profile "Household" field to household page
- [ ] **Commit:** `feat(people): add household view page`

### Batch 7: Journey Grid
> **Goal reminder:** Build the People module UI — the first full module in the New Light CRM, delivering person profiles, journey grid, households, relationships, tags, and search. Foundation for all other modules. **CRITICAL: All UI MUST strictly follow `.agents/planning/ui-ux/decision.md` — recipe-only CSS, barrel imports, Park UI foundation, token hierarchy.**
> The tracks × stages matrix view.

- [ ] **Task 7.1:** Create `src/modules/people/pages/JourneyGridPage.tsx` — full-page grid: tracks as rows, stages as columns, people as cells
- [ ] **Task 7.2:** Create `src/modules/people/components/JourneyGrid.tsx` — renders the matrix from `getJourneyGrid()` query. Cells show people avatars/names at that track+stage intersection.
- [ ] **Task 7.3:** Create `src/modules/people/components/JourneyGridCell.tsx` — cell with person chips, clickable to profile
- [ ] **Task 7.4:** Implement inline stage editing: click person chip → dropdown to change stage (within their tracks)
- [ ] **Task 7.5:** Add column totals (count per stage), row totals (count per track)
- [ ] **Task 7.6:** Implement filtering on grid: by demographic, by tag
- [ ] **Commit:** `feat(people): build journey grid matrix view with inline editing`

### Batch 8: Journey Grid Settings
> **Goal reminder:** Build the People module UI — the first full module in the New Light CRM, delivering person profiles, journey grid, households, relationships, tags, and search. Foundation for all other modules. **CRITICAL: All UI MUST strictly follow `.agents/planning/ui-ux/decision.md` — recipe-only CSS, barrel imports, Park UI foundation, token hierarchy.**
> Admin page for managing tracks, categories, stages.

- [ ] **Task 8.1:** Create `src/modules/people/pages/JourneySettingsPage.tsx` — tabbed settings: Tracks, Categories, Stages
- [ ] **Task 8.2:** Create `src/modules/people/components/TrackManager.tsx` — list of tracks with drag-and-drop reorder, edit name, assign category, delete (with migration target prompt per #44)
- [ ] **Task 8.3:** Create `src/modules/people/components/CategoryManager.tsx` — tree view of categories (#41 self-referencing), add/edit/delete, drag-and-drop nesting
- [ ] **Task 8.4:** Create `src/modules/people/components/StageManager.tsx` — list of stages, edit label/color, mark terminal, reorder. Cannot delete seeded stages.
- [ ] **Task 8.5:** Implement track delete flow: require migration target selection before delete (#44)
- [ ] **Task 8.6:** Implement "last track protection" — prevent removing final non-archived track (#45)
- [ ] **Commit:** `feat(people): add journey grid settings with track/category/stage management`

### Batch 9: Tags
> **Goal reminder:** Build the People module UI — the first full module in the New Light CRM, delivering person profiles, journey grid, households, relationships, tags, and search. Foundation for all other modules. **CRITICAL: All UI MUST strictly follow `.agents/planning/ui-ux/decision.md` — recipe-only CSS, barrel imports, Park UI foundation, token hierarchy.**
> Tag management and assignment.

- [ ] **Task 9.1:** Create `src/modules/people/pages/TagsPage.tsx` — tag management page: list all tags by category, create/edit/delete
- [ ] **Task 9.2:** Create `src/modules/people/components/TagManager.tsx` — CRUD for tags with category filter
- [ ] **Task 9.3:** Create `src/modules/people/components/TagBadge.tsx` — reusable badge component for displaying tags
- [ ] **Task 9.4:** Add tag assignment to person profile (inline edit in TagsSection)
- [ ] **Task 9.5:** Add tag filter to People List page filters
- [ ] **Commit:** `feat(people): add tag management and assignment`

### Batch 10: Saved Lists
> **Goal reminder:** Build the People module UI — the first full module in the New Light CRM, delivering person profiles, journey grid, households, relationships, tags, and search. Foundation for all other modules. **CRITICAL: All UI MUST strictly follow `.agents/planning/ui-ux/decision.md` — recipe-only CSS, barrel imports, Park UI foundation, token hierarchy.**
> Persist filtered views for quick reuse.

- [ ] **Task 10.1:** Add `saved_lists` table to schema: `id uuid pk`, `name varchar`, `owner_id uuid ref auth_users`, `conditions jsonb` (array of filter rules: `{field, operator, value}`), `is_shared boolean`, `created_at`, `updated_at`
- [ ] **Task 10.2:** Create `src/modules/people/lib/list-queries.ts` — CRUD for saved lists: `getSavedLists()`, `getSavedListById()`, `createSavedList()`, `updateSavedList()`, `deleteSavedList()`
- [ ] **Task 10.3:** Create `src/modules/people/components/SaveListDialog.tsx` — dialog to name and save current filter state as a list. "Save as List" button appears when filters are active.
- [ ] **Task 10.4:** Create `src/modules/people/components/SavedListSidebar.tsx` — sidebar panel or dropdown showing saved lists (mine + shared). Click to load filter state.
- [ ] **Task 10.5:** Wire People List page: "Save as List" action when filters active; load saved list on click; update list when filters change (auto-save or manual)
- [ ] **Task 10.6:** Add list management: rename, delete, toggle share. Owner can share with all editors.
- [ ] **Commit:** `feat(people): add saved lists for persisted filter views`

### Batch 11: Basic Forms
> **Goal reminder:** Build the People module UI — the first full module in the New Light CRM, delivering person profiles, journey grid, households, relationships, tags, and search. Foundation for all other modules. **CRITICAL: All UI MUST strictly follow `.agents/planning/ui-ux/decision.md` — recipe-only CSS, barrel imports, Park UI foundation, token hierarchy.**
> Admin-created forms for data collection that feed into People profiles.

- [ ] **Task 11.1:** Add `forms` table to schema: `id uuid pk`, `name varchar`, `description text`, `owner_id uuid ref auth_users`, `is_public boolean`, `submit_action enum ('create_person' | 'update_person' | 'add_to_tag' | 'none')`, `submit_target jsonb` (e.g. tag_id, workflow_id), `settings jsonb` (thank-you message, redirect URL), `created_at`, `updated_at`
- [ ] **Task 11.2:** Add `form_fields` table: `id uuid pk`, `form_id uuid ref forms`, `field_type enum ('text' | 'email' | 'phone' | 'number' | 'select' | 'multi_select' | 'checkbox' | 'textarea' | 'date')`, `label varchar`, `placeholder varchar`, `options jsonb` (for select/multi_select: `[{label, value}]`), `required boolean`, `maps_to_field varchar` (which people.* column this maps to), `sort_order integer`
- [ ] **Task 11.3:** Add `form_submissions` table: `id uuid pk`, `form_id uuid ref forms`, `person_id uuid ref people null` (null if new person), `answers jsonb` (`{field_id: value}`), `created_at timestamptz`
- [ ] **Task 11.4:** Create `src/modules/people/lib/form-queries.ts` — CRUD: `getForms()`, `getFormById()`, `createForm()`, `updateForm()`, `deleteForm()`, `getFormFields()`, `getFormSubmissions()`, `submitForm()`
- [ ] **Task 11.5:** Create `src/modules/people/pages/FormsListPage.tsx` — list of forms with name, submission count, public/private badge, actions (edit, view submissions, copy public URL)
- [ ] **Task 11.6:** Create `src/modules/people/pages/FormBuilderPage.tsx` — form builder: name, description, add/remove/reorder fields, configure each field (type, label, options, required, maps-to-person-field), set submit action
- [ ] **Task 11.7:** Create `src/modules/people/pages/FormPublicPage.tsx` — public-facing form render (no auth required): renders fields from form definition, validates, submits via `submitForm()`, shows thank-you message
- [ ] **Task 11.8:** Create `src/modules/people/pages/FormSubmissionsPage.tsx` — table of submissions for a form: timestamp, answers preview, linked person (if matched), action to view full submission
- [ ] **Task 11.9:** Implement submit logic: on form submission → validate fields → if maps_to_field set, create/update person record; if submit_action = add_to_tag, link person to tag; log in form_submissions
- [ ] **Task 11.10:** Add public form route to router: `/forms/:formId` (public, no auth guard)
- [ ] **Commit:** `feat(people): add basic forms with builder and public submission`

### Batch 12: Email Integration
> **Goal reminder:** Build the People module UI — the first full module in the New Light CRM, delivering person profiles, journey grid, households, relationships, tags, and search. Foundation for all other modules. **CRITICAL: All UI MUST strictly follow `.agents/planning/ui-ux/decision.md` — recipe-only CSS, barrel imports, Park UI foundation, token hierarchy.**
> Connect people module to core platform email service. Depends on core email service being built.

- [ ] **Task 12.1:** Create `src/modules/people/components/SendEmailDialog.tsx` — dialog for composing email: subject, body (rich text or markdown), recipient preview (from list or individual). Uses core email service API.
- [ ] **Task 12.2:** Add "Email" action to Saved Lists — "Email this list" button opens SendEmailDialog pre-filled with list recipients. Resolves list conditions → person email addresses.
- [ ] **Task 12.3:** Add "Email" action to Person Profile — button on profile header opens SendEmailDialog with single recipient. Visible only if person has email + authorized app comms.
- [ ] **Task 12.4:** Create `src/modules/people/lib/email.ts` — helper: `getEmailRecipients(listId)` → resolves saved list to email addresses; `sendPeopleEmail(recipients, subject, body)` → calls core email service.
- [ ] **Task 12.5:** Add email activity log — store sent emails in `people_audit` or dedicated `email_log` table (person_id, subject, sent_at, recipient_count) for audit trail.
- [ ] **Task 12.6:** Chat integration hook — placeholder for future: if person has authorized app comms, show "Chat" action alongside "Email". Wire to core chat module when available.
- [ ] **Commit:** `feat(people): add email integration with bulk list and individual send`

### Batch 13: Polish + Integration
> **Goal reminder:** Build the People module UI — the first full module in the New Light CRM, delivering person profiles, journey grid, households, relationships, tags, and search. Foundation for all other modules. **CRITICAL: All UI MUST strictly follow `.agents/planning/ui-ux/decision.md` — recipe-only CSS, barrel imports, Park UI foundation, token hierarchy.**
> Cross-cutting concerns, error handling, loading states, accessibility.

- [ ] **Task 13.1:** Add loading skeletons to all pages (Park UI `Skeleton`)
- [ ] **Task 13.2:** Add error boundaries and empty states
- [ ] **Task 13.3:** Add breadcrumb navigation (People → [Name] → Profile)
- [ ] **Task 13.4:** Ensure all pages are responsive (mobile-first per core design)
- [ ] **Task 13.5:** Add keyboard navigation support (table rows, form fields)
- [ ] **Task 13.6:** Final commit: `chore(people): polish, error handling, accessibility`
- [ ] **Commit:** `chore(people): polish and cross-cutting concerns`

---

## Git Strategy
- **Branch:** `feature/people-module` from `main`
- **Commits:** After each batch, conventional messages (`feat:`, `chore:`)
- **Push:** After all batches complete
- **PR:** Into `main` with description referencing decision.md + plan.md

---

## Open Questions (see §Clarification Questions below)
1. Module infrastructure — is it built or does Batch 1 include it?
2. Lists / saved searches — include in MVP or defer?
3. Forms — include or defer?
4. Self-service profile editing — include or defer?
5. Default journey track assignment — auto-assign or manual pick?
