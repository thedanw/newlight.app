---
name: product-design
category: ui-ux
description: "Apple-level product design — visual systems, UX flows, accessibility, proprietary visual language, design tokens, prototyping, and handoff. Covers Figma, design systems, typography, color, spacing, motion design, and cognitive design principles."
risk: none
source: community
date_added: '2026-03-06'
author: renat
tags:
- design
- ux
- design-systems
- accessibility
- figma
tools:
- claude-code
- antigravity
- cursor
- gemini-cli
- codex-cli
---

# PRODUCT DESIGN — Apple Level

## Overview

Apple-level product design — visual systems, UX flows, accessibility, proprietary visual language, design tokens, prototyping, and handoff. Covers Figma, design systems, typography, color, spacing, motion design, and cognitive design principles. Activate for: creating a design system, defining a visual language, reviewing UX, accessibility, design tokens, product branding, UI critique.

## When to Use This Skill

- When you need specialized assistance with this domain

## Do Not Use This Skill When

- The task is unrelated to product design
- A simpler, more specific tool can handle the request
- The user needs general-purpose assistance without domain expertise

## How It Works

> "Design is not just what it looks like and feels like. Design is how it works."
> — Steve Jobs

---

## The 10 Jony Ive / Apple Principles

1. **Radical simplicity** — remove everything that is not essential
2. **Material honesty** — every element exists for a reason
3. **Less is more** — restraint is a design decision
4. **Systemic coherence** — everything is part of a single system
5. **Details matter** — the user feels it, even without noticing
6. **Function defines form** — aesthetics serve the purpose
7. **Durability** — design that ages well
8. **Accessibility as standard** — not as an addition
9. **Continuity between screens** — unified experience
10. **Delightful surprise** — the unexpected that delights

## Cognitive Design

- **Zero cognitive load** — the user should never have to think
- **Clear affordances** — what is clickable looks clickable
- **Immediate feedback** — every action has a visual response
- **Errors are prevented** — design that makes errors impossible

## Elite Design System Structure

```
design-system/
├── tokens/
│   ├── colors.json       # full palette with semantics
│   ├── typography.json   # typographic scale
│   ├── spacing.json      # grid and spacing
│   ├── shadows.json      # elevation and depth
│   ├── motion.json       # duration and easing
│   └── radius.json       # rounded borders
├── components/
│   ├── atoms/            # Button, Input, Icon, Badge
│   ├── molecules/        # Card, Form, NavItem
│   └── organisms/        # Header, Sidebar, Modal
├── patterns/
│   ├── onboarding.md     # first access
│   ├── empty-states.md   # empty states
│   ├── loading.md        # loading states
│   └── errors.md         # error handling
└── guidelines/
    ├── voice-tone.md     # voice and tone
    ├── imagery.md        # photography and illustration
    └── accessibility.md  # WCAG 2.1 AA
```

## Design Tokens — Auri Example

```json
{
  "color": {
    "brand": {
      "primary": "#6C63FF",
      "primary-dark": "#5A52E0",
      "accent": "#FF6B6B",
      "surface": "#F8F7FF"
    },
    "semantic": {
      "success": "#22C55E",
      "warning": "#F59E0B",
      "error": "#EF4444",
      "info": "#3B82F6"
    },
    "neutral": {
      "900": "#111827",
      "800": "#1F2937",
      "600": "#4B5563",
      "400": "#9CA3AF",
      "200": "#E5E7EB",
      "50":  "#F9FAFB"
    }
  },
  "typography": {
    "display": { "size": "48px", "weight": "700", "line": "1.1" },
    "h1": { "size": "36px", "weight": "700", "line": "1.2" },
    "h2": { "size": "28px", "weight": "600", "line": "1.3" },
    "body": { "size": "16px", "weight": "400", "line": "1.6" },
    "small": { "size": "14px", "weight": "400", "line": "1.5" }
  },
  "spacing": {
    "xs": "4px", "sm": "8px", "md": "16px",
    "lg": "24px", "xl": "32px", "2xl": "48px", "3xl": "64px"
  },
  "radius": {
    "sm": "4px", "md": "8px", "lg": "12px",
    "xl": "16px", "full": "9999px"
  },
  "shadow": {
    "sm": "0 1px 3px rgba(0,0,0,0.12)",
    "md": "0 4px 12px rgba(0,0,0,0.15)",
    "lg": "0 8px 24px rgba(0,0,0,0.18)",
    "xl": "0 20px 60px rgba(0,0,0,0.22)"
  },
  "motion": {
    "fast": "150ms ease-out",
    "normal": "250ms ease-in-out",
    "slow": "400ms cubic-bezier(0.34, 1.56, 0.64, 1)"
  }
}
```

## UX Flow Structure

```
1. Entry Point (how the user arrives)
2. Context (what the user knows/wants)
3. Action (what the user does)
4. Feedback (immediate system response)
5. Outcome (what the user achieved)
6. Next Step (what comes naturally next)
```

## Elite Onboarding (First 5 Minutes)

```
Screen 1: Promise — "What you will achieve"
  - One impactful phrase
  - An image showing the result
  - CTA: "Start" (not "Create account")

Screen 2: Immediate action — first value before signup
  - Let the user try something real
  - Minimum form (email only)
  - Visible progress (1 of 3)

Screen 3: Personalization — "Tell me about yourself"
  - Max 3 questions
  - Visual, not text
  - Skip available always

Screen 4: Aha Moment — first real success
  - The user does something that works
  - Genuine celebration (not excessive)
  - "You just [value action]"
```

## Enchanting Empty States

```
Don't show: "No items found"
Show:
  - Contextual illustration
  - Opportunity message: "No [X] yet. Create the first one!"
  - Primary CTA
  - Maybe: tip on how to start
```

## Unique Principles for Voice UI

1. **Zero visual load** — the user sees nothing (only hears)
2. **Easy reversibility** — "undo" is always possible
3. **Optional confirmation** — only for irreversible actions
4. **Response variety** — never the same phrase twice
5. **Silence is ok** — 2s pause before asking if help is needed

## Voice Response Structure

```
[Optional hook] + [Core response] + [Action or question]

Bad: "Sorry, I didn't understand what you said. Can you repeat?"
Good: "I didn't catch that. Can you try another way?"

Bad: "Sure! I can help with that. The answer to your question is..."
Good: "The answer is: [direct answer]"
```

## Auri Interaction Scripts

```
First use:
"Hi! I'm Auri. You can ask me anything — from business decisions
to creative ideas. How can I help today?"

Return (known user):
"Welcome back! Last time we were on [topic]. Want to continue?"

Didn't understand:
"I didn't catch that. Try another way?"

Closing:
"Anything else, just call. See you later!"
```

## Constructive Criticism Framework

```
1. OBSERVATION: What I see (without judgment)
   "I notice the main button is in the bottom right corner"

2. PRINCIPLE: Which principle is being tested
   "Visual hierarchy and primary CTA positioning"

3. IMPACT: What this causes the user
   "Users who use their thumb need to stretch to reach it"

4. ALTERNATIVE: Constructive suggestion
   "Consider positioning above the fold, centered"

5. TRADE-OFF: What is lost/gained
   "More accessible, but loses content area"
```

## UI Critique Checklist

- [ ] Clear visual hierarchy (the eye knows where to go)
- [ ] Adequate contrast (WCAG AA: 4.5:1 for text)
- [ ] Minimum touch size (44x44px on mobile)
- [ ] Consistency with design system
- [ ] Interactive states defined (hover/active/disabled/focus)
- [ ] Responsiveness (mobile-first)
- [ ] Loading states and empty states
- [ ] Error handling with useful message
- [ ] Accessibility (labels, ARIA roles, keyboard nav)
- [ ] Perceived performance (skeleton screens, optimistic UI)

## Visual Concept

Auri is **intelligence with human warmth**. It's not a robot — it's a presence.
The visual identity should communicate: accessible sophistication.

## Primary Palette

```
Auri Purple:   #6C63FF  — identity, intelligence, innovation
Auri Pink:     #FF6B9D  — warmth, empathy, humanity
Pure White:    #FFFFFF  — clarity, space, breathing room
Soft Graphite: #1A1A2E  — authority, depth, night
```

## Typography

```
Display/Headings: Inter (or SF Pro for Apple) — Bold 700
Body text:       Inter Regular 400 — line 1.6
Mono/Code:       JetBrains Mono — for technical elements
```

## Logo Concept

```
Shape: Stylized audio wave forming the letter "A"
Color: Purple → Pink gradient (left to right)
Negative space: Suggestion of microphone or ear
Dark/light version: Both defined
Minimum size: 24px (icon), 120px (full lockup)
```

## Design Stack

| Tool    | Use                            |
|---------|--------------------------------|
| Figma   | UI design, prototyping, handoff |
| FigJam  | User journeys, workshops, ideation |
| Zeroheight | Design system documentation |
| Lottie  | Animations (exported from After Effects/Figma) |
| Mobbin  | UI pattern reference           |
| Screenlane | Real UI inspiration         |

## Design Sprint Process (5 Days)

```
Monday: Understand — research, user interviews, define the problem
Tuesday: Diverge — crazy 8s, individual sketches, lightning demos
Wednesday: Decide — vote, storyboard, final decision
Thursday: Prototype — high-fidelity prototype in Figma
Friday: Test — 5 users, insights, iterate
```

## Commands

| Command | Action |
|---------|------|
| `/design-critique` | Structured design critique |
| `/design-tokens` | Generate tokens for a project |
| `/ux-flow` | Map experience flow |
| `/voice-ux` | Voice interaction design |
| `/onboarding` | Create onboarding flow |
| `/design-system` | Structure complete design system |
| `/accessibility` | Accessibility audit |
| `/visual-identity` | Define product visual identity |

## Best Practices

- Provide clear, specific context about your project and requirements
- Review all suggestions before applying them to production code
- Combine with other complementary skills for comprehensive analysis

## Common Pitfalls

- Using this skill for tasks outside its domain expertise
- Applying recommendations without understanding your specific context
- Not providing enough project context for accurate analysis

## Related Skills

- `analytics-product` - Complementary skill for enhanced analysis
- `growth-engine` - Complementary skill for enhanced analysis
- `monetization` - Complementary skill for enhanced analysis
- `product-inventor` - Complementary skill for enhanced analysis

## Limitations
- Use this skill only when the task clearly matches the scope described above.
- Do not treat the output as a substitute for environment-specific validation, testing, or expert review.
- Stop and ask for clarification if required inputs, permissions, safety boundaries, or success criteria are missing.
