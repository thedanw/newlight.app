# Task Plan — Supabase Database Setup

**Status:** planning
**Plan:** [plan.md](./plan.md)
**Findings:** [findings.md](./findings.md)

## Batch Tracker

| Batch | Goal | Status |
|---|---|---|
| 1 | Project Foundation (CLI, init, .env, client) | completed |
| 2 | Extensions + Enums (21 enums) | completed |
| 3a | Platform + Identity Tables | completed |
| 3b | People Table | completed |
| 3c | Journey + Audit + Mirrors | completed |
| 4 | Module Tables (groups, flows, services, songs — 18 tables) | completed |
| 5 | Calendar + Sync Infrastructure (6 tables) | completed |
| 6 | RLS Policies (all 40 tables) | not-started |
| 7 | Seed Data (journey_stages, user_roles, module_config) | not-started |
| 8 | Generate TypeScript Types | not-started |
| 9 | Push to Hosted | not-started |

## Deferred Batches (require tier verification or app logic)
| Batch | Goal | Blocker |
|---|---|---|
| 10 | pg_cron jobs (demographic progression + kindy prompts) | pg_cron on free tier? People Gap #4 |
| 11 | Contact-only parent trigger (people #46–47) | App logic layer needed |
