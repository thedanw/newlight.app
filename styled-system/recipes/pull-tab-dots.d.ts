/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface PullTabDotsVariant {
  open: boolean
}

type PullTabDotsVariantMap = {
  [key in keyof PullTabDotsVariant]: Array<PullTabDotsVariant[key]>
}



export type PullTabDotsVariantProps = {
  [key in keyof PullTabDotsVariant]?: ConditionalValue<PullTabDotsVariant[key]> | undefined
}

export interface PullTabDotsRecipe {
  
  __type: PullTabDotsVariantProps
  (props?: PullTabDotsVariantProps): string
  raw: (props?: PullTabDotsVariantProps) => PullTabDotsVariantProps
  variantMap: PullTabDotsVariantMap
  variantKeys: Array<keyof PullTabDotsVariant>
  splitVariantProps<Props extends PullTabDotsVariantProps>(props: Props): [PullTabDotsVariantProps, Pretty<DistributiveOmit<Props, keyof PullTabDotsVariantProps>>]
  getVariantProps: (props?: PullTabDotsVariantProps) => PullTabDotsVariantProps
}


export declare const pullTabDots: PullTabDotsRecipe