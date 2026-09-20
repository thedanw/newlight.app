**Guardrail:** every item that changes a policy, grant or bucket rule ships as a new idempotent
migration (repo convention) and is re-verified with the anon key. The "lab has no auth — tighten
these when auth lands" preamble in the 2026-08 migrations must not be reintroduced.

### Resolution log (2026-09-20 — applied to the live project)

Evidence per item, from `scripts/security/smoke-anon.ps1` (GREEN, 0/11) and `pg_policies` state:

- **0.1 ✅** `email-send`/`elvanto-sync-worker` anon probes → 401/403; functions hold `getUser`/`assertCanSend` gates.
- **0.2 ✅** anon `INSERT platform_settings` → 42501/403; `elvanto_settings`/`plugins` reads → 403; brand-assets anon writes dropped (`20260919100000`, `20260919100100` applied).
- **0.3 / 0.6 / 0.7 ✅** C5/H2/H7 closed: anon SELECT revoked on `people`, `addresses`, `households`, `people_relationships`, `people_tags` (`20260919100200`); `people_public` = public-flagged rows only, safe columns; `search_people` EXECUTE = authenticated only. Anon probes → 403.
- **1.6 / 1.7 ✅ (REQ-2)** `20260919110100` applied: `is_super_admin()` definer live; settings family = super-admin writes, `elvanto_settings` super-admin-only, `plugins` super-admin-only, anon left with the single `app-settings` branding read; `user_roles` anon revoked; `RequireSuperAdmin` guard on `/settings/*` + conditional sidebar tile shipped with 13 passing Vitest tests. Account/profile link set for daniel@newlight.au.
- **1.1 / 1.2 ⏳ deferred** — live DB lacks the email-system tables (`20260913000000` unapplied); `20260919110000` awaits it.
- **0.4 / 0.5 ⏳ ops pending** — secret rotation + `verify_jwt` confirmation still to be recorded.