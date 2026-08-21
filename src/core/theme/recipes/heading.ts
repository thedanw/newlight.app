import { defineRecipe } from '@pandacss/dev'

/**
 * Consumes the shell heading vars from theme.css §4 (driven by the
 * data-heading-style attribute written by BrandForm): bold / uppercase /
 * accent checkboxes re-theme every <Heading> live.
 */
export const heading = defineRecipe({
  className: 'heading',
  base: {
    color: 'var(--heading-color)',
    fontWeight: 'var(--heading-font-weight, semibold)',
    letterSpacing: 'var(--heading-letter-spacing, normal)',
    textTransform: 'var(--heading-text-transform, none)',
  },
})
