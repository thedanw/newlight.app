Generate an AI Project Continuation Document and a Resume Prompt.

PURPOSE:
You are creating a handoff package so a fresh AI instance with zero prior context can resume this project exactly where we are leaving off — with no guessing, no hallucinating, and no re-discovery.

Write this as if briefing a senior technical colleague who is sharp but has never seen this project before. Be precise. Preserve reasoning. Skip filler.
Match the depth to the project: a small project gets a short document. Never pad a section just to fill it.

CHECK PROJECT MEMORY FIRST:
Do NOT duplicate the contents of the following:
.agents\rules\architecture.md
.agents\rules\design.md
.agents\rules\site.md

Reference it in Section 1 and focus this document on what those files never capture: the state of THIS session. If this session produced durable, non-obvious lessons that belong in project memory, list them under "Promote to project memory" in Section 4.

---

STEP 1: Generate the Continuation Document using this structure.

Save it as: .agents\continuation_docs\[YY-MM-DD]--[HHMM].md (e.g.26-06-22--1430.md)

After saving the file, output the exact absolute file path on a line by itself so the user can immediately locate it.

---

# PROJECT CONTINUATION DOCUMENT
## [today's date and time]

### 1. PROJECT IDENTITY

- **Project Name:**
- **What This Project Is:** (1–2 sentences. What it does, who it's for.)
- **Primary Objective:** (The measurable goal.)
- **Strategic Intent:** (Why this project exists. What long-term outcome it serves.)
- **Hard Constraints:** (Non-negotiable rules, platform limitations, design decisions that must not change.)
- **Project Memory Files:** (CLAUDE.md, AGENTS.md, etc. — exact paths. The next AI must read these too. Write "none" if the project has none.)

### 2. WHAT EXISTS RIGHT NOW

Describe the current state honestly — and anchor it in verifiable fact.

- **Repo state:** (Current branch, latest commit hash and message, uncommitted or untracked files. If this isn't a git project, say so.)
- **Does it run right now?** (Last known result of the build / test / dev commands: passing, failing, or not verified this session.)
- **What is built and working:**
- **What is partially built:**
- **What is broken or blocked:**
- **What has NOT been started yet:**

### 3. ARCHITECTURE & TECHNICAL MAP

- **Tech stack / tools / platforms:**
- **Key files, folders, data structures, or services — and what each does:**
- **How the system works end-to-end:** (Describe the core logic flow in numbered steps.)
- **Commands that matter:** (The exact commands to run, build, and test the project.)
- **Naming conventions or standards in use:**
- **External dependencies:** (APIs, services, integrations — and where their config lives. Never paste secrets or keys into this document.)

### 4. RECENT WORK — WHAT JUST HAPPENED (HIGH PRIORITY)

This section matters more than anything above it for continuation purposes.
Be detailed. Be specific.

- **What was worked on in this session:**
- **What decisions were made and WHY:**
  (Include the reasoning and tradeoffs. This prevents the next AI from undoing your work.)
- **What changed in the system:**
- **What was discussed but NOT yet implemented:**
- **Open threads or unresolved questions:**
- **Promote to project memory:** (Durable lessons from this session that belong in CLAUDE.md / AGENTS.md — or "none".)

### 5. WHAT COULD GO WRONG

- **Known bugs or issues:**
- **Edge cases to watch for:**
- **Technical debt or shortcuts taken:**
- **Assumptions being made that could be wrong:**
  (Flag anything the next AI might incorrectly assume about the system.)

### 6. HOW TO THINK ABOUT THIS PROJECT

Answer these three questions:
1. What is the core architectural pattern or design philosophy, and why was it chosen?
2. What is the most common mistake a new person working on this would make?
3. What looks like it should be refactored or redesigned but intentionally should NOT be? Why?

### 7. DO NOT TOUCH LIST

Explicit rules for the next AI:
- Do NOT refactor stable, working systems without being asked.
- Do NOT redesign architecture unless explicitly instructed.
- Preserve existing naming conventions.
- Maintain previously chosen tradeoffs — they were chosen for reasons documented above.
- Ask before introducing new frameworks, libraries, or dependencies.

### 8. CONFIDENCE & FRESHNESS

For each major section above, flag:
- ✅ HIGH CONFIDENCE — verified or built this session
- ⚠️ MEDIUM — carried forward from earlier, not re-verified
- ❓ LOW — assumed or inferred; the next AI must verify this before relying on it

---

STEP 2: Generate the Resume Prompt.

After the Continuation Document, generate a single copy-pasteable Resume Prompt inside a code block. It must work as a standalone first message in a brand-new
conversation, and it must reference the Continuation Document by the exact file path where you saved it.

The Resume Prompt must instruct the next AI to:

1. Read the Continuation Document at [exact saved file path] in full before doing anything.
2. Read the project memory files listed in Section 1 (CLAUDE.md, AGENTS.md, etc.), if any.
3. Ground itself before trusting the document: run git status and git log -5 (or otherwise inspect the project), compare reality against Section 2, and flag any drift to the user. Verify anything marked ❓ LOW confidence before relying on it.
4. Summarize its understanding of the current project state in 3–5 sentences.
5. State the next action it will take, based on the USER DIRECTIVE at the end of the prompt.
6. Ask clarification questions ONLY if something genuinely blocks execution.
7. Then begin working.

The user did not provide a directive for the next session. The Resume Prompt must end with this section, reproduced exactly:

---
USER DIRECTIVE: none provided.

Analyze the project state, propose the single most strategic next action with brief reasoning — or ask the user what they want to work on — and wait for confirmation before proceeding.
---

The Resume Prompt must be fully self-contained. Do not add any commentary outside of the Continuation Document and the Resume Prompt.