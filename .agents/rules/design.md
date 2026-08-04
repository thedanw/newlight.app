# Design System: New Light App

This is the **Single Source of Truth** for the New Light Studio. It enforces a high-density, "Desktop-First" utility aesthetic.

## 1. Visual Atmosphere
Light, bright, highcontrast orange

## Motion & Interaction
- **Slide Ease Physics**: All transitions use `stiffness: 100, damping: 20`.
- **Active Jobs**: Job status indicators must use a subtle "Breathing" opacity loop (0.7 to 1.0).
- **Waterfall Mounting**: 50ms staggered entry for gallery cards and lists.

---
version: alpha
name: "New Light"
description: "New Light is a church management dashboard. The design uses a warm orange brand accent (#ff7000) against a near-white background, with Inter as the primary typeface and Inter-Display for headings. Rounded corners are sharpt 2px. Buttons are often square dimensions. Elevation is conveyed through a single prominent drop shadow on cards."
colors:
  muted-orange-accent: "#ffb980"
  olive-date-band: "#d8db81"
  page-background: "#ffffff"
  peach-card-surface: "#faece1"
  rose-card-surface: "#fae1e2"
  surface-white: "#ffffff"
  brand-orange: "#ff7000"
  dark-amber-text: "#662e00"
  primary-text: "#313638"
  secondary-text: "#666666"
  border-divider: "#dce0e3"
typography:
  card-title:
    fontFamily: "Inter-Display"
    fontSize: "21.25px"
    fontWeight: "700"
    lineHeight: "25.5px"
  body-default:
    fontFamily: "Inter"
    fontSize: "16px"
    fontWeight: "400"
    lineHeight: "24px"
  series-label:
    fontFamily: "Inter"
    fontSize: "13.71px"
    fontWeight: "700"
    lineHeight: "19.2px"
  date-header:
    fontFamily: "Inter"
    fontSize: "12.8px"
    fontWeight: "700"
    lineHeight: "19.2px"
  nav-label:
    fontFamily: "Inter"
    fontSize: "14px"
    fontWeight: "700"
    lineHeight: "16.8px"
  page-title:
    fontFamily: "Inter-Display"
    fontSize: "30px"
    fontWeight: "700"
    lineHeight: "36px"
  small-label:
    fontFamily: "Inter"
    fontSize: "10px"
    fontWeight: "600"
    lineHeight: "11px"
  icon:
    fontFamily: "Material Symbols Sharp"
    fontSize: "20px"
    fontWeight: "400"
    lineHeight: "20px"
rounded:
  sm: "2px"
  default: "4px"
  card-top: "4px 4px 0px 0px"
  lg: "16px"
spacing:
  xs: "4px"
  sm: "5px"
  md: "10px"
  base: "16px"
  card-pad: "15px"
  lg: "20px"
  xl: "30px"
  2xl: "40px"
  3xl: "60px"
  sidebar: "66px"
---

## Overview

New Light Runsheets is a church service scheduling and runsheet management dashboard. The design uses a warm orange brand accent (#ff7000) against a near-white background, with Inter as the primary typeface and Inter-Display for card headings. Service cards feature thumbnail imagery on the left, date-colored header bands, and a consistent list-row layout. The palette draws from warm amber/orange tones for series labels and date headers, with muted peach and rose tints as card surface fills per series. Elevation is conveyed through a single prominent drop shadow on cards.

**Signature traits:**
- Dual typeface system: Pairs Inter-Display and Inter across the type hierarchy.
- Layered elevation: Depth comes from 5 validated shadow tokens.

## Colors

The palette uses 11 validated color tokens across 1 theme profile. Semantic roles stay attached to observed usage so generation agents can choose accents without inventing new color meaning.

**Semantic naming:**
- **action-text** maps to `brand-orange`: Role "text" is grounded by usage context "Series labels, interactive chevrons, date header text, search button background".
- **surface-background** maps to `surface-white`: Role "background" is grounded by usage context "Card body backgrounds, text-on-dark surfaces".
- **content-text** maps to `primary-text`: Role "text" is grounded by usage context "All body text, headings, card titles, metadata".

### Text Scale
- **Brand Orange** (#ff7000): Series labels, interactive chevrons, date header text, search button background. Role: text. {authored: rgb(255, 112, 0), space: rgb}
- **Dark Amber Text** (#662e00): Date header text on warm-tinted card bands. Role: text. {authored: rgb(102, 46, 0), space: rgb}
- **Primary Text** (#313638): All body text, headings, card titles, metadata. Role: text. {authored: rgb(49, 54, 56), space: rgb}
- **Secondary Text** (#666666): Speaker names, scripture references, secondary metadata. Role: text. {authored: rgb(102, 102, 102), space: rgb}

### Interactive
- **Border / Divider** (#dce0e3): Card borders, input outlines, dividers. Role: border.

### Surface & Shadows
- **Muted Orange Accent** (#ffb980): Date header band for orange-series cards (23 Aug, 30 Aug). Role: background. {authored: rgba(255, 185, 128, 0.9), space: rgb, alpha: 0.9}
- **Olive Date Band** (#d8db81): Date header band for Revelation series card. Role: background. {authored: rgba(216, 219, 129, 0.9), space: rgb, alpha: 0.9}
- **Page Background** (#ffffff): Page-level background fill. Role: background. {authored: rgb(255, 255, 255), space: rgb, alpha: 0.8}
- **Peach Card Surface** (#faece1): Card surface tint for Revelation series rows. Role: background. {authored: rgba(250, 236, 225, 0.5), space: rgb, alpha: 0.5}
- **Rose Card Surface** (#fae1e2): Card surface tint for Alpha Celebration series rows. Role: background. {authored: rgba(250, 225, 226, 0.5), space: rgb, alpha: 0.5}
- **Surface White** (#ffffff): Card body backgrounds, text-on-dark surfaces. Role: background. {authored: rgb(255, 255, 255), space: rgb, alpha: 0.8}

## Typography

Typography uses Inter-Display, Inter, Material Symbols Sharp across extracted hierarchy roles. Keep hierarchy mapped to these token rows before adding decorative type styles.

Mixes Inter-Display and Inter and Material Symbols Sharp for visual contrast. Weight range spans bold, regular, semi-bold. Sizes range from 10px to 30px.
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

### Font Roles
- **Headline Font**: Inter
- **Body Font**: Inter

### Type Scale Evidence
| Role | Font | Size | Weight | Line Height | Letter Spacing | Stack / Features | Notes |
|------|------|------|--------|-------------|----------------|------------------|-------|
| Primary heading for service/runsheet card titles | Inter-Display | 21.25px | 700 | 25.5px | normal | Inter-Display, Helvetica, Arial, sans-serif | Extracted token |
| Body text, card metadata, general UI text | Inter | 16px | 400 | 24px | normal | Inter, Helvetica, Arial, sans-serif | Extracted token |
| Series name labels in orange below card titles | Inter | 13.71px | 700 | 19.2px | normal | Inter, Helvetica, Arial, sans-serif | Extracted token |
| Date text in colored header bands on cards | Inter | 12.8px | 700 | 19.2px | normal | Inter, Helvetica, Arial, sans-serif | Extracted token |
| Navigation bar labels and button text | Inter | 14px | 700 | 16.8px | normal | Inter, Helvetica, Arial, sans-serif | Extracted token |
| Top-level page heading (Services) | Inter-Display | 30px | 700 | 36px | normal | Inter-Display, Helvetica, Arial, sans-serif | Extracted token |
| Compact badge or tag labels | Inter | 10px | 600 | 11px | normal | Inter, Helvetica, Arial, sans-serif | Extracted token |
| UI icons for navigation, expand, and search controls | Material Symbols Sharp | 20px | 400 | 20px | normal | Material Symbols Sharp; features: "liga" | Extracted token |

## Layout

Responsive system uses 3 breakpoint tier(s): mobile, tablet, desktop.

This system uses a 16px base grid with scale values 4, 5, 8, 10, 12, 15, 16, 20, 30, 40, 60, 66.

### Responsive Strategy
- **mobile (576-1299px)**: Constrain layout for small viewports and prioritize vertical stacking.
- **tablet (768-1299px)**: Increase spacing and column structure for medium-width viewports.
- **desktop (1200-1399px)**: Expand layout density and horizontal composition for wide viewports.

### Spacing System
| Token | Value | Px | Notes |
|------|-------|----|-------|
| xs | 4px | 4 | Extracted spacing token |
| sm | 5px | 5 | Extracted spacing token |
| md | 10px | 10 | Extracted spacing token |
| card-pad | 15px | 15 | Extracted spacing token |
| base | 16px | 16 | Extracted spacing token |
| lg | 20px | 20 | Extracted spacing token |
| xl | 30px | 30 | Extracted spacing token |
| 2xl | 40px | 40 | Extracted spacing token |
| 3xl | 60px | 60 | Extracted spacing token |
| sidebar | 66px | 66 | Extracted spacing token |

## Elevation & Depth

Keep depth flat unless validated shadow or interaction evidence appears in the extraction payload. Do not invent shadows beyond this evidence boundary.

### Shadow Evidence
| Shadow Token | Layers | Details |
|--------------|--------|---------|
| card-elevation | 1 | 1px 5px 15px 0px rgba(0, 0, 0, 0.4) |
| expand-button | 2 | 0px -5px 5px -3px rgba(0, 0, 0, 0.133) |
| sidebar-panel | 2 | 10px 0px 10px 0px rgba(0, 0, 0, 0.067) |
| inset-input | 1 | inset 0px 2px 4px 0px rgba(0, 0, 0, 0.06) |
| card-soft | 2 | 11px 17px 13px -12px rgba(0, 0, 0, 0.2) |

### Interaction Signals
| Theme | Signal | Evidence |
|-------|--------|----------|
| Light | backdrop-filter | blur(6px) contrast(1.2) brightness(1.2) |
| Light | outline-style | solid |
| Light | outline-color | rgb(49, 54, 56) ; rgb(255, 255, 255) ; rgb(255, 112, 0) |
| Light | outline-width | 3px ; 1px ; 0px |
| Light | outline-offset | 0px |
| Light | transform | matrix(1, 0, 0, 1, 0, -12) ; matrix(-1, 0, 0, -1, 0, 0) ; matrix(1, 0, 0, 1, -110, 0) |

## Shapes

Shape language maps directly to rounded tokens. Keep component corners consistent with the role mapping below before introducing bespoke geometry.

### Radius Roles
| Token | Value | Px | Role Mapping |
|------|-------|----|--------------|
| sm | 2px | 2 | Hairline corner |
| default | 4px | 4 | Subtle corner |
| card-top | 4px 4px 0px 0px | 4 | Subtle corner |
| lg | 16px | 16 | Card corner |

### Geometry Evidence
| Radius Token | Shape | Units |
|--------------|-------|-------|
| sm | 2px | px |
| default | 4px | px |
| card-top | 4px 4px 0px 0px | px |
| lg | 16px | px |

## Components

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

## iconography
- **library**: material icons sharp.
- **variant**: filled (`font-variation-settings: 'fill' 1`).
- **implementation**: 
    - include `<link href="https://fonts.googleapis.com/icon?family=Material+Icons+Sharp" rel="stylesheet">`
    - use `.material-icons-sharp` class for all icons.

## Do's and Don'ts

Guardrails protect Dual typeface system, Layered elevation without adding unsupported visual claims.

| Do | Don't |
|----|---------|
| Do maintain consistent spacing using the base grid | Don't make unsupported claims about absent visual features |
| Do maintain WCAG AA contrast ratios (4.5:1 for normal text) | Don't mix rounded and sharp corners in the same view |
| Do use the primary color only for the single most important action per screen |  |
| Do verify evidence before writing new design-system guidance |  |

## Responsive Evidence

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | <= 374px | screen and (max-width: 374px) |
| Mobile | <= 400px | screen and (max-width: 400px) |
| Mobile | <= 413px | screen and (max-width: 413px) |
| Mobile | <= 575.98px | (max-width: 575.98px) |
| Mobile | <= 576px | (max-width: 576px) |
| Mobile | <= 767px | (max-width: 767px) |
| Breakpoint 7 | <= 767.98px | (max-width: 767.98px) |
| Breakpoint 8 | <= 768px | screen and (max-width: 768px) |
| Breakpoint 9 | <= 991px | (max-width: 991px) |
| Breakpoint 10 | <= 991.98px | (max-width: 991.98px) |
| Breakpoint 11 | <= 1024px | screen and (max-width: 1024px) |
| Breakpoint 12 | <= 1199.98px | (max-width: 1199.98px) |
| Breakpoint 13 | <= 1299px | screen and (max-width: 1299px) |
| Mobile | >= 576px | (min-width: 576px) |
| Tablet | 768-991px | (max-width: 991px) and (min-width: 768px) |
| Tablet | 768-1299px | (max-width: 1299px) and (min-width: 768px) |
| Tablet | >= 768px | (min-width: 768px) |
| Tablet | 992-1199px | (max-width: 1199px) and (min-width: 992px) |
| Tablet | >= 992px | (min-width: 992px) |
| Desktop | 1200-1399px | (max-width: 1399px) and (min-width: 1200px) |

## Agent Prompt Guide

### Example Component Prompts
- Create button component using validated primary color role and spacing tokens.
- Create card component with mapped radius role and evidence-backed elevation.
- Create form input component using inferred typography hierarchy and border roles.

### Iteration Guide
1. Start with extracted palette and typography roles only.
2. Map spacing and radius directly from token tables before visual polish.
3. Apply component patterns one section at a time and compare against source intent.
4. Keep elevation claims tied to explicit evidence in output.
5. Iterate with smallest diffs and re-check section hierarchy after each change.
