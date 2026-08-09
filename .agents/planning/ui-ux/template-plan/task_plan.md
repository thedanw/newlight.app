# Task Plan — UI/UX Design Lab (Boilerplate + Styleguide)

Status: in_progress

| Batch | Phase | Goal | Status |
|---|---|---|---|
| 1 | Scaffold | Vite + React + TS-strict boilerplate boots via pnpm on `feat/ui-design-lab` | completed |
| 2 | Panda CSS | `hash:false` config + single `global.css` | completed |
| 3 | Park UI base | vendor shell + Dashboard base components into `src/core/ui` | completed |
| 4 | Theme + font | `<html data-*>` emission + static Inter preload | completed |
| 5 | SG shell + Dashboard | `App.tsx` panel stack + Dashboard TOC + breadcrumbs + toolPanel | completed |
| 6 | Brand form | 8-field form, live whole-shell re-theme, logo save-on-apply | completed |
| 7 | Subpages + catalog | 8 category subpages, all 63 components in `toc.ts` | completed |
| 8 | Verify + push | typecheck/build/smoke + push branch | not-started |

## Rules (every batch)
- One fresh subagent per batch; it reads only this plan's batch slice + `findings.md` refs + `task_plan.md`.
- `manage_todo_list`: exactly ONE `in_progress` at a time; update immediately on completion.
- Log outcomes/errors to `progress.md` every 2 ops; compact the batch to ≤3 bullets at the end.
- Build only the bare bones — YAGNI yet (reminder repeated per phase in `plan.md`).
