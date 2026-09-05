import { defineSlotRecipe } from '@pandacss/dev'

const sharedHeaderStyles = {
  display: 'flex',
  top: '0',
  color: 'var(--colors-color-palette-solid-fg)',
  paddingLeft: 'calc( 48px + var(--spacing-1) )',
  paddingRight: 'calc( 48px + var(--spacing-1) )',
  '@media (min-width: 1280px)': {
    paddingLeft: { base: '3', md: '6' },
    paddingRight: { base: '3', md: '6' },
  },
  _before: {
    content: '""',
    position: 'absolute',
    inset: '0',
    zIndex: '-1',
    pointerEvents: 'none',
    background: 'var(--colors-color-palette-solid-bg)',
    filter: 'hue-rotate(calc(60deg * var(--module-number, 0)))',
  },
}

export const page = defineSlotRecipe({
  className: 'page',
  slots: ['root', 'headerTop', 'header', 'headerBottom', 'main', 'body', 'footer'],
  base: {
    root: {
      display: 'flex',
      flexDirection: 'column',
      flex: '1',
      minWidth: '0',
      height: '100%',
      overflow: 'hidden',
      position: 'relative',
      marginLeft: '5px',
      padding: '0',
      gap: { base: '3', md: '6' },
      '@media (min-width: 1280px)': {
        marginLeft: 'var(--dynamic-sidebar-width, 100px)',
      },
    },
    headerTop: {
      zIndex: '1',
      position: 'relative',
      pt: { base: '9', md: '12' },
      pb: '0',
      minHeight: { base: '3', md: '6' },
      ...sharedHeaderStyles,
    },
    header: {
      position: 'sticky',
      zIndex: '2',
      alignItems: 'center',
      gap: '2',
      flexShrink: '0',
      pt: '8px',
      pb: '8px',
      minHeight: '65px',
      ...sharedHeaderStyles,
    },
    headerBottom: {
      zIndex: '1',
      position: 'relative',
      flexDirection: 'column',
      pt: '0',
      gap: { base: '3', md: '6' },
      pb: { base: '3rem', md: '5rem' },
      ...sharedHeaderStyles,
    },
    body: {
      display: 'flex',
      flexDirection: 'column',
      flex: '1',
      minWidth: '0',
      gap: { base: '3', md: '6' },
      padding: { base: '3', md: '6' },
      position: 'relative',
    },
    main: {
      position: 'absolute',
      inset: '0',
      display: 'flex',
      flexDirection: 'column',
      minWidth: '0',
      overflowY: 'auto',
      overflowX: 'hidden',
    },
    footer: {
      display: 'flex',
      justifyContent: 'flex-end',
      paddingLeft: { base: '3', md: '6' },
      paddingRight: { base: '3', md: '6' },
      gap: '3',
      flexShrink: '0',
    },
  },
  variants: {
    headerVariant: {
      default: {
        header: {},
      },
      hero: {
        header: {},
      },
    },
    footerVariant: {
      static: {
        footer: {},
      },
      fixed: {
        footer: {
          position: 'fixed',
          bottom: '0',
          left: '0',
          right: '0',
          zIndex: 'sticky',
          background: 'var(--canvas-bg)',
          borderTop: '1px solid var(--colors-border)',
          padding: '4',
        },
      },
    },
  },
  defaultVariants: {
    headerVariant: 'default',
    footerVariant: 'static',
  },
})
