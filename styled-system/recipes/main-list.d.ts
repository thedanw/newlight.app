/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface MainListVariant {
  /**
 * @default "md"
 */
size: "sm" | "md" | "lg"
}

type MainListVariantMap = {
  [key in keyof MainListVariant]: Array<MainListVariant[key]>
}

type MainListSlot = "root" | "toolbar" | "rows" | "rowWrapper" | "rowSelect" | "rowContent" | "rowCell" | "rowButton" | "rowToolbar" | "rowHeader" | "footer" | "massManage" | "primaryActions" | "secondaryActions"

export type MainListVariantProps = {
  [key in keyof MainListVariant]?: ConditionalValue<MainListVariant[key]> | undefined
}

export interface MainListRecipe {
  __slot: MainListSlot
  __type: MainListVariantProps
  (props?: MainListVariantProps): Pretty<Record<MainListSlot, string>>
  raw: (props?: MainListVariantProps) => MainListVariantProps
  variantMap: MainListVariantMap
  variantKeys: Array<keyof MainListVariant>
  splitVariantProps<Props extends MainListVariantProps>(props: Props): [MainListVariantProps, Pretty<DistributiveOmit<Props, keyof MainListVariantProps>>]
  getVariantProps: (props?: MainListVariantProps) => MainListVariantProps
}


export declare const mainList: MainListRecipe