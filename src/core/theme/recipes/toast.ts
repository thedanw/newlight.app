import { toastAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'
import { PAD, GAP } from '../spacing-contract'

export const toast = defineSlotRecipe({
  className: 'toast',
  slots: toastAnatomy.keys(),
  base: {
    root: {
      alignItems: 'start',
      background: 'gray.surface.bg',
      borderRadius: 'l3',
      boxShadow: 'lg',
      display: 'flex',
      gap: GAP.md,
      height: 'var(--height)',
      minWidth: 'sm',
      opacity: 'var(--opacity)',
      overflowWrap: 'anywhere',
      p: PAD.md,
      position: 'relative',
      scale: 'var(--scale)',
      transitionDuration: 'slow',
      transitionProperty: 'translate, scale, opacity, height',
      transitionTimingFunction: 'default',
      translate: 'var(--x) var(--y)',
      width: 'full',
      willChange: 'translate, opacity, scale',
      zIndex: 'var(--z-index)',
    },
    title: {
      color: 'fg.default',
      fontWeight: 'medium',
      textStyle: 'sm',
    },
    description: {
      color: 'fg.muted',
      textStyle: 'sm',
    },
    actionTrigger: {
      color: 'colorPalette.plain.fg',
      cursor: 'pointer',
      fontWeight: 'semibold',
      textStyle: 'sm',
    },
    closeTrigger: {
      position: 'absolute',
      top: '2',
      insetEnd: '2',
    },
  },
})
