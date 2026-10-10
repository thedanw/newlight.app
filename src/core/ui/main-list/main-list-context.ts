'use client'
import { createStyleContext } from 'styled-system/jsx'
import { mainList } from 'styled-system/recipes'

const { withProvider, withContext } = createStyleContext(mainList)

/** Slot className getters for direct usage in sub-components */
const mainListSlotClassNames = {
  root: (props?: Parameters<typeof mainList>[0]) => mainList(props).root,
  toolbar: (props?: Parameters<typeof mainList>[0]) => mainList(props).toolbar,
  rows: (props?: Parameters<typeof mainList>[0]) => mainList(props).rows,
  row: (props?: Parameters<typeof mainList>[0]) => mainList(props).row,
  rowSelect: (props?: Parameters<typeof mainList>[0]) => mainList(props).rowSelect,
  rowContent: (props?: Parameters<typeof mainList>[0]) => mainList(props).rowContent,
  rowButton: (props?: Parameters<typeof mainList>[0]) => mainList(props).rowButton,
  rowToolbar: (props?: Parameters<typeof mainList>[0]) => mainList(props).rowToolbar,
  rowHeader: (props?: Parameters<typeof mainList>[0]) => mainList(props).rowHeader,
  footer: (props?: Parameters<typeof mainList>[0]) => mainList(props).footer,
  massManage: (props?: Parameters<typeof mainList>[0]) => mainList(props).massManage,
}

export { mainListSlotClassNames }

/** Context components for use in MainList.Root */
export const Root = withProvider('div', 'root')
export const Rows = withContext('div', 'rows')
export const Footer = withContext('div', 'footer')
export const Toolbar = withContext('div', 'toolbar')
export const MassManage = withContext('div', 'massManage')
export const Row = withContext('div', 'row')
export const RowSelect = withContext('div', 'rowSelect')
export const RowButton = withContext('div', 'rowButton')

export { mainList } from 'styled-system/recipes'
export { mainListCssVars, mainListOverlay } from './main-list.css'