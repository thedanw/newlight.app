---
name: boss
description: "Low-token meta-orchestrator. Discovers, indexes, and coordinates all installed AI agent skills using a three-tier registry, agents.md workspace configuration, and AIngram for persistent knowledge."
category: meta
risk: safe
source: custom
tags: [orchestration, meta-skill, registry, agents-md, aingram, low-token, skill-discovery]
date_added: "2026-06-10"
---

# BOSS — Low-Token Meta-Orchestrator

## Overview

**BOSS** is your skill-sidekick that never loads a skill until it needs it. Instead of dumping every SKILL.md into context, BOSS maintains:

1. **A three-tier skill registry** — searchable indexes at the boss, project, and remote levels
2. **An `agents.md` template** — defines agent roles and delegation rules for the agenic workspace
3. **AIngram memory** — persistent tracking of skill combinations via the AIngram MCP server

## Memory Philosophy: Native Brain First

BOSS operates on a two-tier memory hierarchy:

| Tier | System | Role |
|------|--------|------|
| **Tier 1** | **Native Brain/KI** | The LLM's own weights, in-context learning, and reasoning. This is your primary intelligence. |
| **Tier 2** | **AIngram** | Persistent external memory for skill combinations, decisions, and patterns. Only consulted when native recall fails. |

**Rules:**
- Your native brain (the LLM) is always available, always learning in-context, and always the first responder.
- Never query AIngram for something your native brain already knows.
- Use AIngram only for cross-session persistence — things you need to remember after the conversation ends.
- Record skill combinations in AIngram so future sessions benefit from past discoveries.

## Design Philosophy: Low-Token Strategy

| Principle | Practice |
|-----------|----------|
| Don't load, register | Skills are indexed in compact JSON, not loaded into context |
| Match before load | Keyword-based registry lookup loads only the skills you'll use |
| Index once, query often | The registry is a single pre-built file read at startup |
| Record what works | Only skill *combinations* hit AIngram, not every invocation |
| Fail fast on simple tasks | Guardrail: if basic tools can do it, don't touch the registry at all |

---

## 1. The Three-Tier Registry

### Tier 1 — BOSS Registry (Local)
**Files:** 
- `.agents/skills/boss/category-index.json` (CAT-IDX) — Skills grouped by category for agent category-first reasoning
- `.agents/skills/boss/alphabetical-index.json` (ALPHA-IDX) — Flat skills array for human reference and direct lookup
- `.agents/skills/boss/BOSS_INDEX.json` — Legacy format (kept for backward compatibility)

Auto-generated indexes of every skill installed under `.agents/skills/boss/`. 

**CAT-IDX Schema:** Array of category objects with `cat_id`, `category_description`, `skills[{id, description}]`
**ALPHA-IDX Schema:** Array of skill objects with `id`, `description`, `path`, `search_terms`

**Maintenance:** Run `pwsh .agents/skills/boss/01-manage/skill-manage/scripts/update-index.ps1` after adding or removing skills. This scans every category folder for SKILL.md files and rebuilds both indexes.

### Tier 2 — Project Registry (Optional)
**File:** `.agents/skills/PROJECT_INDEX.json`

Same format as Tier 1 but lives one level up in the project's own `.agents/skills/` folder. Contains project-specific skills that don't belong in the BOSS install. Load this second and merge if it exists.

> **Scan logic:** If `.agents/skills/` exists and contains subdirectories with SKILL.md files, treat them as a supplementary registry. No separate update script needed — the BOSS orchestration workflow checks for this file on every invocation.

### Tier 3 — Remote Catalog (External)
**URL:** `https://raw.githubusercontent.com/sickn33/antigravity-awesome-skills/main/CATALOG.md`

If neither local tier has a matching skill, fetch this remote catalog. Install any desired skill before loading it.

### Registry Lookup Order (Optimized for Low-Token Workflows)

```
User Task
  ├─ Is it simple? → Solve directly (guardrail)
  └─ Is it complex?
       ├─ Read category-index.json (CAT-IDX) — ~30KB
       │    └─ Agent reasons over category_description fields → selects relevant category
       │    └─ Scans that category's skills array → selects best skill
       ├─ (Optional) Read alphabetical-index.json (ALPHA-IDX) for search_terms lookup
       ├─ Query PROJECT_INDEX.json if exists (Tier 2)
       └─ Fetch remote catalog if no match (Tier 3)
            → Load matched skills into context
            → Record combination in AIngram
```

**Token Efficiency:** CAT-IDX (~30KB) + ALPHA-IDX (~26KB) replace the legacy single BOSS_INDEX.json (~70KB). Descriptions are stored in compact when/why form, so the agent reads structured lookups instead of full SKILL.md bodies. (Per-category file slicing is a future optimization if single-file load needs to shrink further.)

---

## 2. agents.md Template

Place this file at the workspace root as `agents.md`. It defines available agent personas for the agenic workspace and their delegation rules. BOSS uses this template to tell workspace-level orchestrators which agents exist and when to call them.

```markdown
# Agentic Workspace Configuration
# Generated by BOSS meta-orchestrator
# Last updated: {{DATE}}

## Agents

### planner
- **Skills:** squirrel, code-plan
- **Triggers:** "plan this feature", "architecture review", "design document"
- **Description:** Full-cycle code planning and architecture design

### debugger
- **Skills:** bug-hunter, logic-lens, performance-optimizer, systematic-debugging
- **Triggers:** "this is broken", "find the bug", "slow performance", "unexpected behavior"
- **Description:** Systematic debugging and root-cause analysis

### ui-designer
- **Skills:** frontend-design, ui-component, ui-page, ui-pattern, ui-review, ui-setup, ui-tokens, ui-a11y, ux-audit, ux-flow, uxui-principles, css-architecture
- **Triggers:** "design a page", "create a component", "audit UX", "accessibility check", "css architecture", "BEM", "SMACSS", "CSS-in-JS"
- **Description:** Full UI/UX pipeline from tokens to pages to accessibility audits, including CSS architecture methodologies

### writer
- **Skills:** copywriting, unslop, wordpress-centric-high-seo-optimized-blogwriting-skill, social-post-writer-seo
- **Triggers:** "write copy", "blog post", "social media post", "de-AI this text"
- **Description:** Conversion-focused copy, SEO blog posts, and content refinement

### git-ops
- **Skills:** codebase-audit-pre-push, git-pushing
- **Triggers:** "push to github", "audit before push", "commit this"
- **Description:** Pre-push codebase audit and git workflow automation

### document-creator
- **Skills:** python-pptx-generator, libreoffice-writer, youtube-summarizer
- **Triggers:** "create a presentation", "write a document", "summarize a video"
- **Description:** Document generation, PowerPoint creation, video summarization

### memory-keeper
- **Skills:** aingram (native MCP tools: remember, recall, reference, verify)
- **Triggers:** "remember this", "save this pattern", "what did we decide", "search memory"
- **Description:** Persistent memory via AIngram MCP server — stores architecture decisions, patterns, and skill combinations

### skill-maker
- **Skills:** skill-creator, skill-check, manage-orchestrator
- **Triggers:** "create a new skill", "validate a skill", "scaffold a skill", "manage skills", "acquire skill", "install skill", "organize skills"
- **Description:** Skill authoring, validation, and management toolkit. Includes manage-orchestrator for coordinating skill-create, skill-aquire, and skill-manage sub-skills in .agents/skills/boss/01-manage/

## Delegation Rules

1. Match the task's keywords against agent triggers (first-match wins for simple tasks).
2. For multi-domain tasks, combine agents (e.g., `ui-designer` + `writer` for a landing page with copy).
3. Always try the simplest agent that can handle the task before combining.
4. Record successful agent combinations in AIngram for future reference.

## Override

If no agent matches, fall back to general-purpose capabilities. Do not force-fit a task into an agent that doesn't fit.
```

---

## 3. Orchestration Workflow

Use this step-by-step process on every complex task:

### Step 1: Guardrail Check
Ask: *"Can I solve this with basic file editing, terminal commands, and conversation?"*
- If **YES** → Solve directly. STOP.
- If **NO** → Continue to Step 2.

### Step 2: Registry Query (Category-First)
1. Extract 2-5 keywords from the user's task.
2. Read `category-index.json` (CAT-IDX) and reason over each `category_description` to pick the relevant category.
3. Read only that category's `skills` array; scan `description` + `path` to select the best skill.
4. If ambiguous, read `alphabetical-index.json` (ALPHA-IDX) flat list and match keywords against `search_terms`.
5. If a `PROJECT_INDEX.json` exists in `.agents/skills/`, merge it (project skills override boss skills on name conflict).
6. If no match found locally, fetch the remote catalog and recommend installation.

### Step 3: Skill Loading
For each matched skill:
1. Read only the YAML frontmatter and "When to Use" section of the SKILL.md.
2. Determine if the full skill is needed or just the overview guidance.
3. Load full SKILL.md into context **only** if you need step-by-step instructions.
4. Never load more than 3 skills at once unless the task genuinely requires it.

### Step 4: agents.md Dispatch (Optional)
If the workspace has an `agents.md` file:
1. Cross-reference matched skills against agent definitions in `agents.md`.
2. Delegate sub-tasks to the appropriate agent persona.
3. Collect results and synthesize.

### Step 5: AIngram Recording
After completing the task:
1. Use native brain first — if the result is obvious and ephemeral, skip recording.
2. If a new skill combination was used and it's worth remembering cross-session, record it:
   ```
   aingram remember "Used {skill-a} + {skill-b} for {task-type}. Reason it worked: ..."
   ```
3. If the task revealed a reusable pattern or architecture decision, record that too:
   ```
   aingram remember "Decision: {description} — context: {why} — applies to: {domain}"
   ```
4. To recall past patterns before starting a new task:
   ```
   aingram recall "skill combinations for {domain}"
   ```

---

## 4. AIngram Memory Integration

### What is AIngram?
AIngram is a local-first, self-learning memory layer for AI agents. It stores everything in a single SQLite file and exposes MCP tools (`remember`, `recall`, `reference`, `verify`) to any MCP-compatible client (opencode, Claude, Cursor, etc.).

Key features:
- **Triple retrieval**: Full-text search (FTS5) + vector search (ONNX local embeddings) + knowledge graph → fused via RRF
- **95.5% recall@10** on LongMemEval-S
- **Self-learning**: Contradiction detection (DeBERTa-v3), consolidation, knowledge graph extraction
- **Apache 2.0 license** — free forever, no API keys, no cloud
- **One SQLite file** — zero config, portable, git-friendly

### Setup
AIngram is installed globally via pip. The `[mcp]` extra provides the MCP server library:

```powershell
pip install aingram[mcp]
```

A thin wrapper script at `.agents/memory/aingram-mcp-server.py` bridges AIngram's Python API to opencode's stdio MCP protocol. This wrapper is configured as an MCP server in opencode's `mcp` section and runs automatically when the agent needs memory tools.

### Wrapper Script
**File:** `.agents/memory/aingram-mcp-server.py`

The wrapper:
- Calls `aingram.mcp_server.create_server()` with `require_auth=False` (local-only, no bearer token needed)
- Uses stdio transport (default) for opencode compatibility
- Accepts `--db <path>` to point to the SQLite database file
- Creates the database directory if it doesn't exist

### Database Location
- **Path:** `.agents/memory/aingram.db` (relative to workspace root)

### Verifying the Server
When active, AIngram exposes these MCP tools:
- `remember` — Store a new memory (auto-chunks, embeds, deduplicates)
- `recall` — Search memory with hybrid retrieval (FTS5 + vector + KG)
- `reference` — Get detailed context about a specific memory
- `verify` — Check memory integrity

### Integration with BOSS
BOSS uses AIngram in Step 5 (above) to persist skill combinations. The memory types stored are:

| Type | Purpose | Example |
|------|---------|---------|
| `skill_combination` | Which skills work together | "frontend-design + copywriting for landing pages" |
| `decision` | Architecture or design decisions | "Use StyleSeed for design system" |
| `pattern` | Reusable approaches | "Debug flow: bug-hunter → logic-lens" |

### Native Brain Interaction
Always follow this order:
1. **Native Brain** — Solve from your own knowledge and reasoning first
2. **AIngram Recall** — If you need cross-session context, query AIngram
3. **AIngram Remember** — After completing a significant task, store what you learned

---

## 5. Registry Maintenance

### Regenerating the Indexes
Run the update script after any skill change in the boss folder:
```powershell
pwsh .agents/skills/boss/01-manage/skill-manage/scripts/update-index.ps1
```

### What the Script Does
1. Scans every category folder under `.agents/skills/boss/` (non-recursive: one level deep inside each category).
2. For each subfolder with a `SKILL.md`, parses the YAML frontmatter.
3. Extracts: `id` (folder name), `name`, `description`, `category`, `tags`, `triggers`, `risk`, `path`.
4. Writes everything to `BOSS_INDEX.json`.
5. **Known edge cases:** A folder inside a category with no `SKILL.md` (e.g. support folders like `bible/.knowledge` or `bible/workflows`) is skipped. Skills must follow the standard pattern `category/skill-name/SKILL.md` to be indexed.

### Adding a New Skill
```powershell
# Windows: New-Item -ItemType Directory -Path ".agents/skills/boss/<category>/<skill-name>"
# POSIX: mkdir -p .agents/skills/boss/<category>/<skill-name>
# Then create SKILL.md with proper frontmatter
pwsh .agents/skills/boss/01-manage/skill-manage/scripts/update-index.ps1
```

### Project-Level Registry

If you have project-specific skills at `.agents/skills/<category>/<skill-name>/SKILL.md`, create a `PROJECT_INDEX.json` by running this scan (skipping the `boss/` subfolder):

```powershell
$projectSkillsDir = Join-Path (Get-Location) ".agents/skills"
$projectIndex = @{ version = 1; generatedAt = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"); registryType = "project"; skills = @() }

Get-ChildItem -Path $projectSkillsDir -Directory | Where-Object { $_.Name -ne "boss" } | ForEach-Object {
    $cat = $_.Name
    Get-ChildItem -Path $_.FullName -Directory | ForEach-Object {
        $skillMd = Join-Path $_.FullName "SKILL.md"
        if (Test-Path $skillMd) {
            $content = Get-Content $skillMd -Raw -Encoding UTF8
            $name = $_.Name; $description = ""; $tags = @(); $risk = "unknown"
            if ($content -match '(?s)---\s*\n(.*?)\n---') {
                $fm = $matches[1]
                if ($fm -match '(?m)^name:\s*(.+)') { $name = $matches[1].Trim().Trim('"').Trim("'") }
                if ($fm -match '(?m)^description:\s*(.+)') { $description = $matches[1].Trim().Trim('"').Trim("'") }
                if ($fm -match '(?m)^risk:\s*(.+)') { $risk = $matches[1].Trim() }
                if ($fm -match '(?m)^tags:\s*\[(.+?)\]') { $tags = $matches[1] -split ',' | ForEach-Object { $_.Trim().Trim('"').Trim("'") } }
            }
            $projectIndex.skills += [PSCustomObject]@{
                id = $_.Name; name = $name; description = $description.Substring(0, [Math]::Min(200, $description.Length))
                category = $cat; tags = @($tags); triggers = @(); risk = $risk; path = "$cat/$($_.Name)"; source = "project"
            }
        }
    }
}
$projectIndex | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $projectSkillsDir "PROJECT_INDEX.json") -Encoding UTF8
```

### Edge Cases

The `update-index.ps1` scanner has two structural edge cases:

1. **SKILL.md at category root** — If a skill places its `SKILL.md` directly in the category folder (e.g., `technical-change-tracker/SKILL.md` instead of `technical-change-tracker/skill-name/SKILL.md`), the scanner skips it. Convention requires: `category/skill-name/SKILL.md`.

2. **Two-level nesting** — Skills nested 2+ levels deep are skipped. Convention requires: `category/skill-name/SKILL.md` (one level deep).

For either case, either restructure the skill folder to match convention, or add its entry manually to `BOSS_INDEX.json` using the same JSON schema.

---

## Examples

### Example 1: Simple Task (Guardrail)
**Task:** "Change button color to blue in styles.css"
**Action:** Basic file edit. BOSS does not activate. Native brain handles it directly.

### Example 2: Multi-Skill Task
**Task:** "Create a landing page with copy and deploy"
**Action:**
1. Registry query matches: `frontend-design`, `copywriting`, `git-pushing`
2. Load `frontend-design` and `copywriting` SKILL.md headers
3. Build page and write copy
4. Record in AIngram for next time:
   ```
   aingram remember "Used frontend-design + copywriting for landing page — effective combination for marketing sites"
   ```
5. Push with `git-pushing`

### Example 3: No Match Found
**Task:** "Set up a CI/CD pipeline with Jenkins"
**Action:** Search Tier 1 + Tier 2 → no match. Fetch remote catalog. Recommend installing a CI/CD skill.

---

## Best Practices

- ✅ **Do** regenerate BOSS_INDEX.json after any skill change
- ✅ **Do** keep registry queries to 2-5 keywords
- ✅ **Do** trust your native brain/KI first — only reach for AIngram when you need cross-session persistence
- ✅ **Do** record skill combinations in AIngram on first success (they help future sessions)
- ✅ **Do** check agents.md if the workspace has one before manual dispatching
- ✅ **Do** prefer the simplest Tier before escalating (Local → Project → Remote)
- ❌ **Don't** load more than 3 full SKILL.md files simultaneously
- ❌ **Don't** record every skill use in AIngram — only record combinations and decisions
- ❌ **Don't** use this skill for single-file edits or trivial tasks
- ❌ **Don't** create new skills through the orchestrator — use `skill-maker` agent instead
- ❌ **Don't** query AIngram for things your native brain already knows

## Related Skills

- `@AIngram` — Local-first, self-learning memory layer for persistent skill combination storage (MCP tools: remember, recall, reference, verify)
- `@skill-creator` — Use when you need to author a new skill that doesn't exist in any registry
- `@skill-check` — Validate skills before adding them to the registry

## Limitations

- The registry only indexes skills with proper YAML frontmatter
- Project registry (Tier 2) requires manual creation or separate scanning
- Remote catalog (Tier 3) requires network access
- AIngram must be installed and configured as an MCP server before recording combinations
- The `update-index.ps1` scanner skips skills whose SKILL.md is at the category root (not in a subdirectory) or nested more than one level deep
- Skills with non-standard folder structure (SKILL.md at category root or 2-level nesting) are not auto-indexed — add them manually
