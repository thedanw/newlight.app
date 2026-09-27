---
name: email-core-utility
description: "Build a send-only email utility in src/core/email with GrapesJS drag-drop editor, Google Workspace SMTP via Edge Function, consent/suppression enforcement, send history, and public unsubscribe. Modules and plugins hook into one typed API surface."
category: code-plan
risk: safe
source: local
tags: [email, core-utility, grapesjs, nodemailer, edge-function, supabase, resend, consent, unsubscribe, smtp]
triggers: [email, smtp, resend, nodemailer, grapesjs, unsubscribe, consent, broadcast]
---

# Email Core Utility — Implementation Plan (LEGACY - Pre Studio SDK)

**Goal:** Build a send-only email utility in `src/core/email/` that lets church staff compose branded messages via a GrapesJS drag-drop editor, select audiences from saved lists or a person profile, and send through Google Workspace SMTP via a Supabase Edge Function, with consent/suppression enforcement, send history, and a public one-click unsubscribe page. Modules and plugins hook into one typed API surface (`src/core/email/public.ts`). No inbox, no open/click tracking, no marketing automation.

**Approach:** Core utility under `src/core/email/` mirroring the module contract (`manifest.ts`, `public.ts`, `routes.tsx`, `index.tsx`, `pages/`, `components/`, `lib/`, `settings.ts`) per decision.md §1. GrapesJS editor (`^0.22.5`, resolved 0.22.16, with `@grapesjs/react` 2.0.0 and `grapesjs-preset-newsletter` 1.0.2) with a typed block registry for built-in blocks and future module-provided data blocks. Transport via Supabase Edge Function (`email-send`) using `nodemailer@9.1.1` over Google Workspace SMTP port 465. Consent fields (`consent_broadcasts`, `consent_team_updates`) added to `people` table. Templates, sends, recipients, suppression, and sender aliases persisted in PostgreSQL with RLS. Existing `src/core/lib/email.ts` becomes a compatibility wrapper delegating to the new client. Existing People email usage (`people/lib/email.ts` + `SendEmailDialog`) migrates to the core API. TDD with Vitest for pure logic; Deno tests for Edge Function behavior.

**Branch:** `feature/core-email-utility` (from `main`)

---

## Scope

- **In:**
  - `src/core/email/` — manifest, public API, routes, pages, components, lib, settings registration
  - `src/core/lib/email.ts` — compatibility wrapper delegating to new core email client
  - `src/core/ui/index.ts` — `email` namespace export (if needed for editor components)
  - `src/core/router.tsx` — authenticated email routes + public unsubscribe route
  - `src/core/settings/lib/schema.ts` — register email settings section
  - Database: migration for `email_templates`, `email_sends`, `email_recipients`, `email_unsubscribes`, `email_sender_aliases` tables + `consent_broadcasts`/`consent_team_updates` on `people`
  - `src/core/lib/database.types.ts` — hand-maintained type updates
  - `supabase/functions/email-send/index.ts` — Edge Function with nodemailer SMTP
  - `supabase/functions/email-unsubscribe/index.ts` — public unsubscribe Edge Function
  - People module migration: `people/lib/email.ts` + `SendEmailDialog.tsx` + `SavedListSidebar.tsx` + `PersonProfile/Header.tsx` + `types.ts` consent fields
  - Zod schemas + Vitest unit tests for pure logic
  - Deno tests for Edge Function behavior
  - Integration tests + E2E scenarios
  - Lint, typecheck, build verification
- **Out:**
  - No inbox, replies, threading, open/click tracking, or analytics
  - No marketing automation, drip campaigns, A/B tests
  - No send-time server-side data binding (data blocks are edit-time snapshots)
  - No multi-tenancy, offline write queue, or native app wrapper
  - No parent-facing consent management flow
  - No React-Email component library (not compatible with React 19 + Vite; GrapesJS HTML is the chosen path)
  - No `@react-email/render` (resend/react-email ecosystem assumes server rendering; incompatible with SPA + Vite)

## Libraries

| Library | Version | Purpose | Compatibility |
|---|---|---|---|
| `grapesjs` | `^0.22.5` (resolved 0.22.16) | Drag-drop HTML editor core | Matches `@grapesjs/react@2.0.0` peer range |
| `@grapesjs/react` | `^2.0.0` | Official React 19 wrapper | Supports React 18/19; peer range is `grapesjs@^0.22.5` |
| `grapesjs-preset-newsletter` | `^1.0.2` | Newsletter blocks (columns, button, image, text) | BSD-3-Clause |
| `nodemailer` | `9.1.1` | SMTP transport (Edge Function only) | Deno npm import verified |
| `sanitize-html` | `^2.17.7` | HTML sanitization before storage/send | Deno/browser compatible |
| `zod` | `^4.4.3` | Schema validation (already in repo) | ✅ existing dependency |
| `@supabase/supabase-js` | `^2.112.4` | DB + Edge Function client | ✅ existing dependency |
| `@ark-ui/react` | `^5.38.1` | Headless UI primitives | ✅ existing dependency |
| `lucide-react` | `^1.30.0` | Icons | ✅ existing dependency |
| `framer-motion` | `^13.0.0` | Animations | ✅ existing dependency |

> React-Email is **rejected**: it requires React Server Components or `@react-email/render` with server-side rendering, incompatible with this Vite 7 + React 19 SPA. GrapesJS HTML output is the chosen editor surface.

---

## Execution Protocol (apply every batch)

| Step | Action |
|------|--------|
| Sync | First task: mark PREVIOUS batch tasks complete in plan.md; update findings.md if new gaps discovered |
| Context | Read findings.md#references for batch-specific context; if context >70%, compact progress before next batch |
| Tools | `todowrite` (1 in-progress); `task` subagent for independent >5min subtasks; mask verbose tool output as `[Obs:N]` → plan.md |
| Budget | Stable 20% · Current 50% · History 20% · Buffer 10% |
| Gates | Per-batch: `pnpm test -- <batch>` (TDD fail→pass), `pnpm typecheck`, `pnpm lint` |

### Evolving Context (tracked per batch)

```
Batch 1: [x] dependencies installed · [x] src/core/email scaffolded · [x] types.ts written + tested
Batch 2: [x] migration written · [x] database.types.ts updated · [x] Zod schemas tested
Batch 3: [x] provider abstraction · [x] email.ts wrapper delegates · [x] sendEmail contract tested
Batch 4: [x] queries.ts · [x] audience.ts · [x] permissions.ts · [x] all tested
Batch 5: [x] email-send Edge Function · [x] nodemailer transport · [x] consent/suppression enforced
Batch 6: [x] token utilities (lib/unsubscribe.ts) · [x] email-unsubscribe Edge Function · [x] public route tested
Batch 7: [x] EmailEditor component · [x] block registry · [x] renderer snapshot · [x] tested
Batch 8: [ ] EmailComposer · [ ] AudiencePicker · [ ] TemplateList · [ ] tested
Batch 9: [ ] pages (dashboard, editor, history, settings, unsubscribe) · [ ] routes wired · [ ] settings registered
Batch 10: [ ] compatibility layer · [ ] people module migrated · [ ] router updated · [ ] tested
Batch 11: [ ] integration tests · [ ] E2E scenarios · [ ] full workflow verified
Batch 12: [ ] lint clean · [ ] typecheck clean · [ ] build passes · [ ] docs written
```

### Corrections Applied During Batch 2

- **Zod 4 API changes**: `z.string().datetime()` is not available in Zod 4; replaced with `isoDatetimeSchema` regex (`z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/)`).
- **Zod 4 `z.record()` signature**: requires key + value schema args; used `z.record(z.string(), z.unknown())` for JSON objects.
- **Duplicate type exports**: `types.ts` defines canonical TS types; `schema.ts` exports only Zod schema objects (no type re-exports) to avoid barrel export conflicts.

### Decisions Made During Batch 2