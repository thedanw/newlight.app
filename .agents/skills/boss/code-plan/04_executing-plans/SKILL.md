---
name: 04_executing-plans
description: "Execute written implementation plans in token-optimized batches with file-tracked context, checkpoints, and git integration."
category: code-plan
risk: safe
source: adapted
tags: [execution, implementation, batch, review, checkpoint, tasks, git, context-recovery, todo, context-optimization]
triggers: [execute, implement, run-plan, follow-plan, batch, checkpoint, todo, context-optimization]
allowed-tools: [manage_todo_list, read_file, write_file, edit_file, run_in_terminal, grep_search, file_search]
---

# Executing Plans (Token-Optimized)

## Overview
Load plan → review critically → execute in batches (default 3 tasks) → report → git commit. File-tracked context for resumability. Agent todos for task decomposition. Context optimization for token efficiency.

**Announce:** "I'm using the executing-plans skill to implement this plan."

---

## Process

### Step 0: Context Recovery (If Resuming)
Read all planning files:
1. `decision.md` — decisions/rationale
2. `plan.md` — what to build, current position (source of truth)
3. `findings.md` — research, discoveries, architecture

Resume at next pending task.

**Compaction (if context > 70%):**
- Summarize completed tasks in `plan.md`
- Store detailed findings in `findings.md`, reference by summary
- Mask observations: replace verbose outputs with `plan.md` refs

---

### Step 1: Load & Review Plan
1. Read `plan.md`
2. Review critically — identify questions/concerns
3. If concerns: raise with user before starting
4. Else: proceed

**Todo Decomposition:**
- `manage_todo_list` → atomic, trackable tasks
- Create items per phase/batch/task
- One `in_progress` at a time (limit: 1)
- Update status immediately on completion

---

### Step 2: Mark completed tasks in `plan.md`
1. Identify any tasks already completed 
2. Mark completed tasks in `plan.md` with [x]

### Step 3: Execute Batch
**Default batch: 3 tasks** (or fewer if remaining < 3).

**Context Optimization During Execution:**
- **Observation Masking**: Summarize key findings in `plan.md` after each tool call
- **KV-Cache**: Stable context (plan, architecture) at top; variable (tool outputs, current task) at end
- **Context Partitioning**: Sub-agents with isolated contexts for independent subtasks
- **Budget**: 20% plan/architecture, 30% current task, 30% recent history, 20% buffer

Per task:
1. Mark in progress tasks with [-] in `plan.md` AND todo list
2. Follow plan steps exactly
3. Run verifications
4. Mark completed tasks with [x] in `plan.md`
5. Log errors in `plan.md` error table (not full output)
6. **Context Check**: If > 70% utilized, compact before next task

**Coding Standards (all batches):**
1. Read before write — Read 2-3 similar files before creating new
2. Match conventions — Follow existing naming, imports, architecture
3. No type suppression — Never `as any`, `@ts-ignore`, equivalent
4. Never delete failing tests — Fix code, not test
5. Never leave broken state — Fix before moving on
6. Respect existing code — Don't refactor what you didn't break

---

### Step 4: Report (Checkpoint)
#### Completed:
Check what tasks have been completed and mark completed tasks in `plan.md` with [x]

#### Errors:
Create doc `errors.md` if any errors occurred during execution.
Append `errors.md` with:
```
Errors
| Error | Resolution |
|-------|-----------|
| [If any] | [How resolved] |

```

Report to user:
- What implemented
- Verification output
- Context optimization metrics
- "Ready for feedback."

---

## Context Optimization Reference

### When to Apply
- Context > 70% utilized
- Response quality degrades
- Costs/latency increase with conversation length

### Strategy Selection
| Dominant Component | Primary Strategy |
|-------------------|------------------|
| Tool outputs | Observation masking |
| Retrieved docs | Summarization or partitioning |
| Message history | Compaction with summarization |
| Multiple | Combine strategies |

### Performance Targets
- Compaction: 50-70% token reduction, <5% quality loss
- Masking: 60-80% reduction in masked observations
- Cache optimization: 70%+ hit rate for stable workloads

### Quick Reference
```
# Compaction trigger
if context_tokens / context_limit > 0.7:
    context = compact_context(context)

# Observation masking
if len(observation) > max_length:
    ref_id = store_observation(observation)
    return f"[Obs:{ref_id} elided. Key: {extract_key(observation)}]"

# Cache-friendly ordering
context = [system_prompt, tool_definitions]  # Stable, cacheable
context += [reused_templates]  # Reusable
context += [unique_content]  # Unique per request
```

---

### Step 5: Continue or Complete
Based on feedback:
- Apply changes if needed
- Execute next batch
- Repeat until all tasks complete

After all complete and verified:
- Run final verification (tests, lint, build)
- Update `plan.md` completed tasks with [x]
- Present completion options

---

## Error Handling (3-Strike Protocol)
1. **Strike 1:** Diagnose and fix the specific error. Log in `plan.md` error table.
2. **Strike 2:** Try a different approach. Log in `plan.md` error table.
3. **Strike 3:** STOP. Revert. Document in `plan.md` error table. Ask user.

**Never repeat the exact same failing action.**

---

## When to Stop and Ask for Help
**STOP immediately when:**
- Blocker mid-batch (missing dependency, test fails, unclear instruction)
- Plan has critical gaps preventing start
- You don't understand an instruction
- Verification fails repeatedly (strike 3)

**Ask for clarification rather than guessing.**

---

## When to Revisit Earlier Steps
**Return to Review (Step 1) when:**
- User updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** — stop and ask.

---

## Remember
- Review plan critically first
- Follow plan steps exactly
- Don't skip verifications
- Update `plan.md` after every task
- Stop when blocked, don't guess
- Read planning files to recover context if resuming
