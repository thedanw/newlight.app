import { ark } from '@ark-ui/react'
import type { ComponentProps } from 'react'
import { styled } from 'styled-system/jsx'
import { columnStack } from 'styled-system/recipes'

export type ColumnStackProps = ComponentProps<typeof ColumnStack>
export const ColumnStack = styled(ark.div, columnStack)