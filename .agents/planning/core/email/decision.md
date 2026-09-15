# Decision: Core Email Utility — Send-Only Composer + Drag-Drop Editor

## Status

Planning lock confirmed 2026-08-08; architecture and compatibility review refreshed 2026-09-12. This document governs implementation planning only. No email implementation is authorized by this file.

## Aliases

- Email = always-on core utility under `src/core/email`, not `src/modules/email`
- Core Email API = `src/core/email/public.ts` plus the compatibility surface in `src/core/lib/email.ts`
- Composer = email creation UI (editor + audience + sender + send)
- GrapesJS = drag-and-drop editor (`grapesjs` + `grapesjs-preset-newsletter`)
- Block = editor component such as text, image, button, spacer, columns, or a module-provided data block
- Data block = block populated by another module and captured as an edit-time HTML snapshot
- Snapshot = rendered HTML stored with a template; no send-time data binding in the MVP
- Suppression = `email_unsubscribes` table; suppressed addresses are excluded from every send
- broadcasts = consent "Church news and updates" for church-wide, program, ministry, and newsletter mail
- team_updates = consent "Team updates" for small groups, calendars, and journey-track mail
- SMTP = Google Workspace outbound via a Supabase Edge Function
- Edge Fn = Supabase Edge Function (Deno) that owns SMTP credentials and queue processing
- Sender = global SMTP account configured by a Super Admin, with same-domain per-user alias override

## What & Why

Build a send-only email capability for church staff to compose branded messages, select people from existing saved lists or a person profile, and send through Google Workspace SMTP. The capability is a core utility so every module can consume one typed API without creating a new module dependency. The MVP includes reusable templates, a GrapesJS block editor, audience selection, send history/status, consent and suppression enforcement, and a public one-click unsubscribe page.

## Who

- Senders: Admin, Super Admin, and Team Leader operators.
- Template/settings managers: Admin and Super Admin; SMTP settings are Super Admin-only.
- Recipients: people stored in the People data model, using `people.email` as the MVP source of truth.
- Consumers: People and future Groups, Calendar, Services, and Journey surfaces through `src/core/email/public.ts`.

## Constraints

- Core utility placement: `src/core/email`; do not create `src/modules/email`.
- Mirror the module contract where useful: `manifest.ts`, `public.ts`, `routes.tsx`, `index.tsx`, `pages/`, `components/`, `lib/`, and `settings.ts`.
- Core router ownership remains in `src/core/router.tsx`; email routes are thin children and public unsubscribe routes remain outside `AppShell`.
- UI imports come only from `src/core/ui`; module-local recipes are allowed for email-specific editor chrome.
- Template HTML is sanitized before storage and send. Use `sanitize-html@2.17.7` after a Deno/browser compatibility check; if Deno cannot import it, use a small allowlist sanitizer with identical tests.
- No SMTP credentials or service-role keys in the client, database settings, logs, or source code.
- Supabase Edge Function uses Deno and pins `npm:nodemailer@9.1.1`; Google Workspace SMTP uses port 465 for the MVP.
- GrapesJS uses `^0.22.5` (resolved 0.22.16) because `@grapesjs/react@2.0.0` declares `grapesjs@^0.22.5`; 0.23.x is outside that peer range.
- All email tables use RLS. The Edge Function uses a service-role client only for server-side queue writes and SMTP processing.
- Send history is durable: `email_sends` and `email_recipients` record queued/sent/failed/suppressed/skipped outcomes.
- Templates store GrapesJS JSON plus rendered snapshot HTML. Data blocks are edit-time snapshots.
- Audience selection is saved-list, explicit-person, or registered preset based. No arbitrary query builder.
- Consent fields live in the People model: `consent_broadcasts` and `consent_team_updates`, using the existing `yes_no` domain with Blank represented by null.
- Youth/child consent is admin-managed. A parent-facing consent flow is out of scope.
- AU Spam Act requirements are enforced at send time: consent gate, sender identity, functional unsubscribe, and suppression exclusion.
- PWA remains read-only offline; composer/editor and send operations are online-only.
- Expected volume is low (<50/day typical; 200–300 per periodic broadcast), within the planned Workspace limits.

## Non-Goals

- No inbox, replies, threading, open tracking, click tracking, or analytics.
- No marketing automation, drip campaigns, A/B tests, or arbitrary segment query builder.
- No send-time server-side data binding; future dynamic blocks may add it.
- No multi-tenancy, offline write queue, or native app wrapper.
- No parent-facing consent-management flow.
- No direct client SMTP/provider credentials.
- No migration of the stale `src/modules/email` concept.

## Assumptions

- A dedicated Google Workspace account and app password can be provisioned. ⚠️ Verify before deployment.
- Workspace SPF, DKIM, and DMARC are configured or can be arranged. ⚠️ Verify before production send.
- Same-domain per-user aliases are configured in Workspace; the Edge Function rejects external alias domains.
- `people.email` is the MVP preferred email source because `contact_channels` is designed but not migrated.
- Consent defaults to Blank/null; a send is rejected or skips recipients unless the relevant consent is Yes.
- The Edge Function can import npm dependencies and reach SMTP port 465. ⚠️ Verify in local and hosted runtime.
- Existing hand-maintained `src/core/lib/database.types.ts` is updated alongside the migration.

## Decision Log

| # | Decision | Rationale |
|---|---|---|
| 1 | Place the capability in `src/core/email` and expose `public.ts` | Makes email an always-on typed utility without a stale feature-module directory. |
| 1.1 | Keep `src/core/lib/email.ts` as a compatibility wrapper | Existing People code imports this path; preserving it avoids a breaking migration. |
| 1.2 | Add thin authenticated and public route slices | `src/core/router.tsx` remains the only router assembly point; unsubscribe stays outside the shell. |
| 2 | Use GrapesJS with the newsletter preset and `@grapesjs/react` v2 | Provides drag-and-drop blocks, portable HTML/CSS, React 19 compatibility, and an extension surface. |
| 2.1 | Store editor JSON and rendered snapshot HTML | Preserves edit fidelity and avoids send-time module coupling. |
| 2.2 | Use a typed block registry with built-ins and future module registrations | Lets other modules contribute data blocks without importing email internals. |
| 3 | Send through a Supabase Edge Function using Google Workspace SMTP | Keeps secrets server-side and fits the existing Supabase architecture. |
| 3.1 | Use port 465 and `secure: true` for the MVP | Avoids commonly blocked SMTP ports and matches Workspace relay guidance. |
| 3.2 | Use a global sender plus same-domain alias override | Provides consistent branding and a personal sender without accepting arbitrary From addresses. |
| 4 | Persist templates, sends, recipients, and suppression in PostgreSQL | Provides durable history, retryable status, and auditable recipient outcomes. |
| 4.1 | Edge Function validates authorization and applies consent/suppression before SMTP | Database permissions alone cannot safely enforce every send-time rule. |
| 5 | Use People consent fields `consent_broadcasts` and `consent_team_updates` | Gives all modules one shared consent source. |
| 5.1 | Use `people.email` for the MVP | Avoids depending on the unimplemented `contact_channels` table. |
| 5.2 | Use saved lists, explicit people, and registered presets only | Supports useful targeting without building a query language. |
| 6 | Provide a public one-click unsubscribe route with an opaque token hash | Prevents email addresses from being exposed in unsubscribe URLs and creates a durable suppression record. |
| 7 | Role surface: Team Leaders may send within their visible audience; Admins manage templates; Super Admins manage sender settings | Matches the locked UX roles while keeping settings and broad access restricted. |
| 8 | Store non-secret email settings in `platform_settings`; store SMTP credentials only in Edge Function environment variables | Follows existing settings architecture and prevents secret leakage. |
| 9 | Use Park UI chrome and a light-only editor | Keeps the feature consistent with the existing design system and avoids dark-theme editor work in the MVP. |
| 10 | Test pure logic with Vitest and Edge Function behavior with Deno tests; run Supabase migration checks separately | Matches the repository's current test and backend tooling. |

## Decision Gap Log

- Resolved: placement, editor, transport, sender model, audience scope, consent fields, unsubscribe UX, roles, settings ownership, and data-block contract.
- Verify during implementation: Deno/npm import behavior for `nodemailer@^9`, hosted reachability of SMTP port 465, Workspace app-password requirements, and production SPF/DKIM/DMARC.
- Track separately: full `contact_channels` migration, send-time dynamic data blocks, granular unsubscribe categories, open/click analytics, and parent-facing consent management.
