---
name: skill-aquire
description: "Search and install skills from the antigravity-awesome-skills GitHub repository. Use when looking for external skills to add to the BOSS repo. Downloads full skill folders including all supporting files, then adapts them for BOSS compatibility."
category: meta
risk: moderate
source: local
tags: [acquisition, install, awesome-skills, github, search, import]
triggers: [search, find, install, aquire, import, download, discover, browse]
allowed-tools: Read Write Glob Grep Bash
---

# Skill Aquire

Search and install skills from the [antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills) GitHub repository. Downloads the full skill folder (including all supporting files), then adapts it for BOSS compatibility.

## Data Source

- **Local index**: `awesome-skills_index.json` (in this directory) — 33K+ entries, searchable offline
- **Remote repo**: `https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills` — source of truth for downloads
- **Raw download**: `https://raw.githubusercontent.com/sickn33/antigravity-awesome-skills/main/skills/<skill-name>/`

## Workflow

### Phase 1: SEARCH

1. **Understand the need** — what capability is the user looking for?
2. **Search the local index** — grep `awesome-skills_index.json` for matching terms:

```powershell
# Search by keyword in name/description
Select-String -Path "awesome-skills_index.json" -Pattern "<keyword>" -CaseSensitive:$false
```

3. **Cross-reference BOSS_INDEX** — check if already installed:

```powershell
Select-String -Path "../boss/BOSS_INDEX.json" -Pattern "<skill-name>" -CaseSensitive:$false
```

4. **Present results** — show matching skills with:
   - Name and description
   - Category (awesome-skills category, not BOSS category)
   - Whether already installed in BOSS

### Phase 2: SELECT

1. **User picks a skill** from the search results
2. **Confirm the target BOSS category** — map from awesome-skills category to BOSS category:

| Awesome Category | BOSS Category |
|-----------------|---------------|
| development | development |
| design | ui-ux |
| writing | writing |
| marketing | marketing |
| content | content |
| debugging | debugging |
| github | github |
| memory | meta |
| security | tools |
| devops | tools |
| workflow | tools |
| ai-agents | meta |
| ai-ml | development |

3. **Confirm install path**: `.agents/skills/boss/<category>/<skill-name>/`

### Phase 3: DOWNLOAD

Clone or download the skill from GitHub. Two approaches:

**Option A: Sparse git clone (recommended for single skill)**

```powershell
# Create temp clone with sparse checkout
$tempDir = "$env:TEMP\awesome-skill-download"
git clone --depth 1 --filter=blob:none --sparse `
  https://github.com/sickn33/antigravity-awesome-skills.git $tempDir
cd $tempDir
git sparse-checkout set "skills/<skill-name>"
```

**Option B: Direct raw download (for simple skills)**

```powershell
# Download individual files via raw.githubusercontent.com
$baseUrl = "https://raw.githubusercontent.com/sickn33/antigravity-awesome-skills/main/skills/<skill-name>"
Invoke-WebRequest -Uri "$baseUrl/SKILL.md" -OutFile "<target>/SKILL.md"
```

After download, copy the full skill folder to the target:

```powershell
$target = ".agents/skills/boss/<category>/<skill-name>"
Copy-Item -Path "$tempDir/skills/<skill-name>" -Destination $target -Recurse -Force
```

Clean up temp:

```powershell
Remove-Item $tempDir -Recurse -Force
```

### Phase 4: ADAPT

The downloaded skill needs BOSS compatibility:

1. **Review the SKILL.md frontmatter** — ensure it has BOSS-required fields:

```yaml
---
name: skill-name
description: "WHAT it does + WHEN to use it"
category: <boss-category>
risk: safe
source: adapted
tags: [tag1, tag2]
triggers: [verb1, verb2]
allowed-tools:
---
```

2. **Adapt frontmatter**:
   - Set `category` to the BOSS category folder name
   - Set `source` to `"adapted"`
   - Add/adjust `tags` for BOSS discovery
   - Add/adjust `triggers` with action verbs
   - Set `risk` appropriately
   - Ensure `description` includes WHAT + WHEN

3. **Review the body**:
   - Remove references to Claude Code / Opencode / specific toolchains if not relevant
   - Ensure instructions work in the BOSS/agent-agnostic context
   - Keep all supporting files (scripts/, references/, etc.)

4. **Validate** — run skill-check against the adapted skill:

```powershell
# Read skill-check/SKILL.md and apply its validation
```

### Phase 5: INDEX

1. Add entry to BOSS_INDEX.json with `source: "adapted"`
2. Run update-index.ps1:

```powershell
powershell -ExecutionPolicy Bypass -File .agents/skills/boss/update-index.ps1
```

## Search Tips

The `awesome-skills_index.json` has this schema per entry:

```json
{
  "id": "skill-folder-name",
  "path": "skills/skill-folder-name",
  "category": "awesome-category",
  "name": "Human Name",
  "description": "What it does",
  "risk": "safe|moderate|critical",
  "source": "...",
  "date_added": "...",
  "plugin": {
    "targets": ["claude-code", "cursor", ...],
    "setup": "...",
    "reasons": [...]
  }
}
```

Search strategies:
- **By capability**: grep for verbs in description ("generate", "analyze", "build")
- **By domain**: grep for domain terms ("seo", "wordpress", "react", "api")
- **By category**: filter the JSON by `category` field
- **By target**: check `plugin.targets` for BOSS-compatible skills

## Key Rules

- Always cross-ref BOSS_INDEX before installing (avoid duplicates)
- Always adapt frontmatter to BOSS schema before indexing
- Preserve all supporting files from the original skill
- Set `source` to `"adapted"` (not `"installed"`) for aquired skills
- If a skill already exists in BOSS, suggest updating instead of overwriting
- Clean up temp files after download
