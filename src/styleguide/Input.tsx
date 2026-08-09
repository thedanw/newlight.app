import { styled } from 'styled-system/jsx'
import type { ComponentProps } from 'react'

/* ---------------------------------------------------------------------------
   Temporary local Input primitive for the styleguide toolPanel.
   The vendored DS has no Input yet (Forms category — Batch 7 adds it). This
   stand-in mirrors Park UI's input recipe styling so the toolPanel filter
   demo renders correctly; Batch 7 swaps it for the vendored `Input`.
--------------------------------------------------------------------------- */

const StyledInput = styled('input', {
  base: {
    width: '100%',
    appearance: 'none',
    outline: '0',
    position: 'relative',
    textAlign: 'start',
    borderRadius: 'l2',
    height: '10',
    px: '3.5',
    bg: 'colorPalette.surface.bg',
    borderWidth: '1px',
    borderColor: 'colorPalette.surface.border',
    color: 'colorPalette.surface.fg',
    transition: 'colors',
    transitionProperty: 'border-color, box-shadow',
    _placeholder: {
      color: 'fg.subtle',
    },
    _hover: {
      borderColor: 'colorPalette.surface.border.hover',
    },
    _focus: {
      borderColor: 'colorPalette.solid.bg',
      boxShadow: '0 0 0 1px var(--colors-color-palette-solid-bg)',
    },
    _disabled: {
      layerStyle: 'disabled',
    },
  },
})

export type InputProps = ComponentProps<typeof StyledInput>
export const Input = StyledInput
