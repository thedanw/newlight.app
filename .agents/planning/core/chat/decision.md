# Decision: Chat Module — Opt-in Messaging + Notifications

## Aliases
- Chat = opt-in messaging module (1:1 DM, group, broadcast)
- Opt-in = user explicitly enables chat + notifications before others can message them
- Ask-to-accept = team-leader nudge requesting a user enable chat notifications (in-app + email)
- Broadcast = one-way announcement (team or all-church); replies route to sender's DM
- Web Push = Push API + Notifications API + Service Worker (VAPID) — no native APNs/FCM
- PWA = installed web app on phone (iOS 16.4+ requires Home Screen install for push)
- Guardrail = block adult↔under-18 1:1 DMs (people-module DOB)

## What & Why
Opt-in chat for the church CRM PWA: 1:1 DMs, group chats, and one-way broadcasts, gated so a user can only be messaged once they've accepted the feature in the app. Team leaders can send an ask-to-accept (in-app + email) request. Once enabled, users get in-app popups, web-push device/browser notifications, unread badges, and read receipts — familiar chat-app behavior.

## Who
Team leaders ↔ their team members; admins broadcast to all opted-in users. All existing invite-only accounts (core #9).

## Constraints
- PWA-only (core #34); web push needs PWA install on phone (iOS: Home Screen + 16.4+)
- Supabase free tier (500MB DB); RLS everywhere (core #11); Realtime already used (#15/#27)
- Offline read-only (core #33); no offline message sending
- Opt-in gating: no messaging a non-opted-in user
- Ask-to-accept: in-app request + email fallback (no SMS)
- Guardrail: block adult↔under-18 1:1 DMs via people-module DOB
- Retention: auto-purge messages after 1 year
- Roles: team leader↔member hierarchy; broadcast = team-leader→team + admin→all opted-in

## Non-Goals
- No native app / APNs-FCM push (PWA web push only)
- No typing indicators
- No SMS nudge (email fallback instead)
- No full moderation toolkit (report/block/admin view) — guardrails only
- No offline message send / write queue
- No broadcast reply threads — replies route to sender's DM

## Assumptions
- Opt-in = chat toggle enabled AND web-push permission granted (device-dependent)
- Email fallback uses Supabase branded auth email templates
- Minor = under 18 per people-module DOB; team-leader derived from existing roles
- Broadcast recipients limited to opted-in users
- Existing conversations retained (not deleted) if a user toggles off; new notifications stop

## Decision Log: decision → Rationale
1 Scope 1:1 + group + broadcast chats → covers direct, team, and all-church comms
2 Gate messaging on explicit opt-in toggle → consent-first; no unsolicited contact
3 Restrict chat to team leader ↔ member (+admin) → hierarchy matches platform roles
4 Keep PWA-only; web push for device/browser notifications → no native build (core #34)
5 Ask-to-accept via in-app request + email fallback → push needs prior permission (chicken-egg); SMS skipped
6 Broadcast: team-leader→team + admin→all opted-in → reach without noise
7 Route broadcast replies to sender DM → keeps announcements clean, no thread complexity
8 Notify via popup + web push + unread badge + read receipts → chat-app parity; no typing indicator (YAGNI)
9 Auto-purge messages after 1 year → free-tier storage headroom + privacy hygiene
10 Block adult↔under-18 1:1 DMs via people DOB → child-safety guardrail
11 Group creation by team leaders + admins from roster → self-service team comms
12 Use Supabase-native chat: Postgres+RLS tables, Realtime postgres_changes, Edge-Fn web push → reuses stack (#11/#15/#19), free, RLS-consistent
13 Track per-recipient delivery receipts (message_deliveries) → sender sees Pending/Delivered/Read per member (reliability requirement)
14 Mark delivered via client view + SW ping-back + reconnect catch-up → self-correcting status, no server guessing
15 Re-push undelivered via cron at 1h/3h/8h/24h then give up → covers prolonged offline; bounded notification spam

## Findings (verified)
- Web Push = Push API + Notifications API + Service Worker; VAPID-signed POST to subscription endpoint; no native SDK needed
- Android/desktop: push works from non-installed PWA; iOS Safari: iOS 16.4+ AND Home-Screen install required
- Permission requires a user gesture; per-site revocable; payload E2E-encrypted but body (title/count) visible to push service
- Push services free (FCM/Autopush/Apple); Supabase has no built-in web push → Edge Fn (VAPID + POST)
- Verify at build: free-tier Realtime concurrency; VAPID key mgmt + CF-Pages vs Supabase Edge Fn; iOS 16.4+ coverage; declined-permission re-prompt

## Decision Gap Log
1 Multi-device push subscription management → open
2 Team-leader role derivation from existing modules → open
3 Retention purge scheduling (cron/edge fn) → open
4 Toggle-off behavior details (retain vs hide; re-enable flow) → open
5 Email fallback sender/template reuse → open
