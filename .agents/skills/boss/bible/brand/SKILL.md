---
name: New Light Brand Guidelines
category: bible
description: Comprehensive brand guidelines for New Light Anglican Church, including colors, typography, design patterns, and styling rules for the Team Hub application.
---

# New Light Brand Guidelines

This skill provides comprehensive brand guidelines for New Light Anglican Church and specific styling rules for the Team Hub application built on the Paper Dashboard React template.

## Brand Identity

### Church Name

**New Light Anglican Church Riverstone**

## Color Palette

### Primary Colors

**New Light Orange** (Primary Brand Color)

- Hex: `#FF7300`
- RGB: R255 G115 B0
- CMYK: C0 M68 Y100 K0
- Pantone: 151 C
- Usage: Primary actions, brand accents, headings, links, active states

**New Light Midnight** (Primary Text/Dark)

- Hex: `#313638`
- RGB: R49 G54 B56
- CMYK: C13 M4 Y0 K80
- Pantone: 447 C
- Usage: Body text, dark UI elements, icons

### New Light Secondary/Greys

- #60695C
- Usage: Info, Secondary actions, UI elements

- #E0DFD5
- Usage: Backgrounds, cards

- #FFFFFF
- Usage: Light Text

- #E8E9EB

#313638

### Tertiary Colors

**Red** (Fail/Error)

- Hex: `#E95E38`
- Usage: Error states, destructive actions, alerts

**Yellow** (Warning)

- Hex: `#FFB700`
- Usage: Warning states, caution messages

**Green** (Success)

- Hex: `#FF7B00` (Note: This appears to be orange in brand guide - verify)
- Usage: Success states, confirmations

**Teal**

- Hex: `#FF7B00` (Note: Listed as same as green - verify)

**Blue**

- Hex: `#38759D`

**Violet**

- Hex: `#8F57E4`
- Usage: Accent color

**Pink**

- Hex: `#CA526A`
- Usage: Accent color

**Info Color** (Used in app for service plans, headers)

- Hex: `#60695C`
- Usage: Table headers, secondary UI elements

---

## Typography

### Font Families

**Headings**

- Font: **Inter Tight** (Bold)
- Fallback: `'Inter-Display', Helvetica, Arial, sans-serif`
- Usage: H1, H2, H3, H4, page titles, card titles
- Weight: 700 (Bold)
- Text-transform: Capitalize
- line-height: 1.2

**Subheadings**

- Font: **Inter Tight** (Regular)
- Usage: H5, H6, section subheadings
- Weight: 400 (Regular)
- Text-transform: Capitalize
- line-height: 1.2

**Body Text**

- Font: **Inter** (Regular)
- Fallback: `'Inter', Helvetica, Arial, sans-serif`
- Usage: Paragraphs, descriptions, labels
- Weight: 400 (Regular)
- Text-transform: None (Sentence Case)
- line-height: 1.2

### Font Sizes (Mobile-First, Responsive)

**Base Sizes** (Mobile)

- H1: `2.5rem` (40px) → Desktop: `3.5rem` (56px)
- H2: `2.0rem` (32px) → Desktop: `2.5rem` (40px)
- H3: `1.75rem` (28px) → Desktop: `2.0rem` (32px)
- H4: `1.5rem` (24px) → Desktop: `1.725rem` (27.6px)
- H5: `1.25rem` (20px) → Desktop: `1.5625rem` (25px)
- H6: `1rem` (16px) → Desktop: `1.1rem` (17.6px)
- Body: `1rem` (16px)
- Small: `0.8571rem` (13.7px)
- Mini: `0.7142rem` (11.4px)

### Typography Best Practices

- Use Inter Tight Bold for all major headings
- Use Inter Regular for body text to maintain readability
- Maintain consistent line-height: `1.5` for body, `1.15-1.45` for headings
- Avoid text transformations (no forced uppercase)

---

## Design Patterns

### Border Radius

**Primary Style: Square Corners**

- All border-radius values: `0px`
- Cards, buttons, inputs, modals: Sharp, crisp corners
- Exception: Occasional accent with single rounded corner (see below)

### Accent Rounded Corners (Occasional Use)

- Apply rounded corner to **one corner only** for visual interest
- Typical radius: `8px` to `12px`
- Usage: Featured cards, call-to-action elements, hero sections
- Example: Top-right corner rounded on a card

### Accent Lines

**Double Lines**

- Style: Two parallel thin lines
- Thickness: `1px` each
- Spacing: `2px` to `4px` between lines
- Color: Use brand orange `#FF7300` or grey `#313638`
- Usage: Section dividers, decorative elements, borders

### Background

**Primary Background**
White page

---

## Component Styling Guidelines

### Icons

**Material Symbols Sharp**

- Font: Material Symbols Sharp
- Settings: `'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24`
- Display: `inline-block`
- Vertical Align: `middle`

**Icon Sizing**

- Small: `16px` to `18px`
- Medium: `24px` (default)
- Large: `32px` to `48px`
- Responsive: Use `rem` or `em` units for scaling

### Badges & Tags

**Badge Styles**

- Border Radius: `0px` (square)
- Padding: `2px 8px`
- Font Size: `0.7142rem` (mini)
- Font Weight: `600`

**Color Variants**

- Primary: Background `#FF7300`, Text `#FFFFFF`
- Info: Background `#60695C`, Text `#FFFFFF`
- Light: Background `#F5F5F5`, Text `#313638`
- Success: Background `#6BD098`, Text `#FFFFFF`
- Warning: Background `#FBC658`, Text `#313638`
- Danger: Background `#EF8157`, Text `#FFFFFF`

---

## Layout Patterns

### Two-Panel Sliding Layout

**Structure**

- Left Panel: List/navigation (slides out when detail selected)
- Right Panel: Detail view (slides in from right)
- Animation: Spring physics with `damping: 28, stiffness: 220`

**Panel Classes**

- `.content`: Main content area
- `.second-panel.content`: Sliding detail panel (sibling to main content)

**Animation Variants**

```javascript
listVariants: {
  visible: { x: 0, opacity: 1 },
  hidden: { x: "-100%", opacity: 0 }
}

detailVariants: {
  visible: { x: 0, opacity: 1 },
  hidden: { x: "100%", opacity: 0 }
}
```

### Sidebar Navigation

**Sidebar Styling**

- Width: `260px`
- Background: Dark with brand colors
- Fixed position
- Border Right: `1px solid #DDD`

**Navigation Items**

- Active State: Orange accent `#FF7300`
- Hover: Subtle background change
- Icons: Material Symbols Sharp

### Date Calendar Box

**Small Variant** (List Views)

```scss
.date-calendar-box-sm {
  width: 50px;
  height: 50px;
  // Compact calendar display
}
```

**Standard Variant** (Detail Views)

```scss
.date-calendar-box {
  width: 70px;
  height: 70px;
  // Full calendar display with year, day, month
}
```

---

## Best Practices

### DO's

✓ Use square corners (0px border-radius) as default
✓ Use Inter Tight Bold for headings, Inter Regular for body
✓ Maintain brand orange (#FF7300) for primary actions
✓ Use double fine lines for decorative accents
✓ Apply single rounded corner for special emphasis (sparingly)
✓ Ensure mobile-first responsive design
✓ Use Material Symbols Sharp for icons
✓ Maintain WCAG AA accessibility standards

### DON'Ts

✗ Don't use rounded corners everywhere (only as accent)
✗ Don't force text to uppercase
✗ Don't use generic colors (plain red, blue, green)
✗ Don't ignore mobile optimization
✗ Don't use default browser fonts
✗ Don't apply heavy drop shadows (use subtle glassmorphism)
✗ Don't use more than 3 colors in a single component
✗ Don't create designs without breathing room

---

## Code Examples

### SCSS Variables (Already Implemented)

```scss
// Brand Colors
$primary-color: #ff7300;
$black-color: #313638;
$white-color: #ffffff;

// Typography
$sans-serif-family: "Inter", Helvetica, Arial, sans-serif;
$headings-font-family: "Inter-Display", Helvetica, Arial, sans-serif;

// Border Radius (Square Corners)
$border-radius-none: 0px;
$border-radius-small: 0px;
$border-radius-base: 0px;
$border-radius-large: 0px;
$border-radius-extreme: 0px;
```

### Accent Corner (Special Use)

```scss
.featured-card {
  border-top-right-radius: 12px;
}
```

### Double Line Accent

```scss
.section-divider {
  position: relative;

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: #ff7300;
    box-shadow: 0 2px 0 0 #ff7300;
  }
}
```

---

## When to Use This Skill

Invoke this skill when:

- Choosing colors for new features
- Implementing typography and font styles
- Creating buttons, cards, or form elements
- Ensuring brand consistency across the application
- Making responsive design decisions
- Implementing animations and transitions
- Reviewing designs for brand compliance
- Onboarding new developers to the project
- Creating print-friendly layouts

---

## Resources

### Brand Assets

- Logo Files: https://newlightanglican.church/brand/
- Font Downloads: Inter + Inter Tight (Google Fonts)
- Background Image: `assets/img/runsheet-bg.webp`

### External Links

- Website: https://newlightanglican.church/
- Facebook: https://www.facebook.com/newlightanglican.church
- YouTube: https://www.youtube.com/@newlightanglican.church
- Instagram: https://www.instagram.com/newlightanglican.church
- Team Hub (Elvanto): https://my.newlight.app

### Paper Dashboard Template

- Demo: https://demos.creative-tim.com/paper-dashboard-react/
- Documentation: Creative Tim Paper Dashboard React
- Base Template: Modified with New Light branding
