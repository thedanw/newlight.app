# Plan: New Light Anglican Church CRM - Base Platform

**Goal:** Build a lightweight, modular web application CRM platform for New Light Anglican Church with a baseline "people" module and extensible architecture for additional modules (groups, services, calendar) that can be independently developed and toggled on/off, using Supabase free tier for data storage.

**Active brainstorm (UI architecture & CSS):** Base DS = **Park UI** (Ark UI headless + Panda config recipes, MIT) CLI-vendored into `src/core/ui` — zero-runtime styling, named BEM classes, source owned + editable, no preset black-box, only add what you use (no bloat). Radix + Bits eras superseded (core #3, ui-ux #10). Decisions land in [ui-ux decision.md](../ui-ux/decision.md) (UI/CSS) + [module-design decision.md](../module-design/decision.md) (agent containment).

**Phase 0 = Design Lab (current):** Visual UI exploration ONLY, via LLM agents, in a deliberately bare sandbox — Vite + React + Panda (`hash:false` + tokens) + Park UI vendored + one styleguide page. No structural locks yet: NO router, NO module structure/registry/barrel, NO path aliases, NO CI, NO Supabase/PWA. This decouples visual design from app architecture so large app decisions stay open while the visual layer is designed freely. When architecture converges later, the design-lab output (tokens, `.recipe.ts`, components) ports wholesale into the future app's `src/core/ui` — nothing is wasted. Constraint for agents: keep the lab bare; adding routing/modules/aliases/CI here IS an architecture lock and is out of scope until Phase 1.

**Goal 3 (agent containment):** Small-context LLM agents must be able to build 'bolt-on' modules that are 99% consistent with the app. The UI architecture must therefore be a strict, fail-closed code environment: locked import surface, recipe-only CSS, typed contracts, scaffold generator, and CI enforcement — so an agent that loses context physically cannot create rogue components, use atomic classes, or stray outside the prescribed framework.

## Decision Logs (from brainstorming)
- [Core Platform decisions](decision.md)
- [People Module decisions](../people/decision.md)
- [Chat Module decisions](../chat/decision.md)
- [UI/CSS decisions](../ui-ux/decision.md)
- [Module design + agent containment](../module-design/decision.md)