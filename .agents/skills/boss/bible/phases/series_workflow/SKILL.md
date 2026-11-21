---
name: bible-study-series-workflow
category: bible
phase: series_workflow
description: "Series workflow - Orchestrates multiple studies: orient (once) → research/synthesize/design/draft/review per study."
triggers: ["bible-study-series", "new series", "continue series", "series workflow"]
---

# Bible Study Series Workflow Skill

## Purpose
Orchestrate the creation of an entire Bible study series from a sermon outline. Runs orient once per series, then research/synthesize/design/draft/review for each study.

## Inputs
- `outline_path`: Path to sermon outline markdown
- `mode`: "new" | "continue"
- `studies`: Optional number of studies to create (default: all in outline)
- `start_at`: Study number to start at (for continue mode)

## Outputs
```json
{
  "series_title": "Gospel of Mark",
  "series_path": "Sermons_n_Series/2026/GospelOfMark/Mark_biblestudies.md",
  "studies_created": [
    {"number": 1, "title": "The Power over Demons", "passage": "Mark 5:1-20", "status": "complete"},
    {"number": 2, "title": "The Power over Disease", "passage": "Mark 5:21-43", "status": "complete"}
  ],
  "current_study": 3,
  "context_saved": true
}
```

## Instructions

### 1. Parse Sermon Outline
Extract from outline:
- Series title
- For each week: study number, thematic title, summary/outcome, passage reference

### 2. Initialize Series Context
Call context manager `set_series(title, passage_arc)`.

### 3. Create/Load Series Markdown File
- Path: `[series_folder]/[SeriesTitle]_biblestudies.md`
- If new: Generate boilerplate using biblestudy-01-create_series format
- If continue: Load existing, find next study

### 4. Run Orient Phase (Once Per Series)
- Load Grace Dynamic theology
- Load User DNA
- Select research sources for series (can reuse across studies)
- Save series-level research source preferences

### 5. For Each Study (Loop)
For each study in outline (starting at `start_at`):

**5a. Set Study Passage**
Call `set_study_passage(passage)`.

**5b. Research Phase**
- Invoke `bible-study-research` with passage
- Use series-level source preferences + study-specific adjustments
- Quality gate: `research_complete`

**5c. Synthesize Phase**
- Invoke `bible-study-synthesize`
- Quality gate: (implicit in synthesize)

**5d. Design Phase**
- Invoke `bible-study-design`
- Present options to user for selection
- Save selected options

**5e. Draft Phase (Collaborative Loop)**
For each section in reading strategy:
- Invoke `bible-study-draft --section N --type all`
- Present to user for confirmation/refinement
- On confirmation: `add_confirmed_qa_set`
- Repeat until all sections done

**5f. Opening Question**
- Invoke `bible-study-draft --type opening` (special mode)
- User selects from 3-5 options

**5g. Review Phase**
- Invoke `bible-study-review` on complete study markdown
- Quality gate: `export_ready`

**5h. Append to Series File**
- Write study markdown to series file
- Persist editorial decisions

### 6. Update Series Context
- Add pivot verses to `previous_pivot_verses`
- Add focus titles to `recurring_themes`
- Save context

### 7. Export (Optional)
If requested, invoke `bible-study-export` for the series.

## Modes

**NEW Series:**
- Creates new series markdown file
- Runs orient fresh
- Starts at study 1

**CONTINUE Series:**
- Loads existing series markdown
- Loads series context from state
- Runs orient (light - just refresh theology/DNA)
- Starts at `start_at` or next incomplete study

## Example Invocation
```bash
# New series
python .agents/scripts/phase_dispatcher.py series --outline "Sermons_n_Series/2026/GospelOfMark/outline.md" --mode new

# Continue series, start at study 3
python .agents/scripts/phase_dispatcher.py series --outline "Sermons_n_Series/2026/GospelOfMark/outline.md" --mode continue --start-at 3
```