# Progress: Core Email Utility

## Summary

Planning phase — plan.md is the authoritative implementation roadmap. This file tracks execution state once implementation begins.

## Planning Status

- **decision.md**: ✅ Complete — 10 decisions locked (placement, editor, transport, sender, data model, consent, unsubscribe, roles, settings, testing)
- **findings.md**: ✅ Complete — repo state, runtime, data model, routing conventions, library research, existing people email infrastructure, core utility pattern
- **plan.md**: ✅ Complete — 12 batches across 5 phases (Foundation → Transport → Editor → Pages → Integration/Polish)

## Implementation Progress

| Batch | Status | Tasks | Commit |
|-------|--------|-------|--------|
| 1 | ⬜ pending | deps + types + scaffold | — |
| 2 | ⬜ pending | migration + DB types + Zod schemas | — |
| 3 | ⬜ pending | client/provider + compat wrapper + queries | — |
| 4 | ⬜ pending | audience + permissions + consent | — |
| 5 | ⬜ pending | email-send Edge Function | — |
| 6 | ⬜ pending | email-unsubscribe Edge Function + tokens | — |
| 7 | ⬜ pending | GrapesJS editor + blocks + renderer | — |
| 8 | ⬜ pending | composer + audience picker + template list | — |
| 9 | ⬜ pending | pages + routes + settings + public API | — |
| 10 | ⬜ pending | compat layer + people module migration | — |
| 11 | ⬜ pending | integration tests + E2E + plugin API | — |
| 12 | ⬜ pending | lint + typecheck + build + docs + archive | — |

## Errors

| Batch | Error | Resolution |
|-------|-------|-----------|
| — | — | — |

## Decisions Made During Planning

1. Re-export `EmailRecipient`/`SendEmailInput`/`SendEmailResult` from `lib/types.ts` for backward compat with `src/core/lib/email.ts`
2. Email sender alias table is `email_sender_aliases` (not derived from people.email) — people.email is a recipient field
3. Data blocks are edit-time snapshots (no send-time server-side binding) — matches decision.md §Non-Goals
4. SMTP credentials in Edge Function env vars only, not `platform_settings` — matches decision.md §3 + constraint §A.4
5. Consent fields: `consent_broadcasts` + `consent_team_updates` on `people` table using existing `yes_no` enum
6. Module number 4 (settings=0, people=1, forms=2, example=3)
7. Unsubscribe uses opaque token in URL, email stored as SHA-256 hash only
8. If Deno tests can't run locally, extract pure logic to `lib/sending.ts` and test with Vitest
9. Batch 1 dependency audit corrected GrapesJS to `^0.22.5` (resolved 0.22.16) to satisfy `@grapesjs/react@2.0.0` peer range; 0.23.6 rejected
