import { defineSlotRecipe } from '@pandacss/dev'

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
      p: '6',
      pt:'5',
    },
    header: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1',
    },
    body: {
      display: 'flex',
      flex: '1',
      flexDirection: 'column',
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
  },
})
