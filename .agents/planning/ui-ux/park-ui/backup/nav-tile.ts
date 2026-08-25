import { defineRecipe } from '@pandacss/dev'

export const navTile = defineRecipe({
  className: 'nav-tile',
  jsx: ['NavTile'],
  base: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.5',
    width: '90px',
    height: '90px',
    padding: '0',
    borderRadius: 'lg',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: '1.2',
    transition: 'background-color 150ms ease, color 150ms ease',
    userSelect: 'none',
    _hover: {
      color: 'var(--sidebar-accent)',
    },
    _active: {
      background: 'var(--sidebar-accent)',
      color: 'var(--sidebar-bg)',
    },
    _focusVisible: {
      outline: '2px solid var(--sidebar-accent)',
      outlineOffset: '2px',
    },
  },
  variants: {
    active: {
      true: {
        background: 'var(--sidebar-accent)',
        color: 'var(--sidebar-accent-fg)',
        _hover: {
          background: 'var(--sidebar-accent-hover)',
        },
      },
    },
    disabled: {
      true: {
        opacity: '0.4',
        cursor: 'not-allowed',
        _hover: {
          background: 'transparent',
        },
      },
    },
  },
  defaultVariants: {
    active: false,
    disabled: false,
  },
})