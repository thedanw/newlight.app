import { compact, getSlotCompoundVariant, memo, splitProps } from '../helpers.mjs';
import { createRecipe } from './create-recipe.mjs';

const pageDefaultVariants = {
  "headerVariant": "default"
}
const pageCompoundVariants = []

const pageSlotNames = [
  [
    "root",
    "page__root"
  ],
  [
    "headerTop",
    "page__headerTop"
  ],
  [
    "header",
    "page__header"
  ],
  [
    "headerBottom",
    "page__headerBottom"
  ],
  [
    "main",
    "page__main"
  ],
  [
    "body",
    "page__body"
  ],
  [
    "actions",
    "page__actions"
  ],
  [
    "footer",
    "page__footer"
  ]
]
const pageSlotFns = /* @__PURE__ */ pageSlotNames.map(([slotName, slotKey]) => [slotName, createRecipe(slotKey, pageDefaultVariants, getSlotCompoundVariant(pageCompoundVariants, slotName))])

const pageFn = memo((props = {}) => {
  return Object.fromEntries(pageSlotFns.map(([slotName, slotFn]) => [slotName, slotFn.recipeFn(props)]))
})

const pageVariantKeys = [
  "headerVariant"
]
const getVariantProps = (variants) => ({ ...pageDefaultVariants, ...compact(variants) })

export const page = /* @__PURE__ */ Object.assign(pageFn, {
  __recipe__: false,
  __name__: 'page',
  raw: (props) => props,
  classNameMap: {},
  variantKeys: pageVariantKeys,
  variantMap: {
  "headerVariant": [
    "default",
    "hero"
  ]
},
  splitVariantProps(props) {
    return splitProps(props, pageVariantKeys)
  },
  getVariantProps
})