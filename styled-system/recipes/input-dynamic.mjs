import { compact, getSlotCompoundVariant, memo, splitProps } from '../helpers.mjs';
import { createRecipe } from './create-recipe.mjs';

const inputDynamicDefaultVariants = {}
const inputDynamicCompoundVariants = []

const inputDynamicSlotNames = [
  [
    "root",
    "input-dynamic__root"
  ],
  [
    "trigger",
    "input-dynamic__trigger"
  ],
  [
    "header",
    "input-dynamic__header"
  ],
  [
    "body",
    "input-dynamic__body"
  ]
]
const inputDynamicSlotFns = /* @__PURE__ */ inputDynamicSlotNames.map(([slotName, slotKey]) => [slotName, createRecipe(slotKey, inputDynamicDefaultVariants, getSlotCompoundVariant(inputDynamicCompoundVariants, slotName))])

const inputDynamicFn = memo((props = {}) => {
  return Object.fromEntries(inputDynamicSlotFns.map(([slotName, slotFn]) => [slotName, slotFn.recipeFn(props)]))
})

const inputDynamicVariantKeys = []
const getVariantProps = (variants) => ({ ...inputDynamicDefaultVariants, ...compact(variants) })

export const inputDynamic = /* @__PURE__ */ Object.assign(inputDynamicFn, {
  __recipe__: false,
  __name__: 'inputDynamic',
  raw: (props) => props,
  classNameMap: {},
  variantKeys: inputDynamicVariantKeys,
  variantMap: {},
  splitVariantProps(props) {
    return splitProps(props, inputDynamicVariantKeys)
  },
  getVariantProps
})