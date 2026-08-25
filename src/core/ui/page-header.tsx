'use client'
import type { ComponentProps } from 'react'
import { cva } from 'styled-system/css'
import { styled } from 'styled-system/jsx'

const pageHeader = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '3',
    px: '6',
    py: '2',
    borderBottom: '1px solid var(--colors-border)',
    flexShrink: '0',
    /* leave space for sidebar pull tab */
    marginRight: '44px',
    '@media (min-width: 1280px)': {
      marginRight: '0px',
    },
  },
})

export const PageHeader = styled('header', pageHeader)
export type PageHeaderProps = ComponentProps<typeof PageHeader>
