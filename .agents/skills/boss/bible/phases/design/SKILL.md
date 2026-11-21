---
name: bible-study-design
category: bible
phase: design
description: "Design phase - Propose 3 distinct strategic approaches to a bible study based in one key passage of multiple verses (integrated reading strategy + applications) for user selection, aligned with Grace Dynamic and Kingdom Counter-Culture tone."
triggers: ["bible-study-design", "design phase", "strategic proposal", "reading strategy", "application options"]
---

# Bible Study Design Phase Skill

## Purpose
Propose **3 distinct, intelligent strategic approaches** to studying a given passage. Each approach integrates a reading strategy (2-3 movements) with specific application goals, Grace Dynamic connection, and a supporting passage. This is the "Strategic Proposal" step before drafting begins.

## Inputs
- `applications`: 2-3 applications from synthesize phase
- `passage`: Full passage reference
- `instructions`: Any additional instructions from the user (optional)
- `theme`: Optional theme or focus for the study
- `structure`: Optional Structural skeleton from research phase (major divisions, core definitions)

## Outputs
```json
{
  "strategic_approaches": [
    {
      "number": 1,
      "title": "[Study Title]",
      "main_idea": "[Main Idea]",
      "reading_strategy": {
        "movements": [
          {"passage": "[Mark 5:1-10]", "focus": "The Crisis - Chaos meets Christ"},
          {"passage": "Mark 5:11-17", "focus": "The Intervention - Power displayed, fear revealed"},
          {"passage": "Mark 5:18-20", "focus": "The Response - Transformed man commissioned"}
        ]
      }
    }
    {
      "number": 2,
      "title": "Fear vs Faith When God Draws Near",
      "main_idea": "Jesus Exposes Every Heart",
      "reading_strategy": {
        "movements": [
          {"passage": "Mark 5:1-13", "focus": "Jesus' absolute authority over spiritual chaos"},
          {"passage": "Mark 5:14-17", "focus": "Human fear when God's power disrupts control"},
          {"passage": "Mark 5:18-20", "focus": "Transformed life becomes witness"}
        ]
      }
    }
    {
      "number": 3,
      "title": "From Tombs to Testimony",
      "main_idea": "Christ Restores the Lost",
      "reading_strategy": {
        "movements": [
          {"passage": "Mark 5:1-5", "focus": "The man's hopeless isolation among the dead"},
          {"passage": "Mark 5:6-13", "focus": "Demons' recognition vs Jesus' authority"},
          {"passage": "Mark 5:14-20", "focus": "Restoration and commission to his people"}
        ]
      }
    }
  ]
}
```

## Instructions

### 1. Generate 3 Strategic Approaches (Not 5 Separate Options)
Each approach is an **integrated package** containing:
- **Title**: Short (<6 words), punchy, active
- **Main Idea**: One application-based statement **< 30 characters** that captures the study's core takeaway
- **Reading Strategy**: 2-3 "Movements" with passage segments and focus descriptions. Each movement becomes a `## **Read [Passage Reference]**` section in the final study. **Base movements on the passage's structural skeleton** (major divisions from research), not on a single verse.
- **Application Goals**: 2 specific points (Head/Heart) that the study will land on. **Derive from the passage's structure**, not a pivot verse.
- **Grace Connection**: Explicit statement of how this approach points to Christ's sufficiency (not human effort)
- **Supporting Passage**: One specific extra reading that adds **insight** (not just parallel)

### 2. Design Principles
- **Kingdom Counter-Culture**: Each approach must contrast "World's Way" vs "Kingdom Way"
- **Grace Dynamic Alignment**: Every application goal must flow from what Christ HAS DONE, not what we MUST DO
- **Distinct Angles**: The 3 approaches should offer genuinely different entry points (e.g., authority, fear/faith, restoration/mission)
- **Supporting Passage Value**: Must add fresh insight, not merely repeat the main passage
- **Passage-Centered**: Design around the **full passage structure** (multiple verses). Avoid focusing on any single verse or pivot verse. Let the passage's own divisions drive the reading strategy.

### 3. Format for User Selection
Present the 3 approaches clearly numbered. User will reply with:
- A single number (1, 2, or 3)
- "Combine: <custom blend>"
- "New: <custom approach>"

**Do not proceed to drafting until a strategy is agreed upon.**

### 4. After Selection: Populate Bible Study Document
Once the user selects a strategy, **immediately update the target bible study markdown file** with the following structure:

```markdown
| # **[bible study number--do not change]** | # **[Study Title]** |
| :--- | :--- |
| **Main Idea**: [Main Idea from selected approach] | **Passages**: [Full passage reference] |
| | |

### Focus: [section 1 focus from reading_strategy.movements[0].focus]
> Read [Reading Section 1 from reading_strategy.movements[0].passage]

### Focus: [section 2 focus from reading_strategy.movements[1].focus]
> Read [Reading Section 2 from reading_strategy.movements[1].passage]

### Focus: [section 3 focus from reading_strategy.movements[2].focus]
> Read [Reading Section 3 from reading_strategy.movements[2].passage]
```

**Mapping from selected approach:**
- `Study Title` → `title`
- `Main Idea` → `main_idea`
- `Passages` → `passage` (full reference)
- Each `Focus` section → `reading_strategy.movements[i].focus`
- Each `> Read` line → `reading_strategy.movements[i].passage`

### 5. Save via Context Manager
Call `set_strategic_approach(approach_number, approach_data)`.

