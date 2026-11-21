---
name: 00-ui-ux-skill-orchestrator
description: "Meta-orchestrator that coordinates all UI-UX skills to plan, design, build, audit, and enhance user interfaces. Use when starting a new UI project, redesigning an existing interface, or conducting comprehensive UX/UI audits."
category: ui-ux
risk: low
source: custom
tags: [orchestrator, ui, ux, design, audit, workflow, planning, building, enhancing]
triggers: [orchestrate, coordinate, plan, design, build, audit, enhance, ui, ux, workflow]
date_added: "2026-07-20"
allowed-tools: Read,Write,Bash
---

# UI-UX Skill Orchestrator

> **Core philosophy:** Coordinate specialized skills to deliver cohesive, user-centered interfaces through structured workflows. This orchestrator acts as a conductor, ensuring each skill is applied at the right time for maximum impact.

## Why this exists

UI/UX projects often require multiple specialized skills to be applied in sequence or parallel. Without coordination, skills may be applied out of order, leading to inconsistencies, rework, or missed opportunities. This orchestrator:

-   **Prevents skill silos** by ensuring planning informs design, design informs build, and audit informs enhancement.
-   **Maximizes skill compatibility** by identifying which skills work together and in what order.
-   **Provides structured workflows** for common UI/UX tasks, from initial planning to final polish.
-   **Ensures quality** by integrating audit and review skills at appropriate stages.

## What "done" looks like

When using this orchestrator, you should produce:

-   **A coordinated plan** that outlines which skills will be used, in what order, and for what purpose.
-   **A coherent design system** that flows from strategy to components to implementation.
-   **A validated interface** that has been audited for usability, accessibility, and design-system compliance.
-   **An enhanced interface** that incorporates feedback from audits and reviews.

---

## Skill Inventory & Compatibility Matrix

### Planning Skills
| Skill | Purpose | Compatible With |
|-------|---------|-----------------|
| `church-webdesign` | Church-specific UX/UI strategy | `ux-flow`, `ui-setup`, `ui-tokens` |
| `designing-beautiful-websites` | General UX/UI strategy | `ux-flow`, `ui-setup`, `ui-tokens`, `uxui-principles` |
| `ux-flow` | User flow & screen structure | `church-webdesign`, `designing-beautiful-websites`, `ui-page` |
| `uxui-principles` | Research-backed evaluation | `ux-audit`, `ui-review`, `ui-a11y` |

### Design Skills
| Skill | Purpose | Compatible With |
|-------|---------|-----------------|
| `ui-setup` | Project setup & initial scaffold | `church-webdesign`, `designing-beautiful-websites`, `ui-page` |
| `ui-tokens` | Design token management | `church-webdesign`, `designing-beautiful-websites`, `ui-component`, `ui-page` |
| `ui-pattern` | Reusable UI patterns | `ui-component`, `ui-page`, `ui-tokens` |
| `frontend-design` | Production-grade frontend | `ui-component`, `ui-page`, `ui-pattern` |

### Build Skills
| Skill | Purpose | Compatible With |
|-------|---------|-----------------|
| `ui-component` | Generate UI components | `ui-tokens`, `ui-pattern`, `frontend-design` |
| `ui-page` | Scaffold pages | `ui-component`, `ui-pattern`, `ui-tokens`, `frontend-design` |

### Audit Skills
| Skill | Purpose | Compatible With |
|-------|---------|-----------------|
| `ui-review` | Design-system compliance | `ui-a11y`, `ux-audit`, `uxui-principles` |
| `ui-a11y` | Accessibility audit | `ui-review`, `ux-audit`, `uxui-principles` |
| `ux-a11y` | Usability audit | `ui-review`, `ui-a11y`, `uxui-principles` |

### Enhancement Skills
| Skill | Purpose | Compatible With |
|-------|---------|-----------------|
| All audit skills | Identify improvement areas | `ui-component`, `ui-page`, `ui-pattern`, `ui-tokens` |

---

## Workflows

### Workflow 1: New UI Project (Planning → Design → Build → Audit)
1.  **Planning**: Use `designing-beautiful-websites` or `church-webdesign` for strategy.
2.  **Flow Design**: Use `ux-flow` to define user journeys and screen inventory.
3.  **Setup**: Use `ui-setup` to initialize the project with design tokens.
4.  **Token Management**: Use `ui-tokens` to define and manage design tokens.
5.  **Pattern Design**: Use `ui-pattern` to create reusable patterns.
6.  **Component Build**: Use `ui-component` to build components from patterns.
7.  **Page Build**: Use `ui-page` to assemble pages from components.
8.  **Frontend Polish**: Use `frontend-design` to ensure production-grade quality.
9.  **Audit**: Use `ui-review`, `ui-a11y`, and `ux-audit` to validate the interface.
10. **Enhancement**: Apply fixes from audits using relevant build skills.

### Workflow 2: Redesign Existing Interface (Audit → Plan → Design → Build)
1.  **Audit**: Use `ux-audit`, `ui-review`, and `ui-a11y` to identify issues.
2.  **Principles Check**: Use `uxui-principles` to evaluate against research-backed principles.
3.  **Planning**: Use `designing-beautiful-websites` to create a redesign strategy.
4.  **Flow Redesign**: Use `ux-flow` to restructure user journeys.
5.  **Token Update**: Use `ui-tokens` to update the design system.
6.  **Pattern Refactor**: Use `ui-pattern` to refactor existing patterns.
7.  **Component Update**: Use `ui-component` to update or replace components.
8.  **Page Rebuild**: Use `ui-page` to rebuild pages with new components.
9.  **Validation Audit**: Run audits again to ensure improvements.

### Workflow 3: Quick Enhancement (Audit → Fix)
1.  **Targeted Audit**: Use specific audit skill (`ui-a11y` for accessibility, `ux-audit` for usability).
2.  **Fix Implementation**: Use `ui-component` or `ui-page` to apply fixes.
3.  **Review**: Use `ui-review` to ensure fixes maintain design-system compliance.

---

## How to Use This Orchestrator

### Step 1: Identify the Project Type
-   **New Project**: Start with Workflow 1.
-   **Redesign**: Start with Workflow 2.
-   **Quick Fix**: Start with Workflow 3.

### Step 2: Select Skills Based on Compatibility Matrix
-   Use the compatibility matrix to choose skills that work well together.
-   Ensure planning skills inform design skills, and design skills inform build skills.

### Step 3: Execute Skills in Order
-   Follow the workflow sequence to ensure each skill builds on the previous one.
-   Use audit skills at the end of each workflow to validate the output.

### Step 4: Iterate Based on Audit Feedback
-   If audits reveal issues, loop back to the appropriate build skill to fix them.
-   Re-run audits to ensure fixes are effective.

---

## Example Usage

**User Request:** "I need to design a new mobile app for fitness tracking."

**Orchestrator Response:**
1.  **Planning**: Use `designing-beautiful-websites` to define user goals (track workouts, view progress, set goals).
2.  **Flow Design**: Use `ux-flow` to design the main flows (onboarding, workout logging, progress dashboard).
3.  **Setup**: Use `ui-setup` to initialize a mobile-first project with fitness-themed tokens.
4.  **Token Management**: Use `ui-tokens` to define colors, typography, and spacing for fitness.
5.  **Pattern Design**: Use `ui-pattern` to create workout card, progress chart, and navigation patterns.
6.  **Component Build**: Use `ui-component` to build buttons, inputs, and cards from patterns.
7.  **Page Build**: Use `ui-page` to assemble the dashboard and workout pages.
8.  **Frontend Polish**: Use `frontend-design` to ensure smooth animations and responsive design.
9.  **Audit**: Use `ui-a11y` to check accessibility, `ux-audit` to check usability, and `ui-review` for design compliance.
10. **Enhancement**: Apply any fixes found during audits.

---

## Key Principles for Orchestration

1.  **Start with Strategy**: Always begin with planning skills to define goals and user needs.
2.  **Design Before Build**: Use flow and token skills before building components and pages.
3.  **Audit Late, Audit Often**: Run audits after major build phases to catch issues early.
4.  **Leverage Compatibility**: Use the compatibility matrix to combine skills effectively.
5.  **Iterate**: Use audit feedback to drive improvements in a continuous loop.

This orchestrator ensures that the right skills are applied at the right time, leading to cohesive, user-centered interfaces that meet both business goals and user needs.