---
name: bible-study-draft
category: bible
phase: draft
description: "Draft phase - Collaborative O/I/A question drafting with granular invocation (single question type per section)."
triggers: ["bible-study-draft", "draft phase", "write bible study questions", "observe interpret apply"]
---

# Bible Study Draft Phase Skill

## Purpose
Draft Observe/Interpret/Apply question sets for each application option, one section at a time, with immediate user confirmation. Supports granular invocation for refining single questions.

## Inputs
- `section`: Section number (1-based, corresponds to reading strategy movement)
- `type`: "observe" | "interpret" | "apply" | "discuss" | "all" (default: "all")
- `focus_title`: Focus title for this section (from reading strategy)
- `application_option`: Selected application option for this section
- `passage_segment`: Passage portion for this section
- `previous_qa_sets`: Confirmed QA sets from earlier sections (for chaining)
- `all_qa_sets`: All confirmed QA sets from the full study (required for type="discuss")

## Outputs (for type="all")
```json
{
  "section": 1,
  "focus_title": "Jesus' Authority Over Chaos",
  "passage_segment": "Mark 5:1-13",
  "qa_set": {
    "observe": {
      "question": "What details show the man's life was completely out of control before Jesus arrived?",
      "answer": "He lived among tombs (v3), no one could bind him (v3-4), he cried out day and night cutting himself (v5)."
    },
    "interpret": {
      "question": "What does the demons' response to Jesus (v6-10) reveal about His authority?",
      "answer": "The demons recognize Jesus immediately (v7), beg not to be sent away (v10), and obey His command (v13). Jesus' word alone controls them."
    },
    "apply": {
      "question": "How does knowing Jesus has absolute authority over spiritual chaos help people face overwhelming situations?",
      "answer": "No chaos - spiritual, emotional, or circumstantial - is beyond Jesus' command. He speaks and it obeys. Our stability comes from His authority, not our control."
    }
  },
  "chain_validation": {
    "interpret_uses_observe": true,
    "apply_uses_interpret": true,
    "grace_dynamic_aligned": true,
    "depersonalized": true
  }
}
```

## Outputs (for granular type="observe|interpret|apply")
```json
{
  "section": 1,
  "type": "interpret",
  "question": "What does the demons' response to Jesus (v6-10) reveal about His authority?",
  "answer": "The demons recognize Jesus immediately (v7), beg not to be sent away (v10), and obey His command (v13). Jesus' word alone controls them.",
  "references_previous": "Uses 'demons recognize Jesus' from observe answer"
}
```

## Outputs (for type="discuss")
```json
{
  "type": "discuss",
  "options": [
    {
      "number": 1,
      "question": "What do people typically do when they feel overwhelmed by circumstances beyond their control?",
      "rationale": "Sets up the Grace Pivot: human inability meets Christ's authority"
    },
    {
      "number": 2,
      "question": "In what ways do people try to manage chaos in their lives without turning to God?",
      "rationale": "Contrasts World's Way (self-reliance) with Kingdom Way (Christ's sufficiency)"
    },
    {
      "number": 3,
      "question": "What experiences have people had where they realized they couldn't fix something on their own?",
      "rationale": "Leads to the crisis moment where Christ's power becomes necessary"
    },
    {
      "number": 4,
      "question": "How do people typically respond when they encounter something they can't explain or control?",
      "rationale": "Mirrors the townspeople's fear vs the man's transformation in Mark 5"
    },
    {
      "number": 5,
      "question": "What does it feel like to be 'bound' by something — a habit, situation, or fear — that no human effort can break?",
      "rationale": "Directly parallels the demoniac's chains and Christ's liberating authority"
    }
  ],
  "selection_criteria": [
    "Depersonalized: 'What do people think...' not 'What do you think...'",
    "Sociological: Ask about common human experiences or cultural norms",
    "The Hook: Must directly set up the Grace Pivot of the study"
  ]
}
```

## Instructions

### 1. Load Context
Get study context: confirmed_qa_sets, focus_titles, applications, reading_strategy, passage.

### 2. Question Construction (Chain of Thought)
Build every question in sets of 3 following one train of thought that lands on the Apply question:

**Step 1: Identify what is GIVEN** in the passage, the focus application and instructions.
**Step 2: Identify what is NEEDED**: type of question, the role the question plays.
**Step 3: FORM the question** from the text, referencing the subject of the previous question in the set.
**Step 4: VERIFY** it is answerable from the passage, keeps the reader in the text, and holds subject continuity across the set.

### 3. Observe Question
- **Goal**: Draft one question that unpacks details in the passage, allowing mutiple answers, and points toward the section application.
- **Steps**:
  1. Identify sets of facts, events, actions, repeated words, word/theme lists, contrast sets that relate to the application focus of the section.
  2. The question MUST allow multiple answers to be drawn from the passage and explore a significant portion of the passage segment.
  3. Ask one broad, text-rooted question pointing toward the application.
- **Constraints**:
  - Don't identify the number of answers.
  - Don't use assumed knowledge outside the assigned text.
  - Don't ask double-barreled questions unless exploring a contrast or comparison.
- **Examples**:
- "What clues...", "List the...", "What examples...", "What things...", "What details...", "What words...", "What repeated actions...", "What contrasts...", "What events..." etc.

### 4. Interpret Question
- **Choose strategy**: Interpretation within passage, or correlation with an other passage. (Prefer "within the passage" unless leading towards the application requires a cross-reference.)
- **Interpretation methods**: Use scripture to interpret scripture. What is the internal witness of the passage that leads to the application? What clues in the passage bring understanding to the passage?
- **Prompts**: "What clues does the passage give...?" / "What understanding can we draw...?" / "How does ... increase our understanding?"
- **Constraints**: Avoid being overly prescriptive.
- **Steps**:
  1. Identify meaning clues in the text or a parallel Scripture that relate to the previous answer.
  2. Use scripture to interpret scripture — from the given passage or a supporting passage — and add brief context in the question where the logical flow needs it.
  3. Ask one broad, text-rooted question that has the user interpret the previous answer and points toward the application.
  4. Verify the answer is grounded in a passage that has been provided, not reader opinion nor require external knowledge (historical context or unnamed passages).
- **Grace Dynamic note**: Prefer answers showing Christ's sufficiency or human inability, not a human-centred fix.
- **Examples**:
  - "What clues do we see as to why the king so angry and embarrassed when the queen said 'no'?" (Esther 1:1-12)
  - "In what ways does the passage show Jesus' power and authority?" (Mark 5:1-13)

### 5. Apply Question
- **Ground it** in what the text reveals about God and his work BEFORE asking what it calls people to do.
- **Prompts**: "What does this text reveal about people's need or God's power?" / "What does this passage call people to believe or do?" / "How does this shape the group's prayer or faith?" / "What does this tell us about God's timing when situations get worse?" / "How does knowing God is in charge of the timing of our lives help people stay calm in an uncertain world?"
- **Draw out** communal and life response questions. Keep rooted in passage, not moralistic add-ons.
- **Steps**:
  1. Identify the passage's result, command, or character trait.
  2. Ask for a life response tied to the previous 2 questions, adding brief context where the flow needs it.
  3. Ask how the text should shape belief, behaviour, or group life.
  4. Verify it flows from the text, is not generic moralizing, and is depersonalized (people in general, not "you").
- **Grace Dynamic note**: Frame the response around Christ's sufficiency or human need, not a human attempt to fix the problem.
- **Examples**:
  - "In what ways does this passage show...?", "How might [observation] help out understanding?" ""What might [observation] reveal (about Jesus, God, God's plan, God's people etc)?"

### 6. Discuss Question (Opening Discussion — Drafted LAST, Placed FIRST)
**When**: Only after the full study body is complete (minimum 3 sections × 3 questions each = 9 questions minimum).
**Why**: Drafting last ensures the question introduces the selected applications rather than driving their creation.
**Goal**: Open-ended, low-pressure, non-biblical, non-theological, sociological/psychological/experience-based question that leads toward the application focuses before the group enters scriptural discussion.
**Placement**: Lives in `## **Opening Discussion**` section as Q1 (continuous numbering starts here).

**Construction**:
1. Review all confirmed application focus from every section.
2. Identify the study's "Grace Pivot" — where human inability meets Christ's sufficiency.
3. Draft 3–5 options meeting these criteria:
   - **Depersonalized**: "What do people think..." not "What do you think..."
   - **Sociological**: Ask about common human experiences or cultural norms.
   - **The Hook**: Must directly set up the Grace Pivot of the study.
4. Present options to user for selection.
5. On selection, write to document as `**Discuss**: [question]` with `<!-- ANSWER ... -->` format.

**Example Options** (for a study on Christ's authority over chaos):
- "What do people typically do when they feel overwhelmed by circumstances beyond their control?"
- "In what ways do people try to manage chaos in their lives without turning to God?"
- "What experiences have people had where they realized they couldn't fix something on their own?"
- "How do people typically respond when they encounter something they can't explain or control?"
- "What does it feel like to be 'bound' by something — a habit, situation, or fear — that no human effort can break?"

### 7. Answer Formatting (CRITICAL)
- **Format**: Place answers in HTML comments immediately after each question using `<!-- ANSWER ... -->` syntax.
- **Placement**: Directly after the question line, before any blank line or next question.
- **Content**: Concise, text-grounded answer, 2-3 sentences max, year 8 vocab, referencing verse numbers. When drawing on personal questions (ie. discussion & apply questions) preceed with Examples:`" 
- **Example**:
  ```markdown
  ### Focus: Jesus' Authority Over Chaos

  **Observe**: List the details show the man's life was completely out of control before Jesus arrived?
  <!-- ANSWER: He lived among tombs (v3), no one could bind him (v3-4), he cried out day and night cutting himself (v5). -->

  **Interpret**: What does the demons' response to Jesus (v6-10) reveal about His authority?
  <!-- ANSWER: The demons recognize Jesus immediately (v7), beg not to be sent away (v10), and obey His command (v13). Jesus' word alone controls them. -->

  **Apply**: How does knowing Jesus has absolute authority over spiritual chaos help people face overwhelming situations?
  <!-- ANSWER: No chaos - spiritual, emotional, or circumstantial - is beyond Jesus' command. He speaks and it obeys. Our stability comes from His authority, not our control. -->
  ```

 

### 7. Labels, Headings, and Review
- **Question labels**: Use labels, not sequence numbers. First section is "Discuss". Each `> Read [Passage]` section holds one O/I/A set.
- **Set titles**: Every O/I/A set needs a simple title (<50 chars) as subheading before Observe (e.g., `### Focus: Joining the Heavenly Song`).
- **Section headings**: Start each passage section with `> Read [Passage Reference](link)` (blockquote, linked).
- **Review logic**:
  - Depersonalize: "Why do people..." not "Why do you..."
  - Length: All questions <20 words.
  - 
  - Vocabulary: Year 8 level, adult tone.
  - Kingdom vs World contrast present.
  - Grace Dynamic aligned.

### 8. Granular Invocation
When `type` is "observe", "interpret", or "apply":
- Only draft that specific question type for the section
- For "interpret": Must reference the confirmed observe answer
- For "apply": Must reference the confirmed interpret answer
- Return single question + answer + chain validation

When `type` is "discuss":
- **Requires**: `all_qa_sets` input (all confirmed QA sets from the full study)
- **Precondition**: Study body complete (min 3 sections × 3 questions = 9 questions)
- Draft 3–5 Discuss question options based on all application goals and Grace Pivot
- Present options to user for selection
- On confirmation, write to document as `**Discuss**: [question]` in `## **Opening Discussion**` section

### 9. Save via Context Manager
Call `add_confirmed_qa_set(qa_set)` after user confirms.

## Example Invocation
```bash
# Draft full QA set for section 1
python .agents/scripts/phase_dispatcher.py draft --section 1 --type all --focus-title "Jesus' Authority Over Chaos"

# Refine just the interpret question for section 2
python .agents/scripts/phase_dispatcher.py draft --section 2 --type interpret --focus-title "From Isolation to Community"
```