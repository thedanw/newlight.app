---
name: manage-orchestrator
description: "Orchestrate BOSS skill management sub-skills at .agents/skills/boss/01-manage/. Coordinates skill-create, skill-aquire, skill-manage for creating, acquiring, and managing skills in the BOSS repository."
category: meta
risk: safe
source: local
tags: [orchestrator, repository, skill-management, boss, manage, 01-manage]
triggers: [manage, create, acquire, install, validate, index, search, add, remove, update, skill-create, skill-aquire, skill-manage]
allowed-tools: Read Write Glob Grep Bash
---

# Manage Orchestrator

**LOCATION:** `.agents/skills/boss/01-manage/00-manage-orchestrator/`

Coordinates three skill-management sub-skills in `.agents/skills/boss/01-manage/`:
- `skill-create/` — Create/adapt skills → outputs to `boss/<category>/`
- `skill-aquire/` — Search/install from awesome-skills GitHub → outputs to `boss/<category>/`
- `skill-manage/` — Manage `boss/` taxonomy + dual indexes; single registration authority

## Target Directory

All skills go to: `.agents/skills/boss/<category>/<skill-name>/`

**Never** in `.agents/skills/boss/01-manage/` (tooling only).

## Sub-Skills

| Sub-skill | Location | Purpose |
|-----------|----------|---------|
| skill-create | `../skill-create/` | Create/adapt skills → `boss/` |
| skill-aquire | `../skill-aquire/` | Search/install from awesome-skills → `boss/` |
| skill-manage | `../skill-manage/` | Manage `boss/` taxonomy + dual indexes (CAT-IDX, ALPHA-IDX); single registration authority |

## Workflow

### 1. Determine Intent

- Create/adapt skill → `../skill-create/skill-creator/SKILL.md`
- Validate skill → `../skill-create/skill-check/SKILL.md`
- Search/install external skill → `../skill-aquire/SKILL.md`
- Manage categories/index → `../skill-manage/SKILL.md`
- Rebuild indexes → `../skill-manage/scripts/update-index.ps1`
- Audit repo → scan for missing fields, empty tags, duplicates

### 2. Delegate

Read sub-skill's SKILL.md and follow its process. Each places skills in correct `boss/<category>/` folder.

### 3. Confirm Target

Before write, verify path:
```
CORRECT: .agents/skills/boss/<category>/<skill-name>/
WRONG:   .agents/skills/boss/01-manage/<anything>/
WRONG:   .agents/skills/<skill-name>/              (no category folder)
```
If sub-skill writes outside `boss/`, **stop and correct**.

### 4. Update Index

After add/remove/update to `boss/`, rebuild:
```powershell
powershell -ExecutionPolicy Bypass -File ../skill-manage/scripts/update-index.ps1
```

## Repo Structure

```
.agents/skills/
├── boss/                    ← SKILLS LIVE HERE
│   ├── BOSS_INDEX.json      ← legacy master registry (auto-generated)
│   ├── category-index.json  ← CAT-IDX (auto-generated)
│   ├── alphabetical-index.json ← ALPHA-IDX (auto-generated)
│   ├── SKILL.md             ← BOSS meta-orchestrator
│   ├── 01-manage/           ← SKILL MANAGEMENT TOOLING
│   │   ├── 00-manage-orchestrator/  ← THIS
│   │   ├── skill-create/    ← skill creation tools
│   │   │   ├── skill-creator/   ← scaffold + write
│   │   │   └── skill-check/     ← validate
│   │   ├── skill-aquire/    ← external skill discovery
│   │   │   └── awesome-skills_index.json
│   │   └── skill-manage/    ← category & index management (single registration authority)
│   │       ├── scripts/     ← update-index.ps1 (single build step)
│   │       └── refs/        ← schemas.md, categories.md (live refs)
│   ├── 00-setup/            ← workspace scaffolding (agents.md, junctions)
│   ├── ai-meta/             ← prompts, agent behavior, context
│   ├── bible/               ← biblical research, sermons
│   ├── code-plan/           ← planning, brainstorm, architecture
│   ├── debugging/           ← debug, fix, troubleshoot
│   ├── github/              ← git, GitHub, CI/CD
│   ├── marketing/           ← marketing, growth, SEO
│   ├── memory/              ← memory & knowledge management
│   ├── tools/               ← general tools & utilities
│   ├── ui-ux/               ← UI, UX, design, frontend
│   └── writing/             ← writing, content, documents
└── ...                      ← other categories
```

## BOSS_INDEX.json Schema

```json
{
  "id": "skill-folder-name",
  "name": "Human Readable Name",
  "description": "What it does and when to use it",
  "category": "boss-category-folder",
  "tags": ["tag1", "tag2"],
  "triggers": ["verb1", "verb2"],
  "risk": "safe|moderate|critical",
  "path": "category/skill-folder",
  "source": "installed|local|adapted"
}
```

## Key Rules

1. **ALL skills in `boss/<category>/`** — non-negotiable
2. **NEVER create skills in `01-manage/`** — tooling only
3. **Always rebuild index** after structural changes to `boss/`
4. **Never edit BOSS_INDEX.json manually** — use `update-index.ps1`
5. **Use kebab-case** for skill folder names
6. **Every skill needs valid YAML frontmatter** in SKILL.md
7. **Verify target path** before write — must start with `boss/`

## Anti-Patterns (Hard Stops)

| Wrong Action | Why | Correct Action |
|-------------|-----|---------------|
| Creating skill in `01-manage/` | Tooling, not skill destination | Create in `boss/<category>/` |
| Creating skill in `boss/` (no category) | Must be in category folder | Create in `boss/<category>/<skill-name>/` |
| Editing BOSS_INDEX.json manually | Overwritten by update-index.ps1 | Run update-index.ps1 after changes |
| Forgetting to rebuild index | BOSS won't discover new skills | Always run update-index.ps1 after add/remove/move |
