---
name: skill-aquire
description: "Search and install skills from antigravity-awesome-skills GitHub repo. Use when adding external skills to BOSS. Downloads full skill folders, adapts for BOSS compatibility."
category: meta
risk: moderate
source: local
tags: [acquisition, install, awesome-skills, github, search, import]
triggers: [search, find, install, aquire, import, download, discover, browse]
allowed-tools: Read Write Glob Grep Bash
---

# Skill Aquire

Search and install skills from [antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills) GitHub repo. Downloads full skill folder (all supporting files), adapts for BOSS compatibility.

## Data Source

- **Local index**: `awesome-skills_index.json` — 33K+ entries, searchable offline
- **Remote repo**: `https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills` — source of truth
- **Raw download**: `https://raw.githubusercontent.com/sickn33/antigravity-awesome-skills/main/skills/<skill-name>/`

## Workflow

### Phase 1: SEARCH

1. **Understand need** — what capability?
2. **Search local index** — grep `awesome-skills_index.json`:
```powershell
Select-String -Path "awesome-skills_index.json" -Pattern "<keyword>" -CaseSensitive:$false
```
3. **Cross-ref index** — check if already installed:
```powershell
Select-String -Path "../boss/alphabetical-index.json" -Pattern "<skill-name>" -CaseSensitive:$false
```
4. **Present results** — name, description, awesome-skills category, BOSS install status

### Phase 2: SELECT

1. **User picks skill** from results
2. **Map category** — awesome-skills → BOSS:

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

3. **Confirm path**: `.agents/skills/boss/<category>/<skill-name>/`

### Phase 3: DOWNLOAD

**Option A: Sparse git clone (recommended)**
```powershell
$tempDir = "$env:TEMP\awesome-skill-download"
git clone --depth 1 --filter=blob:none --sparse `
  https://github.com/sickn33/antigravity-awesome-skills.git $tempDir
cd $tempDir
git sparse-checkout set "skills/<skill-name>"
```

**Option B: Direct raw download (simple skills)**
```powershell
$baseUrl = "https://raw.githubusercontent.com/sickn33/antigravity-awesome-skills/main/skills/<skill-name>"
Invoke-WebRequest -Uri "$baseUrl/SKILL.md" -OutFile "<target>/SKILL.md"
```

Copy to target:
```powershell
$target = ".agents/skills/boss/<category>/<skill-name>"
Copy-Item -Path "$tempDir/skills/<skill-name>" -Destination $target -Recurse -Force
Remove-Item $tempDir -Recurse -Force
```

### Phase 4: ADAPT

1. **Review frontmatter** — ensure BOSS fields:
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
   - `category` → BOSS category folder name
   - `source` → `"adapted"`
   - Adjust `tags` for BOSS discovery
   - Adjust `triggers` with action verbs
   - Set `risk` appropriately
   - Ensure `description` has WHAT + WHEN

3. **Review body**:
   - Remove Claude Code/Opencode/toolchain refs if irrelevant
   - Ensure BOSS/agent-agnostic context
   - Keep all supporting files (scripts/, references/, etc.)

4. **Validate** — run skill-check:
```powershell
# Read skill-check/SKILL.md and apply validation
```

### Phase 5: REGISTER (Delegate to skill-manage)

**skill-manage is the single registration authority. Do NOT edit any index directly.**

1. Hand off to `../skill-manage/SKILL.md` → follow its **ADD SKILL** (canonical registration) workflow
2. Ensure frontmatter `category:` matches the target folder (skill-manage validates)
3. skill-manage runs `update-index.ps1` to regenerate both indexes + legacy index
4. Verify: skill appears in `category-index.json` and `alphabetical-index.json` with `source: "adapted"`

## Search Tips

Index schema per entry:
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

Strategies:
- **By capability**: grep verbs ("generate", "analyze", "build")
- **By domain**: grep terms ("seo", "wordpress", "react", "api")
- **By category**: filter by `category` field
- **By target**: check `plugin.targets` for BOSS-compatible

## Key Rules

- Cross-ref alphabetical-index.json before install (avoid duplicates)
- Adapt frontmatter to BOSS schema before indexing
- Preserve all supporting files from original
- Set `source` to `"adapted"` for acquired skills
- If exists in BOSS, suggest update over overwrite
- Clean up temp files after download
