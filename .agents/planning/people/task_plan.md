# Task Plan: People Module

> Auto-initialized from plan.md. Updated per batch during execution.

**UI/UX Guidelines:** All UI implementation MUST strictly follow `.agents/planning/ui-ux/decision.md` and `.agents/planning/module-design/decision.md`. See plan.md §UI/UX Guidelines for full details.

## Batch Progress

| Batch | Title | Status | Tasks | Notes |
|-------|-------|--------|-------|-------|
| 1 | Module Skeleton + Navigation | ✅ complete | 6 | Router prerequisite added locally; lint unavailable |
| 2 | Supabase Queries + Types | ✅ complete | 4 | Manual schema-aligned types until migrations are applied |
| 3 | People List Page | ✅ complete | 6 | Search, filters, table, and offset pagination implemented |
| 4 | Person Profile Page | 🟡 partial | 13 | Shell and demographic gating implemented; tabs, contact channels/address, relationships, tags, and full child-safety fields remain |
| 5 | Create / Edit Person | ✅ complete | 7 | Shared form, routes, mutations, household flow, track assignment, Zod validation, operator-aware admin fields, and journey/demographic audit implemented |
| 6 | Household View | ✅ complete | 4 | Household page, editable home address, member list, and profile link implemented |
| 7 | Journey Grid | ✅ complete | 6 | Tracks-by-stages matrix, inline stage editing, row/column totals, demographic filtering, and tag filtering implemented |
| 8 | Journey Grid Settings | ✅ complete | 6 | Admin-gated tabs, CRUD edits/creation, drag-and-drop sort ordering, category tree/parent selection, seeded-stage protection, and track-delete safeguards implemented |
| 9 | Tags | ✅ complete | 5 | Tag CRUD, reusable badges, profile assignment, and directory filtering implemented |
| 10 | Saved Lists | ✅ complete | 6 | Migration, ownership-aware CRUD (incl. rename + share toggle), filter loading, save dialog, sidebar management, and refresh-after-mutation implemented |
| 11 | Basic Forms | ✅ complete | 10 | Migration, CRUD, builder, public submission, submissions table, and public route implemented |
| 12 | Email Integration | ✅ complete | 6 | Core email contract, recipients resolution, SendEmailDialog, saved-list + profile email actions, audit logging, and chat hook implemented; provider wiring deferred to core |
| 13 | Polish + Integration | ✅ complete | 6 | PageSkeleton loading states, ErrorBoundary, breadcrumbs, keyboard nav on table rows, and empty states implemented |

## Current: All Batches Complete

Batches 1–13 are complete. Batch 4 remains partial against its full profile contract (tabs, first-class contact channels, household address on profile, registered/contact-only guardians, full child-safety display, role-aware edit permissions).

## Dependency Graph

```
Batch 1 (Skeleton) ──▶ Batch 2 (Queries) ──┬──▶ Batch 3 (List)
                                            ├──▶ Batch 4 (Profile)
                                            ├──▶ Batch 5 (Create/Edit)
                                            ├──▶ Batch 6 (Household)
                                            ├──▶ Batch 7 (Journey Grid)
                                            ├──▶ Batch 8 (Grid Settings)
                                            └──▶ Batch 9 (Tags)
                                                        │
                                                        ▼
                                                Batch 10 (Saved Lists)
                                                        │
                                                        ▼
                                                Batch 11 (Basic Forms)
                                                        │
                                                        ▼
                                                Batch 12 (Email Integration) ← depends on core email service
                                                        │
                                                        ▼
                                                Batch 13 (Polish)
```
