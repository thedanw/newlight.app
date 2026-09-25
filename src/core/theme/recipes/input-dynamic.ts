import { defineSlotRecipe } from '@pandacss/dev'
import { GAP } from '../spacing-contract'

export const inputDynamic = defineSlotRecipe({
  className: 'input-dynamic',
  slots: ['root', 'trigger', 'header', 'body'],
  base: {
    root: {
      p: 0,
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'gray.outline.border',
      borderRadius: 'l2',
      overflow: 'hidden',
      position: 'relative',
      width: 'full',
    },
    trigger: {
      display: 'block',
    },
    header: {
      background: 'gray.surface.bg.hover',
      color: 'gray.surface.fg',
      opacity: 0,
      paddingLeft: '4',
      pointerEvents: 'none',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      transition: 'opacity var(--durations-fast) ease',
      zIndex: 1,
      '[data-state="open"] &': {
        opacity: 1,
        pointerEvents: 'auto',
      },
      '@media (prefers-reduced-motion: reduce)': {
        transition: 'none',
      },
    },
    body: {
      display: 'grid',
      gridTemplateRows: '0fr',
      overflow: 'hidden',
      gap : GAP,
      transition: 'grid-template-rows var(--durations-normal) ease',
      '[data-state="open"] &': {
        gridTemplateRows: '1fr',
      },
      '@media (prefers-reduced-motion: reduce)': {
        transition: 'none',
      },
    },
  },
})
