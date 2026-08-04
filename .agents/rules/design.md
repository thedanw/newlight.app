# Design System: New Light App

This is the **Single Source of Truth** for the New Light Studio. It enforces a high-density, "Desktop-First" utility aesthetic.

## 1. Visual Atmosphere
Light, bright, highcontrast orange

## 2. Color Palette (Strict)
- **New Light Orange** (#FF7300) — Primary Accent. Used for playheads, primary CTAs, and active selection states.
- **Neutral Grayscale Containers (Backgrounds)** - Containers get progressively lighter as they move to the center of the layout
  -> (#171717) Sidebar & Mobile Navbar
  -> (#1E1E1E) Tool panel Titlebar
  -> (#262626) Side Push-Panel and tool panels
  -> (#323232) Main Window Titlebar background
  -> (#3f3f3f) Main Window Background

## font hierarchy
- **headings (h1, h3, h4)**: `inter display` (bold)
- **subheadings**: `inter display` (regular/medium)
- body text: `inter` (regular), **line height: 1.25**

```css
@font-face{font-family:Inter;font-style:normal;font-weight:400;font-display:fallback;src:url('https://newlightanglican.church/wp1/wp-content/themes/spectra-one-riverstone/assets/fonts/inter/inter-400-normal.woff2') format('woff2');}
@font-face{font-family:Inter;font-style:normal;font-weight:700;font-display:fallback;src:url('https://newlightanglican.church/wp1/wp-content/themes/spectra-one-riverstone/assets/fonts/inter/inter-700-normal.woff2') format('woff2');}
@font-face{font-family:"Inter Display";font-style:normal;font-weight:400;font-display:fallback;src:url('https://newlightanglican.church/wp1/wp-content/themes/inter-display/inter-display-400-normal.woff2') format('woff2');}
@font-face{font-family:"Inter Display";font-style:normal;font-weight:700;font-display:fallback;src:url('https://newlightanglican.church/wp1/wp-content/themes/inter-display/inter-display-700-normal.woff2') format('woff2');}
```

## logo & assets
- **variants**:
    - **Orange**: Primary use on white/light backgrounds.
    `https://newlightanglican.church/wp1/wp-content/uploads/2024/02/Master-Logo-1.svg`
    - **Grey**: Secondary for darkneutral or professional contexts.
    `https://newlightanglican.church/wp1/wp-content/uploads/2025/02/NL_logo1-flat-grey.svg`
    - **White**: for dark backgrounds or #FF7300 "New Light Orange"
    `https://newlightanglican.church/wp1/wp-content/uploads/2025/02/NL_logo1-flat-white.svg`
- **wordmarks**:
    - `New Light Anglican Church` (Full name in New Light Orange "Inter Display Bold")
    `https://newlightanglican.church/wp1/wp-content/uploads/2025/02/NLAC_text-orange.svg`
    - `New Light` (Short form in New Light Orange "Inter Display Bold")
    `https://newlightanglican.church/wp1/wp-content/uploads/2025/02/NL_text-orange.svg`

## layout logic
1. **heading spacing**:
    - spacing **before** a heading: **(m)**.
    - **exception**: `0px` if it is the first item in a container.
    - **exception**: `0px` if immediately preceded by another heading (e.g., h1 followed by h2).
2. **safe areas**: all bottom-fixed elements must include `env(safe-area-inset-bottom)` padding.

## iconography
- **library**: material icons sharp.
- **variant**: filled (`font-variation-settings: 'fill' 1`).
- **implementation**: 
    - include `<link href="https://fonts.googleapis.com/icon?family=Material+Icons+Sharp" rel="stylesheet">`
    - use `.material-icons-sharp` class for all icons.

## Geometric Signature
- **Corner Radius**: `xs` (2px) — Sharp, professional edges only.
- **Shadows**: `lg` (Deep, diffused obsidian shadows). No neon or colored glows.
- **Framework**: Shadcn UI (Tailwind CSS + Radix UI). This entirely replaces any legacy use of Panda CSS or Park UI.
    - **CRITICAL DIRECTIONS FOR AGENTS**: 
      1. You must exclusively use Tailwind utility classes for all styling. Do not use styled components or inline styles.
      2. Follow Shadcn conventions for component structure and theming.
      3. For any UI components or design questions, you MUST invoke and consult the Shadcn skill located at: C:\laragon\www\sermon-videos\.agents\skills\shadcn

## Component Behaviors
- **Buttons**: Tactile feedback. -1px Y-axis translate on `:active`.
- **Loaders**: Skeletal shimmer matching component dimensions. **Circular spinners are BANNED.**
- **Iconography**: Material Icons Sharp (Filled). Variant: `font-variation-settings: 'fill' 1`.

## Layout Principles
- **App Shell Grid**: The global layout is governed by a persistent 2-row, 2-column CSS Grid (`MainLayout`).
    - **Header**: 64px height, spans full width.
    - **Sidebar**: 280px width, locked to the left.
    - **Main**: Scrollable content area.
- **Sidebar-First**: Collapsible left sidebar for infinite project nesting.
- **Shared Primitives**: All UI building blocks must be imported from `@/components/ui`. Ad-hoc `styled` components for buttons, inputs, and headings are prohibited.
- **Integrated Creation**: The Global Contextual "Create" button is anchored at the top of the Sidebar Explorer for immediate access.
- **Single Source of Truth**: Layouts must reflect the filesystem hierarchy.
- **Safe Areas**: Bottom-fixed UI must include `env(safe-area-inset-bottom)`.
- **Heading Spacing**: `0px` if first in container or preceded by another heading.

## Motion & Interaction
- **Slide Ease Physics**: All transitions use `stiffness: 100, damping: 20`.
- **Active Jobs**: Job status indicators must use a subtle "Breathing" opacity loop (0.7 to 1.0).
- **Waterfall Mounting**: 50ms staggered entry for gallery cards and lists.

## Anti-Patterns (BANNED)
- **No Emojis**: Use Material Icons Sharp for all visual signaling.
- **No All-Caps**: NEVER use `text-transform: uppercase`.
- **No Glassmorphism**: Use solid Obsidian/Midnight layers.
- **No Overlap**: Elements must occupy distinct spatial zones.
- **No Pure Black**: Use `#18181B` for deep backgrounds.
- **No AI Copywriting**: Avoid "Elevate", "Seamless", "Unleash", "Next-Gen".

## DOM Semantic Identifiers
- **Goal**: Improved code management and debugging by providing high-signal identifiers in the rendered DOM.
- **Implementation**: Every major component and internal section (especially those demarcated by code comments) MUST have a descriptive semantic class name as its **first** class in the `className` string.
- **Naming Protocol**: Use a hybrid naming convention that aligns with React section comment naming. 
    *   Example: `{/* Media Player */}` -> `className="media-player ..."`
    *   Example: `{/* Icon Strip */}` -> `className="icon-strip ..."`
- **Strict Constraint**: These classes are for **identification only**.
    - No external `.css` files.
    - No `@apply` in existing CSS.
    - No functional styling via these classes.
    - Use all existing Tailwind utility classes for styling as per standard rules.
- **Prefixing**: Do not use project prefixes (e.g., `sermon-`). Keep names descriptive and human-readable.

### Logic Rules:
1. **Inheritance**: Folders inside a workspace inherit the parent's action menu.
2. **Structural Integrity**: You cannot create a `Series` inside another `Series`.
3. **Asset Specificity**: "Video Highlights" are hidden unless inside a `YouTube` project.
4. **Smart Redirect**: Creating a `YouTube` structural item automatically triggers the "Import YouTube" flow.
