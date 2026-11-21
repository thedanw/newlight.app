/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface ColumnStackVariant {
  /**
 * @default "md"
 */
spacing: "none" | "xs" | "sm" | "md" | "lg" | "xl"
/**
 * @default "stretch"
 */
align: "start" | "center" | "end" | "stretch" | "baseline"
justify: "start" | "center" | "end" | "between" | "around" | "evenly"
grow: boolean
divider: boolean
/**
 * @default "stack"
 */
layout: "2" | "3" | "4" | "stack" | "1-4-1" | "1-3-1" | "1-2" | "2-1" | "1-3" | "3-1" | "2-3" | "3-2"
stack: "sm" | "md" | "lg"
}

type ColumnStackVariantMap = {
  [key in keyof ColumnStackVariant]: Array<ColumnStackVariant[key]>
}



export type ColumnStackVariantProps = {
  [key in keyof ColumnStackVariant]?: ColumnStackVariant[key] | undefined
}

export interface ColumnStackRecipe {
  
  __type: ColumnStackVariantProps
  (props?: ColumnStackVariantProps): string
  raw: (props?: ColumnStackVariantProps) => ColumnStackVariantProps
  variantMap: ColumnStackVariantMap
  variantKeys: Array<keyof ColumnStackVariant>
  splitVariantProps<Props extends ColumnStackVariantProps>(props: Props): [ColumnStackVariantProps, Pretty<DistributiveOmit<Props, keyof ColumnStackVariantProps>>]
  getVariantProps: (props?: ColumnStackVariantProps) => ColumnStackVariantProps
}


export declare const columnStack: ColumnStackRecipe