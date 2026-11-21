import { memo, splitProps } from '../helpers.mjs';
import { createRecipe, mergeRecipes } from './create-recipe.mjs';

const pullTabFn = /* @__PURE__ */ createRecipe('pull-tab', {}, [])

const pullTabVariantMap = {}

const pullTabVariantKeys = Object.keys(pullTabVariantMap)

export const pullTab = /* @__PURE__ */ Object.assign(memo(pullTabFn.recipeFn), {
  __recipe__: true,
  __name__: 'pullTab',
  __getCompoundVariantCss__: pullTabFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: pullTabVariantKeys,
  variantMap: pullTabVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, pullTabVariantKeys)
  },
  getVariantProps: pullTabFn.getVariantProps,
})