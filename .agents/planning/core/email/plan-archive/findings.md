# Findings: Core Email Utility

Verified: 2026-09-12

## Repository and Runtime

- Repository: `newlight.app`, React/Vite SPA with Supabase.
- Current branch: `feat/people-module`; 39 commits ahead of `origin/main`; unrelated dirty changes are present. Email implementation must start from an isolated worktree/branch based on `main`.
- Node: `24.19.0`; pnpm: `8.15.4`; Deno: `2.6.3`; Supabase CLI: `2.116.0`.
- Lockfile versions currently resolve newer patch/minor versions than the ranges in `package.json`: React `19.3.0`, Vite `7.3.6`, TypeScript `5.9.2`, Supabase `2.116.0`, Zod `4.6.2`, Ark UI `5.39.1`.
- Test stack: Vitest `4.1.11`, happy-dom `20.14.0`, Testing Library React `16.3.3`, jest-dom `7.0.1`, user-event `14.6.7`.
- Available validation commands:
  - `pnpm test`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm build`
  - `pnpm panda`
  - `pnpm dev`
- Supabase CLI commands available:
  - `pnpm exec supabase start`
  - `pnpm exec supabase db reset --local`
  - `pnpm exec supabase migration up --local`
  - `pnpm exec supabase db diff --local`
  - `pnpm exec supabase functions serve email-send --no-verify-jwt`
  - `pnpm exec supabase functions deploy email-send`
- `supabase/config.toml` uses Edge Runtime Deno major version 2 and has local SMTP enabled for development.

## Current Email State

- `src/core/email/` does not exist.
- The existing compatibility contract is `src/core/lib/email.ts`:
  - `EmailRecipient = { email: string; name?: string }`
  - `SendEmailInput = { to: EmailRecipient[]; subject: string; body: string; from?: string }`
  - `SendEmailResult = { acceptedCount: number; messageId?: string }`
  - `sendEmail()` currently throws `"The core email service is not yet configured. Wire a provider into src/core/lib/email.ts to enable sending."`
- People already consumes that contract:
  - `src/modules/people/lib/email.ts` resolves saved-list recipients, calls `sendEmail`, and writes one `people_audit` row per accepted recipient.
  - `src/modules/people/components/SendEmailDialog.tsx` is a basic subject/body dialog.
  - `src/modules/people/pages/PersonProfile/Header.tsx` exposes an Email action.
  - `src/modules/people/pages/Dashboard/SavedListSidebar.tsx` exposes Email for saved lists.
- Existing People email behavior does not implement templates, consent categories, suppression, send history, aliases, or provider configuration.
- `src/core/lib/database.types.ts` is hand-maintained, not generated, and currently references `contact_channels` even though no matching migration was found. Email work must update this file deliberately or replace the dependency with a typed local contract after verifying the project convention.

## Data Model

- `people.email` exists and is the practical MVP source for recipient addresses.
- `people.school_email_permission` exists, but it is a school-specific permission and must not be reused as the general email-consent source.
- `people.consent_broadcasts` and `people.consent_team_updates` do not exist.
- `saved_lists` exists and stores JSON conditions; it is the existing audience source for People bulk email.
- No email templates, sends, recipients, suppression, unsubscribe tokens, or sender aliases exist.
- `platform_settings` exists as `(id, key, environment, value jsonb, updated_at)` and is used by the settings provider. Existing migrations grant broad anon/authenticated write access and rely on application-layer Super Admin gating. Email settings must therefore be validated server-side and must never store SMTP secrets there.

## Routing, Settings, and UI Conventions

- `src/core/router.tsx` owns all route assembly. Authenticated routes are inside `AppShell`; public routes are outside it.
- `src/core/routes.tsx` currently aggregates core settings routes only.
- Core settings pages use `Page.Main`, `Page.Header`, `Page.Body`, Park UI components, and `useSettings()` where appropriate.
- Settings sections are registered through `src/core/settings/lib/schema.ts`; a new email settings section should register under `/settings/email`.
- UI imports should come from `src/core/ui/index.ts`; module-local recipes are allowed only for email-specific editor chrome.
- Page headers are sticky/fixed and body content must scroll below them.
- Forms default to full-width cards; two-column grids are reserved for paired short fields and collapse at `sm`.
- The app is light-theme only.

## Editor and Transport Research

- `pnpm view` confirms package availability and peer compatibility:
  - `grapesjs@0.22.16` with `^0.22.5`; required by `@grapesjs/react@2.0.0` (`grapesjs@^0.22.5`)
  - `@grapesjs/react@2.0.0`
  - `grapesjs-preset-newsletter@1.0.2`
  - `nodemailer@9.1.1` and `nodemailer@9.0.5`; npm also reports a newer `10.0.9` line.
- `@grapesjs/react@2.0.0` supports React 18/19 and GrapesJS `^0.22.5`; the resolved GrapesJS `0.22.16` combination is compatible. GrapesJS `0.23.6` was rejected because it is outside the wrapper peer range.
- GrapesJS and the newsletter preset are BSD-3-Clause; `@grapesjs/react` is the official React wrapper.
- Supabase Edge Functions are Deno/TypeScript functions and support npm imports. The existing `supabase/functions/elvanto-sync-worker/index.ts` demonstrates remote imports and service-role usage.
- Supabase documentation and current package metadata support using `nodemailer` from an Edge Function, but Deno/npm compatibility and Gmail port `465` must be verified in the local Edge runtime before deployment.
- Google Workspace SMTP requires a dedicated account/app password and correct SPF/DKIM/DMARC. These credentials and DNS settings are not present in the repository.

## Likely Implementation Surface

### Core utility

- `src/core/email/manifest.ts`
- `src/core/email/public.ts`
- `src/core/email/routes.tsx`
- `src/core/email/index.tsx`
- `src/core/email/settings.ts`
- `src/core/email/pages/EmailDashboard.tsx`
- `src/core/email/pages/TemplateEditorPage.tsx`
- `src/core/email/pages/SendHistoryPage.tsx`
- `src/core/email/pages/EmailSettingsPage.tsx`
- `src/core/email/pages/UnsubscribePage.tsx`
- `src/core/email/components/EmailComposer.tsx`
- `src/core/email/components/EmailEditor.tsx`
- `src/core/email/components/AudiencePicker.tsx`
- `src/core/email/components/TemplateList.tsx`
- `src/core/email/components/SendHistoryTable.tsx`
- `src/core/email/lib/types.ts`
- `src/core/email/lib/schema.ts`
- `src/core/email/lib/queries.ts`
- `src/core/email/lib/hooks.ts`
- `src/core/email/lib/permissions.ts`
- `src/core/email/lib/audience.ts`
- `src/core/email/lib/templates.ts`
- `src/core/email/lib/unsubscribe.ts`
- `src/core/email/lib/editor.ts`
- `src/core/email/lib/renderer.ts`
- `src/core/email/lib/client.ts`
- `src/core/email/lib/blocks.ts`
- `src/core/email/__tests__/` or colocated `*.test.ts(x)` files

### Compatibility and integration

- `src/core/lib/email.ts` — preserve exports and delegate to the new core email client.
- `src/core/router.tsx` — add authenticated email routes and public unsubscribe route.
- `src/core/settings/lib/schema.ts` — register the email settings section through `src/core/email/settings.ts`.
- `src/modules/people/lib/email.ts` — retain audit behavior while using the new core API.
- `src/modules/people/components/SendEmailDialog.tsx` — migrate to the core composer or a thin adapter.
- `src/modules/people/pages/Dashboard/SavedListSidebar.tsx` — migrate saved-list email entry to the core audience/composer API.
- `src/modules/people/pages/PersonProfile/Header.tsx` — migrate person email entry to the core composer API.
- `src/modules/people/components/sections/Consents.tsx` — add the two shared consent fields for Youth/Child profiles, with admin-managed behavior.
- `src/modules/people/lib/types.ts` — expose the new consent fields through the existing `Tables<'people'>` type.

### Backend

- `supabase/migrations/<next-timestamp>_create_email_system.sql`
- `src/core/lib/database.types.ts`
- `supabase/functions/email-send/index.ts`
- `supabase/functions/email-send/*.test.ts`
- `supabase/functions/email-unsubscribe/index.ts`
- `supabase/functions/email-unsubscribe/*.test.ts`
- `supabase/config.toml` or function-specific config for public unsubscribe JWT behavior
- Environment-variable documentation/configuration outside source control for SMTP and unsubscribe secrets

## Core Utility Pattern (from dragndrop + module-design)

- `src/core/dragndrop/` is the existing model for a core utility: it has `index.ts` (barrel), `types.ts`, `provider.tsx`, `components/`, `hooks/`, `sensors/`, `utils/`, and is exported as `* as Dragndrop` from `src/core/ui/index.ts` (line 23).
- Module manifest pattern (from `src/modules/forms/manifest.ts`, `src/modules/example/manifest.ts`):
  - `id` (kebab), `name` (display), `icon` (LucideIcon), `number` (drives hero hue, 16deg × n), `alwaysOn`, `basePath`, `nav: { label, route }`
  - Module numbers used: settings=0, people=1, forms=2, example=3 → email=4
- Module contract (from `naming-convention.md` + `boilerplate/`): `manifest.ts`, `public.ts` (re-export manifest + ModuleApi type), `routes.tsx` (thin RouteObject glue), `dashboard.tsx` (Page.Main pattern with `--module-number` CSS var), `settings.ts` (calls `registerSettingsSection`), `components/`, `lib/` (kebab-case: types.ts, queries.ts, schema.ts, hooks.ts)
- Core settings registration: `src/core/settings/lib/schema.ts` — `registerSettingsSection({ id, title, description, component, order })` — imported from `routes.tsx` for side-effect
- Core router assembly: `src/core/router.tsx` — `createBrowserRouter` with `AppShell` + children; public routes outside shell (e.g. `/forms/:formId`)
- Plugin API context: `src/core/plugins/PluginAPI.tsx` — `PluginAPIContext` interface with `supabase`, `settings`, `router`, `toast`, `i18n`, `dragndrop`, `pluginName`, `pluginVersion`
- Plugin hook registration: `src/core/plugins/HookRegistry.ts` — in-memory arrays per hook type, `pluginHooks.*` wrappers, `clearPluginRegistrations` for testing
- Plugin manifest schema: `src/core/plugins/manifest-schema.ts` — Zod schema with permissions, hooks, dashboard widgets, nav items, dnd collections
- Naming convention: `naming-convention.md` — `+page<Domain>` for page entry, `section<Domain>`, `widget<Domain>`, `dialog<Domain>`, `field<Domain>`; non-component lib files are kebab-case (types.ts, queries.ts); tests colocated next to source
- DB types: `src/core/lib/database.types.ts` — hand-maintained, uses `TableDefinition<Row>` generic with Insert/Update; `Tables<T>` helper; enums inline; `Json` type exported
- Edge Function pattern: `supabase/functions/elvanto-sync-worker/index.ts` — Deno, `serve()`, `SUPABASE_SERVICE_ROLE_KEY` env, service-role client, CORS headers, `config.toml` Edge Runtime v2

## Existing People Email Infrastructure (confirmed)

- `src/core/lib/email.ts` — stub contract: `EmailRecipient`, `SendEmailInput` (to/subject/body/from), `SendEmailResult` (messageId, acceptedCount); `sendEmail()` throws "not yet configured"
- `src/modules/people/lib/email.ts` — full adapter:
  - `getEmailRecipients(listId)` — resolves saved-list conditions → queries people → returns distinct EmailRecipient[] (dedupes by lowercase email)
  - `sendPeopleEmail(recipients, subject, body)` — validates → calls `sendEmail` → `logEmailActivity()` writes one `people_audit` row per recipient
  - `canChat(person)` — returns false for child, true if email or mobile present
- `src/modules/people/components/SendEmailDialog.tsx` — basic Dialog with subject Input + body Textarea + send/close; NOT named per naming convention (should be `dialogSendEmail.tsx`)
- `src/modules/people/pages/Dashboard/SavedListSidebar.tsx` — calls `getEmailRecipients(listId)` for email action
- `src/modules/people/pages/PersonProfile/Header.tsx` — exposes Email action on person profile
- `src/modules/people/lib/types.ts` — `Person = Tables<'people'>`; no consent fields yet

---

## Open Gaps and Risks

- Confirm the exact Supabase Edge Runtime behavior for `npm:nodemailer@9.1.1`, including import syntax, TLS, and outbound port `465`.
- Confirm Google Workspace app-password and DNS requirements before production testing.
- Define and test RLS policies for templates, sends, recipients, aliases, and suppression; application role checks are not a substitute for database policy.
- Resolve whether per-user sender aliases come from a new `email_sender_aliases` table or another existing identity source. A dedicated table is the safer design because `people.email` is a recipient field.
- Define retry semantics for failed recipients and whether a separate processor invocation is required; the MVP can process the queue synchronously inside `email-send` while retaining durable queued/failed rows.
- Define the exact audience condition subset supported from `saved_lists.conditions`; core email must not silently accept unsupported query shapes.
- Add HTML sanitization and data escaping before storing or sending template output. No sanitizer dependency currently exists (`sanitize-html` to be installed in Batch 1).
- Decide whether the hand-maintained database type file remains the source of truth or is regenerated after migration; do not mix generated and manual types without a documented convention.
- Existing broad `platform_settings` write policies are a security risk. Email settings must use Super Admin gating plus server-side validation, and a later core security cleanup should tighten those policies.
- GrapesJS React 19 compatibility: `@grapesjs/react@2.0.0` is the official wrapper supporting React 18/19; verify in Batch 7.
