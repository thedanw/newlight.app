# Context Partitioning

## When to Spawn Sub-Agents

| Condition | Example |
|-----------|---------|
| Independent subtasks >5 min | Write tests for module A, module B in parallel |
| Parallel file ops | Tests in `tests/`, configs in `config/`, docs in `docs/` |
| Research/discovery | Grep search, file search, web fetch |
| Fresh context needed | Any task benefiting from isolation |

## Sub-Agent Context Template

```
Task: [Specific subtask goal]
Context: [Parent batch evolving context - minimal]
Deliverable: [Concrete output: file paths, test results, findings]
Constraints: [TDD, file paths, patterns, no shared mutable state]
Update: Write to findings.md, log summary to plan.md
```

## Result Aggregation

1. Validate all partitions completed
2. Merge compatible results (file changes, test passes)
3. Summarize findings in plan.md with refs to findings.md
4. If aggregated > budget: summarize before continuing