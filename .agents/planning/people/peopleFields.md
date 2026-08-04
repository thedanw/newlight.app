> **Single source of truth** for field-level data: field names, enum values, conditional visibility, and the journey-grid mapping. Model decisions and rationale live in `decision.md`.

# Journey Grid (replaces Locations, status, and People Category)
Journey grid = **ministries (rows) × universal stages (columns)**; one stage per ministry per person (PK: person_id + ministry_id).

The journey grid is a **single status source** — there is **no** separate `people.status`, `people_category`, or `locations[]` field.

Universal stages (`journey_stage_slug`):
- `contact` — #e6e3d7
- `guest` — #7ec8b5
- `linked` — #5ab2aa
- `regular` — #1c7782
- `archived` — #6B7280 (terminal)
- `deleted_privacy_data` — #a16969 (terminal)

Ministries (rows, admin-customizable):
- Sundays 10am
- Playtime (Tues)
- Youth (Fri)

---

#Personal Details
First Name
Preferred Name
Last Name

#Demographics
Demographics: Adult | Youth | Child → PG enum `demographic`
Gender → PG enum `gender` Male | Female | Blank
Date of Birth
Marital Status (visible if adult): Blank | Single | Enaged | Married | Partner | Widowed | Divorced | Separated → PG enum `marital_status` (typo: "Enaged" → "Engaged")
School (Visible if not adult)
School Year (visible if not adult): Preschool | Kindy |  1 | 2 |3 | .. | 12 → **REPLACED by `kindy_start_year` integer** (calculated school year = CURRENT_YEAR − kindy_start_year; "Preschool" option dropped — no preschool tracking per decision #24–25)
School Email permission: Blank | Yes | No (visible only if youth) → PG enum `school_email_permission` (DUPLICATED with Consents "Youth School Email Permission")
School Email: (Visible only if Youth and School Email permission is 'yes')

#Address
Home Address
Suburb
State
Post code

#Contact (Only Visible if demographic is adult--not youth/child)
Email
Phone Number → contact channel
Mobile Number → contact channel

Fields if demographic is Child or Youth
Linked Parent/Guardians (multiple select-- search and select or add new)
For each parent/guardian show First Name, Last Name, Email, Phone visible

#Medical
Anaphylaxis/Allergy/Medical Details
Other Medical/Behavioral info
Regular Medication

#Consents 
External Photo Consent: Blank | Yes | No → PG enum `consent_status`
Internel Photo Consent: Blank | Yes | No → typo "Internel" → "Internal"; PG enum `consent_status`
Youth School Email Permission: Blank | Yes | No → DUPLICATE of Demographics "School Email permission"; PG enum `school_email_permission`
Biscuit Permission (Under 5s): Blank | Yes | No → `biscuit_permission_under5`, visible if child <5
Girl Guide Off-site Permission: Blank | Yes | No → PG enum `consent_status`

#Child Safety Accreditation (Only visible if youth or adult)
Safe Ministry Leader Type: Adults Leader | Junior Leader | Not Active | Under 13 Assistant | Visiting Leader
Safe Min Notes
Safe Ministry Start Date → should be DATE type (legacy says "Text area" — inconsistent with WWCC Expiry Date being a date)

##WWCC 
WWCC Number
WWCC Expiry Date
WWCC Verification Date
WWCC Verification Made By
WWCC Verification Outcome: blank | Cleared
WWCC Exemption: Support Role | Volunteer and Parent of attending Child (multiple select)

##Safe Ministry Training (SMT)
SMT Certificate No
SMT Completion Date
Last SMT Type: Blank | Essentials | Junior | Refresher

##Safe Ministry Check (SMC)
SMC Exemption
SMC Reviewer
SMC Result Date
SMC Result: Age 13-17 Application Approved | Over 18 Application Approved

#Admin (Visible to Admins only)
#Access Permissions: Public | Member Area | Team Leaders | Admin | SuperAdmin → PG enum `access_permission`;
Date Professed → `date_professed`
Legacy Date Added → `legacy_date_added`
Legacy Member ID → `legacy_member_id`






