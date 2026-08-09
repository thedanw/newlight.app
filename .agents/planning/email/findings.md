# Findings: Email Component Research (verified 2026-08-07)

## Context from existing decisions
- Stack: Vite + React + React Router SPA on CF Pages; Panda CSS + Park UI (src/core/ui); TypeScript strict; pnpm (core #1-4, ui-ux)
- Backend: Supabase free tier (Postgres + Auth + Realtime + Edge Fns + Storage); RLS on all tables (core #5, #11); no API layer — direct DB + shared TS types (core #19)
- Module system: compile-time modules in src/modules/*, typed manifest + public index API, thin routes.tsx glue into single router, disable-only lifecycle, scaffold-writes-registry (module-design #1-9, core #12/#40/#43/#44/#48)
- People module = always-on foundation; contact channels first-class (phone_type, email) + consents (school_email_permission, consent_status); other modules import its API (core #13, people #34-35)
- PWA offline READ-ONLY (core #33); editing requires online. Realtime used for UI-critical settings (core #27)
- Settings: per-module settings in module_config/tables/platform_settings; env vars for CI/staging secrets only (core #18/#20/#21/#23)
- Supabase Auth sends emails via built-in branded templates (core #37) — separate from this feature (auth emails, not CRM outreach)

## Editor candidates (drag-drop modular editor)
- **GrapesJS** (BSD-3-clause, open source) — 26.1k★, v0.23.4, active. Web-builder framework with built-in **Block Manager** (drag blocks from panel to canvas), Style Manager, Layer Manager, Asset Manager, storage manager, code viewer. Custom components/blocks + **plugin system** (modules can register blocks/plugins). Newsletter/email presets: `grapesjs-preset-newsletter`, `grapesjs-mjml` (MJML components). Outputs JSON; exports HTML/CSS. `@grapesjs/react` wrapper for declarative React UI. Can render components to HTML server-side (Node/Deno-compatible) → send-time rendering possible. Framework-agnostic (vanilla core; integrates via ref). White-labellable (BSD). NOTE: the paid "Grapes Studio SDK" is a separate commercial product — NOT needed; core framework is free/BSD.
- **Craft.js** (MIT) — 8.7k★. React framework for drag-drop page editors. Custom blocks = plain React components (useNode/useEditor) → easy module-contributed blocks. Serializable JSON state. BUT: ships NO editor UI (build everything yourself), no email-output tooling, no table-layout/inline-CSS handling for email clients, less active (last release ~1yr). GrapesJS is cited as its inspiration.
- **React Email** (MIT) — 19.6k★, very active. Unstyled React email components (Html/Head/Button/Container/Column/Row/Section/Text/Link/Image/Preview) that render to email-safe HTML; handles Gmail/Outlook/Yahoo quirks + dark mode. Its Editor is **TipTap + ProseMirror prose editing** (NOT drag-drop blocks). Integrations: Resend, Nodemailer, SendGrid, Mailgun, Postmark, SES, etc. Best role here = render/send layer or hand-authored system emails, not the drag-drop builder.
- **MJML** (MIT) — email framework language (XML → HTML) used by GrapesJS `grapesjs-mjml` preset. Output format option, not a builder itself.
- Rejected for MVP: Unlayer/Stripo/Bee (proprietary, white-label paid); Mosaico (aged, unmaintained).

## Send providers (free tier, white-label, AU-friendly)
- **Resend** — Free: 3,000 emails/mo, capped 100/day, 1 domain, 30-day retention. Pro $20/mo → 50k, no daily cap. All plans: REST API + SMTP relay + official SDKs + batch send + **open/click tracking** + React Email + DKIM/SPF/DMARC + webhooks + inbound. Bring-your-own-domain (fully white-label). Works from Supabase Edge Functions (Deno) via REST/SDK. Strongest fit.
- **AWS SES** — No permanent free tier anymore: pay-as-you-go $0.10–0.16/1k (Essentials plan / à-la-carte); new accounts get $200 credit (6-mo free plan). Requires AWS account + IAM + region (ap-southeast-2 Sydney). Cheapest at scale; more setup/ops. No open/click tracking built-in (SNS + config).
- **Mailgun** — free trial 100/day for 3 months then paid. **Mailjet** — free 200/day, 6k/mo. **Brevo (Sendinblue)** — free 300/day, 9k/mo. **Postmark** — 25k one-time trial then paid. All viable but smaller/restricted free tiers.
- Supabase-native auth email (Resend integration) exists for Auth; this feature uses a provider API from Edge Fn, independent of auth templates.

## Architecture constraints (from module-design/core)
- No server bundle in client SPA → all sending server-side via Supabase Edge Function (Deno) calling provider API; queue/status in Postgres tables (RLS) — mirrors chat module pattern (#12 chat: Postgres tables + Edge Fn web push)
- Email as an embeddable capability: other modules (groups, calendar, services) want "email these people" → email module exposes public index API (composer component + send function), imported via declared manifest deps
- Dynamic blocks populated by other modules (e.g. upcoming events): needs a block/data-source extension point; server-side render at send time (Edge Fn queries source module's data) vs edit-time snapshot
- Recipients come from people module (single source of truth for contact channels/emails + consents); audience = people queries (journey stage, demographic, tags, households, groups)
- AU compliance: Spam Act 2003 (consent, sender ID, functional unsubscribe, suppression list) — tie to people consents (e.g. school_email_permission, consent_status) + global email_unsubscribes
- Settings: sender identity, domain/DKIM status, default footer, daily/monthly caps, provider key (secret → env, core #18/#23)

## Confirmed (Understanding Lock 2026-08-08)
- Placement: email = FOUNDATION module `src/modules/email` (always-on, like people; public API for other modules)
- Editor: **GrapesJS** (BSD-3) — drag-drop Block Manager + plugin/block system + `grapesjs-preset-newsletter`; JSON storage
- Send: **Google Workspace SMTP** (smtp.gmail.com) via Supabase Edge Fn (Deno + nodemailer); volume <50/day, ~200-300 broadcast (within 2,000/day ceiling)
- Sender: global account (superadmin-configured) + per-user alias From override (same-domain aliases only)
- Data blocks: **edit-time snapshot** (HTML saved with template); send-time server binding = future upgrade
- MVP scope: reusable templates + send history/status (queued/sent/failed only — no open/click on SMTP)
- Compliance: unsubscribe + suppression + consent gate NOW (AU Spam Act 2003)
- Consent flags in PEOPLE module (shared foundation, core #13): `broadcasts` = "Church news and updates" (church-wide/program/ministry/newsletter); `team_updates` = "Team updates" (small groups, calendars, journey tracks); both follow `consent_status` Blank|Yes|No

## Open gaps (Decision Gap Log — see decision.md)
Sending roles · recipient segment builder scope · unsubscribe UX details · preferred email channel selection · consent demographic gating · SMTP secret + alias verification · GrapesJS theming · data-block extension point contract
