import { memo, splitProps } from '../helpers.mjs';
import { createRecipe, mergeRecipes } from './create-recipe.mjs';

const navTileFn = /* @__PURE__ */ createRecipe('nav-tile', {
  "active": false,
  "disabled": false
}, [])

const navTileVariantMap = {
  "active": [
    "true"
  ],
  "disabled": [
    "true"
  ]
}

const navTileVariantKeys = Object.keys(navTileVariantMap)

export const navTile = /* @__PURE__ */ Object.assign(memo(navTileFn.recipeFn), {
  __recipe__: true,
  __name__: 'navTile',
  __getCompoundVariantCss__: navTileFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: navTileVariantKeys,
  variantMap: navTileVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, navTileVariantKeys)
  },
  getVariantProps: navTileFn.getVariantProps,
})