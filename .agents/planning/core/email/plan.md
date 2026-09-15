---
name: email-core-utility
description: "Build a send-only email utility in src/core/email with GrapesJS drag-drop editor, Google Workspace SMTP via Edge Function, consent/suppression enforcement, send history, and public unsubscribe. Modules and plugins hook into one typed API surface."
category: code-plan
risk: safe
source: local
tags: [email, core-utility, grapesjs, nodemailer, edge-function, supabase, resend, consent, unsubscribe, smtp]
triggers: [email, smtp, resend, nodemailer, grapesjs, unsubscribe, consent, broadcast]
---

# Email Core Utility — Implementation Plan

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

- **Enum migration**: Created PostgreSQL enums (`email_template_status`, `email_send_status`, `email_recipient_status`, `email_consent_category`, `email_audience_type`) to match the Zod schemas and TypeScript types exactly. Consistent with the project pattern (`form_submit_action`, `yes_no` enums in `20260825221018_create_enums.sql`).
- **UUID primary keys**: Used `gen_random_uuid()` with `pgcrypto` extension, matching the existing migration pattern.
- **RLS**: Authenticated-only policies for all email tables (no public/anon access). Edge Function uses `service_role` to bypass RLS for send processing (per findings.md §B.2).
- **Consent columns**: Added `consent_broadcasts` and `consent_team_updates` as `yes_no` enum columns on `people` table — nullable, no default, safe for existing rows.
- **Schema type exports removed**: Types come from `types.ts` only; `schema.ts` is for runtime validation schemas.

### Findings Updates

- **Obs:31** — `src/core/email/__tests__/schema.test.ts` has 38 tests covering enums, compatibility, template/send/recipient/unsubscribe/alias schemas, audience specs, and insert payloads.
- **Obs:32** — `package.json` now also includes `@types/nodemailer` — verify in Batch 5.
- **Obs:33** — People module types (`Tables<'people'>`) automatically pick up consent fields; no explicit changes to `people/lib/types.ts` needed.
- **Obs:34** — `pnpm lint` pre-existing ESLint config error (`eslint.config.*` missing) still blocks lint gate. Not email-related.

### Mandatory Tool Usage

- Every batch: `todowrite` to track in-progress tasks
- TDD batches: `read` 2-3 similar existing files before writing new code
- Verification: `pnpm test -- <pattern>`, `pnpm typecheck`, `pnpm lint`
- Git: `git add -A` + `git commit -m "type(scope): desc"` after each approved batch
- Edge Function: `pnpm exec supabase functions serve email-send --no-verify-jwt` for local testing

### Compaction Protocol

If context exceeds 70% during a batch:
1. Append a "Context Reset" note to plan.md
2. Summarize decisions made so far in `< 50 lines`
3. Discard verbose tool outputs, keep only `[Obs:N]` references

---

## Phase 1: Foundation — Types, Schema, Provider

### Batch 1: Dependencies + Core Email Types + Scaffold

## Batch 1 Start: Sync
- [ ] Mark previous batch tasks complete in plan.md (first batch — no previous)
- [ ] Read findings.md#current-email-state, findings.md#data-model, findings.md#library-adoption
- [ ] Read `src/core/lib/email.ts` (existing contract)
- [ ] Read `src/core/dragndrop/index.ts` (core utility barrel pattern)

## Batch 1 Context
- Goal: Core email utility under `src/core/email/` mirroring module contract.
- This Batch: Install deps, scaffold `src/core/email/`, write `lib/types.ts`, create barrel.
- Prev: None — first batch.
- Key: findings.md#repository-and-runtime, findings.md#current-email-state

#### Task 1.1: Install Dependencies
- [ ] `pnpm add grapesjs@^0.22.5 @grapesjs/react@^2.0.0 grapesjs-preset-newsletter@^1.0.2 sanitize-html@^2.17.7`
- [ ] Verify: `pnpm list grapesjs @grapesjs/react grapesjs-preset-newsletter sanitize-html`
- [ ] Gate: no GrapesJS peer warning; resolved GrapesJS must remain within `^0.22.5`

#### Task 1.2: Scaffold Directory Structure
- [ ] Create `src/core/email/lib/`
- [ ] Create `src/core/email/pages/`
- [ ] Create `src/core/email/components/`
- [ ] Create `src/core/email/__tests__/`

#### Task 1.3: Write Core Email Types (`lib/types.ts`)
**Context:** Existing contract in `src/core/lib/email.ts` (EmailRecipient, SendEmailInput, SendEmailResult).
Write failing test → implement → verify.

Types to define:
```ts
// Re-export existing contract types for compatibility
export type { EmailRecipient, SendEmailInput, SendEmailResult } from '@/core/lib/email'

// New core email types
export type EmailTemplateStatus = 'draft' | 'published' | 'archived'
export type EmailSendStatus = 'queued' | 'sending' | 'sent' | 'failed' | 'partial' | 'suppressed'
export type EmailRecipientStatus = 'queued' | 'sent' | 'failed' | 'suppressed' | 'skipped'
export type EmailTransport = 'smtp' | 'resend' | 'noop'

export type EmailTemplate = {
  id: string
  name: string
  subject: string
  html_content: string  // snapshot HTML
  editor_json: Json | null  // GrapesJS editor state
  status: EmailTemplateStatus
  from_email: string
  from_name: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export type EmailSend = {
  id: string
  template_id: string | null
  subject: string
  body: string  // rendered HTML
  from_email: string
  from_name: string
  consent_category: 'broadcasts' | 'team_updates'
  audience_type: 'saved_list' | 'explicit' | 'preset'
  audience_ref: string | null  // saved_list id or preset id
  recipient_count: number
  accepted_count: number
  status: EmailSendStatus
  provider: string | null
  provider_message_id: string | null
  error_message: string | null
  sent_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type EmailRecipientRow = {
  id: string
  send_id: string
  person_id: string | null
  email: string
  name: string | null
  status: EmailRecipientStatus
  provider_message_id: string | null
  error_message: string | null
  sent_at: string | null
  created_at: string
}

export type EmailUnsubscribe = {
  id: string
  email: string  // hashed in practice
  token_hash: string
  send_id: string | null
  reason: string | null
  unsubscribed_at: string
}

export type EmailSenderAlias = {
  id: string
  email: string
  name: string
  is_default: boolean
  created_by: string | null
  created_at: string
}
```

**TDD:**
- [ ] Write failing test: `src/core/email/__tests__/types.test.ts` — validates type shapes, EmailRecipient compat
- [ ] Run: `pnpm test -- email/types` → FAIL
- [ ] Implement `src/core/email/lib/types.ts`
- [ ] Run: `pnpm test -- email/types` → PASS

#### Task 1.4: Create Barrel (`index.ts`)
- [ ] `src/core/email/index.ts` — re-export from lib/types, lib/schema, lib/queries, lib/client, components, pages
- [ ] Verify: `pnpm typecheck` clean

**Deliverable:** Dependencies installed, `src/core/email/` scaffolded, typed contract defined + tested.
**Commit:** `chore(email): scaffold core email utility + typed contracts`

---

### Batch 2: Database Schema + Zod Schemas + DB Types

## Batch 2 Start: Sync
- [ ] Mark Batch 1 tasks complete
- [ ] Read findings.md#data-model, findings.md#repository-and-runtime

## Batch 2 Context
- Goal: Core email utility under `src/core/email/`.
- This Batch: Migration for email tables + consent columns; DB types update; Zod schemas.
- Prev: Batch 1 scaffolded types + barrel.
- Key: findings.md#data-model — people.email is MVP source; consent fields don't exist yet

#### Task 2.1: Write Migration
**Context:** Migration naming convention `YYYYMMDDHHMMSS_name.sql`. RLS pattern from `20260826000000_create_platform_tables.sql`.
- [ ] `supabase/migrations/20260913000000_create_email_system.sql`:
  - `email_templates` (id, name, subject, html_content, editor_json, status, from_email, from_name, created_by, created_at, updated_at)
  - `email_sends` (id, template_id, subject, body, from_email, from_name, consent_category, audience_type, audience_ref, recipient_count, accepted_count, status, provider, provider_message_id, error_message, sent_at, created_by, created_at, updated_at)
  - `email_recipients` (id, send_id FK, person_id FK, email, name, status, provider_message_id, error_message, sent_at, created_at)
  - `email_unsubscribes` (id, email_hash, token_hash, send_id FK nullable, reason, unsubscribed_at)
  - `email_sender_aliases` (id, email, name, is_default, created_by, created_at)
  - `ALTER TABLE people ADD COLUMN consent_broadcasts yes_no, ADD COLUMN consent_team_updates yes_no`
  - RLS policies: authenticated = select/insert/update non-deleted; service_role = full
  - Grants: authenticated rw, service_role rw
  - **TDD for migration:** Write `supabase/migrations/__tests__/email_migration.test.sql` using pgTAP or `supabase db diff` verification — test that columns exist, RLS is enabled, policies grant authenticated

#### Task 2.2: Update database.types.ts
- [ ] Add `EmailTemplateRow`, `EmailSendRow`, `EmailRecipientRow`, `EmailUnsubscribeRow`, `EmailSenderAliasRow` type definitions
- [ ] Add `email_templates`, `email_sends`, `email_recipients`, `email_unsubscribes`, `email_sender_aliases` to `Database['public']['Tables']`
- [ ] Add `consent_broadcasts` + `consent_team_updates` to `PersonRow` (both `yes_no | null`)
- [ ] Verify: `pnpm typecheck` clean

#### Task 2.3: Write Zod Schemas (`lib/schema.ts`)
**Context:** Forms module uses Zod schemas in `src/modules/forms/lib/schema.ts`. Pattern from `forms-schema.ts`.
- [ ] `src/core/email/lib/schema.ts` — Zod schemas for EmailTemplate, EmailSend, EmailRecipient, EmailUnsubscribe, EmailSenderAlias
- [ ] EmailRecipient schema reuses existing `EmailRecipient` type (email + optional name)
- [ ] Consent category enum: `['broadcasts', 'team_updates']`
- [ ] Status enums: templates `['draft','published','archived']`, sends `['queued','sending','sent','failed','partial','suppressed']`
- **TDD:**
  - [ ] Write failing test: `src/core/email/__tests__/schema.test.ts` — 12+ test cases (valid/invalid templates, sends, recipients, consent validation, status validation)
  - [ ] Run: `pnpm test -- email/schema` → FAIL
  - [ ] Implement `src/core/email/lib/schema.ts`
  - [ ] Run: `pnpm test -- email/schema` → PASS

#### Task 2.4: Update People Types
- [ ] Add `consent_broadcasts` and `consent_team_updates` to `Person` type usage in `src/modules/people/lib/types.ts`
- [ ] Add `EmailSend` and `EmailTemplate` type re-exports if people module needs them
- [ ] Verify: `pnpm typecheck` clean

**Deliverable:** Migration + DB types + Zod schemas; all tested.
**Commit:** `feat(email): database schema + Zod schemas + consent fields`

---

### Batch 3: Email Client + Provider Abstraction

## Batch 3 Start: Sync
- [ ] Mark Batch 2 tasks complete
- [ ] Read findings.md#current-email-state — sendEmail throws; people/lib/email.ts calls it

## Batch 3 Context
- Goal: Core email utility under `src/core/email/`.
- This Batch: Provider abstraction (Edge Function transport), update `src/core/lib/email.ts` to delegate.
- Prev: Batch 2 — migration + types + schemas tested.
- Key: decision.md §3 — SMTP via Edge Function

#### Task 3.1: Provider Abstraction (`lib/client.ts`)
**Context:** `src/core/lib/supabase.ts` client pattern. Edge Function at `supabase/functions/email-send/`.
- [ ] `src/core/email/lib/client.ts`:
  - `EmailProvider` interface: `{ send(input: SendEmailInput): Promise<SendEmailResult> }`
  - `EdgeFunctionProvider` — calls `supabase.functions.invoke('email-send', { body })`
  - `NoopProvider` — for tests; returns `{ messageId: null, acceptedCount: input.to.length }`
  - `createEmailProvider(config: { transport: EmailTransport })` — factory selecting provider
  - `sendEmail(input: SendEmailInput): Promise<SendEmailResult>` — delegates to configured provider
- **TDD:**
  - [ ] Write failing test: `src/core/email/__tests__/client.test.ts` — provider selection, EdgeFunction invoke shape, NoopProvider returns correct count
  - [ ] Run: `pnpm test -- email/client` → FAIL
  - [ ] Implement `src/core/email/lib/client.ts`
  - [ ] Run: `pnpm test -- email/client` → PASS

#### Task 3.2: Compatibility Wrapper
- [ ] Update `src/core/lib/email.ts` — re-export types + delegate `sendEmail` to `@/core/email/lib/client`
- [ ] Keep `EmailRecipient`, `SendEmailInput`, `SendEmailResult` type exports unchanged
- [ ] Keep `sendEmail` async function signature identical
- [ ] Verify: `pnpm typecheck` clean (people module imports still resolve)

#### Task 3.3: Queries Layer (`lib/queries.ts`)
- [ ] `src/core/email/lib/queries.ts`:
  - `getTemplates()` — list published/draft templates owned by user or shared
  - `getTemplate(id)` — single template
  - `createTemplate(input)` / `updateTemplate(id, patch)` / `deleteTemplate(id)`
  - `getSends(options)` — list sends with filters
  - `getSendRecipients(sendId)` — recipients for a send
  - `createSenderAlias(input)` / `getSenderAliases()`
- **TDD:**
  - [ ] Write failing test: `src/core/email/__tests__/queries.test.ts` — mock supabase, test template CRUD shapes
  - [ ] Run: `pnpm test -- email/queries` → FAIL
  - [ ] Implement `src/core/email/lib/queries.ts`
  - [ ] Run: `pnpm test -- email/queries` → PASS

**Deliverable:** Provider abstraction + compatibility wrapper + queries; all tested.
**Commit:** `feat(email): client provider + compatibility wrapper + queries`

---

### Batch 4: Audience Resolution + Permissions

## Batch 4 Start: Sync
- [ ] Mark Batch 3 tasks complete
- [ ] Read findings.md#data-model — saved_lists stores JSON conditions

## Batch 4 Context
- Goal: Core email utility under `src/core/email/`.
- This Batch: Audience resolution (saved lists, explicit people, presets) + role-based send permissions.
- Prev: Batch 3 — client/provider/queries tested.
- Key: decision.md §5 — only saved-list, explicit-person, registered-preset audience sources

#### Task 4.1: Audience Resolution (`lib/audience.ts`)
**Context:** `src/modules/people/lib/email.ts` has `getEmailRecipients(listId)` — existing logic to migrate. `saved_lists.conditions` is JSON.
- [ ] `src/core/email/lib/audience.ts`:
  - `AudienceType = 'saved_list' | 'explicit' | 'preset'`
  - `resolveAudience(audience: { type: AudienceType; ref?: string; peopleIds?: string[] }): Promise<EmailRecipient[]>`
  - `resolveSavedList(listId): Promise<EmailRecipient[]>` — migrated from people/lib/email.ts
  - `resolvePeople(peopleIds: string[]): Promise<EmailRecipient[]>`
  - `resolvePreset(presetId): Promise<EmailRecipient[]>` — registered presets via HookRegistry
- **TDD:**
  - [ ] Write failing test: `src/core/email/__tests__/audience.test.ts` — mock supabase, test each resolver returns correct shape, deduplication, missing-email skip
  - [ ] Run: `pnpm test -- email/audience` → FAIL
  - [ ] Implement `src/core/email/lib/audience.ts`
  - [ ] Run: `pnpm test -- email/audience` → PASS

#### Task 4.2: Permissions (`lib/permissions.ts`)
**Context:** `access_permission` enum: `public | member_area | team_leaders | admin | super_admin`. `people` module uses saved lists with `owner_id`.
- [ ] `src/core/email/lib/permissions.ts`:
  - `canSendEmail(userAccess: AccessPermission): boolean` — team_leaders+, not public/member_area
  - `canManageTemplates(userAccess: AccessPermission): boolean` — admin+
  - `canManageSenderAliases(userAccess: AccessPermission): boolean` — super_admin only
  - `canConfigureSmtp(userAccess: AccessPermission): boolean` — super_admin only
  - `canManageSettings(userAccess: AccessPermission): boolean` — admin+
  - `filterRecipientsByRole(recipients: EmailRecipient[], viewerAccess: AccessPermission): EmailRecipient[]` — team_leaders only see their team's people
- **TDD:**
  - [ ] Write failing test: `src/core/email/__tests__/permissions.test.ts` — test each permission level, role filtering
  - [ ] Run: `pnpm test -- email/permissions` → FAIL
  - [ ] Implement `src/core/email/lib/permissions.ts`
  - [ ] Run: `pnpm test -- email/permissions` → PASS

#### Task 4.3: Consent Enforcement
- [ ] Add to `lib/audience.ts`: `filterByConsent(recipients: EmailRecipient[], consentCategory: 'broadcasts' | 'team_updates'): Promise<EmailRecipient[]>`
  - Fetches `people.email` and `people.consent_<category>` via Supabase
  - Skips recipients where consent is not `yes` or email is null
  - Returns filtered list with consent status
- **TDD:**
  - [ ] Write failing test: consent filtering — yes consent passes, null/no consent skipped
  - [ ] Run: `pnpm test -- email/audience` → FAIL
  - [ ] Implement consent filter
  - [ ] Run: `pnpm test -- email/audience` → PASS

**Deliverable:** Audience resolver + permissions + consent filtering; all tested.
**Commit:** `feat(email): audience resolution + consent + permissions`

---

## Phase 2: Transport — Edge Functions

### Batch 5: Edge Function — email-send

## Batch 5 Start: Sync
- [ ] Mark Batch 4 tasks complete
- [ ] Read findings.md#editor-and-transport-research — nodemailer@9.1.1, port 465, Workspace SMTP
- [ ] Read `supabase/functions/elvanto-sync-worker/index.ts` (Edge Fn pattern)

## Batch 5 Context
- Goal: Core email utility under `src/core/email/`.
- This Batch: `supabase/functions/email-send/index.ts` with nodemailer SMTP + consent/suppression checks.
- Prev: Batch 4 — audience + permissions tested.
- Key: decision.md §3 — Edge Function owns SMTP credentials + queue processing

#### Task 5.1: Edge Function Scaffold
- [ ] Create `supabase/functions/email-send/index.ts`:
  - `serve(async (req) => { ... })` handler with CORS headers
  - POST endpoint, JWT verification via Supabase service_role
  - Request body: `{ sendId, templateId?, recipients, subject, body, from, consentCategory }`
  - Response: `{ success: boolean; results: { email, status, messageId?, error? }[] }`
- [ ] `supabase/functions/email-send/deps.ts` — shared types (optional, or inline)

#### Task 5.2: Nodemailer Transport
- [ ] Implement SMTP transport config:
  - Read `SMTP_HOST`, `SMTP_PORT` (465), `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_NAME` from Deno.env
  - `nodemailer.createTransport({ host, port: 465, secure: true, auth: { user, pass } })`
  - If no SMTP env vars → throw clear config error (not silent fail)
- [ ] Implement `sendIndividualEmail(transporter, recipient, subject, html, from)`:
  - Returns `{ messageId | null, accepted: boolean }`
  - Catches per-recipient errors, continues batch

#### Task 5.3: Consent + Suppression + Queue Processing
- [ ] Before sending, query `email_unsubscribes` by `email_hash` (SHA-256 of lowercase email) — skip suppressed
- [ ] Query `people.consent_<category>` — skip if not `yes`
- [ ] For each accepted recipient: insert `email_recipients` row with status `sent`/`failed`/`suppressed`/`skipped`
- [ ] Update `email_sends` status: `sent` if all accepted, `partial` if some failed, `failed` if none sent
- [ ] Upsert provider message IDs
- **Deno tests (`supabase/functions/email-send/__tests__/index.test.ts`):**
  - [ ] Test consent check logic (mock supabase: consent=yes sends, consent=null skips)
  - [ ] Test suppression check (mock: token exists → skipped)
  - [ ] Test status rollup (all sent → sent, some failed → partial, none sent → failed)
  - [ ] Run: `deno test supabase/functions/email-send/` (or test pure logic via Vitest if Deno test infra not ready)
  - Context guard: if Deno tests can't run locally, extract pure logic to `src/core/email/lib/sending.ts` and test with Vitest instead

**Deliverable:** Edge Function with nodemailer SMTP + consent/suppression enforcement + tests.
**Commit:** `feat(email): edge function email-send with nodemailer + consent/suppression`

---

### Batch 6: Edge Function — email-unsubscribe + Token Utilities

## Batch 6 Start: Sync
- [ ] Mark Batch 5 tasks complete
- [ ] Read findings.md#repository-and-runtime — `supabase/functions serve email-send --no-verify-jwt`

## Batch 6 Context
- Goal: Core email utility under `src/core/email/`.
- This Batch: `supabase/functions/email-unsubscribe/index.ts` + token utilities in `lib/unsubscribe.ts`.
- Prev: Batch 5 — email-send Edge Function working.
- Key: decision.md §6 — opaque token hash, same-domain, durable suppression record

#### Task 6.1: Token Utilities (`lib/unsubscribe.ts`)
- [ ] `src/core/email/lib/unsubscribe.ts`:
  - `generateUnsubscribeToken(email: string, sendId: string): string` — HMAC-SHA256 via edge function secret, or random token stored hashed
  - `hashEmail(email: string): string` — SHA-256 of lowercase email
  - `verifyUnsubscribeToken(token: string): { email: string; sendId: string | null } | null`
  - `createUnsubscribeLink(email: string, sendId?: string): string` — returns `/email/unsubscribe?token=<opaque>`
- **TDD:**
  - [ ] Write failing test: `src/core/email/__tests__/unsubscribe.test.ts` — token generation is deterministic per input, verification rejects tampered tokens, email hashing is consistent
  - [ ] Run: `pnpm test -- email/unsubscribe` → FAIL
  - [ ] Implement `src/core/email/lib/unsubscribe.ts`
  - [ ] Run: `pnpm test -- email/unsubscribe` → PASS

#### Task 6.2: Unsubscribe Edge Function
- [ ] `supabase/functions/email-unsubscribe/index.ts`:
  - GET endpoint at `/email/unsubscribe?token=<token>` — renders a confirmation HTML page (inline, no framework)
  - POST endpoint with `{ token, reason? }` — records `email_unsubscribes` row, returns HTML confirmation
  - Token verified server-side; email never appears in URL (only token hash matches)
  - Inserts into `email_unsubscribes` (email_hash, token_hash, send_id, reason, unsubscribed_at)
  - Idempotent: re-unsubscribe is a no-op (upsert)
- [ ] `supabase/config.toml` — ensure `email-unsubscribe` function configured for public/no-JWT access

#### Task 6.3: UnsubscribePage (client-side route)
- [ ] `src/core/email/pages/UnsubscribePage.tsx`:
  - Reads `token` from URL search params
  - Calls `supabase.functions.invoke('email-unsubscribe', { body: { token, reason } })` on form submit
  - Shows confirmation state
  - No AppShell wrapper (public route in `router.tsx`)
- **TDD:**
  - [ ] Write failing test: page renders unsubscribe form, submits to function, shows confirmation
  - [ ] Run: `pnpm test -- email/unsubscribe` → PASS

**Deliverable:** Unsubscribe Edge Function + token utilities + client page; all tested.
**Commit:** `feat(email): unsubscribe edge function + token utils + public page`

---

## Phase 3: Editor — GrapesJS

### Batch 7: GrapesJS Editor + Block Registry

## Batch 7 Start: Sync
- [ ] Mark Batch 6 tasks complete
- [ ] Read findings.md#editor-and-transport-research — grapesjs@^0.22.5, @grapesjs/react@2.0.0

## Batch 7 Context
- Goal: Core email utility under `src/core/email/`.
- This Batch: EmailEditor component wrapping GrapesJS + typed block registry + snapshot renderer.
- Prev: Batch 6 — unsubscribe + tokens tested.
- Key: decision.md §2 — GrapesJS + newsletter preset; JSON + snapshot HTML storage

#### Task 7.1: Block Registry (`lib/blocks.ts`)
- [ ] `src/core/email/lib/blocks.ts`:
  - `EmailBlockSpec = { type: string; label: string; icon: string; category: string; defaultContent: string }`
  - Built-in blocks: text, image, button, spacer, divider, columns, heading
  - `registerEmailBlock(block: EmailBlockSpec): void` — for module/plugin data blocks
  - `getAllEmailBlocks(): EmailBlockSpec[]` — built-ins + registered
  - `EmailBlockRegistry` — module-level singleton
- **TDD:**
  - [ ] Write failing test: `src/core/email/__tests__/blocks.test.ts` — lookup, defaults, registration, deduplication
  - [ ] Run: `pnpm test -- email/blocks` → FAIL
  - [ ] Implement `src/core/email/lib/blocks.ts`
  - [ ] Run: `pnpm test -- email/blocks` → PASS

#### Task 7.2: Snapshot Renderer (`lib/renderer.ts`)
- [ ] `src/core/email/lib/renderer.ts`:
  - `renderSnapshot(editorJson: Json): string` — converts GrapesJS JSON to HTML snapshot
  - Uses GrapesJS `render()` method or `editor.getHtml()`
  - If GrapesJS not available in test env, use a mock/SSR-safe fallback
  - Sanitizes output via `sanitize-html` before returning
- **TDD:**
  - [ ] Write failing test: `src/core/email/__tests__/renderer.test.ts` — valid JSON → HTML with expected elements, sanitizes unsafe content
  - [ ] Run: `pnpm test -- email/renderer` → FAIL
  - [ ] Implement `src/core/email/lib/renderer.ts`
  - [ ] Run: `pnpm test -- email/renderer` → PASS

#### Task 7.3: EmailEditor Component (`components/EmailEditor.tsx`)
- [ ] `src/core/email/components/EmailEditor.tsx`:
  - Wraps `@grapesjs/react` (`<Grapesjs editor={editor} />` or `<Editor />`)
  - Initializes GrapesJS with newsletter preset + custom block registry
  - Light-theme only (per decision.md §9)
  - Provides `onChange(editorJson, htmlSnapshot)` callback
  - Exports `useEmailEditor()` hook for parent access
- [ ] `src/core/email/components/__tests__/EmailEditor.test.tsx`:
  - [ ] Test: renders without crash, loads blocks, emits onChange
  - [ ] Run: `pnpm test -- EmailEditor` → PASS
  - Context note: GrapesJS requires DOM; use happy-dom. May need `vi.mock` for heavy parts.

**Deliverable:** GrapesJS editor component + block registry + renderer; tested.
**Commit:** `feat(email): GrapesJS editor + block registry + snapshot renderer`

---

### Batch 8: Composer + AudiencePicker + TemplateList

## Batch 8 Start: Sync
- [ ] Mark Batch 7 tasks complete
- [ ] Read findings.md#fill-ux-decision (from forms) for UI conventions

## Batch 8 Context
- Goal: Core email utility under `src/core/email/`.
- This Batch: EmailComposer orchestrator + AudiencePicker + TemplateList components.
- Prev: Batch 7 — GrapesJS editor + registry tested.
- Key: decision.md §12 — Composer = editor + audience + sender + send

#### Task 8.1: AudiencePicker Component
- [ ] `src/core/email/components/AudiencePicker.tsx`:
  - Dropdown/radio selecting: Saved List / Explicit People / Preset
  - Saved List: `<Select>` of user's saved lists (from `saved_lists` with `owner_id = user.id` or `is_shared`)
  - Explicit: people search/combobox (autocomplete from `people`)
  - Preset: registered presets from HookRegistry
  - Shows resolved recipient count (debounced)
  - Validates consent category is set
- **TDD:**
  - [ ] Write failing test: `src/core/email/components/__tests__/AudiencePicker.test.tsx` — renders, switches modes, resolves count
  - [ ] Run: `pnpm test -- AudiencePicker` → FAIL
  - [ ] Implement + run → PASS

#### Task 8.2: TemplateList Component
- [ ] `src/core/email/components/TemplateList.tsx`:
  - Grid/list of email templates (name, subject, status, updated_at)
  - New / Edit / Delete / Archive actions
  - Filtering by status (draft/published)
  - Search by name
- **TDD:**
  - [ ] Write failing test: `src/core/email/components/__tests__/TemplateList.test.tsx` — renders list, filters, actions call callbacks
  - [ ] Run: `pnpm test -- TemplateList` → FAIL
  - [ ] Implement + run → PASS

#### Task 8.3: EmailComposer Component
- [ ] `src/core/email/components/EmailComposer.tsx`:
  - Orchestrates: EmailEditor + AudiencePicker + sender identity selector + subject input + send button
  - Form validation (Zod schema for compose form)
  - On send: resolve audience → filter consent → insert `email_sends` row (status=queued) → invoke Edge Function → update status
  - Loading + error states
  - Uses `usePageActions` if on a routed page
- **TDD:**
  - [ ] Write failing test: `src/core/email/components/__tests__/EmailComposer.test.tsx` — validates before send, calls audience resolver, invokes send, shows error on failure
  - [ ] Run: `pnpm test -- EmailComposer` → FAIL
  - [ ] Implement + run → PASS

**Deliverable:** Composer + pickers + template list; tested.
**Commit:** `feat(email): composer + audience picker + template list`

---

## Phase 4: Pages + Routing + Settings

### Batch 9: Pages + Routes + Settings Registration

## Batch 9 Start: Sync
- [ ] Mark Batch 8 tasks complete
- [ ] Read findings.md#routing-settings-and-ui-conventions

## Batch 9 Context
- Goal: Core email utility under `src/core/email/`.
- This Batch: All pages + route wiring + settings section registration.
- Prev: Batch 8 — composer + components tested.
- Key: findings.md#routing — router.tsx owns assembly; settings via settings/lib/schema.ts

#### Task 9.1: Page Implementations
- [ ] `src/core/email/pages/EmailDashboard.tsx` — template list + new template button (Page.Header hero)
- [ ] `src/core/email/pages/TemplateEditorPage.tsx` — EmailComposer for new/edit `:id` route
- [ ] `src/core/email/pages/SendHistoryPage.tsx` — table of sends with status filtering + recipient detail modal
- [ ] `src/core/email/pages/EmailSettingsPage.tsx` — sender aliases, SMTP status, consent field descriptions
- [ ] `src/core/email/pages/UnsubscribePage.tsx` — reads token from URL, POSTs to unsubscribe function (public route)
- **TDD per page:** minimal render test (lazy load + Page.Header pattern)

#### Task 9.2: Routes + Manifest + Settings
- [ ] `src/core/email/manifest.ts` — id `email`, icon `Mail` (lucide), number = next free (0 = settings, 1 = people, 2 = forms, 3 = example → email = 4), basePath `/email`
- [ ] `src/core/email/routes.tsx` — index→dashboard, `new`→editor, `:id/edit`→editor, `:id/send`→composer, `history`→send history, `settings`→settings
- [ ] `src/core/email/index.tsx` — module entry (lazy route loader pattern)
- [ ] `src/core/email/settings.ts` — registerSettingsSection({ id: 'email', title: 'Email Settings', ... })
- [ ] Update `src/core/router.tsx`:
  - Add `{ path: 'email', children: emailRoutes }` inside AppShell
  - Add `/email/unsubscribe` public route outside AppShell (no auth)
- [ ] Import `./settings` from routes for side-effect registration
- **TDD:**
  - [ ] Test routes resolve: `pnpm typecheck` + route import check
  - [ ] Test settings section registered

#### Task 9.3: Public API (`public.ts`)
- [ ] `src/core/email/public.ts`:
  - Re-export manifest + types
  - `EmailCoreApi = { moduleId: 'email'; sendEmail: (input) => Promise<SendEmailResult>; resolveAudience; createUnsubscribeLink }`
  - Functions for modules to call (e.g., People module's "Email this person")
- **TDD:**
  - [ ] Test public API surface (types resolve, functions callable)

**Deliverable:** All pages + routes + settings + public API; wired into app shell.
**Commit:** `feat(email): pages + routes + settings + public API`

---

### Batch 10: Compatibility Layer + People Module Migration

## Batch 10 Start: Sync
- [ ] Mark Batch 9 tasks complete
- [ ] Read findings.md#current-email-state — people/lib/email.ts, SendEmailDialog, SavedListSidebar, PersonProfile/Header

## Batch 10 Context
- Goal: Core email utility under `src/core/email/`.
- This Batch: Migrate People module's email usage to the new core API + update router.
- Prev: Batch 9 — pages + routes wired.
- Key: decision.md §13 — people/lib/email.ts retains audit behavior, SendEmailDialog migrates to core composer

#### Task 10.1: Update Compatibility Wrapper
- [ ] Finalize `src/core/lib/email.ts` — fully delegate to `@/core/email/lib/client`
- [ ] Re-export `EmailRecipient`, `SendEmailInput`, `SendEmailResult` + new types
- [ ] `sendEmail` delegates to `EmailClient.send` (Edge Function provider)
- Verify: people module imports unchanged

#### Task 10.2: Migrate People Module
- [ ] `src/modules/people/lib/email.ts`:
  - `getEmailRecipients(listId)` — delegate to `@/core/email/lib/audience` `resolveSavedList`
  - `sendPeopleEmail(recipients, subject, body)` — call core `sendEmail` + logEmailActivity (retain audit)
  - `canChat(person)` — unchanged (chat module future)
- [ ] `src/modules/people/components/SendEmailDialog.tsx`:
  - Replace inline form with `EmailComposer` from core (or thin adapter that pre-fills recipients)
  - Keep subject/body fields if not using full composer
- [ ] `src/modules/people/components/SendEmailDialog.tsx` is named `dialogSendEmail.tsx` per naming convention — verify and rename if needed
- Verify: `pnpm typecheck` clean

#### Task 10.3: Update SavedListSidebar + PersonProfile
- [ ] `src/modules/people/pages/Dashboard/SavedListSidebar.tsx` — use core `EmailCoreApi` or `getEmailRecipients` for email action
- [ ] `src/modules/people/pages/PersonProfile/Header.tsx` — email action opens core composer with explicit recipient
- Verify: `pnpm typecheck` clean + `pnpm test` clean

**Deliverable:** Compatibility layer complete, people module migrated to core email API.
**Commit:** `refactor(email): migrate people module to core email API`

---

## Phase 5: Integration + Polish

### Batch 11: Integration Tests + E2E Scenarios

## Batch 11 Start: Sync
- [ ] Mark Batch 10 tasks complete
- [ ] Read findings.md#open-gaps-and-risks

## Batch 11 Context
- Goal: Core email utility under `src/core/email/`.
- This Batch: Full workflow integration tests + E2E unsubscribe flow.
- Prev: Batch 10 — people migrated, compatibility verified.
- Key: decision.md §6 — one-click unsubscribe

#### Task 11.1: Template CRUD Integration
- [ ] `src/core/email/__tests__/integration/templates.test.ts`:
  - Create template → fetch template → update template → archive → verify list filters archived out
  - Mock supabase client
- [ ] Run: `pnpm test -- email/integration` → PASS

#### Task 11.2: Full Send Workflow
- [ ] `src/core/email/__tests__/integration/send-flow.test.ts`:
  - Compose (editor JSON + snapshot) → resolve audience (mock saved list) → filter consent (mock people with consent) → insert email_sends → invoke email-send function (mock) → verify email_recipients rows created with correct statuses
- [ ] Run: `pnpm test -- email/integration` → PASS

#### Task 11.3: Unsubscribe E2E Flow
- [ ] `src/core/email/__tests__/integration/unsubscribe.test.ts`:
  - Generate token → GET unsubscribe page (reads token) → POST confirmation → verify email_unsubscribes row created → verify suppressed recipient excluded from next send
- [ ] Run: `pnpm test -- email/integration` → PASS

#### Task 11.4: Plugin API Extension
- [ ] Add `email` property to `PluginAPIContext` in `src/core/plugins/PluginAPI.tsx`:
  - `sendEmail` (delegates to core)
  - `registerPreset(preset)` for audience presets
  - `createTemplate(template)` for plugins to create templates
- [ ] Add email registration to `HookRegistry.ts`
- [ ] Add email hooks to manifest-schema.ts
- **TDD:**
  - [ ] Test plugin can access email API and register presets
- [ ] Run: `pnpm test -- plugins` → PASS

**Deliverable:** Integration tests + plugin API extension + E2E scenarios verified.
**Commit:** `test(email): integration tests + plugin API email extension`

---

### Batch 12: Polish & Documentation

## Batch 12 Start: Sync
- [ ] Mark Batch 11 tasks complete
- [ ] Read findings.md#open-gaps-and-risks

## Batch 12 Context
- Goal: Core email utility under `src/core/email/`.
- This Batch: Lint, typecheck, build, documentation cleanup, archive planning docs.
- Prev: Batch 11 — integration tests pass.
- Key: findings.md#repository-and-runtime — all validation commands available

#### Task 12.1: Lint + Typecheck + Build
- [ ] `pnpm lint` — fix all warnings (0 warnings policy)
- [ ] `pnpm typecheck` — tsc -b clean
- [ ] `pnpm build` — Vite build succeeds, email chunks resolve
- [ ] `pnpm lint:tokens` — token enforcement clean
- [ ] `pnpm lint:pages` — page rules clean

#### Task 12.2: Documentation
- [ ] Update `src/core/email/public.ts` exports with JSDoc
- [ ] Update `findings.md` with implementation gaps resolved
- [ ] Create `src/core/email/README.md` — usage guide for modules/plugins
- [ ] Update `.agents/planning/core/email/decision.md` with lessons learned from implementation
- [ ] Update `src/core/lib/email.ts` with deprecation notice pointing to new API

#### Task 12.3: Archive Planning Docs
- [ ] Move `plan.md` → `plan-archive/plan.md`
- [ ] Move `findings.md` → `plan-archive/findings.md`
- [ ] Move `decision.md` → `plan-archive/decision.md` (preserve, update with lessons)
- [ ] Keep a stub `plan.md` pointing to archive

**Deliverable:** All quality gates pass, documentation complete, planning docs archived.
**Commit:** `docs(email): polish + documentation + archive planning`

---

## Validation Gates (Final)

- [ ] All unit tests pass (`pnpm test`) — target: 80+ tests across 12+ test files
- [ ] Coverage ≥ 70% for `src/core/email/lib/` pure logic
- [ ] Deno tests pass for Edge Functions (or extracted to Vitest)
- [ ] No lint/type errors (`pnpm lint && pnpm typecheck`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Token enforcement clean (`pnpm lint:tokens`)
- [ ] Page rules clean (`pnpm lint:pages`)
- [ ] People module migrated: `sendPeopleEmail` delegates to core API, `SendEmailDialog` uses new composer
- [ ] Compatibility: `src/core/lib/email.ts` exports unchanged, `sendEmail` delegates correctly
- [ ] Plugin API: `PluginAPIContext.email.sendEmail` available
- [ ] Routes: `/email` authenticated, `/email/unsubscribe` public outside AppShell
- [ ] RLS: all email tables have RLS + authenticated policies
- [ ] Edge Functions: `email-send` and `email-unsubscribe` deploy locally via `supabase functions serve`

---

## File Tracking

| File | Status | Batch |
|------|--------|-------|
| `package.json` | Modified | 1 |
| `src/core/email/index.ts` | Created | 1 |
| `src/core/email/manifest.ts` | Created | 9 |
| `src/core/email/public.ts` | Created | 9 |
| `src/core/email/routes.tsx` | Created | 9 |
| `src/core/email/index.tsx` | Created | 9 |
| `src/core/email/settings.ts` | Created | 9 |
| `src/core/email/lib/types.ts` | Created | 1 |
| `src/core/email/lib/schema.ts` | Created | 2 |
| `src/core/email/lib/client.ts` | Created | 3 |
| `src/core/email/lib/queries.ts` | Created | 3 |
| `src/core/email/lib/audience.ts` | Created | 4 |
| `src/core/email/lib/permissions.ts` | Created | 4 |
| `src/core/email/lib/unsubscribe.ts` | Created | 6 |
| `src/core/email/lib/blocks.ts` | Created | 7 |
| `src/core/email/lib/renderer.ts` | Created | 7 |
| `src/core/email/lib/sending.ts` | Created (if Deno tests infeasible) | 5 |
| `src/core/email/components/EmailEditor.tsx` | Created | 7 |
| `src/core/email/components/EmailComposer.tsx` | Created | 8 |
| `src/core/email/components/AudiencePicker.tsx` | Created | 8 |
| `src/core/email/components/TemplateList.tsx` | Created | 8 |
| `src/core/email/pages/EmailDashboard.tsx` | Created | 9 |
| `src/core/email/pages/TemplateEditorPage.tsx` | Created | 9 |
| `src/core/email/pages/SendHistoryPage.tsx` | Created | 9 |
| `src/core/email/pages/EmailSettingsPage.tsx` | Created | 9 |
| `src/core/email/pages/UnsubscribePage.tsx` | Created | 9 |
| `src/core/email/__tests__/types.test.ts` | Created | 1 |
| `src/core/email/__tests__/schema.test.ts` | Created | 2 |
| `src/core/email/__tests__/client.test.ts` | Created | 3 |
| `src/core/email/__tests__/queries.test.ts` | Created | 3 |
| `src/core/email/__tests__/audience.test.ts` | Created | 4 |
| `src/core/email/__tests__/permissions.test.ts` | Created | 4 |
| `src/core/email/__tests__/unsubscribe.test.ts` | Created | 6 |
| `src/core/email/__tests__/blocks.test.ts` | Created | 7 |
| `src/core/email/__tests__/renderer.test.ts` | Created | 7 |
| `src/core/email/components/__tests__/EmailEditor.test.tsx` | Created | 7 |
| `src/core/email/components/__tests__/AudiencePicker.test.tsx` | Created | 8 |
| `src/core/email/components/__tests__/TemplateList.test.tsx` | Created | 8 |
| `src/core/email/components/__tests__/EmailComposer.test.tsx` | Created | 8 |
| `src/core/email/__tests__/integration/*.test.ts` | Created | 11 |
| `src/core/lib/email.ts` | Modified | 10 |
| `src/core/lib/database.types.ts` | Modified | 2 |
| `src/core/ui/index.ts` | Modified (if editor export needed) | 7 |
| `src/core/router.tsx` | Modified | 9 |
| `src/core/settings/lib/schema.ts` | Not modified (settings.ts calls registerSettingsSection) | — |
| `src/core/plugins/PluginAPI.tsx` | Modified | 11 |
| `src/core/plugins/HookRegistry.ts` | Modified | 11 |
| `src/core/plugins/manifest-schema.ts` | Modified | 11 |
| `src/modules/people/lib/email.ts` | Modified | 10 |
| `src/modules/people/lib/types.ts` | Modified | 2 |
| `src/modules/people/components/SendEmailDialog.tsx` | Modified | 10 |
| `src/modules/people/pages/Dashboard/SavedListSidebar.tsx` | Modified | 10 |
| `src/modules/people/pages/PersonProfile/Header.tsx` | Modified | 10 |
| `supabase/migrations/20260913000000_create_email_system.sql` | Created | 2 |
| `supabase/functions/email-send/index.ts` | Created | 5 |
| `supabase/functions/email-send/__tests__/index.test.ts` | Created | 5 |
| `supabase/functions/email-unsubscribe/index.ts` | Created | 6 |
| `supabase/functions/email-unsubscribe/__tests__/index.test.ts` | Created | 6 |
| `supabase/config.toml` | Modified (add functions) | 6 |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| GrapesJS React 19 compatibility issues | Use `@grapesjs/react@2.0.0` (official wrapper); mock in unit tests; isolate editor component errors with ErrorBoundary |
| Deno npm import of nodemailer@9 | Verify with `supabase functions serve email-send --no-verify-jwt`; extract pure logic to Vitest if Deno test infra not ready |
| SMTP port 465 blocked in hosted Edge Runtime | Decision.md §3.1 — port 465 preferred; verify during Batch 5; fallback to Resend if SMTP fails (provider is abstracted) |
| People module audit rows break | Retain `logEmailActivity` in people/lib/email.ts — only the transport call changes |
| Existing `sendEmail` callers break | Compatibility wrapper at `src/core/lib/email.ts` preserves exact signature |
| RLS gaps on email tables | Migration includes RLS + policies (decision.md §A.2); idempotent `drop policy if exists` pattern |
| Broad platform_settings write policies | Email SMTP secrets go in Edge Function env vars, not DB (decision.md §3) |
| GrapesJS license | BSD-3-Clause verified (findings.md#editor-and-transport-research) |
| React-Email incompatibility | Rejected — see Libraries table above; GrapesJS is the chosen editor |
| Migration on `people` table locks row | Add columns nullable; no default; safe for existing rows |

---

## Success Criteria

1. **Typed API surface** — `src/core/email/public.ts` exports `sendEmail`, `resolveAudience`, `createUnsubscribeLink` usable by any module
2. **Editor works** — GrapesJS editor loads with newsletter blocks, produces HTML snapshot
3. **Transport works** — Email Function sends via Workspace SMTP; consent/suppression enforced before SMTP
4. **People integration** — `SendEmailDialog` opens core composer with pre-filled recipients; `sendPeopleEmail` logs audit
5. **Settings page** — `/settings/email` shows sender aliases + SMTP status + consent docs
6. **Unsubscribe** — `/email/unsubscribe?token=...` works without auth, creates suppression record
7. **Templates persist** — Create/edit/archive templates; editor JSON + snapshot HTML stored
8. **Send history** — `/email/history` shows sends with status; recipient detail modal shows per-recipient outcomes
9. **Plugin API** — `PluginAPIContext.email.sendEmail` available to plugins
10. **Zero regressions** — all existing tests + lint + typecheck + build pass
