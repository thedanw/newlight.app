---
name: bible-study-research
category: bible
phase: research
description: "Research phase - Execute COM-01 (StudyLight Deep-Dive) and COM-02 (TGC Framework) per the Research Protocol. Mandatory: Henry, Calvin, Poole for structural skeleton; TGC for hooks/pivot/applications."
triggers: ["bible-study-research", "research phase", "bible research", "COM-01", "COM-02"]
---

# Bible Study Research Phase Skill

## Purpose
Execute the **mandatory research protocol** for a Bible study using online commentaries. This phase produces the "Structural Skeleton" (major divisions, core definitions), hooks, pivot verse candidates, and application seeds — all filtered through the Grace Dynamic.

## Inputs
- `passage`: Bible passage reference (required)
- `series_context`: Optional series-level context for recurring themes
- `instructions`: Optional user instructions for research focus

## Outputs
```json
{
  "passage": "Mark 5:1-20",
  "structural_skeleton": {
    "major_divisions": ["Division 1: v1-10", "Division 2: v11-17", "Division 3: v18-20"],
    "core_definitions": {"legion": "many demons", "Decapolis": "ten cities region"}
  },
  "pivot_verse_candidates": ["Mark 5:19", "Mark 5:7"],
  "application_seeds": ["Seed 1", "Seed 2", "Seed 3"],
  "cross_references": ["Eph 2:8-9", "Rom 8:1"],
  "historical_context": "Context notes...",
  "sources_used": ["COM-01", "COM-02"],
  "citations": {"structure": "Mark 5:1-20", "pivot": "Mark 5:7,19"}
}
```

## Instructions

### 1. Load Context
Use context_injector to get passage + series context.

### 2. Execute COM-01: StudyLight Deep-Dive (MANDATORY)
**Source**: StudyLight.org commentaries via Jina Reader
**Required Commentators** (all three must be read):
- **Henry (`mhm`)** - Practical/exegetical framework
- **Calvin (`cal`)** - Theological/doctrinal framework  
- **Poole (`mpc`)** - Textual/structural framework

**URL Pattern**: `https://r.jina.ai/https://www.studylight.org/commentaries/eng/[CODE]/[BOOK]-[CHAPTER].html`

**Extract from each**:
- **Structural Skeleton**: Major divisions of the passage (2-4 movements)
- **Core Definitions**: Key terms, names, places, theological concepts
- **Verse-by-verse insights** relevant to structure and pivot

### 3. Execute COM-02: TGC Framework (MANDATORY)
**Source**: The Gospel Coalition Commentary via Jina Reader
**URL Pattern**: `https://r.jina.ai/https://www.thegospelcoalition.org/commentary/[book]/`

**Extract**:
- **Hooks**: Striking phrases, vivid imagery, narrative surprises
- **Pivot Verse Candidates**: Verses where human effort fails and God's kingdom prevails
- **Application Points**: Grace Dynamic-aligned implications (Christ's sufficiency, not human fix)

### 4. Filter Through Grace Dynamic (CRITICAL)

**The Grace Dynamic Framework** (from `04_Homiletics_GraceDynamic.md`):
> "I am more sinful and flawed than I ever dared believe, while at the same time, more accepted and loved than I ever dared hope."

**Core Principle**: Grace is the *engine* of transformation, not just a subject. Resist both **legalism** (I obey → accepted) and **antinomianism** (accepted → no obedience). Aim for **gospel-motivated obedience** (accepted → I obey).

**Filter Checklist** — Apply to every finding:

| Category | ✅ KEEP (Grace Dynamic) | ❌ REJECT (Moralistic) |
|----------|------------------------|------------------------|
| **Focus** | What Christ HAS DONE | What you MUST DO |
| **Text Role** | Points to Christ as Savior | Examples to follow (about me) |
| **Law's Role** | Reveals sin, drives to Christ, guides gratitude | Means to earn acceptance |
| **Motivation** | Love, gratitude, joy in grace | Fear, pride, reward-seeking |
| **Acceptance Source** | Christ's finished work by faith | Moral effort / performance |
| **Target** | Heart transformation (affections, identity) | Behavior modification |
| **Outcome** | Humility + radical assurance | Self-righteousness or despair |

**Scriptural logic lens**: Understanding the passage through the grace dynamic:
1. **The Standard/Ideal** (what text demands)
2. **Human Inability** (why we fail — the Crisis)
3. **Christ as Solution** (how Jesus fulfills/bears penalty — the Resolution)
4. **Gospel Application** (faith empowers change via gratitude/Spirit — not willpower)

**Idolatry Lens**: Behavior = symptom. Root = misplaced worship (career, approval, comfort, control). Grace Dynamic doesn't just "stop" sin — it **replaces** the idol with superior love for Christ.

### 5. Consolidate & Deduplicate
- Merge structural outlines from Henry, Calvin, Poole into unified **Structural Skeleton**
- Combine hooks/striking phrases, keep most vivid/textual
- Group application seeds by theme
- Remove duplicates (same verse, same insight)
- Keep 3-5 application seeds
- Preserve verse citations for everything

### 6. Save via Context Manager
Update research_findings in study context.