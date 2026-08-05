# Findings: Chat Module — Opt-in Messaging + Notifications

## Goal context
Add a chat module to the church CRM PWA. Messaging is opt-in gated: a user can only be messaged once they have accepted the chat/notifications feature in the app installed on their phone. A team leader can send a notification asking the user to accept chat notifications. Once enabled, browser + device notifications and in-app popups behave like any chat app. Brainstorm session per `01_brainstorming` skill; decisions logged in `chat/decision.md`.

## Existing platform context (from core decision.md)
- #34 Ship PWA only for MVP; native wrappers (Capacitor/TWA/Tauri) future option — **there is no native app; "app on phone" = installed PWA**
- #32 PWA via @vite-pwa/sveltekit + Workbox — service worker already present
- #15/#27 Realtime used for UI-critical settings; #6 detail tabs + event bus deferred
- #11 RLS on all tables via auth.uid()
- #25 5-level platform roles (public → super_admin)
- #12 Self-contained modules in src/modules/* + core in src/core/*
- #33 Offline read-only; edits require online
- #53 touchSMS SMS gateway (5c/SMS) — potential fallback channel for opt-in nudges
- Supabase: PostgreSQL + Auth + Realtime + Storage + Edge Fns (free tier: 500MB DB, 2GB bandwidth, 50MB storage)

## Web Push / device notifications (verified facts)
- Web Push = Push API + Notifications API + Service Worker; server sends push to a stored subscription endpoint (VAPID-signed POST). No native APNs/FCM SDK needed for a PWA.
- **Android Chrome/Edge**: web push works from installed or non-installed PWA.
- **iOS Safari**: web push requires iOS 16.4+ AND the PWA added to Home Screen — aligns with "app installed on their phone".
- Desktop: Chrome/Edge/Firefox/Safari all support web push from a visited site.
- Notification permission must be granted via a **user gesture**; cannot be silently requested. Permission is per-site, revocable.
- Payload is end-to-end encrypted to the subscription public key; message body (incl. count/title) is unencrypted and visible to the push service.
- Push services are free (FCM for Chrome/Android, Mozilla Autopush for Firefox, Apple for Safari). No paid tier needed at church scale.
- Supabase has **no built-in web push** — send via Edge Function (VAPID sign + POST to subscription endpoint) or a third-party (OneSignal/UPush). For solo dev + free tier, a small Edge Function is the lean path.
- Supabase Realtime: free tier has concurrency/message limits (verify at build). Use postgres_changes or broadcast for live chat.

## Known constraints / tensions to resolve in brainstorm
- **Chicken-and-egg**: web push needs prior permission — a user who hasn't opted in cannot receive a push "ask to accept". Need an alternative nudge: in-app notification, email, or SMS (touchSMS).
- iOS: cannot prompt for push until the PWA is installed to Home Screen; notification permission prompt is gated.
- RLS + privacy: chat content is sensitive; messages must be RLS-scoped; consider child-safety rules (church context) — no unsupervised minor-adult DMs (people module handles WWCC data).
- Offline: read-only per #33 — chat offline behavior must be scoped (view cached messages; send requires online).
- Data growth/retention: message tables grow; free tier 500MB — need retention/pruning policy.
- Cost: push services free; Realtime/SMS minor.

## Open items to verify later (at build time)
- Supabase free-tier Realtime message/concurrency limits for chat scale
- Exact VAPID/key management + Edge Function hosting constraints on CF Pages (functions vs Supabase Edge Fns)
- iOS 16.4+ Home Screen install requirement coverage among church users
- Whether Web Push permission re-prompt is needed for users who declined
