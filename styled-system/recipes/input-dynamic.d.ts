/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface InputDynamicVariant {
  
}

type InputDynamicVariantMap = {
  [key in keyof InputDynamicVariant]: Array<InputDynamicVariant[key]>
}

type InputDynamicSlot = "root" | "trigger" | "header" | "body"

export type InputDynamicVariantProps = {
  [key in keyof InputDynamicVariant]?: ConditionalValue<InputDynamicVariant[key]> | undefined
}

export interface InputDynamicRecipe {
  __slot: InputDynamicSlot
  __type: InputDynamicVariantProps
  (props?: InputDynamicVariantProps): Pretty<Record<InputDynamicSlot, string>>
  raw: (props?: InputDynamicVariantProps) => InputDynamicVariantProps
  variantMap: InputDynamicVariantMap
  variantKeys: Array<keyof InputDynamicVariant>
  splitVariantProps<Props extends InputDynamicVariantProps>(props: Props): [InputDynamicVariantProps, Pretty<DistributiveOmit<Props, keyof InputDynamicVariantProps>>]
  getVariantProps: (props?: InputDynamicVariantProps) => InputDynamicVariantProps
}


export declare const inputDynamic: InputDynamicRecipe