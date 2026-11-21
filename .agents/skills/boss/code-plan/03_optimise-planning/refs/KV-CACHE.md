# KV-Cache Optimization

## Context Ordering (Maximize Prefix Cache Hits)

| Layer | Content | Cache Scope |
|-------|---------|-------------|
| **Stable prefix** | System prompt, tool defs, plan header, arch decisions, coding standards | All batches |
| **Reusable middle** | Batch template, TDD cycle, git commands, file conventions | Similar batches |
| **Unique suffix** | Current batch context, active task, tool outputs, sub-agent results | Single batch |

## Cache Stability Rules

- No dynamic content (timestamps, random IDs) in stable/reusable sections
- Consistent formatting across all batches
- Identical plan header structure for every batch
- Target: 70%+ cache hit rate for stable workloads