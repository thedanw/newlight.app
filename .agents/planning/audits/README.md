# Audits

Security and hardening audits for `newlight.app`, produced with the
`security-and-hardening` skill (`.agents/skills/security-and-hardening/SKILL.md`).

## Conventions

- One dated file per audit: `YYYY-MM-DD-<topic>.md` (e.g. `2026-09-19-security-audit.md`).
- Every finding carries: **ID · Severity · Area · Evidence (file:line) · Impact · Fix**.
- Findings are reopened, not rewritten — a later audit supersedes an earlier one and
  links to it. Do not silently delete findings; append `→ RESOLVED in <date>-<topic>.md`.
- Severity follows the skill's triage: **Critical** (unauth data/action or credential
  exposure), **High** (authenticated/role bypass, PII exposure, consent failure, advertised
  control that does not work), **Medium** (defense-in-depth, info disclosure, DoS/cost),
  **Low** (hygiene, supply-chain reproducibility).
- "Accepted risk" must name the decision doc that accepts it and a review date.

## How to reproduce an audit

```powershell
# dependency audit against the authoritative lockfile (pnpm@10.34.5, per package.json)
pnpm audit --prod --audit-level moderate     # runtime/reachable findings
pnpm audit --audit-level low                 # includes dev-only toolchain findings

# secret scan across tracked files and history
git grep -n -I -E '(eyJhbGciOi|sk_live_|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|ghp_[A-Za-z0-9]{20,})' -- . ':!*.lock'

# anon-reachable surface (the public key ships in the bundle, so every `TO anon`
# policy is remotely reachable by anonymous callers)
Select-String -Path 'supabase\migrations\*.sql' -Pattern 'TO anon|TO public|to anon'

# build-time asset exposure (what actually ships to Cloudflare)
Get-ChildItem 'dist\content' -Recurse -File
```

## Index

| Date | Topic | File | Headline result |
|---|---|---|---|
| 2026-09-19 | Full app security audit (OWASP Top 10 + RLS + Edge Functions + supply chain) | `2026-09-19-security-audit.md` | 5 Critical, 7 High — anon-writable settings/plugin state, unauthenticated Edge Functions, anon-readable address book & family graph (C5), all-column PII of public people via base table + `search_people` RPC (H7), RLS gap on `people_public`, broken unsubscribe suppression; §9 traces the two product requirements (PII members-only, super-admin settings) and both fail |

**Remediation plan:** `2026-09-19-security-audit/plan.md` (+ `findings.md`) — implements audit §5 waves 0–2 as 13 verification-first batches on `feat/security-hardening-2026-09-19`; generated with the `02_concise-planning` skill.
