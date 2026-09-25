import { defineSlotRecipe } from '@pandacss/dev'
import { PAD, GAP } from '../spacing-contract'

export const card = defineSlotRecipe({
  className: 'card',
  slots: ['root', 'header', 'body', 'footer', 'title', 'description'],
  base: {
    root: {
      borderRadius: 'l3',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
      gap: GAP,
      p: PAD,
      pt: PAD,
    },
    header: {
      display: 'flex',
      flexDirection: 'column',
      gap: GAP,
    },
    body: {
      display: 'flex',
      flex: '1',
      flexDirection: 'column',
      gap: GAP,
    },
    footer: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '3',
    },
    title: {
      textStyle: 'lg',
      fontWeight: 'semibold',
    },
    description: {
      color: 'fg.muted',
      textStyle: 'sm',
    },
  },
  defaultVariants: {
    variant: 'outline',
    size: 'default',
  },
  variants: {
    variant: {
      elevated: {
        root: {
          bg: 'gray.surface.bg',
          boxShadow: 'lg',
        },
      },
      outline: {
        root: {
          bg: 'gray.surface.bg',
          borderWidth: '1px',
        },
      },
      subtle: {
        root: {
          bg: 'gray.subtle.bg',
        },
      },
    },
    size: {
      default: {},
      compact: {
        root: {
          p: 0,
        },
        header: {
          gap: GAP,
        },
        body: {
          gap: GAP,
        },
        footer: {
          gap: GAP,
        },
      },
    },
  },
})
