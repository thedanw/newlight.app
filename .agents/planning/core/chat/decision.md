# Chat Module — Opt-in Messaging

## Summary
Opt-in chat (1:1 DM, group, broadcast) for church CRM PWA. Users must accept toggle before receiving messages. Team leaders send ask-to-accept via in-app + email. Enables push notifications, unread badges, read receipts.

## Key Terms
- **Opt-in**: toggle + push permission granted; user must enable before messaging
- **Ask-to-accept**: team-leader nudge to enable chat (in-app + email)
- **Broadcast**: one-way announcement; replies route to sender DM
- **Web Push**: Push API + Notifications API + SW (VAPID); no native APNs/FCM
- **Guardrail**: block adult↔under-18 1:1 DMs via people-module DOB

## Constraints
PWA-only; Supabase free tier (500MB); RLS + Realtime; offline read-only; opt-in gating; email fallback (no SMS); roles = team-leader ↔ member + admin broadcast

## Non-Goals
Native app/APNs-FCM push; typing indicators; full moderation toolkit; offline send/write queue; broadcast reply threads

## Decision Log: decision → Rationale (hierarchical; parent = decision, sub = dependent)
1 Feature Scope: 1:1 + group + broadcast chats → covers direct, team, all-church comms
   1.1 Team-leader ↔ member (+admin) only → matches platform role hierarchy
   1.2 Group creation by leaders + admins from roster → self-service team comms
2 Opt-in Gating: explicit toggle required before messaging → consent-first; no unsolicited contact
   2.1 Ask-to-accept via in-app + email → push needs prior permission (chicken-egg); SMS skipped
   2.2 Broadcast = team-leader→team + admin→all opted-in → reach without noise
   2.3 Route broadcast replies to sender DM → keeps announcements clean, no thread complexity
3 Notifications: popup + web push + unread badge + read receipts → chat-app parity
   3.1 PWA-only; no native build needed → web push sufficient for device/browser
4 Safety & Retention: auto-purge after 1 year → free-tier storage + privacy
   4.1 Block adult↔under-18 1:1 DMs via people DOB → child-safety guardrail
5 Infrastructure: Supabase-native (Postgres+RLS, Realtime, Edge Fn) → reuses stack, free, RLS-consistent
   5.1 Per-recipient delivery receipts (message_deliveries) → sender sees Pending/Delivered/Read per member
   5.2 Mark delivered via client view + SW ping-back + reconnect catch-up → self-correcting status
   5.3 Re-push undelivered via cron at 1h/3h/8h/24h → bounded retry for prolonged offline

## Findings
- Web Push: VAPID-signed POST; no native SDK; free (FCM/Autopush/Apple); Supabase has no built-in → Edge Fn
- iOS: 16.4+ AND Home-Screen install required; Android/desktop: push works from non-installed PWA
- Permission: user-gesture required; per-site revocable; payload encrypted but body visible to push service
- Verify: free-tier Realtime concurrency; VAPID key mgmt; iOS 16.4+ coverage; re-prompt after decline

## Decision Gap Log
1 Multi-device push subscription management → open
2 Team-leader role derivation from existing modules → open
3 Retention purge scheduling (cron/edge fn) → open
4 Toggle-off behavior details (retain vs hide; re-enable flow) → open
5 Email fallback sender/template reuse → open
