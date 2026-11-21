---
name: skill-check
description: "Validate SKILL.md files against agentskills spec and Anthropic best practices. Catches structural, semantic, naming issues in single read-only pass."
category: development
risk: safe
source: https://github.com/olgasafonova/SkillCheck-Free
date_added: "2026-03-11"
author: olgasafonova
tags: [validation, linter, agentskills, skill-authoring, code-quality]
tools: [claude, cursor, windsurf, codex-cli]
license: MIT
allowed-tools: Read Glob
compatibility: claude-code
---

# SkillCheck

Validate SKILL.md files against [agentskills spec](https://agentskills.io) and Anthropic best practices. Catches structural errors, semantic contradictions, naming anti-patterns, quality gaps in single read-only pass.

## When to Use

- User says "check skill", "skillcheck", or "validate SKILL.md"
- Reviewing skill before marketplace publish
- Debugging why skill doesn't trigger
- Onboarding team to skill authoring standards
- **NOT** for anti-slop, security, token analysis → use [SkillCheck Pro](https://getskillcheck.com)

## How It Works

### Step 1: Parse
Read target SKILL.md, extract YAML frontmatter.

### Step 2: Validate
Apply Free tier checks:

| Category | Checks | Catches |
|----------|--------|---------|
| Structure (1.x) | Name format, description WHAT+WHEN, allowed-tools, categories, XML injection | Malformed frontmatter, missing fields |
| Body (2.x) | Line count, hardcoded paths, stale dates, empty sections, deprecated syntax, MCP tool qualification | Content quality issues |
| Naming (3.x) | Vague terms, single-word names, gerund suggestions | Poor discoverability |
| Semantic (4.x) | Contradictions, ambiguous terms, missing output format, wisdom/platitudes, misplaced triggers | Logical inconsistencies |
| Quality (8.x) | Examples, error handling, triggers, output format, prerequisites, negative triggers | Strengths (positive patterns) |

### Step 3: Score
Calculate 0-100. Penalties: critical = -20, warning = -5, suggestion = -1.

### Step 4: Report
Return: score, grade (Excellent/Good/Needs Work/Poor), issues with check IDs, line numbers, messages, fix suggestions.

## Examples

### Example 1: Validating a skill
```
User: check my skill at ~/.claude/skills/weekly-report/SKILL.md

SkillCheck output:
## weekly-report Check Results [FREE]
Score: 85/100 (Good)

### Warnings (2)
  - 1.2-desc-when (line 3): Description missing WHEN clause
  - 4.5-desc-no-triggers (line 3): Description lacks triggering conditions

### Suggestions (1)
  - 3.4-gerund-naming (line 2): Skill name could use gerund form

### Passed Checks: 28
```

### Example 2: Clean skill
```
User: skillcheck ~/.claude/skills/processing-pdfs/SKILL.md
Score: 100/100 (Excellent)
All 31 checks passed. No issues found.
```

## Limitations

- Read-only: no file modifications
- Free tier: structural, semantic, naming only
- Anti-slop, security, WCAG, token, enterprise, workflow → [SkillCheck Pro](https://getskillcheck.com)
- Semantic checks (contradiction, wisdom/platitude) heuristic, ~5% false positive
- No validation of referenced files/scripts; only SKILL.md content
- Single-file; no cross-check against other skills in directory

## Best Practices

- Run before marketplace submission
- Fix critical/warning issues; suggestions optional
- Use check ID (e.g., `1.2-desc-when`) to find exact rule
- Re-run after fixes to confirm score improvement

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Low score from many suggestions | Suggestions cap at -15 total. Focus on warnings/criticals first. |
| False positive on ambiguous terms in code blocks | SkillCheck skips code blocks/inline code. Wrap term in backticks if needed. |
| Wisdom/platitude flags legitimate instructions | Rephrase generic advice ("Remember testing is important") as concrete directives ("Run tests before committing"). |
