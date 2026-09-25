import { toastAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'
import { PAD, GAP } from '../spacing-contract'

export const toast = defineSlotRecipe({
  className: 'toast',
  slots: toastAnatomy.keys(),
  base: {
    root: {
      alignItems: 'start',
      background: 'colorPalette.surface.bg',
      borderRadius: 'l3',
      borderWidth: '1px',
      borderColor: 'colorPalette.surface.border',
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
      color: 'colorPalette.surface.fg',
      fontWeight: 'medium',
      textStyle: 'sm',
    },
    description: {
      color: 'colorPalette.surface.fg',
      opacity: '0.8',
      textStyle: 'sm',
    },
    actionTrigger: {
      color: 'colorPalette.plain.fg',
      cursor: 'pointer',
      fontWeight: 'semibold',
      textStyle: 'sm',
    },
    closeTrigger: {
      color: 'colorPalette.outline.fg',
      position: 'absolute',
      top: '2',
      insetEnd: '2',
    },
  },
  defaultVariants: {
    status: 'info',
  },
  variants: {
    status: {
      info: {
        root: { colorPalette: 'blue' },
      },
      warning: {
        root: { colorPalette: 'orange' },
      },
      success: {
        root: { colorPalette: 'green' },
      },
      error: {
        root: { colorPalette: 'red' },
      },
      loading: {
        root: { colorPalette: 'gray' },
      },
    },
  },
})
