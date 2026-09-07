# Budget Monitoring — People Profile Refactor

## Trigger Thresholds

| Utilization | Action |
|-------------|--------|
| > 70% | Run compaction — summarize findings.md refs |
| > 80% | Emergency compaction + mask all non-critical observations |
| Quality degrading | Compact + review masking rules |
| Sub-agent results too large | Summarize before merging |

## Metrics to Track (log in `progress.md`)

| Metric | Purpose |
|--------|---------|
| Tokens per section (stable/current/history/buffer) | Budget adherence |
| Compaction events: count, before/after tokens, quality | Compaction effectiveness |
| Masking events: count, tokens saved | Observation masking effectiveness |
| Test pass/fail counts per batch | TDD validation |
| File changes per batch | Scope creep detection |

## Plan-Specific Triggers

- **Batch boundary**: Always check context budget after `git commit` — if >70%, compact `progress.md`
- **Tool output > 500 lines**: Mask immediately — extract to `progress.md` as `[Obs:N]`
- **TDD red→green**: Log test counts (e.g., "29 tests red → 29 tests green")
- **Error resolutions**: Store error message + fix in `findings.md`, reference from `progress.md`
