import { defineSlotRecipe } from '@pandacss/dev'
import { PAD, GAP } from '../spacing-contract'

export const mainList = defineSlotRecipe({
  className: 'main-list',
  slots: ['root', 'toolbar', 'rows', 'row', 'rowSelect', 'rowContent', 'rowButton', 'rowToolbar', 'rowHeader', 'footer', 'massManage', 'primaryActions', 'secondaryActions'],
  base: {
    root: {
      display: 'flex',
      flexDirection: 'column',
      width: 'full',
      gap: '0',
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
      gap: '0',
    },
    row: {
      display: 'flex',
      flexDirection: {base:'column', sm:'row'},
      alignItems: 'center',
      gap: '0',
      padding: '0',
      borderBottomWidth: '1px',
      borderColor: 'border',
      transition: 'all0.4s ease',
      _hover: {
        bg: 'gray.surface.bg.hover',
      },
      // D2: the managed row sits above the row-toolbar overlay (overlay is
      // zIndex 50) when its toolbar is open. Driven by `data-toolbar-open`
      // so the recipe stays the single styling source (findings #8/#9).
      '&[data-toolbar-open="true"]': {
        position: 'relative',
        zIndex: '60',
        bg: 'gray.surface.bg',
      },
          // Select column width controlled by data-select-mode on the row
          // (avoids slot-targeting variant codegen issue).
          '&[data-select-mode="true"]': {
            '--main-list-select-width': '48px',
          },
          '&[data-select-mode="false"]': {
            '--main-list-select-width': '0px',
          },
          '&[data-select-open="true"]': {
            '--main-list-select-width': '48px',
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
      transition: 'width 0.4s ease, max-width 0.4s ease',
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
      alignItems: 'flex-end',
      gap: '2',
      width: 'full',
      maxHeight: '0',
      overflow: 'hidden',
      transition: 'all 0.4s ease',
      boxShadow: 'inset',
        background: 'gray.bg.subtle',
      // D2: animation is driven by the data-open attribute set on the element.
      '&[data-open="true"]': {
        maxHeight: '500px',
      },
    },
    rowHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      paddingTop: 2,
      paddingBottom: 2,
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
      padding: '3',
      borderColor: 'border',
    },
    massManage: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '2',
      bg: 'bg.subtle',
      borderColor: 'border',
      maxHeight: '0',
      overflow: 'hidden',
      transition: 'all 0.2s ease',
      // D2: animation is driven by the data-visible attribute set on the element.
      '&[data-visible="true"]': {
        maxHeight: '500px',
      borderWidth: '1px',
      padding: 2,
      },
    },
    primaryActions: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '2',
    },
    secondaryActions: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: '2',
    },
  },
  defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        sm: {
          row: { padding: '0', gap: '2' },
          rowHeader: { 
      paddingTop: 2,
      paddingBottom: 2, gap: '2' },
          footer: { padding: '0' },
        },
        md: {
          row: { padding: '0', gap: '3' },
          rowHeader: { 
      paddingTop: 2,
      paddingBottom: 2, gap: '3' },
          footer: { padding: '0' },
        },
        lg: {
          row: { padding: '0', gap: '3' },
          rowHeader: { 
      paddingTop: 2,
      paddinBottom: 2, gap: '3' },
          footer: { 
      paddingTop: 2,
      paddingBottom: 2 },
        },
      },
    },
})
