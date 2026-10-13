import { defineSlotRecipe } from '@pandacss/dev'
import { PAD, GAP } from '../spacing-contract'

export const mainList = defineSlotRecipe({
  className: 'main-list',
  slots: ['root', 'toolbar', 'rows', 'row', 'rowSelect', 'rowContent', 'rowButton', 'rowToolbar', 'rowHeader', 'footer', 'massManage'],
  base: {
    root: {
      display: 'flex',
      flexDirection: 'column',
      width: 'full',
      gap: 1,
    },
    toolbar: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '4',
      flexWrap: 'wrap',
    },
    rows: {
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
    },
    row: {
      display: 'flex',
      alignItems: 'center',
      gap: GAP,
      padding: '3 4',
      borderBottomWidth: '1px',
      borderColor: 'border',
      transition: 'background-color 0.2s ease',
      _hover: {
        bg: 'gray.surface.bg.hover',
      },
      // D2: the managed row sits above the row-toolbar overlay (overlay is
      // zIndex 50) when its toolbar is open. Driven by `data-toolbar-open`
      // so the recipe stays the single styling source (findings #8/#9).
      '&[data-toolbar-open="true"]': {
        position: 'relative',
        zIndex: '60',
      },
          // Select column width controlled by data-select-mode on the row
          // (avoids slot-targeting variant codegen issue).
          '&[data-select-mode="true"]': {
            '--main-list-select-width': '48px',
          },
          '&[data-select-mode="false"]': {
            '--main-list-select-width': '0px',
          },
        },
    rowSelect: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 'var(--main-list-select-width, 0px)',
      maxWidth: 'var(--main-list-select-width, 0px)',
      overflow: 'hidden',
      flexShrink: '0',
      transition: 'width 0.2s ease, max-width 0.2s ease',
    },
    rowContent: {
      flex: '1',
      minWidth: '0',
      display: 'flex',
      flexDirection: 'row',
      gap: '1',
    },
    rowButton: {
      flexShrink: '0',
    },
    rowToolbar: {
      display: 'flex',
      alignItems: 'center',
      gap: '2',
      width: 'full',
      maxHeight: '0',
      overflow: 'hidden',
      transition: 'max-height 0.2s ease',
      // D2: animation is driven by the data-open attribute set on the element.
      '&[data-open="true"]': {
        maxHeight: '500px',
      },
    },
    rowHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '4',
      padding: '3 4',
      fontWeight: 'semibold',
      color: 'fg.muted',
      bg: 'bg.subtle',
      borderBottomWidth: '1px',
      borderColor: 'border',
    },
    footer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '3 4',
      borderTopWidth: '1px',
      borderColor: 'border',
    },
    massManage: {
      display: 'flex',
      alignItems: 'center',
      gap: '4',
      padding: '3 4',
      bg: 'bg.subtle',
      borderBottomWidth: '1px',
      borderColor: 'border',
      maxHeight: '0',
      overflow: 'hidden',
      transition: 'max-height 0.2s ease',
      // D2: animation is driven by the data-visible attribute set on the element.
      '&[data-visible="true"]': {
        maxHeight: '500px',
      },
    },
  },
  defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        sm: {
          row: { padding: '2 3', gap: '3' },
          rowHeader: { padding: '2 3', gap: '3' },
          footer: { padding: '2 3' },
          massManage: { padding: '2 3' },
        },
        md: {
          row: { padding: '3 4', gap: '4' },
          rowHeader: { padding: '3 4', gap: '4' },
          footer: { padding: '3 4' },
          massManage: { padding: '3 4' },
        },
        lg: {
          row: { padding: '4 5', gap: '5' },
          rowHeader: { padding: '4 5', gap: '5' },
          footer: { padding: '4 5' },
          massManage: { padding: '4 5' },
        },
      },
    },
})
