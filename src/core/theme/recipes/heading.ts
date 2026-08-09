import { defineRecipe } from '@pandacss/dev'

export const heading = defineRecipe({
  className: 'heading',
  // Consume the heading-style shell vars emitted by theme.css
  // (`[data-heading-style*='bold'|'uppercase'|'accent']`, decision #61).
  // Fallbacks match the default look so knobs are pure overrides.
  base: {
    fontWeight: 'var(--heading-font-weight, var(--font-weights-semibold))',
    textTransform: 'var(--heading-text-transform, none)',
    letterSpacing: 'var(--heading-letter-spacing, normal)',
    color: 'var(--heading-color, var(--colors-fg-default))',
  },
})
