'use client'
import type { ComponentProps } from 'react'
import { cva } from 'styled-system/css'
import { styled } from 'styled-system/jsx'

const pagePanel = cva({
  base: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1',
    minWidth: '0',
    height: '100%',
    overflow: 'hidden',
    marginLeft: '5px',
    '@media (min-width: 1280px)': {
      marginLeft: 'var(--dynamic-sidebar-width, 100px)',
    },
  },
})

export const PagePanel = styled('div', pagePanel)
export type PagePanelProps = ComponentProps<typeof PagePanel>
