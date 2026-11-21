# Output Patterns

Use these patterns when skills need consistent, high-quality output.

## Template Pattern

Provide templates for output format. Match strictness to needs.

**Strict (API responses, data formats):**
```markdown
## Report structure

ALWAYS use this exact template:

# [Analysis Title]

## Executive summary
[One-paragraph overview of key findings]

## Key findings
- Finding 1 with supporting data
- Finding 2 with supporting data
- Finding 3 with supporting data

## Recommendations
1. Specific actionable recommendation
2. Specific actionable recommendation
```

**Flexible (adaptation useful):**
```markdown
## Report structure

Sensible default, use judgment:

# [Analysis Title]

## Executive summary
[Overview]

## Key findings
[Adapt sections based on discoveries]

## Recommendations
[Tailor to context]

Adjust sections as needed for analysis type.
```

## Examples Pattern

For skills where output quality depends on examples, provide input/output pairs:

```markdown
## Commit message format

Generate commit messages following these examples:

**Example 1:**
Input: Added user authentication with JWT tokens
Output:
```
feat(auth): implement JWT-based authentication

Add login endpoint and token validation middleware
```

**Example 2:**
Input: Fixed bug where dates displayed incorrectly in reports
Output:
```
fix(reports): correct date formatting in timezone conversion

Use UTC timestamps consistently across report generation
```

Follow style: type(scope): brief description, then detailed explanation.
```

Examples clarify desired style and detail level better than descriptions alone.
