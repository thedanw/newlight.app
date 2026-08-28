# Decision: Email Module — Send-Only Composer + Drag-Drop Editor

## Aliases
- Email = foundation module under `src/modules/email` (always-on; exposes public API for other modules)
- Composer = email creation UI (editor + audience + from + send), embeddable from other modules via public index
- GrapesJS = BSD-3 drag-drop block editor framework (editor engine; `grapesjs-preset-newsletter`)
- Block = draggable editor component (text, image, button, spacer, columns, custom/data blocks)
- Data block = block populated by another module (e.g. calendar "upcoming events") — edit-time snapshot
- Snapshot = rendered HTML captured at template save (dynamic data rendered at edit time, not send time)
- Suppression = `email_unsubscribes` table (global; excluded from every send)
- broadcasts = consent flag "Church news and updates" (church-wide / program / ministry / newsletter)
- team_updates = consent flag "Team updates" (small groups, calendars, journey tracks)
- SMTP = Google Workspace outbound (smtp.gmail.com) via Supabase Edge Fn
- Edge Fn = Supabase Edge Function (Deno) — server-side send queue processor
- Sender = global SMTP account (superadmin-configured in settings); per-user alias From override

## What & Why
Send-only email for the CRM: compose branded emails with a drag-drop block editor and send to people in the church database. No inbox. Foundation module so other modules (groups, calendar, services) can embed "email these people". The editor's block set is extensible — other modules contribute data blocks (edit-time snapshot). Send via Google Workspace SMTP from a Supabase Edge Function.

## Who
Church admins/staff/team leaders composing; recipients = people in the DB (segmented by journey track, demographic, tags, households, groups); sender = global account with per-user alias option.

## Constraints
- Foundation module pattern (core #13): email always-on like people; others import email public index via declared manifest deps (module-design #1-9)
- No server bundle in client SPA (core #44) → all sending via Supabase Edge Fn (Deno + nodemailer)
- Supabase free tier + RLS on all tables (core #5/#11); module-local migrations (core #46)
- PWA offline read-only (core #33) → composer/editor online-only; drafts persisted in DB
- SMTP volume: <50/day typical; ~200–300 monthly/fortnightly broadcast — within Workspace 2,000/day ceiling
- Consent flags live in PEOPLE module (shared foundation, core #13) following `consent_status` Blank|Yes|No pattern (people decision/peopleFields.md)
- AU Spam Act 2003: consent gate, sender identification, functional unsubscribe, suppression list
- Secrets (SMTP app password) via env vars, not DB settings (core #18/#23)
- UI via core/ui barrel + Park UI recipes (ui-ux decision); GrapesJS is a module-local dependency (not DS)

## Non-Goals
- No inbox / read / reply / threading
- No open/click tracking dashboards (SMTP has none; deferred)
- No marketing automation / drip sequences / A/B testing / list management
- No send-time server-side data binding (edit-time snapshot only; future upgrade path)
- No multi-tenancy
- No offline editing / write queue

## Assumptions
- Church Workspace domain SPF/DKIM/DMARC present or arrangeable (verify at build)
- A dedicated Workspace account + App Password is provisioned by the church admin for sends
- Per-user "send as" aliases must be on the same Workspace domain (Google appends "on behalf of" for external From)
- Recipients sourced from people-module preferred email channel (contact channels single source)
- `broadcasts` / `team_updates` default Blank; sending gated on consent (Blank/No = excluded)
- Unsubscribe = auto-appended footer link + suppression table + PWA one-click page
- Sending roles = admins + designated managers via assignable permission (open detail)

## Decision Log: decision → Rationale
1 Email = foundation module under src/modules/email → embeddable by all modules; people-style foundation (core #13)
2 Use GrapesJS (BSD-3) drag-drop editor → block manager + plugin/block system + newsletter preset + white-label; JSON storage
3 Send via Google Workspace SMTP (smtp.gmail.com) from Edge Fn → church's own domain; fits <500/day volume; no per-email cost
4 Sender = global account configured by superadmin in settings; per-user alias From override → consistent brand + personal touch
5 Dynamic data blocks = edit-time snapshot (HTML saved with template) → simplest MVP; send-time binding = future upgrade
6 MVP scope = reusable templates + send history/status → observable + repeatable without inbox
7 Enforce unsubscribe + suppression + consent gate now → AU Spam Act compliance from day one
8 Consent flags in people module: broadcasts + team_updates → shared consent source for all modules (core #13)
9 broadcasts = "Church news and updates" → universal label for church-wide/program/ministry/newsletter sends
10 team_updates = "Team updates" → small groups, calendars, journey-track notifications
11 Store GrapesJS JSON + rendered snapshot HTML in Supabase → edit fidelity + send-time HTML ready
12 Queue sends via Postgres email_sends/email_recipients + Edge Fn processor → async, RLS-safe, per-recipient status
13 Composer online-only (PWA read-only) → RLS-safe writes; no offline queue (core #33)
14 Send status = queued/sent/failed only → SMTP has no open/click; tracking deferred

## Decision Gap Log
1 Sending roles: admins-only vs assignable manager permission → open
2 Recipient segment builder scope (simple filters vs full query builder) → open
3 Unsubscribe UX details (footer format, PWA page, suppression granularity) → open
4 Preferred email channel selection from people contact channels → open
5 Consent-flag demographic gating (adult/youth; children via guardians) → open
6 SMTP secret storage + per-user alias verification mechanics → open
7 GrapesJS editor theming (light/dark) vs Park UI recipe surface → open
8 Data-block extension point contract (registry shape, snapshot capture) → open
