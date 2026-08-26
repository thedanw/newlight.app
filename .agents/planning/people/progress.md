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
- Core module infrastructure (registry, manifest, router) must be complete before Batch 1 can begin
- `database.types.ts` is currently a placeholder — needs regeneration from schema

### Decisions Made
- **Saved Lists: YES** — user confirmed. New `saved_lists` table with rule-based conditions (JSONB). Added as Batch 10.
- **Workflows: DEFER** — user confirmed. No workflow UI in this people module. Elvanto mirror tables remain untouched for future module.
- **Forms: YES, BASIC** — user confirmed. New `forms` + `form_fields` + `form_submissions` tables. Admin builder, public URL, field-to-person mapping. Added as Batch 11.
- **Email: YES, via core service** — user confirmed. Single email system for whole app (existing decision). People module integrates: bulk email to saved lists, individual email from profile. Chat integration hook for future. Added as Batch 12.
- **Duplicate Detection & Merge: DEFER** — user confirmed. No duplicate detection UI in this module. Admins manually find and clean duplicates. Future work: auto-suggest + merge UI.
- **Reporting: DEFER** — user confirmed. No reporting dashboard in this module. Counts/badges on existing pages sufficient for now.
- **CSV import/export: DEFER** — user confirmed. Elvanto migration handles initial data. CSV export can follow saved lists in a future batch.