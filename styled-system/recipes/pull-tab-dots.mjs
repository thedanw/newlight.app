import { memo, splitProps } from '../helpers.mjs';
import { createRecipe, mergeRecipes } from './create-recipe.mjs';

const pullTabDotsFn = /* @__PURE__ */ createRecipe('pull-tab-dots', {}, [])

const pullTabDotsVariantMap = {
  "open": [
    "true"
  ]
}

const pullTabDotsVariantKeys = Object.keys(pullTabDotsVariantMap)

export const pullTabDots = /* @__PURE__ */ Object.assign(memo(pullTabDotsFn.recipeFn), {
  __recipe__: true,
  __name__: 'pullTabDots',
  __getCompoundVariantCss__: pullTabDotsFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: pullTabDotsVariantKeys,
  variantMap: pullTabDotsVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, pullTabDotsVariantKeys)
  },
  getVariantProps: pullTabDotsFn.getVariantProps,
})