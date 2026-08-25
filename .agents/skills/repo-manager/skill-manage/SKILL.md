---
name: skill-manage
description: "Manage BOSS skill category folders and keep BOSS_INDEX.json in sync. Use when adding, moving, removing, or reorganizing skills in .agents/skills/boss/. Handles category mapping, index updates, and index audit."
category: meta
risk: moderate
source: local
tags: [management, organization, index, categories, boss, sync, audit]
triggers: [manage, move, add, remove, reorganize, sync, audit, clean, update-index, category]
allowed-tools: Read Write Glob Grep Bash
---

# Skill Manage

Manage the BOSS skill category folders and keep `BOSS_INDEX.json` synchronized with the actual skill layout.

## What It Does

- **Audit** — scan boss/ folder vs BOSS_INDEX.json, find mismatches
- **Add skill** — move a new skill into the correct category folder + update index
- **Move skill** — relocate a skill to a different category folder + update index
- **Remove skill** — delete a skill folder + remove from index
- **Rebuild index** — run `update-index.ps1` to regenerate BOSS_INDEX.json
- **Fix drift** — reconcile folder structure with index entries

## BOSS Folder Structure

```
.agents/skills/boss/
├── BOSS_INDEX.json      ← master registry (auto-generated)
├── SKILL.md             ← BOSS meta-orchestrator
├── update-index.ps1     ← index rebuild script
├── code-plan/           ← skills for code planning
├── debugging/           ← debugging & troubleshooting skills
├── doc-create/          ← document creation skills
├── github/              ← GitHub/Git operations
├── marketing/           ← marketing & growth
├── memory/              ← memory & knowledge management
├── tools/               ← general tools & utilities
├── ui-ux/               ← UI/UX, design, frontend
└── writing/             ← writing & content skills
```

## Current Category Mapping

| Category Folder | Purpose | Example Skills |
|----------------|---------|----------------|
| `code-plan` | Code planning, architecture | squirrel |
| `debugging` | Debug, fix, troubleshoot | systematic-debugging, bug-hunter, logic-lens, performance-optimizer |
| `doc-create` | Create documents, presentations | python-pptx-generator |
| `github` | Git, GitHub, CI/CD | git-pushing, codebase-audit-pre-push |
| `marketing` | Marketing, growth, SEO, social | social-post-writer-seo |
| `memory` | Memory systems, knowledge | mcp-agent-memory |
| `tools` | General tools, utilities | youtube-summarizer |
| `ui-ux` | UI, UX, design, frontend | ui-a11y, ui-component, frontend-design |
| `writing` | Writing, copywriting, content | copywriting, unslop, wordpress-centric-blog |

## Workflow

### AUDIT — Find Drift Between Folders and Index

1. **Scan folder structure**:

```powershell
$bossDir = ".agents/skills/boss"
$categoryDirs = Get-ChildItem -Path $bossDir -Directory | Where-Object {
    $_.Name -notin @('scripts', 'repo-manager')
} | Sort-Object Name

foreach ($cat in $categoryDirs) {
    $skills = Get-ChildItem -Path $cat.FullName -Directory | Sort-Object Name
    Write-Host "$($cat.Name): $($skills.Count) skills"
    foreach ($s in $skills) {
        $hasMd = Test-Path (Join-Path $s.FullName "SKILL.md")
        Write-Host "  $($s.Name) $(if(-not $hasMd){'[NO SKILL.md]'})"
    }
}
```

2. **Compare against BOSS_INDEX.json** — for each index entry:
   - Does the path still exist?
   - Does the category match the actual folder?
   - Are there skills in folders missing from the index?

3. **Report mismatches**:

| Issue | Severity | Fix |
|-------|----------|-----|
| Skill in folder but not in index | Warning | Add to index, run update-index.ps1 |
| Index entry but folder missing | Critical | Remove from index or restore folder |
| Category mismatch | Warning | Update either folder location or index entry |
| Empty tags/tracks | Info | Enrich frontmatter |
| `risk: "unknown"` | Info | Set correct risk level |

### ADD SKILL — Install New Skill to Boss

1. **Determine category** — match skill purpose to category table above
2. **Check for duplicates** — search BOSS_INDEX.json for same name
3. **Create folder**:

```powershell
New-Item -ItemType Directory -Path ".agents/skills/boss/<category>/<skill-name>" -Force
```

4. **Write SKILL.md** — with proper BOSS frontmatter (see skill-create)
5. **Add to BOSS_INDEX.json** — insert entry matching schema
6. **Run update-index.ps1**:

```powershell
powershell -ExecutionPolicy Bypass -File .agents/skills/boss/update-index.ps1
```

### MOVE SKILL — Change Category

1. **Confirm source and destination** — old category → new category
2. **Move folder**:

```powershell
Move-Item -Path ".agents/skills/boss/<old-category>/<skill-name>" `
          -Destination ".agents/skills/boss/<new-category>/<skill-name>" -Force
```

3. **Update BOSS_INDEX.json** — change `category` and `path` fields
4. **Run update-index.ps1**

### REMOVE SKILL — Delete Skill

1. **Confirm deletion** — warn user, this is destructive
2. **Remove folder**:

```powershell
Remove-Item -Path ".agents/skills/boss/<category>/<skill-name>" -Recurse -Force
```

3. **Remove from BOSS_INDEX.json** — delete the entry
4. **Run update-index.ps1**

### REBUILD INDEX — Full Regeneration

Run the update script:

```powershell
powershell -ExecutionPolicy Bypass -File .agents/skills/boss/update-index.ps1
```

**Note**: update-index.ps1 only scans one-level-deep category folders. It skips:
- Folders at category root level (no subfolder)
- Folders 2+ levels deep
- The `scripts/` folder

For skills in non-standard locations, manually add entries to BOSS_INDEX.json.

### FIX DRIFT — Full Reconciliation

Run this combined check:

```powershell
$bossDir = ".agents/skills/boss"
$index = Get-Content "$bossDir/BOSS_INDEX.json" -Raw | ConvertFrom-Json

# Get all actual skill folders
$actualSkills = @()
$categoryDirs = Get-ChildItem -Path $bossDir -Directory | Where-Object { $_.Name -ne 'scripts' }
foreach ($cat in $categoryDirs) {
    $skillDirs = Get-ChildItem -Path $cat.FullName -Directory -ErrorAction SilentlyContinue
    foreach ($s in $skillDirs) {
        $actualSkills += @{
            Path = "$($cat.Name)/$($s.Name)"
            Category = $cat.Name
        }
    }
}

# Find index entries without folders
foreach ($entry in $index.skills) {
    $folderExists = $actualSkills | Where-Object { $_.Path -eq $entry.path }
    if (-not $folderExists) {
        Write-Host "ORPHAN: $($entry.path) in index but no folder" -ForegroundColor Red
    }
}

# Find folders without index entries
foreach ($actual in $actualSkills) {
    $inIndex = $index.skills | Where-Object { $_.path -eq $actual.Path }
    if (-not $inIndex) {
        Write-Host "MISSING: $($actual.Path) in folder but not in index" -ForegroundColor Yellow
    }
}

# Find category mismatches
foreach ($entry in $index.skills) {
    $actual = $actualSkills | Where-Object { $_.Path -eq $entry.path }
    if ($actual -and $actual.Category -ne $entry.category) {
        Write-Host "MISMATCH: $($entry.path) index says '$($entry.category)' but folder is '$($actual.Category)'" -ForegroundColor Magenta
    }
}

Write-Host "`nTotal in index: $($index.skills.Count)"
Write-Host "Total in folders: $($actualSkills.Count)"
```

## BOSS_INDEX.json Entry Schema

```json
{
  "id": "skill-folder-name",
  "name": "Human Readable Name",
  "description": "WHAT it does + WHEN to use it",
  "category": "boss-category-folder-name",
  "tags": ["tag1", "tag2", "tag3"],
  "triggers": ["verb1", "verb2", "verb3"],
  "risk": "safe",
  "path": "category/skill-folder-name",
  "source": "installed"
}
```

## Key Rules

- `category` field MUST match the actual folder name under `boss/`
- `path` field MUST be `"category/skill-name"` matching actual location
- `id` should match the skill folder name (kebab-case)
- Always run `update-index.ps1` after structural changes
- Never leave `risk: "unknown"` — determine the actual risk level
- Empty `tags` arrays should be populated for discoverability
- Empty `triggers` arrays should be populated for BOSS matching

## Integration with Other Skills

- **skill-create** — creates the skill content; skill-manage puts it in the right folder
- **skill-aquire** — downloads and adapts external skills; skill-manage categorizes and indexes
- Both skill-create and skill-aquire should call skill-manage's move/add/index workflows
