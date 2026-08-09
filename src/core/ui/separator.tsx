'use client'
import { ark } from '@ark-ui/react/factory'
import type { ComponentProps } from 'react'
import { styled } from 'styled-system/jsx'
import { separator } from 'styled-system/recipes'

export type SeparatorProps = ComponentProps<typeof Separator>
export const Separator = styled(ark.hr, separator)
