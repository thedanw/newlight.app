# Findings: Planning Center People Module — Reference Analysis

> Scraped 2026-08-26 from https://help.planningcenter.com/en/138423-people.html + sub-pages.
> Cross-referenced against existing decisions (decision.md, peopleFields.md) to identify gaps.
> **UI/UX Guidelines:** All UI implementation MUST strictly follow `.agents/planning/ui-ux/decision.md` and `.agents/planning/module-design/decision.md`. See plan.md §UI/UX Guidelines for full details.

## Planning Center People — Feature Inventory

### 1. Person Profiles
- **Fields:** Name, contact info, demographics, background check status, membership type, household, custom fields, photo, birthday, anniversary, membership date, removal date.
- **Sections:** Personal, Contact, Background Checks (configurable), Family/Household, Groups, Giving (linked), Communication history.
- **Custom Fields:** User-defined field sets with types (text, date, dropdown, checkbox, paragraph). Organized into groups. Admin-configurable.
- **Background Checks:** Checkr integration for WWCC-style checks. Tracks status, expiry, verification.

### 2. Household / Family Management
- **Households:** Group people into households (address sharing, directory grouping).
- **Family relationships:** Parent, child, spouse, sibling, etc. Each person belongs to one household.
- **Church Center (self-service):** Members can manage their own household — add/remove members, update profiles.
- **Head of Household:** Designated primary contact per household.

### 3. Lists (Saved Searches)
- **Rule-based filtering:** Compound conditions on any person field (demographic, journey stage, tags, custom fields, attendance, etc.).
- **Saved & shared:** Lists can be private or shared with team.
- **Actions from list:** Email everyone, export CSV, add to workflow, add tags, print labels, send text.
- **Dynamic:** Lists update as people match/unmatch conditions.
- **Key use cases:** New attendees (last 90 days), active members by type, people in groups vs not, by journey stage, by tag.

### 4. Workflows (Follow-up)
- **Multi-step processes:** Guest follow-up, membership class, volunteer onboarding.
- **Cards:** Each person gets a card that moves through steps.
- **Steps:** Each step can have assigned team members, instructions, notifications.
- **Entry:** Manual add, from list, from form.
- **Notifications:** Team members notified when card reaches their step.
- **Templates:** Pre-built workflow templates (guest follow-up, membership, etc.).

### 5. Forms
- **Data collection:** Contact info, prayer requests, volunteer interest, event signups.
- **Public/private:** Can be shared publicly or restricted.
- **Profile integration:** Form submissions update person profiles.
- **Conditional logic:** Show/hide fields based on answers.

### 6. Communication
- **Email:** Send emails to individuals or lists from within People.
- **Text messaging:** SMS to individuals or groups (via Planning Center texting).
- **Communication history:** All outbound comms logged on person profile.
- **Automations:** Auto-send emails, update profiles, add to workflows based on triggers.

### 7. Reporting
- **Lists as reports:** Any saved list acts as a report.
- **Statistics:** Demographic breakdowns, attendance trends, membership counts.
- **Export:** CSV export from any list.

### 8. Duplicate Detection & Merge
- **Auto-suggest:** System suggests potential duplicates based on name/email/phone.
- **Merge:** Admin can merge duplicate records, choosing primary record and field values.

### 9. Import / Export
- **CSV Import:** Match spreadsheet columns to People fields, preview before commit.
- **CSV Export:** Export any list to CSV.

### 10. Roles & Permissions (People-specific)
- **Levels:** Admin, Manager, Editor, Viewer, Workflows Only.
- **Admin:** Full access + permission management.
- **Manager:** Create/edit forms, run imports, manage workflows.
- **Editor:** Add/edit profiles, manage automations.
- **Viewer:** Look up profiles, create lists, send emails.
- **Workflows Only:** Just work assigned workflow cards.

### 11. Church Center (Self-Service / Public)
- **Profile management:** Members update own profile, household, payment methods.
- **Directory:** Opt-in directory sharing (controlled per field).
- **Group browsing/joining:** Find and join groups.
- **Event registration:** Register for events, manage RSVPs.

### 12. Children's Ministry
- **Check-In:** Kiosk-style check-in with labels, security codes, pickup verification.
- **Medical/allergy notes:** Visible during check-in.
- **Age-based filtering:** Auto-categorize by age.
- **Background checks for volunteers:** Checkr integration.

---

## Gap Analysis: PC Features vs Existing Decisions

### Already Decided ✅
| Feature | Decision Reference |
|---|---|
| Person profile (all sections) | decision.md #1–#12, peopleFields.md |
| Household model | schema.dbml `households` |
| Relationships/guardians | schema.dbml `people_relationships` |
| Journey grid (tracks × stages) | decision.md #12, #38–#45 |
| Demographic auto-progression | decision.md #23–#32 |
| Child-safety (WWCC/SMT/SMC) | decision.md #7, peopleFields.md |
| Tags (categories) | schema.dbml `tags`, `people_tags` |
| Custom fields (JSONB) | decision.md #4 |
| Contact channels (first-class) | decision.md #34 |
| RLS + roles | decision.md #9, #25, #37 |
| Soft-delete / tombstones | decision.md #26 |
| People audit | decision.md #18, #28 |
| Module API functions | decision.md (module API list) |

### Gaps / Not Yet Decided ❓
| Gap | PC Equivalent | Status | Notes |
|---|---|---|---|
| **Lists / saved searches** | PC Lists | **✅ Decided 2026-08-26** | Build saved lists. New `saved_lists` table with `conditions jsonb`. Batch 10 in plan. |
| **Workflows / follow-up** | PC Workflows | **✅ Decided 2026-08-26** | **Defer** — no workflow UI in this module. Elvanto mirror tables (`people_flows`, `people_flow_steps`, `people_flow_step_members`) remain untouched for future use. |
| **Forms** | PC Forms | **✅ Decided 2026-08-26** | **Include basic forms.** New `forms` + `form_fields` + `form_submissions` tables. Admin creates forms with field types (text/select/checkbox), maps fields to person columns. Public URL for submission. Batch 11 in plan. |
| **Communication (email/SMS send)** | PC Comms | **✅ Decided 2026-08-26** | **Email via core platform service** (single email system for whole app, decision already exists). People module integrates: bulk email to saved list, individual email from profile. Individual chat integration possible if user has authorized app comms. touchSMS stays auth-only. |
| **Reporting / dashboard** | PC Reports | **✅ Decided 2026-08-26** | **Defer** — no reporting dashboard in this module. Counts/badges on existing pages sufficient for now. Can be added as follow-up batch. |
| **Duplicate detection / merge** | PC Merge | **✅ Decided 2026-08-26** | **Defer** — no duplicate detection UI in this module. Admins manually find and clean duplicates. Future work: auto-suggest + merge UI. |
| **CSV import** | PC Import | **✅ Decided 2026-08-26** | **Defer** — Elvanto migration handles initial data. CSV export can follow saved lists in a future batch. |
| **CSV export** | PC Export | **✅ Decided 2026-08-26** | **Defer** — follow saved lists in a future batch. Simple to add once lists are built. |
| **Person create flow** | — | **Partially decided** | Decision #42: "≥1 journey track at creation." But: which fields required? UI flow? Auto-assign default journey track? |
| **Person edit flow (self vs admin)** | PC Church Center | **Partially decided** | RLS allows own-profile update (#20). But: which fields can self-edit? What about contact-only users? |
| **Household create/move** | PC Households | **No decision** | Create new household? Move person between households? Merge households? |
| **Tag management UI** | PC Tags | **No decision** | Create/edit/delete tags, assign to people. |
| **Journey Grid Settings UI** | — | **Decision gap #2** | Admin page for managing tracks, categories, stages. Drag-and-drop organizer (#39/#41). |
| **Search UX** | PC Search | **Partially decided** | API has `search` function. UI: global search bar? Per-page search? |
| **PWA offline cache** | — | **Decided** (#33) but no implementation design | Cache all people fields read-only in IndexedDB. Which fields? Sync strategy? |
| **Automation / triggers** | PC Automations | **No decision** | Auto-send welcome email on person creation, auto-add to workflow, etc. Deferred? |

---

## Planning Center vs Elvanto — People Module Comparison

| Capability | Planning Center | Elvanto | Our Design |
|---|---|---|---|
| Person CRUD | ✅ Full | ✅ Full (API) | ✅ Full (app-owned) |
| Households | ✅ Yes | ✅ Families | ✅ Households (lazy capture) |
| Custom fields | ✅ User-defined | ✅ EAV (custom_fields + values) | ✅ JSONB on people |
| Tags | ✅ Yes | ✅ Tags | ✅ Yes (5 categories) |
| Lists / filters | ✅ Saved rule-based | ❌ No | ❓ **Gap** |
| Workflows | ✅ Multi-step cards | ✅ People Flows (EAV) | ❓ **Gap** |
| Forms | ✅ Public forms | ❌ No | ❓ **Gap** |
| Email/SMS send | ✅ Built-in | ❌ No | ❓ **Gap** (touchSMS exists) |
| Reporting | ✅ Lists + stats | ❌ Basic | ❓ **Gap** |
| Duplicate merge | ✅ Auto-suggest | ❌ No | ❓ **Gap** |
| CSV import/export | ✅ Yes | ❌ No | ❓ **Gap** |
| Background checks | ✅ Checkr | ❌ No | ✅ WWCC/SMT/SMC (manual) |
| Journey/stages | ❌ No (use Groups/Workflows) | ❌ No | ✅ Journey grid (unique) |
| Self-service (members) | ✅ Church Center | ❌ No | ❓ **Gap** (RLS allows) |
| Children's check-in | ✅ Check-Ins module | ❌ No | ❌ Out of scope |
