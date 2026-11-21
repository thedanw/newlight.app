/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface NavTileVariant {
  /**
 * @default false
 */
active: boolean
/**
 * @default false
 */
disabled: boolean
}

type NavTileVariantMap = {
  [key in keyof NavTileVariant]: Array<NavTileVariant[key]>
}



export type NavTileVariantProps = {
  [key in keyof NavTileVariant]?: ConditionalValue<NavTileVariant[key]> | undefined
}

export interface NavTileRecipe {
  
  __type: NavTileVariantProps
  (props?: NavTileVariantProps): string
  raw: (props?: NavTileVariantProps) => NavTileVariantProps
  variantMap: NavTileVariantMap
  variantKeys: Array<keyof NavTileVariant>
  splitVariantProps<Props extends NavTileVariantProps>(props: Props): [NavTileVariantProps, Pretty<DistributiveOmit<Props, keyof NavTileVariantProps>>]
  getVariantProps: (props?: NavTileVariantProps) => NavTileVariantProps
}


export declare const navTile: NavTileRecipe