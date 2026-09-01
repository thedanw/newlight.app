import { defineRecipe } from '@pandacss/dev'

export const pullTab = defineRecipe({
  className: 'pull-tab',
  jsx: ['PullTab'],
  base: {
    // NOTE: this button must NOT create a stacking context (no z-index or
    // transform here), otherwise the ::before with z-index:-1 could only sit
    // behind the content, never behind the button's own background. The
    // pull-tab wrapper provides the modal stacking level.
    position: 'absolute',
    top: '0.5rem',
    right: 'calc( var(--sidebar-width) - 12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: '6px',
    width: '54px',
    height: '48px',
    borderRadius: 'l2',
    background: 'var(--sidebar-bg)',
    border: 'none',
    color: 'var(--sidebar-fg)',
    cursor: 'grab',
    boxShadow:
      '1px -1px 0px 0px var(--colors-gray-a3), 10px 0px 12px var(--colors-black-a1)',
    transition: 'transform 200ms ease, background-color 150ms ease, border-color 150ms ease',
    userSelect: 'none',
    _hover: {
      color: 'var(--sidebar-accent)',
      borderColor: 'var(--sidebar-accent)',
    },
    _active: {
      cursor: 'grabbing',
      color: 'var(--sidebar-fg)',
    },
    _focusVisible: {
      outline: '2px solid var(--sidebar-accent)',
      outlineOffset: '2px',
    },
    _before: {
      content: '" "',
      position: 'absolute',
      background: 'var(--colors-black-a5)',
      borderRadius: 'l2',
      inset: '0px 3px 3px 16px',
      // z-index:-1 escapes to the wrapper's stacking context (the button must
      // not create its own) so this paints behind the WHOLE button — its
      // background AND icon — yet still above the page.
      zIndex: '-1',
      pointerEvents: 'none',
      // The tab background is opaque, so a flush ::before would be fully
      // hidden. Offset it so it peeks out below/right as a cast shadow.
      transform: 'skew(-7deg, 10deg) translate(1px, 8px)',
      filter: 'blur(10px)',
    },
  },
})