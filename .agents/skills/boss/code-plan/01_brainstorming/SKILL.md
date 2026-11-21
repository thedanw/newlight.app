---
name: 01_brainstorming
description: "Use before any creative or constructive work (features, architecture, behavior). Transforms vague ideas into validated designs through disciplined dialogue. Outputs decision tree to decision.md for pipeline integration."
category: code-plan
risk: safe
source: adapted
tags: [brainstorming, design, planning, collaboration, requirements, architecture, decision-tree]
triggers: [brainstorm, design, plan, explore, ideate, discuss, requirements]
allowed-tools: Read Write Glob Grep vscode_askQuestions
---

# Brainstorming Ideas Into Designs

## Purpose

Turn raw ideas into **clear, validated designs** through structured dialogue **before any implementation begins**.

Outputs a **decision tree** to `decision.md` that feeds directly into the planning phase.

This skill exists to prevent:
- premature implementation
- hidden assumptions
- misaligned solutions
- fragile systems

You are **not allowed** to implement, code, or modify behavior while this skill is active.

---

## Operating Mode

You are a **design facilitator and senior reviewer**, not a builder.

- No creative implementation
- No speculative features
- No silent assumptions
- No skipping ahead

Your job: **slow the process down just enough to get it right**.

---

## The Process

### 1. Establish Clear Goal and Research Context (Mandatory First Steps)

**Step 1: Establish Clear Goal**
- Ask the user for a clear goal statement for what they want to accomplish
- Update `plan.md` with this goal statement at the beginning of the file
- If `plan.md` doesn't exist, create it with the goal as the first content

**Step 2: Research Context and Identify Gaps**
- Run a research process to understand the context of the environment:
  - Review existing files, documentation, plans, prior decisions
  - Read `findings.md` if it exists (from pipeline Phase 0 Detect)
  - Identify what already exists vs. what is proposed
  - Note constraints that appear implicit but unconfirmed
- Identify potential technical and decision gaps that need to be addressed in the brainstorm process
- Store research findings in `findings.md` (create if doesn't exist, append if exists)

**Do not design yet.**

---

### 2. Understanding the Idea (One Question at a Time)

Your goal is **shared clarity**, not speed.

**Rules:**
- Ask **one question per message**
- Prefer **multiple-choice questions** when possible
- Use open-ended questions only when necessary
- If a topic needs depth, split it into multiple questions
- **Use the `vscode_askQuestions` tool to present multiple-choice questions as selectable options** — this allows users to click their answer instead of typing

Focus on understanding: purpose, target users, constraints, success criteria, explicit non-goals.

---

### 3. Non-Functional Requirements (Mandatory)

You MUST explicitly clarify or propose assumptions for:

- Performance expectations
- Scale (users, data, traffic)
- Security or privacy constraints
- Reliability / availability needs
- Maintenance and ownership expectations

If the user is unsure, **add the item to the Decision Gap Log** and address it using the one-question-at-a-time process. Never make assumptions on the user's behalf.

---

### 4. Understanding Lock (Hard Gate)

Before proposing **any design**, pause and provide:

#### Understanding Summary (5–7 bullets)
Aim for efficient clarity. Avoid emojis, verbosity, duplication, and large text blocks
- What is being built
- Why it exists
- Who it is for
- Key constraints
- Explicit non-goals

#### Assumptions
List all assumptions explicitly.

#### Open Questions
List unresolved questions, if any.

Then ask:

> "Does this accurately reflect your intent? Please confirm or correct anything before we move to design."

**Do NOT proceed until explicit confirmation is given.**

**After Understanding Lock is confirmed:**
- Create `decision.md` in the project directory
- Initialize the **Decision Gap Log** with all open questions, unclarified non-functional requirements, and any assumptions that need validation
- This becomes the working list of decisions to make

---

### 5. Explore Design Approaches

Once understanding is confirmed:

- Propose **2–3 viable approaches**
- Lead with your **recommended option**
- Explain trade-offs: complexity, extensibility, risk, maintenance
- Avoid premature optimization (**YAGNI ruthlessly**)

**Ask the user to select or refine an approach before proceeding.** This selection is recorded as the first entry in the Decision Log.

This is still **not** final design.

---

### 6. Present the Design (Incrementally)

Break design into sections of **200–300 words max**. After each section, ask:

> "Does this look right so far?"

Cover as relevant: Architecture, Components, Data flow, Error handling, Edge cases, Testing strategy.

---

### 7. Decision Log (Mandatory — Running Throughout)

Maintain a running **Decision Log** in `decision.md` as decisions are made.
For each decision, record **one compressed line**:

```
Decision → Rationale
```

**Compression rules (apply prompt-optimizer techniques):**
- **Imperative verbs only** — "Use X" not "We decided to use X"
- **No filler** — Drop "The decision is", "We chose", "After consideration"
- **Colon-delimited rationale** — Combine reason + constraint in one clause
- **Reference by alias** — Use aliases from top of file (defined in Aliases section)
- **Max 120 chars** — Hard limit; split if exceeded
- **No code, no markdown** — Plain text only

**Examples:**
```
# Verbose (avoid)
1 We decided to use PostgreSQL for the database because it supports JSONB and we need flexible schema

# Compressed (target)
1 Use PostgreSQL → JSONB support + flexible schema required
```

**This is the decision tree output.** Every decision must be written and maintained in decision.md immediately, not reconstructed after.

---

### 8. Decision Gaps (Mandatory — Running Throughout)

Maintain a running **Decision Gap Log** at the end of the decision.md file.
Track **only open gaps** (resolved gaps are captured in the Decision Log above):

```
Gap → Status (open|deferred)
```

After each decision:
- Remove gaps that are answered (they become Decision Log entries)
- Add new gaps that arise from the decision
- Process the next open gap with the user as the next loop

**Single source of truth:** A gap moves from Gap Log → Decision Log when resolved. No duplication.

---

### 9. Optimize Decision Log (Mandatory — Before Exit)

Before finalizing, run an **optimization pass** on `decision.md`:

1. **Deduplicate** — Remove any repeated rationale or context already in Understanding Lock
2. **Compact** — Merge consecutive decisions on same topic into one line with combined rationale
3. **Reference** — Replace repeated feature names with a short alias defined once at top
4. **Verify consistency** — Every open gap has a path to resolution; no orphaned decisions
5. **Trim** — Enforce 120-char limit; split or rephrase if needed
6. **Compress** — Apply prompt-optimizer compression: imperative verbs, drop filler, colon-delimit

Target: **Decision Log + Gap Log ≤ 40 lines total** for typical features.

---

### 10. Finalize Brainstorm and Update Context

**Update Goal in plan.md**
- Review if the goal has evolved during brainstorming based on discoveries and decisions made
- If the goal has changed, update `plan.md` with the refined goal statement
- If the goal remains the same, confirm it's still accurate

**Final Research Update**
- Run a final research process to update `findings.md` with the most relevant information based on the brainstorm
- Incorporate insights from decision-making, identified gaps, and validated approaches
- Ensure `findings.md` contains the synthesized knowledge needed for the planning phase

**User Satisfaction Check**
- Ask the user if they are satisfied with the brainstorming process and if all essential information gaps have been explored
- If not satisfied, continue with additional questioning and exploration
- If satisfied, proceed to exit criteria check

---

## Output: decision.md

**`decision.md` is created after Understanding Lock (Step 4) and maintained throughout the brainstorming process.** The final validated design is already captured in the file — no separate write step needed.

The file structure in the **project directory**:

```markdown
# Decision: [Feature Name]

## Aliases
[Short aliases for repeated terms, e.g., API=Application Programming Interface]

## What & Why
[What is being built and why — ≤3 lines]

## Who
[Target users — ≤1 line]

## Constraints
- [Constraint 1]
- [Constraint 2]

## Non-Goals
- [Explicit out-of-scope item]

## Assumptions
- [Assumption 1] (marked if uncertain)

## Decision Log: decision → Rationale
1 Use PostgreSQL → JSONB support + flexible schema required
2 Use REST over GraphQL → simpler caching + team familiarity

## Decision Gap Log
1 Auth strategy
2 Rate limiting approach
```

Update `findings.md` with any architecture notes from the design.

---

## After Documentation

Once the design is validated and captured in `decision.md`, ask:

> "Ready to create the implementation plan?"

If yes, hand off to **concise-planning** skill, passing `decision.md` as input.

---

## Exit Criteria (Hard Gates)

Exit brainstorming mode **only when all are true:**
- [ ] Understanding Lock confirmed
- [ ] At least one design approach explicitly accepted
- [ ] Major assumptions documented
- [ ] Key risks acknowledged
- [ ] Decision Log complete (≤40 lines with Gap Log)
- [ ] All decision gaps resolved or explicitly deferred
- [ ] Optimization pass completed (Section 9)
- [ ] `decision.md` created and maintained in project directory

If any criterion is unmet: **continue refinement. Do NOT proceed.**

---

## Key Principles

- One question at a time
- Assumptions must be explicit
- Explore alternatives
- Validate incrementally
- Prefer clarity over cleverness
- Be willing to go back and clarify
- **YAGNI ruthlessly**
