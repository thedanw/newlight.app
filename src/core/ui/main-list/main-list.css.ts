'use client'
import { css } from 'styled-system/css'
import { mainList } from 'styled-system/recipes'

/** MainList root recipe */
export { mainList }

/** CSS custom properties for MainList */
export const mainListCssVars = css({
  '--main-list-select-width': '0px',
  '--main-list-row-height': '12',
})

/** Overlay backdrop for row toolbar */
export const mainListOverlay = css({
  position: 'fixed',
  inset: '0',
  zIndex: '50',
  bg: 'black/20',
  backdropFilter: 'blur(2px)',
})