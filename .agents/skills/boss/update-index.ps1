# update-index.ps1
# Rebuilds the BOSS skill indexes by scanning all one-level-deep category folders
# under .agents/skills/boss/ for SKILL.md files.
# Run this after adding, removing, or updating any skill.
#
# Outputs (written to the BOSS skill root):
#   - category-index.json      (CAT-IDX: skills grouped by category for agent reasoning)
#   - alphabetical-index.json  (ALPHA-IDX: flat skills array for human reference)
#   - BOSS_INDEX.json          (Legacy: kept for backward compatibility)
#   - 01-manage/skill-manage/refs/categories.md  (LIVE category reference, auto-generated)

# --- Resolve BOSS root regardless of script location --------------------------
# Walk up from the script directory until we find the folder that contains
# SKILL.md and 01-manage/ (i.e. the BOSS skill root).
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$bossDir = $scriptDir
while (-not (Test-Path (Join-Path $bossDir 'SKILL.md')) -and (Split-Path $bossDir -Parent) -ne $bossDir) {
    $bossDir = Split-Path $bossDir -Parent
}

$catIdxFile = Join-Path $bossDir "category-index.json"
$alphaIdxFile = Join-Path $bossDir "alphabetical-index.json"
$legacyIdxFile = Join-Path $bossDir "BOSS_INDEX.json"
$refsCategoriesFile = Join-Path $bossDir "01-manage\skill-manage\refs\categories.md"

# --- Category descriptions (manually curated - source of truth for CAT-IDX) ---
# Maintained by skill-manage. cat_id MUST match the folder name exactly.
$categoryDescriptions = @{
    "00-setup"  = "Scaffold and configure an agentic workspace: agents.md, skill junctions, BOSS index"
    "ai-meta"   = "Optimize agent context, prompts, and multi-agent orchestration for token efficiency"
    "ai-skills" = "Build and refine LLM prompts, instructions, and agent behaviors"
    "bible"     = "Biblical research, sermon preparation, and theological study"
    "code-plan" = "Plan features, design architecture, create technical specs, break down work"
    "content"   = "Create, transform, and manage content assets"
    "debugging" = "Debug production issues: logging, profiling, error analysis, root cause analysis"
    "design"    = "Visual design, brand guidelines, and UI patterns"
    "doc-create"= "Generate documents, presentations, and formatted outputs"
    "github"    = "Git operations, GitHub workflows, CI/CD pipelines"
    "marketing" = "Marketing strategy, growth tactics, SEO, social media"
    "memory"    = "Knowledge management, persistent memory, context persistence"
    "seo"       = "Search engine optimization, keyword research, content optimization"
    "tools"     = "General utilities, converters, and helper scripts"
    "ui-ux"     = "User interface design, accessibility, frontend components"
    "writing"   = "Writing, copywriting, editing, and content creation"
}

# Vague terms to exclude from search_terms (too generic to be useful)
$vagueTerms = @("fix", "solve", "manage", "handle", "process", "tool", "utility", "helper", "support", "enable", "provide", "create", "build", "make", "generate", "use", "work", "run", "execute", "perform", "apply", "implement", "develop", "design", "plan", "organize", "structure", "optimize", "improve", "enhance", "refactor", "clean", "maintain", "update", "modify", "change", "adjust", "configure", "setup", "install", "deploy", "release", "publish", "deliver", "ship", "complete", "finish", "done")

# Specific coder terms to prefer in search_terms
$specificTerms = @("debug", "error", "exception", "crash", "profile", "trace", "log", "import", "type", "wildcard", "lint", "test", "unit", "integration", "push", "commit", "branch", "merge", "ci", "cd", "pipeline", "build", "compile", "bundle", "minify", "compress", "cache", "token", "context", "llm", "prompt", "agent", "memory", "vector", "embed", "search", "index", "query", "filter", "sort", "transform", "convert", "parse", "serialize", "validate", "schema", "migrate", "seed", "backup", "restore", "monitor", "alert", "metric", "dashboard", "ui", "ux", "component", "accessib", "responsive", "css", "html", "js", "ts", "react", "vue", "api", "rest", "graphql", "auth", "oauth", "jwt", "encrypt", "decrypt", "hash", "sign", "verify", "git", "github", "gitlab", "pr", "review", "rebase", "stash", "tag", "release", "version", "semver", "changelog", "doc", "readme", "markdown", "pdf", "pptx", "word", "excel", "csv", "json", "yaml", "xml", "sql", "db", "database", "migration", "orm", "entity", "repository", "service", "controller", "middleware", "route", "endpoint", "handler", "dto", "model", "view", "template", "render", "layout", "partial", "directive", "pipe", "guard", "interceptor", "decorator", "provider", "module", "inject", "singleton", "lifecycle", "hook", "effect", "state", "prop", "reducer", "action", "dispatch", "store", "selector", "memo", "callback", "ref", "portal", "suspense", "lazy", "router", "client", "server", "node", "python", "javascript", "typescript", "powerpoint", "slide", "deck", "video", "youtube", "transcript", "audio", "church", "sermon", "bible", "scripture", "nlt", "exegesis", "theology", "homiletics", "rhetoric", "seo", "keyword", "meta", "snippet", "cannibalization", "backlink", "analytics", "copywriting", "headline", "cta", "brand", "logo", "color", "typography", "wireframe", "mockup", "prototype", "storyboard", "photo", "image", "stock", "unsplash", "jina", "search-foundation", "scrape", "crawl", "extract", "summarize")

# --- Helper functions (must be defined before use) ---------------------------

function Generate-SkillDescription {
    param(
        [string]$description,
        [string]$name,
        [string[]]$tags
    )

    if (-not $description) {
        return "No description available"
    }

    # Transform from "what it does" to "when/why to use" (task-focused)
    $desc = $description.Trim()

    # Normalise leading whitespace/colon after the description field
    $desc = $desc -replace '^:\s*', ''

    $patterns = @(
        @{pattern = '^Refine and optimize (.+)'; replacement = 'Improve $1: rewrite, add examples, tune parameters'},
        @{pattern = '^Fetch the exact wording of (.+)'; replacement = 'Retrieve $1: exact lookup for study or reference'},
        @{pattern = '^Transform (.+) into (.+)'; replacement = 'Convert $1 to $2: transform for $2'},
        @{pattern = '^Generate (.+)'; replacement = 'Create $1: generate from input'},
        @{pattern = '^Analyze (.+)'; replacement = 'Analyze $1: inspect and report findings'},
        @{pattern = '^Optimize (.+)'; replacement = 'Optimize $1: improve performance/efficiency'},
        @{pattern = '^Debug (.+)'; replacement = 'Debug $1: find and fix issues'},
        @{pattern = '^Test (.+)'; replacement = 'Test $1: verify functionality'},
        @{pattern = '^Deploy (.+)'; replacement = 'Deploy $1: release to environment'},
        @{pattern = '^Build (.+)'; replacement = 'Build $1: compile and package'},
        @{pattern = '^Create (.+)'; replacement = 'Create $1: generate new'},
        @{pattern = '^Manage (.+)'; replacement = 'Manage $1: administer and configure'},
        @{pattern = '^Monitor (.+)'; replacement = 'Monitor $1: observe and alert'},
        @{pattern = '^Sync (.+)'; replacement = 'Sync $1: synchronize across systems'},
        @{pattern = '^Convert (.+)'; replacement = 'Convert $1: transform format'},
        @{pattern = '^Validate (.+)'; replacement = 'Validate $1: check correctness'},
        @{pattern = '^Extract (.+)'; replacement = 'Extract $1: pull data from source'},
        @{pattern = '^Research (.+)'; replacement = 'Research $1: investigate and synthesize'},
        @{pattern = '^Plan (.+)'; replacement = 'Plan $1: design approach and steps'},
        @{pattern = '^Design (.+)'; replacement = 'Design $1: architect solution'},
        @{pattern = '^Write (.+)'; replacement = 'Write $1: produce content'},
        @{pattern = '^Review (.+)'; replacement = 'Review $1: evaluate quality'},
        @{pattern = '^Audit (.+)'; replacement = 'Audit $1: inspect compliance'},
        @{pattern = '^Use before (.+)'; replacement = '$1: use before implementation'},
        @{pattern = '^Use for (.+)'; replacement = '$1: use for this purpose'},
        @{pattern = '^Use to (.+)'; replacement = '$1: use to accomplish this'},
        @{pattern = '^Use when (.+)'; replacement = '$1: use when needed'},
        @{pattern = '^Helps (.+)'; replacement = '$1: helps with this task'},
        @{pattern = '^Enables (.+)'; replacement = '$1: enables this capability'},
        @{pattern = '^Provides (.+)'; replacement = '$1: provides this functionality'},
        @{pattern = '^Allows (.+)'; replacement = '$1: allows this action'},
        @{pattern = '^Context optimization extends (.+)'; replacement = 'Reduce token usage for small-context LLMs: compression, caching, partitioning strategies'},
        @{pattern = '^(.+) extends the effective capacity (.+)'; replacement = 'Reduce token usage: $1 strategies for limited context windows'},
        @{pattern = '^(.+), use when (.+)'; replacement = '$1: use when $2'},
        @{pattern = '^(.+)\. Use when (.+)'; replacement = '$1: use when $2'},
        @{pattern = '^Create, update, or maintain (.+)'; replacement = 'Create, update, or maintain $1: agent documentation setup'},
        @{pattern = '^Create, update, or maintain (.+) files? with (.+)'; replacement = 'Create, update, or maintain $1 files: $2'},
        @{pattern = '^Scaffold a complete (.+)'; replacement = 'Scaffold a complete $1: full workspace bootstrapping'}
    )

    foreach ($p in $patterns) {
        if ($desc -match $p.pattern) {
            $desc = $desc -replace $p.pattern, $p.replacement
            break
        }
    }

    # Fallback: strip weak leading articles so the description stays task-focused
    # and starts with a meaningful phrase (no "Use for: " prefix pollution).
    $desc = $desc -replace '^(This skill|This tool|This agent|This|It|The|A|An)\s+', ''

    # Truncate to a reasonable length
    if ($desc.Length -gt 150) {
        $desc = $desc.Substring(0, 147) + "..."
    }

    return $desc
}

function Generate-SearchTerms {
    param(
        [string]$description,
        [string[]]$tags,
        [string]$name,
        [string[]]$triggers
    )

    $allTerms = @()

    # Add tags
    $allTerms += $tags

    # Add triggers
    $allTerms += $triggers

    # Extract terms from description (split on non-word chars, filter)
    if ($description) {
        $descTerms = $description -split '\W+' | Where-Object {
            $_ -and $_.Length -gt 2 -and $_ -notmatch '^\d+$'
        }
        $allTerms += $descTerms
    }

    # Add name parts (kebab/underscore split)
    $nameParts = $name -split '[-_]'
    $allTerms += $nameParts

    # Filter: remove vague terms and common stop words, keep specific coder terms
    $filtered = $allTerms | ForEach-Object { $_.ToLower().Trim() } |
        Where-Object {
            $_ -and
            $_.Length -gt 1 -and
            $vagueTerms -notcontains $_ -and
            $_ -notmatch '^(the|and|for|with|from|this|that|will|can|has|have|been|was|were|are|being|does|did|do|get|got|set|put|let|may|might|must|should|could|would|shall|when|any|all|into|about|your|you|our|we)\w*$'
        } |
        Sort-Object -Unique

    # Prefer specific terms, then fill with remaining filtered terms, max 5
    $preferred = @($filtered | Where-Object { $specificTerms -contains $_ } | Select-Object -First 5)
    if ($preferred.Count -lt 5) {
        $remaining = @($filtered | Where-Object { $specificTerms -notcontains $_ } | Select-Object -First (5 - $preferred.Count))
        $preferred += $remaining
    }

    return (($preferred | Select-Object -First 5) -join ', ')
}

# --- Main ---------------------------------------------------------------------

$skills = @()
$skillCount = 0
$skipCount = 0
$errorCount = 0
$warningCount = 0

# Get all immediate subdirectories (category folders) that contain skill folders
$categoryDirs = @(Get-ChildItem -Path $bossDir -Directory | Where-Object {
        # Skip tooling folders (not categories)
        $_.Name -notin @('scripts', '01-manage') -and
        # Only include folders that have subfolders (skills are one level deep)
        (Get-ChildItem -Path $_.FullName -Directory -ErrorAction SilentlyContinue).Count -gt 0
    } | Sort-Object Name)

foreach ($catDir in $categoryDirs) {
    $category = $catDir.Name
    $skillDirs = @(Get-ChildItem -Path $catDir.FullName -Directory -ErrorAction SilentlyContinue | Sort-Object Name)

    foreach ($skillDir in $skillDirs) {
        $skillMd = Join-Path $skillDir.FullName "SKILL.md"
        if (-not (Test-Path $skillMd)) {
            Write-Host "WARNING: $($skillDir.Name) has no SKILL.md" -ForegroundColor Yellow
            $warningCount++
            continue
        }

        $content = Get-Content $skillMd -Raw -Encoding UTF8

        # Extract YAML frontmatter
        $name = $skillDir.Name
        $description = ""
        $skillCategory = $category
        $tags = @()
        $triggers = @()

        if ($content -match '(?s)---\s*\n(.*?)\n---') {
            $frontmatter = $matches[1]

            if ($frontmatter -match '(?m)^name:\s*(.+)') {
                $name = $matches[1].Trim().Trim('"').Trim("'")
            }
            if ($frontmatter -match '(?m)^description:\s*(.+)') {
                $description = $matches[1].Trim().Trim('"').Trim("'")
            }
            if ($frontmatter -match '(?m)^category:\s*(.+)') {
                $skillCategory = $matches[1].Trim()
            }
            if ($frontmatter -match '(?m)^tags:\s*\[(.+?)\]') {
                $tags = @($matches[1] -split ',' | ForEach-Object { $_.Trim().Trim('"').Trim("'") } | Where-Object { $_ -ne '' })
            }
            if ($frontmatter -match '(?m)^triggers:\s*\[(.+?)\]') {
                $triggers = @($matches[1] -split ',' | ForEach-Object { $_.Trim().Trim('"').Trim("'") } | Where-Object { $_ -ne '' })
            }
        }

        # Validate category matches folder
        if ($skillCategory -ne $category) {
            Write-Host "ERROR: $($skillDir.Name) frontmatter category '$skillCategory' != folder '$category'" -ForegroundColor Red
            $errorCount++
        }

        # Generate skill description (when/why format) from frontmatter description
        $skillDesc = Generate-SkillDescription -description $description -name $name -tags $tags

        # Generate search_terms (specific coder terms, max 5, comma-separated)
        $searchTerms = Generate-SearchTerms -description $description -tags $tags -name $name -triggers $triggers

        # Build skill object for CAT-IDX
        $catSkill = [PSCustomObject]@{
            id          = $skillDir.Name
            description = $skillDesc
            path        = "$category/$($skillDir.Name)"
        }

        # Build skill object for ALPHA-IDX
        $alphaSkill = [PSCustomObject]@{
            id          = $skillDir.Name
            description = $skillDesc
            path        = "$category/$($skillDir.Name)"
            search_terms = $searchTerms
        }

        # Build skill object for legacy BOSS_INDEX.json
        $legacyTriggers = @()
        if ($description) {
            $triggerPatterns = @(
                "create", "build", "debug", "fix", "audit", "review",
                "design", "write", "plan", "test", "deploy", "analyze",
                "optimize", "convert", "generate", "push", "summarize",
                "validate", "track"
            )
            $descLower = $description.ToLower()
            foreach ($tp in $triggerPatterns) {
                if ($descLower -match "\b$tp\w*\b") {
                    $legacyTriggers += $tp
                }
            }
        }

        $legacySkill = [PSCustomObject]@{
            id          = $skillDir.Name
            name        = $name
            description = if ($description) { $description.Substring(0, [Math]::Min(200, $description.Length)) } else { "" }
            category    = $skillCategory
            tags        = $tags
            triggers    = $legacyTriggers | Sort-Object -Unique
            path        = "$category/$($skillDir.Name)"
            source      = "installed"
        }

        # Add to collections
        $skills += [PSCustomObject]@{
            Category     = $category
            Skill        = $catSkill
            AlphaSkill   = $alphaSkill
            LegacySkill  = $legacySkill
        }

        $skillCount++
    }
}

# Build CAT-IDX: group by category
$catIdxCategories = @()
foreach ($catDir in $categoryDirs) {
    $category = $catDir.Name
    $catSkills = @($skills | Where-Object { $_.Category -eq $category } | ForEach-Object { $_.Skill })

    if ($catSkills.Count -gt 0) {
        $catDesc = if ($categoryDescriptions.ContainsKey($category)) { $categoryDescriptions[$category] } else { "Category: $category" }

        $catIdxCategories += [PSCustomObject]@{
            cat_id              = $category
            category_description = $catDesc
            skills              = $catSkills
        }
    }
}

# Build ALPHA-IDX: flat array sorted by id
$alphaIdxSkills = @($skills | ForEach-Object { $_.AlphaSkill } | Sort-Object id)

# Build legacy BOSS_INDEX.json
$legacySkills = @($skills | ForEach-Object { $_.LegacySkill } | Sort-Object category, name)

# Write CAT-IDX
$catIdxJson = $catIdxCategories | ConvertTo-Json -Depth 10
$catIdxJson | Set-Content $catIdxFile -Encoding UTF8

# Write ALPHA-IDX
$alphaIdxJson = $alphaIdxSkills | ConvertTo-Json -Depth 10
$alphaIdxJson | Set-Content $alphaIdxFile -Encoding UTF8

# Write legacy BOSS_INDEX.json
$legacyIndex = [PSCustomObject]@{
    version     = 2
    generatedAt = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    registryType = "boss-local"
    skills      = $legacySkills
}
$legacyJson = $legacyIndex | ConvertTo-Json -Depth 5
# Fix single-element array serialization for tags/triggers
$legacyJson = [System.Text.RegularExpressions.Regex]::Replace($legacyJson, '"triggers":\s*"((?:(?!\s*\}).)+)"', '"triggers": ["$1"]')
$legacyJson = $legacyJson -replace '"triggers":\s*\{\s*\}', '"triggers": []'
$legacyJson = $legacyJson -replace '"tags":\s*\{\s*\}', '"tags": []'
$legacyJson | Set-Content $legacyIdxFile -Encoding UTF8

# Write LIVE categories.md into skill-manage/refs/ (single source of truth reference)
$refsDir = Split-Path -Parent $refsCategoriesFile
if (-not (Test-Path $refsDir)) {
    New-Item -ItemType Directory -Path $refsDir -Force | Out-Null
}

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("# BOSS Category Reference (LIVE)")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("<!-- AUTO-GENERATED by update-index.ps1. Do not edit manually. -->")
[void]$sb.AppendLine("<!-- Source of truth: SKILL.md frontmatter + skill-manage taxonomy table -->")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("## Category Summary")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("| cat_id | # skills | category_description |")
[void]$sb.AppendLine("|--------|----------|----------------------|")
foreach ($cat in $catIdxCategories) {
    [void]$sb.AppendLine("| $($cat.cat_id) | $($cat.skills.Count) | $($cat.category_description) |")
}
[void]$sb.AppendLine("")
[void]$sb.AppendLine("## Skills by Category")
[void]$sb.AppendLine("")
foreach ($cat in $catIdxCategories) {
    [void]$sb.AppendLine("### $($cat.cat_id) - $($cat.category_description)")
    [void]$sb.AppendLine("")
    [void]$sb.AppendLine("| id | description | path |")
    [void]$sb.AppendLine("|----|-------------|------|")
    foreach ($s in $cat.skills) {
        $sDesc = $s.description -replace '\|', '\|'
        [void]$sb.AppendLine("| $($s.id) | $sDesc | $($s.path) |")
    }
    [void]$sb.AppendLine("")
}
$sb.ToString() | Set-Content $refsCategoriesFile -Encoding UTF8

# Summary
Write-Host "Indexes rebuilt successfully." -ForegroundColor Green
Write-Host "  Categories scanned: $($categoryDirs.Count)" -ForegroundColor Cyan
Write-Host "  Skills indexed: $skillCount" -ForegroundColor Cyan
if ($warningCount -gt 0) {
    Write-Host "  Folders skipped (no SKILL.md): $warningCount" -ForegroundColor Yellow
}
if ($errorCount -gt 0) {
    Write-Host "  Validation errors: $errorCount" -ForegroundColor Red
} else {
    Write-Host "  Validation: OK (no category mismatches)" -ForegroundColor Green
}
