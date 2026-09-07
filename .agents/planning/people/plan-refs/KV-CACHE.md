# KV-Cache Optimization — People Profile Refactor

## Context Ordering (Maximize Prefix Cache Hits)

| Layer | Content | Cache Scope |
|-------|---------|-------------|
| **Stable prefix** | System prompt, tool defs, plan header, arch decisions (#79–86), coding standards (TDD + vitest) | All batches |
| **Reusable middle** | Batch template structure, TDD cycle pattern, git commit format, file conventions | Similar batches |
| **Unique suffix** | Current batch context, active task details, tool outputs, sub-agent results | Single batch |

## Cache Stability Rules

- **No dynamic content** in stable/reusable sections — no timestamps in arch decisions, no random IDs
- **Consistent formatting** — every batch starts with identical header structure
- **Identical plan header structure** for every batch:
  ```
  ## Batch [N] Start: Sync
  ## Batch [N] Context
  ## Batch [N] Tools
  ## Batch [N] KV-Cache Optimization
  ## Batch [N] Context Partitioning
  ## Batch [N] Observation Masking
  ## Batch [N] Compaction
  ## Batch [N] Budget Monitoring
  ```
- **Target**: 70%+ cache hit rate for stable workloads (arch decisions, TDD patterns, git conventions)

## Plan-Specific Cache Items

- Arch decisions #79–86 → stable prefix (never changes)
- TDD red→green→commit pattern → reusable middle (every batch)
- Git commit format → reusable middle (consistent across batches)
- File paths (`src/modules/people/...`) → reusable middle (stable locations)
