# Decision: Email Module — Send-Only Composer + Drag-Drop Editor

## Aliases
- Email = foundation module under `src/modules/email`
- Composer = email creation UI (editor + audience + from + send), embeddable via public index
- GrapesJS = BSD-3 drag-drop block editor (`grapesjs-preset-newsletter`)
- Block = draggable editor component (text/image/button/spacer/columns/custom-data)
- Data block = block fed by another module (cal. upcoming events) — edit-time snapshot
- Snapshot = rendered HTML captured at template save (rendered at edit, not send)
- Suppression = `email_unsubscribes` table (excluded from every send)
- broadcasts = consent "Church news and updates" (church-wide/program/ministry/newsletter)
- team_updates = consent "Team updates" (small groups, calendars, journey tracks)
- SMTP = Google Workspace outbound (smtp.gmail.com) via Supabase Edge Fn
- Edge Fn = Supabase Edge Function (Deno) — server-side send queue processor
- Sender = global SMTP account (superadmin-configured); per-user alias From override

## What & Why
Send-only email: compose branded emails with a drag-drop block editor, send to people in the DB. No inbox. Foundation module so others (groups, calendar, services) embed "email these people". Blocks extensible — other modules contribute data blocks (edit-time snapshot). Sent via Google Workspace SMTP from a Supabase Edge Function.

## Who
Admins/staff/team leads compose; recipients = DB people (journey track, demos, tags, households, groups); sender = global account with per-user alias.

## Constraints
- Foundation module: always-on like people; others import email public index via declared manifest deps
- No server bundle in client SPA → all sending via Edge Fn (Deno + nodemailer)
- Free tier + RLS on all tables; module-local migrations
- PWA offline read-only → composer/editor online-only; drafts persisted in DB
- Volume <50/day typ.; ~200–300 monthly/fortnightly broadcast (< Workspace 2,000/day cap)
- Consent flags in PEOPLE module following `consent_status` Blank|Yes|No
- AU Spam Act 2003: consent gate, sender ID, functional unsubscribe, suppression list
- Secrets (SMTP app pw) via env vars, not DB settings
- UI via core/ui barrel + Park UI recipes; GrapesJS module-local dep (not DS)

## Non-Goals
No inbox/read/reply/threading · no open/click dashboards (deferred) · no marketing automation/drip/A-B/list mgmt · no send-time server-side binding (future) · no multi-tenancy · no offline editing/write queue

## Assumptions
- Church Workspace SPF/DKIM/DMARC present or arrangeable (verify at build)
- Dedicated Workspace account + App Password provisioned for sends
- Per-user "send-as" aliases on same Workspace domain (external From ⇒ "on behalf of")
- Recipients from people-preferred email channel (single source)
- `broadcasts`/`team_updates` default Blank; sending gated on consent
- Unsubscribe = auto-footer link + suppression table + PWA one-click page
- Roles = admins + assigned managers (assignable permission)

## Decision Log: decision → Rationale (hierarchical; parent = decision, sub = dependent)
1 Module placement & embedding → foundation keeps email always-on and embeddable anywhere
    1.1 Email = foundation module under src/modules/email → embeddable by all modules; people-style foundation
2 Editor choice → drag-drop authoring with faithful, portable rendering
    2.1 Use GrapesJS (BSD-3) drag-drop editor → block manager + plugin/block system + newsletter preset + white-label; JSON storage
    2.2 Dynamic data blocks = edit-time snapshot (HTML saved with template) → simplest MVP; send-time binding = future upgrade
3 Transport & sending → reliable low-volume outbound via owned domain
    3.1 Send via Google Workspace SMTP (smtp.gmail.com) from Edge Fn → church's own domain; fits <500/day; no per-email cost
    3.2 Sender = global account (superadmin-configured) + per-user alias From override → consistent brand + personal touch
4 Recipient targeting & consent → segmented audiences gated on shared consent
    4.1 Consent flags in people module: broadcasts + team_updates → shared consent source for all modules
        4.1.1 broadcasts = "Church news and updates" → universal label for church-wide/program/ministry/newsletter
        4.1.2 team_updates = "Team updates" → small groups, calendars, journey-track notifications
5 Deliverability & compliance → lawful, trusted mail
    5.1 Enforce unsubscribe + suppression + consent gate now → AU Spam Act compliance from day one
6 Product scope → usable, verifiable MVP without inbox complexity
    6.1 MVP scope = reusable templates + send history/status → observable + repeatable without inbox
7 Persistence & queuing → durable records with safe asynchronous dispatch
    7.1 Store GrapesJS JSON + rendered snapshot HTML in Supabase → edit fidelity + send-time HTML ready
    7.2 Queue sends via Postgres email_sends/email_recipients + Edge Fn processor → async, RLS-safe, per-recipient status
    7.3 Composer online-only (PWA read-only) → RLS-safe writes; no offline queue
    7.4 Send status = queued/sent/failed only → SMTP has no open/click; tracking deferred

## Decision Gap Log
1 Sending roles: admins-only vs assignable manager permission → open
2 Segment builder scope (simple filters vs full query builder) → open
3 Unsubscribe UX (footer format, PWA page, suppression granularity) → open
4 Preferred email-channel selection from people contacts → open
5 Consent-flag demo gating (children via guardians) → open
6 SMTP secret storage + alias verification mechanics → open
7 GrapesJS theming (light/dark) vs Park UI recipe surface → open
8 Data-block extension-point contract (registry shape, snapshot capture) → open
