import { compact, getSlotCompoundVariant, memo, splitProps } from '../helpers.mjs';
import { createRecipe } from './create-recipe.mjs';

const mainListDefaultVariants = {
  "size": "md"
}
const mainListCompoundVariants = []

const mainListSlotNames = [
  [
    "root",
    "main-list__root"
  ],
  [
    "toolbar",
    "main-list__toolbar"
  ],
  [
    "rows",
    "main-list__rows"
  ],
  [
    "rowWrapper",
    "main-list__rowWrapper"
  ],
  [
    "rowSelect",
    "main-list__rowSelect"
  ],
  [
    "rowContent",
    "main-list__rowContent"
  ],
  [
    "rowCell",
    "main-list__rowCell"
  ],
  [
    "rowButton",
    "main-list__rowButton"
  ],
  [
    "rowToolbar",
    "main-list__rowToolbar"
  ],
  [
    "rowHeader",
    "main-list__rowHeader"
  ],
  [
    "footer",
    "main-list__footer"
  ],
  [
    "massManage",
    "main-list__massManage"
  ],
  [
    "primaryActions",
    "main-list__primaryActions"
  ],
  [
    "secondaryActions",
    "main-list__secondaryActions"
  ]
]
const mainListSlotFns = /* @__PURE__ */ mainListSlotNames.map(([slotName, slotKey]) => [slotName, createRecipe(slotKey, mainListDefaultVariants, getSlotCompoundVariant(mainListCompoundVariants, slotName))])

const mainListFn = memo((props = {}) => {
  return Object.fromEntries(mainListSlotFns.map(([slotName, slotFn]) => [slotName, slotFn.recipeFn(props)]))
})

const mainListVariantKeys = [
  "size"
]
const getVariantProps = (variants) => ({ ...mainListDefaultVariants, ...compact(variants) })

export const mainList = /* @__PURE__ */ Object.assign(mainListFn, {
  __recipe__: false,
  __name__: 'mainList',
  raw: (props) => props,
  classNameMap: {},
  variantKeys: mainListVariantKeys,
  variantMap: {
  "size": [
    "sm",
    "md",
    "lg"
  ]
},
  splitVariantProps(props) {
    return splitProps(props, mainListVariantKeys)
  },
  getVariantProps
})