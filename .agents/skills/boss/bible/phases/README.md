# Bible Study Phase Skills

This directory contains the phase-based skills for the optimized Bible study workflow. Each phase is independently invocable and can be re-entered at any time.

## Phase Overview

| Phase | Skill | Purpose | Granular Invocation |
|-------|-------|---------|---------------------|
| 1 | `orient` | Load theology, user DNA, select research sources | No |
| 2 | `research` | Fetch and extract research using ResearchSources.md matrix | No |
| 3 | `synthesize` | Consolidate research, select pivot verse & 2-3 applications | No |
| 4 | `design` | Generate 5 application options + 3-4 reading strategies | No |
| 5 | `draft` | Collaborative O/I/A question drafting | **Yes** (`--section N --type observe|interpret|apply`) |
| 6 | `review` | Final validation before export | No |
| 7 | `export` | Multi-format generation (HTML, RTF, GDoc, PDF) | No |

## Orchestration Skills

| Skill | Purpose |
|-------|---------|
| `series_workflow` | Orchestrates multiple studies: orient (once) → research/synthesize/design/draft/review per study |
| `export_workflow` | Generates leader/participant guides using shared export-config.yaml |

## Usage

### Via Phase Dispatcher CLI
```bash
# Orient
python .agents/scripts/phase_dispatcher.py orient --passage "Mark 5:1-20" --series "Gospel of Mark"

# Research
python .agents/scripts/phase_dispatcher.py research --passage "Mark 5:1-20" --sources "COM-01,COM-02" --depth structure

# Synthesize
python .agents/scripts/phase_dispatcher.py synthesize --pivot-verse "Mark 5:19" --applications 3

# Design
python .agents/scripts/phase_dispatcher.py design --strategy movement_based

# Draft (full QA set)
python .agents/scripts/phase_dispatcher.py draft --section 1 --type all --focus-title "Jesus Authority Over Chaos"

# Draft (granular - just interpret)
python .agents/scripts/phase_dispatcher.py draft --section 2 --type interpret --focus-title "From Isolation to Community"

# Review
python .agents/scripts/phase_dispatcher.py review --markdown study.md --strict

# Export
python .agents/scripts/phase_dispatcher.py export --source "Mark_biblestudies.md" --formats html,rtf,gdoc,pdf

# Refine (targeted edit)
python .agents/scripts/phase_dispatcher.py refine --target question --study 3 --section 2 --type interpret --instruction "Focus more on the demons' reaction"

# Series workflow
python .agents/scripts/phase_dispatcher.py series --outline "outline.md" --mode new
```

### Via Copilot Hooks (Automatic)
The `.vscode/copilot-hooks.json` configures:
- **PreToolUse**: Injects minimal context before each phase (~1k tokens)
- **PostToolUse**: Runs quality gates + persists state

## Context Management

Three-tier context in `.agents/state/bible-study-context.json`:

| Tier | Scope | TTL | Contents |
|------|-------|-----|----------|
| Project | Permanent | Never expires | Theology, church, vocab, tone, branding |
| Series | Persists across studies | Series lifetime | Title, passage arc, themes, pivot verses, user preferences |
| Study | Ephemeral | Per study | Passage, research, pivot, applications, QA sets, current section |

## Quality Gates

Automated validation after each phase:

| Gate | Phase | Checks |
|------|-------|--------|
| `research_complete` | research | Pivot verse, 2-3 apps, Grace Dynamic, citations |
| `draft_qa_set` | draft | Text-rooted, chained, depersonalized, Grace Dynamic, <20 words, Year 8 vocab |
| `export_ready` | review | Numbering, answer format, headings, study headers, linked Read sections |

## Export Configuration

Single source of truth: `.agents/skills/boss/bible/export-config.yaml`

Used by:
- Workflow skills (documentation)
- `create_docs.py` (HTML/RTF generation)
- `md_to_rtf_studies.py` (specialized RTF)
- `md_to_gdoc.py` (Google Docs sync)
- `quality_gates.py` (export_ready validation)

## Architecture Decision Records

See `.agents/adr/` for ADR-001 through ADR-005 documenting key decisions.