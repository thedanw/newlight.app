# Observation Masking — People Profile Refactor

## Masking Decision Matrix

| Category | Action | Plan Examples |
|----------|--------|---------------|
| Critical to current task | Never mask | Active test failures, files being edited, current grep results |
| Most recent turn | Never mask | Last `vitest` output, current commit error |
| Active reasoning artifacts | Never mask | Permission logic derivation, decision tree analysis |
| 2+ tasks ago | Consider masking | Previous batch's full grep results, old file reads |
| Verbose with extractable keys | Consider masking | Full `tsc -b` output, complete test output with pass/fail counts |
| Served purpose | Consider mask | Verification output after green tests confirmed |
| Repeated outputs | Always mask | Same vitest run with no changes, duplicate grep across files |
| Boilerplate | Always mask | Standard error headers, vitest config banners, commit success messages |
| Already summarized | Always mask | Content already in progress.md as summary |

## Masking Format

After tool call >500 tokens:
1. Extract key findings (test counts, file paths, error messages, pass/fail status)
2. Store full output in progress.md with reference ID: `[Obs:N]`
3. Replace in context with: `[Obs:N elided. Key: <key findings>]`
4. Reference in future: `see progress.md#Obs-N`

## Plan-Specific Masking Rules

- **vitest output**: Mask after extracting pass/fail counts → `[Obs:N elided. Key: N passed, M failed]`
- **tsc -b output**: Mask errors after extracting file:line references → `[Obs:N elided. Key: X type errors at src/...]`
- **eslint output**: Mask warnings after extracting rule violations → `[Obs:N elided. Key: N warnings (no-unused-vars, etc.)]`
- **vitest --coverage**: Mask detailed table, keep summary numbers → `[Obs:N elided. Key: coverage X% (target ≥70%)]`
