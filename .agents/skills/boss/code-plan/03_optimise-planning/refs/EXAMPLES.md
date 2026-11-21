# Examples for 03_optimise-planning

## Before Optimization

```markdown
### Batch 2: Core Implementation
- [ ] Task 2.1: Write failing test for user auth
- [ ] Task 2.2: Implement auth logic
- [ ] Task 2.3: Run tests
```

## After Full Optimization (8 Optimizations + Token-Efficient Patterns)

```markdown
### Batch 2: Core Implementation

## Batch 2 Start: Sync
- [ ] Mark completed tasks in `plan.md` (update checkboxes/status)
- [ ] Read `findings.md` for key discoveries
- [ ] **Context Check**: If estimated context > 70%, run compaction before proceeding

## Batch 2 Context
- Overall Goal: Implement user authentication with JWT
- Current Batch Goal: Build auth logic with TDD
- Previous Batch: Batch 1 completed project setup, CI configured, types defined
- Key Findings: Ref findings.md#auth-patterns (JWT with refresh tokens)
- Current State: Ready for auth implementation
- Budget: Stable 20% | Current 30% | History 30% | Buffer 20%
- Optimization Status: Clean

## Batch 2 Tools
- **Use `manage_todo_list`** — Create atomic tasks, max 1 in-progress
- **Use subagents** — For independent subtasks >5 min (context partitioning)
- **Apply Observation Masking** — After each tool call, summarize key findings in plan.md, replace verbose output with ref
- **Monitor Context** — If > 70% utilized, trigger compaction before next task

## Batch 2 Observation Masking
See `plan-refs/MASKING-RULES.md` for rules and format.

## Batch 2 KV-Cache Optimization
See `plan-refs/KV-CACHE.md` for ordering and stability rules.

## Batch 2 Context Partitioning
See `plan-refs/PARTITIONING.md` for spawn conditions, template, and aggregation.

- [ ] Task 2.1: Write failing test for user auth
- [ ] Task 2.2: Implement auth logic
- [ ] Task 2.3: Run tests

## Batch 2 Compaction

- If context > 70%: compact before next batch — never exceed 80%
- Cache-friendly ordering: stable (plan, arch) → reusable (templates, patterns) → unique (current task)
- Quality check: Compaction must preserve decisions, commitments, context shifts — <5% quality degradation

```