# Context Partitioning — People Profile Refactor

## When to Spawn Sub-Agents

| Condition | Plan Examples |
|-----------|---------------|
| Independent subtasks >5 min | Write ChildSafetySection test + GuardiansSection test in parallel |
| Parallel file ops | Edit multiple test files + multiple source files in different sections |
| Research/discovery | Grep for existing inline-edit patterns, search for permission hook usage |
| Fresh context needed | Starting new batch — clear previous context to avoid pollution |

## Sub-Agent Context Template

```
Task: [Specific subtask goal — e.g., "Write failing tests for ChildSafetySection expansion"]
Context: [Parent batch evolving context — minimal — ref: findings.md#component-state, plan.md Batch N]
Deliverable: [Concrete output — e.g., "ChildSafetySection.test.tsx with 16 field assertions"]
Constraints: [TDD red phase, file path conventions, import patterns from PersonalSection.test.tsx]
Update: Write full results to findings.md, log summary to progress.md
```

## Result Aggregation

1. Validate all partitions completed (exit code 0)
2. Merge compatible results (all tests pass → green phase)
3. Summarize findings in progress.md with refs to findings.md
4. If aggregated > budget: summarize before continuing

## Plan-Specific Partitioning Guidance

- **Batch 2**: Test writing + component expansion can be parallel sub-agents
- **Batch 4**: PersonalSection/DemographicsSection/ContactSection — 3 independent sections → 3 sub-agents
- **Batch 5**: Profile gating + dashboard gating + filters — 3 independent UI areas → 3 sub-agents
