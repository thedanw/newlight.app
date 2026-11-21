---
name: parkui
description: 'Design, build, and maintain ParkUI components (ArkUI + PandaCSS). Use when creating ParkUI components, designing ParkUI API, styling ParkUI components, or working with ParkUIs composable component architecture. Orchestrates arkui-api-design (UI API) and panda-css (styling) subskills.'
category: ui-ux
risk: safe
source: adapted
tags: [parkui, arkui, panda-css, components, design-system, ui, ux, composable, headless, styling]
triggers: [parkui, park component, arkui component, panda style, comp, component design, design token, build component]
allowed-tools: Read, Write, Bash, Glob, Grep
---

# ParkUI Skill

> **Core philosophy:** ParkUI components are built on two foundations: **ArkUI** (headless UI logic) and **PandaCSS** (styling). The API must be predictable for developers **and AI tools**, and composable by design.

**This skill is an orchestrator.** It coordinates two subskills:

| Subskill | Role | Use When |
|---|---|---|
| arkui-api-design | UI API design (static/dynamic sync, JSDOC, type safety) | Designing/modifying component properties, writing JSDOC, syncing APIs |
| panda-css | Styling (tokens, recipes, CSS extraction) | Writing styles, tokens, recipes, debugging CSS |

---

## When to Use This Skill

Use this skill when the user says:
- Create a ParkUI component
- Design a ParkUI component API
- Add a property to a ParkUI component
- Style this ParkUI component
- Design tokens for ParkUI
- Review this ParkUI component
- Build a ParkUI component with ArkUI and PandaCSS

## ParkUI Architecture Overview

`
┌──────────────────────────────────────────────────────────────┐
│                      ParkUI Component                         │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐                       │
│  │  ArkUI API   │    │  PandaCSS    │                       │
│  │  (headless)  │    │  (styling)   │                       │
│  │  • Properties│    │  • Tokens    │                       │
│  │  • Methods   │    │  • Recipes   │                       │
│  │  • Events    │    │  • Conditions│                       │
│  └──────────────┘    └──────────────┘                       │
│              │                   │                          │
│              └──────────┬────────┘                          │
│                         │                                  │
│              Consistent composable interface                │
│              (predictable for devs & AI tools)              │
└──────────────────────────────────────────────────────────────┘
`

### The Two-Layer Model

**Layer 1 — ArkUI (UI Logic)**
- Headless component API
- Static (.static.d.ets) and dynamic (*Modifier.d.ts) interface sync
- TypeScript types, JSDOC, Resource types
- Cross-framework consistent interface

**Layer 2 — PandaCSS (Styling)**
- Tokens, recipes, patterns, conditions
- Build-time CSS extraction
- Design tokens → CSS variables
- Consistent theming

**Key Principle:** The API must be predictable for both developers and AI tools, maintaining consistency even when switching JavaScript frameworks.


## ParkUI Architecture Overview

`
┌──────────────────────────────────────────────────────────────┐
│                      ParkUI Component                         │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐                       │
│  │  ArkUI API   │    │  PandaCSS    │                       │
│  │  (headless)  │    │  (styling)   │                       │
│  │  • Properties│    │  • Tokens    │                       │
│  │  • Methods   │    │  • Recipes   │                       │
│  │  • Events    │    │  • Conditions│                       │
│  └──────────────┘    └──────────────┘                       │
│              │                   │                          │
│              └──────────┬────────┘                          │
│                         │                                  │
│              Consistent composable interface                │
│              (predictable for devs & AI tools)              │
└──────────────────────────────────────────────────────────────┘
`

### The Two-Layer Model

**Layer 1 — ArkUI (UI Logic)**
- Headless component API
- Static (.static.d.ets) and dynamic (*Modifier.d.ts) interface sync
- TypeScript types, JSDOC, Resource types
- Cross-framework consistent interface

**Layer 2 — PandaCSS (Styling)**
- Tokens, recipes, patterns, conditions
- Build-time CSS extraction
- Design tokens → CSS variables
- Consistent theming

**Key Principle:** The API must be predictable for both developers and AI tools, maintaining consistency even when switching JavaScript frameworks.


## Workflow: Build a New ParkUI Component

### Step 1: Understand Requirements
1. What is the component's purpose?
2. Which properties does it need (UI + styling)?
3. What events does it expose?
4. What is the default behavior?

### Step 2: Design the API (Use arkui-api-design)
1. Define TypeScript types for all properties
2. Create static API entry (.static.d.ets)
3. Create dynamic API entry (*Modifier.d.ts)
4. Sync static and dynamic interfaces
5. Add JSDOC with proper tags (@since, @syscap, @unit, @stagemodelonly)
6. Support Resource types for themable properties

### Step 3: Style the Component (Use panda-css)
1. Define design tokens (colors, spacing, typography, etc.)
2. Create recipes for common component states
3. Write CSS using css(), cva(), or JSX style props
4. Use semantic tokens, not primitive values
5. Verify CSS extraction works

### Step 4: Integrate Layers
1. Ensure the API and styling are consistent
2. Test component in multiple frameworks
3. Verify composability (component can be combined)
4. Run full build and verify output

### Step 5: Validate
1. Check both subskills for compliance
2. Verify static/dynamic API sync
3. Verify CSS extraction
4. Run audits


## Workflow: Add a New Property to an Existing ParkUI Component

### Step 1: Determine Property Type
- UI property → Use arkui-api-design rules
- Styling property → Use panda-css rules
- Both → Follow both

### Step 2: Update API (arkui-api-design)
1. Update static API (.static.d.ets)
2. Update dynamic API (*Modifier.d.ts)
3. Keep signatures synchronized
4. Add JSDOC with @since X static and @since X dynamic

### Step 3: Update Styling (panda-css)
1. Add token if needed
2. Update recipe for the new property
3. Ensure CSS extraction includes the property

### Step 4: Sync
1. Verify both APIs compile
2. Verify CSS extraction
3. Document the change


## Workflow: Update Design Tokens

1. Use ui-tokens principles for token naming
2. Use panda-css for token implementation and CSS extraction
3. Ensure tokens are accessible (contrast, etc.)
4. Update all dependent components

---

## Workflow: Audit a ParkUI Component

1. API Audit → Use arkui-api-design checks:
   - Static/dynamic sync present?
   - JSDOC complete?
   - Types correct?
   - Resource types supported?

2. Styling Audit → Use panda-css checks:
   - Tokens used exist?
   - CSS extraction works?
   - No hardcoded values?
   - No deprecated patterns?

3. Composability Audit → Verify:
   - Component can be composed with others
   - API is consistent
   - Styling is predictable


## Key Rules

### arkui-api-design Rules (Applied via Subskill)
- Always update both static and dynamic APIs
- Use @since X static and @since X dynamic version tags
- Use Resource type for themable properties (API 12+)
- Use ResourceStr for new APIs (API 13+)
- JSDOC: Sets the X not Called when X (for setters)
- No any types
- Include @syscap, @stagemodelonly tags

### panda-css Rules (Applied via Subskill)
- Use tokens from <outdir>/types/tokens.d.ts
- Never hardcode values when tokens exist
- Use semantic tokens (fg.muted, bg.subtle) over primitives
- Run panda codegen after config changes
- Check CSS extraction with panda doctor
- No Tailwind strings, no Emotion, no !important

### ParkUI-Specific Rules
- The component must work across JavaScript frameworks
- The API must be predictable for AI tools
- Composability is the core design principle
- Source code is distributed via CLI (not NPM package)


## Examples

### Example 1: Creating a ParkUI Button

Step 1 — API Design (arkui-api-design):
- Define Button static API with properties (label, icon, disabled, etc.)
- Define ButtonAttribute dynamic API with methods
- Sync both APIs

Step 2 — Styling (panda-css):
- Define tokens for colors, spacing, radii
- Create button-recipe for base styles
- Create button-variant-* for primary/secondary
- Ensure all tokens are semantic

Step 3 — Integration:
- Component accepts both API props and CSS props
- Themeable via PandaCSS tokens
- Consistent across frameworks

### Example 2: Adding iconSize to Button

API changes (arkui-api-design):
- Static: iconSize: number | string with JSDOC
- Dynamic: iconSize(value) => ButtonAttribute method
- Both tagged with @since X static / @since X dynamic

Styling changes (panda-css):
- Ensure iconSize affects the CSS output
- Update recipe if needed


## ParkUI vs. Traditional Component Libraries

| Aspect | Traditional | ParkUI |
|---|---|---|
| Distribution | NPM package | Source code via CLI |
| API | Framework-specific | Framework-agnostic |
| Styling | Separate or bundled | PandaCSS-based |
| Composability | Often limited | Core principle |
| AI predictability | Varies | Designed for AI tools |

---

## Troubleshooting

### Component not styled correctly
- Check panda codegen ran after config changes
- Verify token exists in tokens.d.ts
- Check CSS extraction with panda doctor

### API property not synced
- Check both static and dynamic files updated
- Verify type signatures match
- Check JSDOC tags correct

### Component not composable
- Check API is framework-agnostic
- Verify styling doesn't hardcode values
- Test composition with other components


## Additional Resources

- ParkUI Documentation: https://park-ui.com/docs/components/table#usage
- Subskill: arkui-api-design — UI API design
- Subskill: panda-css — Styling & tokens
- Subskill: ui-tokens — Token management (if available)

---

> Note: This skill is an orchestrator. Delegate to subskills/arkui-api-design for API design work and subskills/panda-css for styling work. The orchestrator ensures both layers are consistent and the component is built correctly.
