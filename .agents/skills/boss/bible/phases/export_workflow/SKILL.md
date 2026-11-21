---
name: bible-study-export-workflow
category: bible
phase: export_workflow
description: "Export workflow - Generates leader/participant guides in HTML, RTF, GDoc, PDF using shared export-config.yaml."
triggers: ["bible-study-export", "export bible study", "generate booklet", "create docs"]
---

# Bible Study Export Workflow Skill

## Purpose
Convert Bible study markdown into professionally formatted output formats using the centralized createDocs engine and shared export-config.yaml.

## Inputs
- `source`: Path to markdown file (single study or series)
- `formats`: Comma-separated: html, rtf, gdoc, pdf (default: all)
- `output_dir`: Optional output directory (default: same as source)
- `mode`: "leader" | "participant" | "both" (default: "both")

## Outputs
```json
{
  "source": "Mark_biblestudies.md",
  "outputs": {
    "leader": {
      "html": "Mark_leadersguide.html",
      "rtf": "Mark_leadersguide.rtf",
      "gdoc": "https://docs.google.com/...",
      "pdf": "Mark_leadersguide.pdf"
    },
    "participant": {
      "html": "Mark.html",
      "rtf": "Mark.rtf",
      "gdoc": "https://docs.google.com/...",
      "pdf": "Mark.pdf"
    }
  },
  "validation": {"passed": true, "warnings": []}
}
```

## Instructions

### 1. Load Export Configuration
Read `.agents/skills/boss/bible/export-config.yaml` for all formatting rules.

### 2. Validate Source Markdown
Run `quality_gates.py --gate export_ready` on source.
If failed, return errors and stop.

### 3. Prepare Source for Each Mode
**Leader Guide**: Keep `<!-- ANSWER ... -->` comments
**Participant Guide**: Strip `<!-- ANSWER ... -->` comments

### 4. Generate Formats via createDocs

**HTML (Leader + Participant):**
```powershell
$SkillRoot = Resolve-Path '.agents\skills\boss\bible\sync-docs'
# Leader
& py "$SkillRoot\scripts\create_docs.py" "[Source]" --html --output "[Name]_leadersguide.html" --mode leader
# Participant
& py "$SkillRoot\scripts\create_docs.py" "[Source]" --html --output "[Name].html" --mode participant
```

**RTF (Leader + Participant):**
```powershell
# Leader (uses md_to_rtf_studies.py for studies)
& py "$SkillRoot\scripts\md_to_rtf_studies.py" "[Source]" "[Output]_leadersguide.rtf"
# Participant (strip answers first)
& py "$SkillRoot\scripts\md_to_rtf_studies.py" "[Source_NoAnswers]" "[Output].rtf"
```

**Google Docs (Leader + Participant):**
```powershell
# Leader
& py "$SkillRoot\scripts\md_to_gdoc.py" "[Source]" --export pdf,docx,rtf
# Participant (strip answers first)
& py "$SkillRoot\scripts\md_to_gdoc.py" "[Source_NoAnswers]" --export pdf,docx,rtf
```

**PDF:**
- Generated via `create_docs.py --pdf` (requires HTML first)
- Or via Google Docs export

### 5. Apply Export Config Rules

**Page Boundaries:**
- `---`, `***`, `___` → new page (structural, not decorative)
- Title page → TOC → Reference page → Study 1 → Study 2...

**Study Headers (Mark Standard):**
- `.header-top` grid (70px 1fr), 3px double border bottom
- Number box: 70x70, #FF7300, white, Inter Tight 800
- Title: H1, Inter Tight 800, capitalized
- Subtitle: 0.95rem, grey italic

**Metadata Blocks:**
- Background: #F8F9FA
- Border-left: 4px solid #60695C
- Labels: Orange bold uppercase (MAIN IDEA, PASSAGES)

**Question Numbering:**
- CSS counters: `.study-container { counter-reset: question }`
- `ol li::before { content: counter(question) "." }`
- Continuous within study, resets per study

**Bible Links:**
- `> Read [Passage]` → `> Read [Passage](https://team.newlight.app/bible?&q=[Encoded])`

**Answer Rendering:**
- Leader: `<!-- ANSWER ... -->` → `<div class="answer-block">...</div>`
- Participant: Strip entirely

**TOC:**
- Separate page after title page
- Columns: # (10%) | Study (90%) with title + passages

### 6. Upload Google Docs
- Use folder structure: `Sermons_n_Series/{Year}/{Series}/`
- Root folder ID: `1dGRJkjh5hVGvhYc5cZ7k99BeCNA262yy`
- Template ID: `1o3tbW_5jlMNsFKaZhht9xfT8rx6mYUdpqYfTJ3o8Zn8`

### 7. Return Output Paths/URLs
Provide local file paths and Google Doc URLs.

## Example Invocation
```bash
python .agents/scripts/phase_dispatcher.py export --source "Mark_biblestudies.md" --formats html,rtf,gdoc,pdf --mode both
```