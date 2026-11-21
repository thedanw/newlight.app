---
name: bible-study-synthesize
category: bible
phase: synthesize
description: "Synthesize phase - Consolidate research, select pivot verse and 2-3 applications."
triggers: ["bible-study-synthesize", "synthesize phase", "consolidate research"]
---

# Bible Study Synthesize Phase Skill

## Purpose
Consolidate research findings, deduplicate, and select the strongest pivot verse and 2-3 application points that align with Grace Dynamic theology.

## Inputs
- `research_findings`: From research phase (structure, hooks, pivot candidates, application seeds)
- `passage`: Bible passage reference
- `grace_dynamic_filter`: true (always)

## Outputs
```json
{
  "passage": "Mark 5:1-20",
  "consolidated_findings": {
    "structure": "Unified structure...",
    "hooks": ["Best hook 1", "Best hook 2"],
    "striking_phrases": ["Best phrase 1"]
  },
  "pivot_verse": "Mark 5:19",
  "pivot_rationale": "Shows Jesus sending the man to testify - Christ's power transforms and commissions",
  "applications": [
    {
      "title": "Testifying to Christ's Power",
      "logic": "The man wanted to stay with Jesus, but Jesus sent him to testify (v19). Christ's power isn't for our comfort but for witness."
    },
    {
      "title": "Christ's Authority Over Chaos",
      "logic": "The legion of demons (v9) couldn't resist Jesus' word. No chaos is beyond His authority."
    },
    {
      "title": "From Isolation to Community",
      "logic": "The man lived among tombs (v3), but Jesus restored him to his people (v19). Christ brings the isolated into community."
    }
  ],
  "rejected_candidates": ["Mark 5:7 - shows demon knowledge, not Christ's sufficiency"],
  "grace_dynamic_check": "All applications show Christ's sufficiency, not human effort"
}
```

## Instructions

### 1. Load Research Findings
Get research_findings from context manager.

### 2. Consolidate & Deduplicate
- Merge structure outlines from multiple commentaries
- Combine hooks/striking phrases, keep most vivid/textual
- Group application seeds by theme
- Remove duplicates (same verse, same insight)

### 3. Select Pivot Verse
Criteria (in order):
1. **Christ's sufficiency**: Verse shows Jesus' power, authority, grace, or finished work
2. **Human inability**: Verse shows human helplessness, need, or failure
3. **Textual centrality**: Verse is structurally/climactically important
4. **Application potential**: Verse naturally yields 2-3 distinct applications
5. **Grace Dynamic alignment**: No human-centric "fix" implied

Reject verses that:
- Only show demon/human knowledge without Christ's response
- Are purely descriptive without theological weight
- Lead to moralistic applications

### 4. Select 2-3 Applications
From consolidated application seeds, choose 2-3 that:
- Each flows from the pivot verse (or passage climax)
- Are distinct (different angle: witness, authority, community, fear/faith, etc.)
- Are Grace Dynamic aligned (Christ's work → our response)
- Have clear "Key logic" (1-2 sentences linking passage to application)

### 5. Grace Dynamic Check
Verify each application:
- ✅ Shows what Christ HAS DONE
- ✅ Shows human NEED/INABILITY
- ❌ Does NOT say "we must try harder"
- ❌ Does NOT say "we should do better"
- ❌ Does NOT imply earning/meriting

### 6. Save via Context Manager
Call `set_pivot_and_applications(pivot_verse, applications)`.

## Example Invocation
```bash
python .agents/scripts/phase_dispatcher.py synthesize --pivot-verse "Mark 5:19" --applications 3
```