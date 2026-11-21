---
name: bible-study-orient
category: bible
phase: orient
description: "Orient phase - Load Grace Dynamic theology, user DNA, and select research sources for a passage."
triggers: ["bible-study-orient", "orient phase", "start bible study"]
---

# Bible Study Orient Phase Skill

## Purpose
Initialize the theological and contextual foundation for a Bible study. Load Grace Dynamic theology, user DNA preferences, and select appropriate research sources based on the passage.

## Inputs
- `passage`: Bible passage reference (e.g., "Mark 5:1-20")
- `series_title`: Optional series title for series-level context
- `user_preferences`: Optional overrides for research depth, source preferences

## Outputs
```json
{
  "theology_summary": "Grace Dynamic theology summary...",
  "user_dna_summary": "User preferences: Year 8 vocab, Kingdom vs World tone...",
  "selected_sources": ["COM-01", "COM-02", "SER-01"],
  "research_plan": "Phase 1: Structure (Commentaries)...",
  "passage": "Mark 5:1-20",
  "series_context": {...}
}
```

## Instructions

### 1. Load Grace Dynamic Theology
The theological framework is **Grace Dynamic** - focus on Christ's sufficiency, not human fix.
Key principles:
- Christ's finished work is the ground of all application
- Human inability is the problem; God's power is the solution
- Application flows from what God HAS DONE, not what we MUST DO
- Kingdom vs World contrast: God's ways vs human ways

### 2. Load User DNA
From `.agents/skills/boss/bible/.knowledge/user-DNA/`:
- Vocabulary: Year 8 level, adult tone
- Tone: Kingdom vs World contrast
- Style: Simple, clear, direct sentences
- No double negatives, no filler
- Questions < 20 words
- Depersonalized: "Why do people..." not "Why do you..."

### 3. Select Research Sources (ResearchSources.md Selector Logic)
Based on passage and study goals, select from the Source Matrix:

**Phase 1 - Structure (Always):**
- COM-01: StudyLight (Henry/Calvin/Poole) - Framework, structure, exegesis
- COM-02: TGC Commentary - Modern theological framework

**Phase 2 - Depth (If needed):**
- ART-01: Monergism - Deep systematic/Reformed depth
- ART-02: TGC Articles - Modern worldview context

**Phase 3 - Connection (Always for application):**
- SER-01: Skip Heitzig (YouTube) - Application, expository points
- SER-02: Spurgeon Gems - Illustrations, rhetoric
- SER-03: Desiring God - Christian Hedonism, pastoral theology

### 4. Build Research Plan
Output a phased research plan matching the selector logic.

### 5. Initialize Context
Save passage and series context via context manager.

## Example Invocation
```bash
python .agents/scripts/phase_dispatcher.py orient --passage "Mark 5:1-20" --series "Gospel of Mark"
```