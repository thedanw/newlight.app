import { defineRecipe } from '@pandacss/dev'

export const separator = defineRecipe({
  className: 'separator',
  base: {
    border: 'none',
    background: 'border',
  },
  variants: {
    orientation: {
      horizontal: {
        height: '1px',
        width: 'full',
      },
      vertical: {
        alignSelf: 'stretch',
        height: 'auto',
        width: '1px',
      },
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
  },
})
