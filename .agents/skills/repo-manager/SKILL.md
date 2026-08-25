---
name: repo-manager
description: "Orchestrate the BOSS skill repository at .agents/skills/boss/. All skills created, acquired, or managed MUST be placed in boss/ category folders — never in repo-manager/. Use when managing, adding, or maintaining skills in the boss repo."
category: meta
risk: safe
source: local
tags: [orchestrator, repository, skill-management, boss, index]
triggers: [manage, create, acquire, install, validate, index, search, add, remove, update]
allowed-tools: Read Write Glob Grep Bash
---

# Repo Manager

> **GOLDEN RULE: All skills managed by this orchestrator are placed in `.agents/skills/boss/` category folders. NEVER place skills in `repo-manager/`. The repo-manager directory contains only tooling — the skills it manages live in `boss/`.**

Orchestrate the BOSS skill repository. Three sub-skills handle specific operations:

| Sub-skill | Location | Purpose |
|-----------|----------|---------|
| **skill-create** | `skill-create/` | Create new skills or adapt existing ones → outputs to `boss/` |
| **skill-aquire** | `skill-aquire/` | Search and install skills from awesome-skills GitHub repo → outputs to `boss/` |
| **skill-manage** | `skill-manage/` | Manage `boss/` category folders, keep `BOSS_INDEX.json` in sync |

## Target Directory

**All skills go here:**

```
.agents/skills/boss/<category>/<skill-name>/
```

**Never here:**

```
.agents/skills/repo-manager/        ← TOOLING ONLY, not for skills
```

## Workflow

### 1. Determine Intent

Identify what the user wants:

- **Create/adapt a skill** → delegate to `skill-create/SKILL.md`
- **Search/install external skill** → delegate to `skill-aquire/SKILL.md`
- **Manage categories/index** → delegate to `skill-manage/SKILL.md`
- **Validate a skill** → delegate to `skill-create/skill-check/SKILL.md`
- **Rebuild BOSS_INDEX.json** → run `../boss/update-index.ps1`
- **Audit the repo** → scan for missing fields, empty tags, duplicates

### 2. Delegate

Read the relevant sub-skill's SKILL.md and follow its process. Each sub-skill is responsible for placing skills in the correct `boss/<category>/` folder.

### 3. Confirm Target

Before any write operation, verify the target path:

```
CORRECT: .agents/skills/boss/<category>/<skill-name>/
WRONG:   .agents/skills/repo-manager/<anything>/
WRONG:   .agents/skills/<skill-name>/              (no category folder)
```

If a sub-skill tries to write outside `boss/`, **stop and correct**.

### 4. Update Index

After any add/remove/update to `boss/`, rebuild the index:

```powershell
powershell -ExecutionPolicy Bypass -File ../boss/update-index.ps1
```

## Repo Structure

```
.agents/skills/
├── boss/                    ← SKILLS LIVE HERE (target for all operations)
│   ├── BOSS_INDEX.json      ← master skill registry
│   ├── update-index.ps1     ← index rebuild script
│   ├── code-plan/           ← planning, brainstorm, architecture
│   ├── debugging/           ← debug, fix, troubleshoot
│   ├── doc-create/          ← document creation
│   ├── github/              ← git, GitHub, CI/CD
│   ├── marketing/           ← marketing, growth, SEO
│   ├── memory/              ← memory & knowledge management
│   ├── tools/               ← general tools & utilities
│   ├── ui-ux/               ← UI, UX, design, frontend
│   └── writing/             ← writing & content
├── repo-manager/            ← TOOLING ONLY (no skills here)
│   ├── skill-create/        ← skill creation tools
│   │   ├── skill-creator/   ← scaffold + write skills
│   │   └── skill-check/     ← validate skills
│   ├── skill-aquire/        ← external skill discovery
│   │   └── awesome-skills_index.json
│   └── skill-manage/        ← category & index management
└── ...                      ← other skill categories
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

1. **ALL skills go in `boss/<category>/`** — this is non-negotiable
2. **NEVER create skill folders in `repo-manager/`** — it is tooling-only
3. **Always rebuild index** after structural changes to `boss/`
4. **Never edit BOSS_INDEX.json by hand** — use `update-index.ps1`
5. **Use kebab-case** for skill folder names
6. **Every skill must have valid YAML frontmatter** in SKILL.md
7. **Verify target path** before any write — if it doesn't start with `boss/`, stop

## Anti-Patterns (Hard Stops)

| Wrong Action | Why | Correct Action |
|-------------|-----|---------------|
| Creating skill in `repo-manager/` | Repo-manager is tooling, not a skill destination | Create in `boss/<category>/` |
| Creating skill directly in `boss/` (no category) | Skills must be in category folders | Create in `boss/<category>/<skill-name>/` |
| Editing BOSS_INDEX.json manually | Will be overwritten by update-index.ps1 | Run update-index.ps1 after changes |
| Forgetting to rebuild index | BOSS won't discover new skills | Always run update-index.ps1 after add/remove/move |
