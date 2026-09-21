import { fieldsetAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'
import { PAD, GAP } from '../spacing-contract'

export const fieldset = defineSlotRecipe({
  className: 'fieldset',
  slots: fieldsetAnatomy.extendWith('content', 'control').keys(),
  base: {
    root: {
      display: 'flex',
      justifyContent: 'space-between',
      width: 'full',
      flexDirection: { base: 'column', md: 'row' },
      gap: GAP,
    },
    control: {
      maxW: 'xs',
      display: 'flex',
      flexDirection: 'column',
      width: 'full',
      gap: GAP.base,
    },
    content: {
      display: 'flex',
      flexDirection: 'column',
      width: 'full',
      maxW: '2xl',
      gap: GAP.base,
    },
    legend: {
      color: 'fg.default',
      fontWeight: 'semibold',
    },
    helperText: {
      color: 'fg.muted',
      textStyle: 'sm',
    },
    errorText: {
      display: 'inline-flex',
      alignItems: 'center',
      color: 'error',
      gap: GAP.base,
      fontWeight: 'medium',
      textStyle: 'sm',
    },
  },
})
