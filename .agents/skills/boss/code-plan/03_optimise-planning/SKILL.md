---
name: 03_optimise-planning
description: "Optimize planning documents for small context LLMs by adding token-optimized context statements and task completion sync to every batch."
category: code-plan
risk: safe
source: adapted
tags: [planning, optimization, small-context, context-statements, batch]
triggers: [optimize-plan, optimize-planning, context-optimization, small-context, batch-optimization]
---

# Optimize Planning Documents for Small Context LLMs

Apply 2 high-impact optimizations to every batch. Enables small-context LLMs to execute multi-batch plans without losing track.

## Essential Optimizations (YAGNI — highest ROI)

### 1. Batch Start — Task Completion Sync (MANDATORY first task)

```
## Batch [N] Start: Sync
- [ ] Mark completed tasks in `plan.md` (update checkboxes/status)
- [ ] Read `findings.md` for key discoveries
```

### 2. Batch Start — Token-Optimized Context Statement (MANDATORY)

```
## Batch [N] Context
- Goal: [One sentence from plan header]
- This Batch: [One sentence]
- Prev: [2-3 lines from plan.md completed tasks]
- Key: [Ref findings.md#section]
```

---

## Application

Apply to **every batch** in `implementation-plan.md` and `plan.md`.

**Token-efficient patterns** (per `markdown-token-optimizer`):
- Imperative verbs: "Mark completed tasks" not "You should mark..."
- No filler: Drop "The goal is to", "This section covers"
- Inline refs: `findings.md#section` not full paths
- One header per batch: `## Batch N` only

See [refs/EXAMPLES.md](refs/EXAMPLES.md) for before/after.

---

## Usage

Invoked by meta-plan-pipeline after Phase 2, before Phase 3.

```bash
# Reads plan.md, findings.md → writes optimized versions
```

---

## Pipeline Integration

```
Phase 1: BRAINSTORM (01_brainstorming)
    ↓
Phase 2: PLAN (02_concise-planning) → plan.md
    ↓
Phase 2.5: OPTIMIZE (03_optimise-planning) → adds sync + context to each batch
    ↓
Phase 3: EXECUTE (04_executing-plans)
    ↓
Phase 4: REVIEW
```