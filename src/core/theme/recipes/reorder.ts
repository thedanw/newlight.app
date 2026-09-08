import { defineSlotRecipe } from '@pandacss/dev'

export const reorder = defineSlotRecipe({
  className: 'reorder',
  slots: ['root', 'item', 'handle'],
  base: {
    root: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      gap: '2',
      listStyle: 'none',
      margin: '0',
      padding: '0',
    },
    item: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: '3',
      // Opacity-only enter (keyframes in src/index.css) — never conflicts
      // with framer-motion's transform-based drag/layout. Exit is defined
      // for consumers; AnimatePresence is forbidden around Ark portals.
      animation: 'reorder-item-enter 0.2s ease-out',
    },
    handle: {
      flexShrink: '0',
      cursor: 'grab',
      touchAction: 'none',
      _active: {
        cursor: 'grabbing',
      },
    },
  },
})