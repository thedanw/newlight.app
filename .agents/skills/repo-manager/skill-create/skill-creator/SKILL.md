---
name: skill-creator
description: "Create new skills or adapt existing skills for the BOSS repo. Scaffold SKILL.md with proper frontmatter, write content, validate, and update BOSS_INDEX. Use when adding new skills to .agents/skills/boss/."
category: skill-create
risk: safe
source: local
tags: [scaffolding, authoring, boss, skill-development]
triggers: [create, scaffold, write, author, adapt, new-skill]
allowed-tools: Read Write Glob Grep Bash
---

# Skill Creator — BOSS Edition

Create or adapt skills for the BOSS repository. Extends the base skill-creator pattern with BOSS-specific awareness: frontmatter schema, category mapping, BOSS_INDEX updates, and keyword enrichment.

## When to Use

- Creating a brand-new skill from scratch
- Adapting an external skill from the awesome-skills repo
- Re-scaffolding a skill that has the wrong structure
- Adding keywords/tags to improve BOSS discoverability

## Prerequisites

1. Determine the target **category folder** under `.agents/skills/boss/`
2. Check BOSS_INDEX.json for existing skills in that category (avoid duplicates)
3. Verify the skill name is kebab-case

## Workflow

### Phase 1: BRAINSTORM

Before writing anything:

1. **Search existing** — grep BOSS_INDEX.json for similar skills
2. **Identify the gap** — what does this skill do that no existing skill covers?
3. **Determine scope** — single-purpose or multi-purpose?
4. **Choose approach**:
   - **From scratch** — no reference, greenfield
   - **Adapt** — base on an existing skill (internal or from awesome-skills)
   - **Extend** — add to an existing skill's capability

Output a brief: name, category, purpose, approach.

### Phase 2: PLAN

Define the skill spec:

```
Name:     kebab-case-name
Category: boss-category-folder
Purpose:  One sentence: WHAT it does + WHEN to use it
Tags:     3-8 search tags
Triggers: 3-6 action verbs users would say
Risk:     safe | moderate | critical
```

Design the SKILL.md structure. Choose a pattern:

| Pattern | Best for | Example |
|---------|----------|---------|
| **Workflow** | Step-by-step processes | "1. Analyze → 2. Build → 3. Verify" |
| **Task** | Single-action tools | "Run this script to..." |
| **Reference** | Documentation/cheatsheets | API reference, pattern library |
| **Capabilities** | Feature-rich tools | Multiple distinct commands |

### Phase 3: SCAFFOLD

Create the skill directory:

```powershell
$skillPath = ".agents/skills/boss/<category>/<skill-name>"
New-Item -ItemType Directory -Path $skillPath -Force
```

Generate SKILL.md with BOSS-compliant frontmatter:

```markdown
---
name: skill-name
description: "WHAT it does + WHEN to use it. Be specific."
category: <category-folder>
risk: safe
source: local
tags: [tag1, tag2, tag3]
triggers: [verb1, verb2, verb3]
allowed-tools:
---

# Skill Name

## Overview

## When to Use This Skill

## Workflow / Process

## Examples

## Key Rules
```

Create supporting files as needed:
- `README.md` — extended docs (optional)
- `scripts/` — helper scripts (optional)
- `references/` — detailed reference docs (optional)

### Phase 4: WRITE

Fill in the SKILL.md body:

1. **Frontmatter first** — ensure all fields are complete
2. **Overview** — 2-3 sentences max
3. **When to Use** — explicit trigger conditions ("Use when user says X")
4. **Workflow** — numbered steps, clear and actionable
5. **Examples** — at least 2 input/output pairs
6. **Key Rules** — constraints, pitfalls, gotchas
7. **Keyword enrichment** — add a `keywords` field to the BOSS_INDEX entry (not frontmatter, but in the JSON):
   - Synonyms and related terms
   - Domain-specific vocabulary
   - Common misspellings or alternate phrasings
   - Acronyms and abbreviations

### Phase 5: AUDIT

Validate before publishing:

1. **Run skill-check** — read `skill-check/SKILL.md` and apply its validation
2. **BOSS-specific checks**:
   - [ ] Name is kebab-case
   - [ ] Description includes WHAT + WHEN
   - [ ] Category matches folder name
   - [ ] Tags array is populated (not empty)
   - [ ] Triggers array has 3-6 action verbs
   - [ ] Risk field is set
   - [ ] Source field is set
   - [ ] Path is correct ("category/skill-name")
3. **Frontmatter schema compliance** — required fields present
4. **Content quality** — examples present, no placeholder text

### Phase 6: INDEX

Register in BOSS_INDEX:

1. Add entry to BOSS_INDEX.json:

```json
{
  "id": "skill-name",
  "name": "Skill Name",
  "description": "WHAT it does + WHEN to use it (same as frontmatter)",
  "category": "category-folder",
  "tags": ["tag1", "tag2"],
  "triggers": ["verb1", "verb2", "verb3"],
  "risk": "safe",
  "path": "category-folder/skill-name",
  "source": "local"
}
```

2. Run `update-index.ps1`:

```powershell
powershell -ExecutionPolicy Bypass -File .agents/skills/boss/update-index.ps1
```

## Frontmatter Fields Reference

| Field | Required | Format | Example |
|-------|----------|--------|---------|
| `name` | Yes | kebab-case | `blog-writer` |
| `description` | Yes | "WHAT + WHEN" string | "Generate SEO blog posts. Use when creating content." |
| `category` | Yes | boss folder name | `content` |
| `risk` | Yes | safe/moderate/critical | `safe` |
| `tags` | Yes | array of lowercase strings | `[writing, seo, content]` |
| `triggers` | Yes | array of verbs | `[write, generate, create]` |
| `source` | Yes | installed/local/adapted | `local` |
| `allowed-tools` | No | tool names | `Read Write Bash` |

## Keyword Enrichment Strategy

To improve low-token discovery in BOSS matching, add a `keywords` field directly to the BOSS_INDEX.json entry (not in the skill's frontmatter — this is metadata for the index only):

```json
{
  "id": "blog-writer",
  ...
  "keywords": ["article", "post", "content-marketing", "wordpress", "cms", "copy", "blog"]
}
```

Keywords should include:
- Synonyms of tags and description terms
- Related domain terms users might search for
- Common alternative phrasings
- Acronyms if applicable
