import { defineSlotRecipe } from '@pandacss/dev'

/**
 * Page — the standard page scaffold for every module page.
 *
 * Replaces the old `PagePanel` + `PageHeader` pair with a single slot recipe:
 *   - `root`   : outer wrapper (margin-left for the sidebar pull-tab, page
 *                gutter padding, vertical rhythm between header/body/footer)
 *   - `header` : page chrome — h1 on dashboard pages, back-button on sub
 *                pages. Scrolls WITH the page (never fixed). Optional `hero`
 *                variant tints the header with the module's accent hue.
 *   - `body`   : main content region (vertical rhythm between cards)
 *   - `footer` : OPTIONAL. `fixed` variant pins to the bottom of the screen
 *                and stays visible while scrolling — used for whole-page
 *                save/apply forms.
 *
 * Responsive rhythm: padding/gaps collapse from `6` (24px) on wide screens to
 * `3` (12px) on small screens via the `base`/`md` responsive object syntax.
 */
export const page = defineSlotRecipe({
  className: 'page',
  slots: ['root', 'header', 'body', 'footer'],
  base: {
    root: {
      display: 'flex',
      flexDirection: 'column',
      flex: '1',
      minWidth: '0',
      height: '100%',
      overflow: 'hidden',
      marginLeft: '5px',
      padding: '0',
      gap: { base: '3', md: '6' },
      '@media (min-width: 1280px)': {
        marginLeft: 'var(--dynamic-sidebar-width, 100px)',
      },
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      pt: '8px',
      pb: '8px',
      borderBottom: '1px solid var(--colors-border)',
      flexShrink: '0',
      minHeight: '65px',
      paddingRight: { base: '3', md: '6' },
      paddingLeft: 'calc( 48px + 3)',
      /* leave space for sidebar pull tab */
      '@media (min-width: 1280px)': {
        paddingLeft: { base: '3', md: '6' },
      },
    },
    body: {
      display: 'flex',
      flexDirection: 'column',
      flex: '1',
      minWidth: '0',
      gap: { base: '3', md: '6' },
      paddingLeft: { base: '3', md: '6' },
      paddingRight: { base: '3', md: '6' },
      overflowY: 'auto',
      position: 'relative',
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
