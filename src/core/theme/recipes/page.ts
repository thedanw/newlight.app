import { defineSlotRecipe } from '@pandacss/dev'

const sharedHeaderStyles = {
  display: 'flex',
  top: '0',
  color: 'var(--colors-color-palette-solid-fg)',
  paddingLeft: 'calc(48px + var(--spacing-1))',
  paddingRight: 'calc(48px + var(--spacing-1))',
  '@media (min-width: 1280px)': {
    paddingLeft: '6',
    paddingRight: '6',
  },
  _before: {
    content: '""',
    position: 'absolute',
    inset: '0',
    zIndex: '-1',
    pointerEvents: 'none',
    background: 'var(--colors-color-palette-solid-bg)',
    /* filter: 'hue-rotate(calc(60deg * var(--module-number, 0)))', -- future color palette extension */
  },
}

export const page = defineSlotRecipe({
  className: 'page',
  slots: ['root', 'headerTop', 'header', 'headerBottom', 'main', 'body', 'actions', 'footer'],
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
      // Height of the shell-owned action footer (padding-block 4 ×2 + 40px
      // button) — consumed by Page.Main's scrollPaddingBottom so the last
      // field is never occluded when the footer is visible.
      '--footer-height': 'calc(var(--spacing-4) * 2 + 40px)',
      // Gap removed — the root's only in-flow children are Page.Main (flex:1)
      // and, on action pages, Page.Footer. When main was absolute it was the
      // only child and the gap had zero effect; with footer now in-flow a gap
      // would detach the action bar from the bottom of the page.
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
      gap: { base: '2', md: '4' },
      pb: { base: '3rem', md: '5rem' },
      ...sharedHeaderStyles,
    },
    body: {
      display: 'flex',
      flexDirection: 'column',
      // Natural height (no grow/shrink): Page.Main is the scroll container and
      // flex-grow on body would size it to exactly the visible viewport,
      // leaving no overflow for Main to scroll when content is taller.
      flex: '0 0 auto',
      minWidth: '0',
      gap: { base: '2', md: '4' },
      padding: { base: '3', md: '6' },
      position: 'relative',
    },
    main: {
      position: 'relative',
      flex: '1',
      minHeight: '0',
      minWidth: '0',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      overflowX: 'hidden',
      scrollPaddingBottom: 'var(--footer-height, 0)',
    },
    actions: {
      display: 'flex',
      flexDirection: 'column',
      flex: '0 0 auto',
      minWidth: '0',
      gap: { base: '2', md: '4' },
      padding: { base: '3', md: '6' },
      paddingTop: '6',
      position: 'relative',
    },
    footer: {
      position: 'absolute',
      bottom: '0',
      left: '0',
      right: '0',
      zIndex: 'sticky',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: '3',
      paddingLeft: { base: '3', md: '6' },
      paddingRight: { base: '3', md: '6' },
      paddingBlock: '4',
      paddingBottom: 'calc(var(--spacing-4) + env(safe-area-inset-bottom))',
      background: 'var(--canvas-bg)',
      borderTop: '1px solid var(--colors-border)',
      transform: 'translateY(100%)',
      transition: 'transform var(--durations-normal) ease',
      '&[data-state="visible"]': {
        transform: 'translateY(0)',
      },
      '@media (prefers-reduced-motion: reduce)': {
        transition: 'none',
      },
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
  },
  defaultVariants: {
    headerVariant: 'default',
  },
})
