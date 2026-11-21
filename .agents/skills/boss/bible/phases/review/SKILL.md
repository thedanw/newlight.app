---
name: bible-study-review
category: bible
phase: review
description: "Review phase - Final validation of study markdown before export: headings, labels, vocab, tone, numbering, answer format."
triggers: ["bible-study-review", "review phase", "validate bible study", "export prep"]
---

# Bible Study Review Phase Skill

## Purpose
Validate a complete Bible study markdown file against all quality standards before export. Checks headings, question labels, vocabulary, tone, numbering, answer format, and Grace Dynamic alignment.

## Inputs
- `markdown`: Complete study markdown content
- `study_number`: Study number in series
- `strict`: Boolean for strict validation (default: false)

## Outputs
```json
{
  "passed": true,
  "study_number": 3,
  "checks": {
    "headings_correct": true,
    "question_labels": true,
    "questions_short_clear": true,
    "vocab_year8": true,
    "tone_kingdom_vs_world": true,
    "numbering_continuous": true,
    "answer_format_valid": true,
    "grace_dynamic_aligned": true,
    "depersonalized": true,
    "study_headers_present": true,
    "read_sections_linked": true,
    "bonus_questions_present": true
  },
  "errors": [],
  "warnings": ["Question 7 uses 'nevertheless' - consider simpler word"],
  "export_ready": true
}
```

## Instructions

### 1. Load Export Configuration
Read `.agents/skills/boss/bible/export-config.yaml` for validation rules.

### 2. Run Quality Gates
Use `quality_gates.py --gate export_ready` with the markdown.

### 3. Specific Checks

**Heading Structure:**
- First line: Table header with study number and title
- Second line: Main Idea | Passages
- `**Discuss**:` opening question (depersonalized, sociological)
- `> Read [Passage](link)` for each movement (blockquote, linked)
- `### Focus: [Title]` before each O/I/A set
- `## **Bonus Questions**` or `### **Bonus Questions**` (H3 bold) at end
- Bonus: curiosity question + application question

**Question Labels:**
- Use labels: **Observe**, **Interpret**, **Apply**, **Discuss**, **Bonus curiosity**, **Bonus application**
- NOT sequence numbers (1., 2., 3.)

**Question Quality:**
- All questions < 20 words
- Year 8 vocabulary (check against complex word list)
- Adult tone, simple clear sentences
- No double negatives
- Direct instruction language
- Kingdom vs World contrast evident
- Depersonalized: "people" not "you"

**Answer Format:**
- `<!-- ANSWER ... -->` immediately after each question
- Concise, 2-3 sentences max
- References verse numbers
- Text-grounded

**Numbering:**
- Continuous within study (CSS counters in HTML)
- Resets at each new study
- Markdown uses simple "1." "2." "3." across sections

**Study Headers:**
- 2x2 table (Esther style) OR 1x2 table (Mark style)
- Number box: 70x70, orange (#FF7300), white text, Inter Tight 800
- Title: H1, Inter Tight 800, capitalized
- Subtitle: 0.95rem, grey italic

**Read Sections:**
- Blockquote format: `> Read [Passage](link)`
- Link pattern: `https://team.newlight.app/bible?&q=[Encoded+Passage]`
- Always "Read" never "Reach"

**Grace Dynamic Alignment:**
- Every apply answer shows Christ's sufficiency or human need
- No "try harder", "do better", "improve", "effort", "strive"
- No human-centric fixes

### 4. Report Results
Return structured validation report. If `strict=true`, any warning becomes error.

### 5. Save Validation State
Persist validation result via context manager.

## Example Invocation
```bash
python .agents/scripts/phase_dispatcher.py review --markdown study.md --strict
```