---
name: css-architecture
description: "Organize CSS using BEM, SMACSS, and CSS-in-JS patterns. Use when building scalable, maintainable styling systems with proper naming conventions."
category: ui-ux
risk: safe
source: community
source_repo: aj-geddes/useful-ai-prompts
source_type: community
date_added: "2026-08-06"
tags: [css, architecture, bem, smacss, css-in-js, styling, design-system, maintainability]
tools: [claude, cursor, codex, gemini]
---

# CSS Architecture

## Overview

Build maintainable CSS systems using methodologies like BEM (Block Element Modifier), SMACSS, and CSS-in-JS patterns with proper organization and conventions.

## When to Use

- Large-scale stylesheets
- Component-based styling
- Design system development
- Multiple team collaboration
- CSS scalability and reusability

## Quick Start

Minimal working example:

```css
/* Block - standalone component */
.button {
  display: inline-block;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
}

/* Element - component part */
.button__icon {
  margin-right: 8px;
  vertical-align: middle;
}

/* Modifier - variant */
.button--primary {
  background-color: #007bff;
  color: white;
}

.button--primary:hover {
  background-color: #0056b3;
}
```

## Reference Guides

Detailed implementations in the `references/` directory:

| Guide | Contents |
|-------|----------|
| [BEM (Block Element Modifier) Pattern](references/bem-block-element-modifier-pattern.md) | BEM (Block Element Modifier) Pattern |
| [SMACSS (Scalable and Modular Architecture for CSS)](references/smacss-scalable-and-modular-architecture-for-css.md) | SMACSS (Scalable and Modular Architecture for CSS) |
| [CSS-in-JS with Styled Components](references/css-in-js-with-styled-components.md) | CSS-in-JS with Styled Components |
| [CSS Variables (Custom Properties)](references/css-variables-custom-properties.md) | CSS Variables (Custom Properties) |
| [Utility-First CSS (Tailwind Pattern)](references/utility-first-css-tailwind-pattern.md) | Utility-First CSS (Tailwind Pattern) |

## Best Practices

### ✅ DO

- Follow established patterns and conventions
- Write clean, maintainable code
- Add appropriate documentation
- Test thoroughly before deploying

### ❌ DON'T

- Skip testing or validation
- Ignore error handling
- Hard-code configuration values