> Single source of truth for PEOPLE field-level data (names, enums, visibility, journey-grid mapping). Decisions/rationale → `decision.md` (governs on conflict).

# Journey Grid Overview (replaces Locations, status, People Category)
= journey tracks (rows) × universal stages (columns); 1 stage/track/person in `people.journey` JSONB `{track_id → stage}`. Decisions #38–43.
Single status source — no `people.status`, `people_category`, `locations[]`.

### Definitions
- **Journey stage** (column, `journey_stage_slug`, admin-customizable) — a progression point a person holds on a track: `contact` #e6e3d7 → `guest` #7ec8b5 → `linked` #5ab2aa → `regular` #1c7782; terminal: `archived` #6B7280, `deleted_privacy_data` #a16969.
- **Journey track** (row, admin-customizable) — the ongoing program a person is engaged with; one stage per track per person (a `people.journey` key). Seeded: Sundays 10am · Playtime (Tues) · Youth (Fri).
- **Category** (heading only — never a track) — groups tracks for organising/navigation; `journey_track_categories (id, parent_id nullable, name, sort_order)`, self-referencing tree (#41). Categories hold no journey data.
- **`archived`** no longer in a program
- **`deleted_privacy_data`** after 5 years in archived contact details are removed -- attendance data is retains

### Example grid (stages = columns, tracks = rows)
| Track ↓ / Stage → | `contact` | `guest` | `linked` | `regular` | `archived` |
|---|---|---|---|---|---|
| **Church Location (multi-site option)** | | | | | |
| 　Sundays 10am | | | | J. Doe | |
| 　Youth (Fri) | | J. Doe | | | |
| **Kids** | | | | | |
| 　Playtime (Tues) | | | | | |

J. Doe = regular on Sundays 10am + guest on Youth (Fri) → `people.journey` = `{sundays_10am: "regular", youth_fri: "guest"}`; 
Category example: **Campus** (e.g. *New Light – Southern Highlands*) → subcategory **Youth** → track **Youth (Fri)**; a track always lives under a category/subcategory.

### Tables (field structure)
- `journey_tracks (id, category_id nullable, name, sort_order)` — rows
- `journey_track_categories (id, parent_id nullable, name, sort_order)` — headings only
- `people.journey` — JSONB `{journey_track_id → journey_stage_slug}`, 1 entry/track, GIN-indexed (#43); `CHECK (journey <> '{}')` — never zero tracks: last unchecked → forced `archived` (#45); track delete → required migration target (#44)

### Sorting & grouping
Ordering/nesting = live drag-and-drop in **Journey Grid Settings** (#39/#41). This file = structure (tables, columns, stages, defaults), not live ordering. Behaviour → `decision.md` #38–45.

---

# Handling People Categories ( Adult | Youth | Child )
`demographic` PG enum (Adult | Youth | Child) — age-based classification; replaces legacy free-form People Category. Journey grid = status; demographic = who-sees-what.

Derivation & auto-progression (#23–32):
- Derived from DOB + school year (CURRENT_YEAR − kindy_start_year; Kindy=0 → Year 12)
- child→youth at Year 5→6; youth→adult post-Year 12 (Jan 1 via pg_cron; no admin confirmation)
- Kindy prompt (Nov/Dec): age 3–5 missing kindy_start_year; children 5+ missing → admin warning
- Auto-progressions logged people_audit (change_reason = auto_progression)

Visibility by category (per-section tags in Person Profile Page):
- **Adult** — full profile: Contact + Child Safety (WWCC/SMT/SMC)
- **Youth** — no Contact (reached via guardians); Child Safety + School fields apply
- **Child** — no Contact, no Child Safety; guardians shown; Biscuit consent if <5

Notes:
- Youth/Child reached via guardian channels (Registered + Contact-only, #46–47)
- Child-safety accreditation applies to Youth+Adult only (never children)

---

# Person Profile Page
Section visibility keyed by `demographic` (see Handling People Categories): **[All]** every demographic · **[Adult]** adult only · **[Youth]** youth only · **[Child]** child only · **[Youth+Child]** guardians view · **[Youth+Adult]** child-safety · **[Admin]** role-gated.

## Personal Details [All]
First Name · Preferred Name · Last Name

## Demographics [All] — sub-fields gated
- `demographic`: Adult | Youth | Child (PG enum)
- `gender`: Male | Female | Blank (PG enum)
- Date of Birth
- Marital Status [Adult]: Blank | Single | Engaged | Married | Partner | Widowed | Divorced | Separated → `marital_status` (PG enum; legacy typo "Enaged"→"Engaged")
- School [Youth+Child]; School Year → **REPLACED by `kindy_start_year` int** (calc = CURRENT_YEAR − kindy_start_year; no preschool per #24–25)
- School Email permission [Youth]: Blank | Yes | No → `school_email_permission` (DUPLICATE of Consents "Youth School Email Permission")
- School Email [Youth + permission 'yes']

## Address [All]
Home Address · Suburb · State · Post code

## Contact [Adult]
Email · Phone Number → contact channel · Mobile Number → contact channel

## Guardians [Youth+Child]
Linked guardians — **Registered** (members via people_relationships → profile) or **Contact-only** (not in system; person row, journey auto-reconciled at `contact` on child's tracks, #46–47; shows name/email/phone, promotable). Child reached via guardian channels.

## Medical [Youth+Child]
Anaphylaxis/Allergy/Medical Details · Other Medical/Behavioral info · Regular Medication

## Consents [Youth+Child]
- External Photo Consent: Blank | Yes | No → `consent_status`
- Internal Photo Consent: Blank | Yes | No → `consent_status` (typo "Internel"→"Internal")
- Youth School Email Permission [Youth]: Blank | Yes | No → `school_email_permission` (DUPLICATE of Demographics "School Email permission")
- Biscuit Permission [Child <5]: Blank | Yes | No → `biscuit_permission_under5`
- Girl Guide Off-site Permission: Blank | Yes | No → `consent_status`

## Child Safety Accreditation [Youth+Adult]
- Safe Ministry Leader Type: Adults Leader | Junior Leader | Not Active | Under 13 Assistant | Visiting Leader
- Safe Min Notes
- Safe Ministry Start Date → DATE type (legacy "Text area" inconsistent with WWCC Expiry Date)

### WWCC [Youth+Adult]
WWCC Number · WWCC Expiry Date · WWCC Verification Date · WWCC Verification Made By · WWCC Verification Outcome: blank | Cleared · WWCC Exemption: Support Role | Volunteer and Parent of attending Child (multi-select)

### Safe Ministry Training (SMT) [Youth+Adult]
SMT Certificate No · SMT Completion Date · Last SMT Type: Blank | Essentials | Junior | Refresher

### Safe Ministry Check (SMC) [Youth+Adult]
SMC Exemption · SMC Reviewer · SMC Result Date · SMC Result: Age 13-17 Application Approved | Over 18 Application Approved

## Admin [Admin role — All]
- `access_permission`: Public | Member Area | Team Leaders | Admin | SuperAdmin (PG enum)
- `date_professed` · `legacy_date_added` · `legacy_member_id`






