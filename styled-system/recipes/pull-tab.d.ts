/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface PullTabVariant {
  
}

type PullTabVariantMap = {
  [key in keyof PullTabVariant]: Array<PullTabVariant[key]>
}



export type PullTabVariantProps = {
  [key in keyof PullTabVariant]?: ConditionalValue<PullTabVariant[key]> | undefined
}

export interface PullTabRecipe {
  
  __type: PullTabVariantProps
  (props?: PullTabVariantProps): string
  raw: (props?: PullTabVariantProps) => PullTabVariantProps
  variantMap: PullTabVariantMap
  variantKeys: Array<keyof PullTabVariant>
  splitVariantProps<Props extends PullTabVariantProps>(props: Props): [PullTabVariantProps, Pretty<DistributiveOmit<Props, keyof PullTabVariantProps>>]
  getVariantProps: (props?: PullTabVariantProps) => PullTabVariantProps
}


export declare const pullTab: PullTabRecipe