# Observation Masking Rules

## Masking Decision Matrix

| Category | Action | Examples |
|----------|--------|----------|
| Critical to current task | Never mask | Active error, file being edited, test output for current task |
| Most recent turn | Never mask | Last tool output, current reasoning |
| Active reasoning artifacts | Never mask | In-progress analysis, decision tree |
| 2+ tasks ago | Consider masking | Previous grep results, old file reads |
| Verbose with extractable keys | Consider masking | Large search results, full file contents |
| Served purpose | Consider masking | Completed verification outputs |
| Repeated outputs | Always mask | Duplicate search results, same command run twice |
| Boilerplate | Always mask | Headers, footers, standard disclaimers |
| Already summarized | Always mask | Content already in plan.md |

## Masking Format

```
After tool call >500 tokens:
1. Extract key findings (metrics, conclusions, file paths, errors)
2. Store full output in plan.md with ID: [Obs:N]
3. Replace in context: [Obs:N elided. Key: <findings>]
4. Future reference: see plan.md#Obs-N
```