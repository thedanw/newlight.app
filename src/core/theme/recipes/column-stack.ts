import { defineRecipe } from '@pandacss/dev'

export const columnStack = defineRecipe({
  className: 'column-stack',
  base: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    gap: '4',
    width: 'full',
    '& > *': {
      _focusVisible: {
        zIndex: 1,
      },
    },
  },
  defaultVariants: {
    spacing: 'md',
    align: 'stretch',
  },
  variants: {
    spacing: {
      none: { gap: '0' },
      xs: { gap: '1' },
      sm: { gap: '2' },
      md: { gap: '4' },
      lg: { gap: '6' },
      xl: { gap: '8' },
    },
    align: {
      start: { alignItems: 'flex-start' },
      center: { alignItems: 'center' },
      end: { alignItems: 'flex-end' },
      stretch: { alignItems: 'stretch' },
      baseline: { alignItems: 'baseline' },
    },
    justify: {
      start: { justifyContent: 'flex-start' },
      center: { justifyContent: 'center' },
      end: { justifyContent: 'flex-end' },
      between: { justifyContent: 'space-between' },
      around: { justifyContent: 'space-around' },
      evenly: { justifyContent: 'space-evenly' },
    },
    grow: {
      true: {
        '& > *': {
          flex: 1,
        },
      },
    },
    divider: {
      true: {
        '& > *:not(:last-child)': {
          borderBottomWidth: '1px',
          borderColor: 'border',
          paddingBottom: '4',
        },
      },
    },
  },
  compoundVariants: [
    {
      grow: true,
      justify: 'between',
      css: {
        '& > *:first-child': {
          marginTop: 'auto',
        },
        '& > *:last-child': {
          marginBottom: 'auto',
        },
      },
    },
  ],
})