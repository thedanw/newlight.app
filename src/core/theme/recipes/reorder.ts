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