import { green } from "@/core/theme/colors/green";
import { red } from "@/core/theme/colors/red";
import { orange } from "@/core/theme/colors/orange";
import { sand } from "@/core/theme/colors/sand";
import { animationStyles } from "@/core/theme/animation-styles";
import { zIndex } from "@/core/theme/tokens/z-index";
import { shadows } from "@/core/theme/tokens/shadows";
import { durations } from "@/core/theme/tokens/durations";
import { colors } from "@/core/theme/tokens/colors";
import { textStyles } from "@/core/theme/text-styles";
import { layerStyles } from "@/core/theme/layer-styles";
import { keyframes } from "@/core/theme/keyframes";
import { globalCss } from "@/core/theme/global-css";
import { conditions } from "@/core/theme/conditions";
import { slotRecipes, recipes } from "@/core/theme/recipes";
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: true,
  hash: false,
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  outdir: 'styled-system',
  jsxFramework: 'react',
  staticCss: {
    recipes: {
      '*': '*',
    },
  },

  theme: {
    extend: {
      animationStyles: animationStyles,
      recipes: recipes,
      slotRecipes: slotRecipes,
      keyframes: keyframes,
      layerStyles: layerStyles,
      textStyles: textStyles,

      tokens: {
        colors: colors,
        durations: durations,
        zIndex: zIndex
      },

      semanticTokens: {
        colors: {
          fg: {
            default: {
              value: {
                _light: "{colors.gray.12}",
                _dark: "{colors.gray.12}"
              }
            },

            muted: {
              value: {
                _light: "{colors.gray.11}",
                _dark: "{colors.gray.11}"
              }
            },

            subtle: {
              value: {
                _light: "{colors.gray.10}",
                _dark: "{colors.gray.10}"
              }
            }
          },

          border: {
            value: {
              _light: "{colors.gray.4}",
              _dark: "{colors.gray.4}"
            }
          },

          error: {
            value: {
              _light: "{colors.red.9}",
              _dark: "{colors.red.9}"
            }
          },

          gray: sand,
          orange: orange,
          red: red,
          green: green
        },

        shadows: shadows
      }
    },
  },

  globalCss: globalCss,
  conditions: conditions
})