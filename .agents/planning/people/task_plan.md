# Task Plan: People Module

> Auto-initialized from plan.md. Updated per batch during execution.

**UI/UX Guidelines:** All UI implementation MUST strictly follow `.agents/planning/ui-ux/decision.md` and `.agents/planning/module-design/decision.md`. See plan.md §UI/UX Guidelines for full details.

## Batch Progress

| Batch | Title | Status | Tasks | Notes |
|-------|-------|--------|-------|-------|
| 1 | Module Skeleton + Navigation | 🔲 not-started | 6 | Depends on core module infra |
| 2 | Supabase Queries + Types | 🔲 not-started | 4 | |
| 3 | People List Page | 🔲 not-started | 6 | |
| 4 | Person Profile Page | 🔲 not-started | 13 | Largest batch |
| 5 | Create / Edit Person | 🔲 not-started | 7 | |
| 6 | Household View | 🔲 not-started | 4 | |
| 7 | Journey Grid | 🔲 not-started | 6 | Complex UI |
| 8 | Journey Grid Settings | 🔲 not-started | 6 | Admin-only |
| 9 | Tags | 🔲 not-started | 5 | |
| 10 | Saved Lists | 🔲 not-started | 6 | **NEW** — persisted filter views |
| 11 | Basic Forms | 🔲 not-started | 10 | **NEW** — admin forms + public submission |
| 12 | Email Integration | 🔲 not-started | 6 | **NEW** — bulk list + individual email via core service |
| 13 | Polish + Integration | 🔲 not-started | 6 | |

## Current: Batch 1 — Module Skeleton + Navigation

_No batches started yet._

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
