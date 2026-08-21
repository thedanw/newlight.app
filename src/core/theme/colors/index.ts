import { amber } from './amber'
import { blue } from './blue'
import { bronze } from './bronze'
import { brown } from './brown'
import { crimson } from './crimson'
import { cyan } from './cyan'
import { gold } from './gold'
import { grass } from './grass'
import { green } from './green'
import { indigo } from './indigo'
import { iris } from './iris'
import { jade } from './jade'
import { lime } from './lime'
import { mauve } from './mauve'
import { mint } from './mint'
import { neutral } from './neutral'
import { olive } from './olive'
import { orange } from './orange'
import { pink } from './pink'
import { plum } from './plum'
import { purple } from './purple'
import { red } from './red'
import { ruby } from './ruby'
import { sage } from './sage'
import { sand } from './sand'
import { slate } from './slate'
import { sky } from './sky'
import { teal } from './teal'
import { tomato } from './tomato'
import { violet } from './violet'
import { yellow } from './yellow'

/**
 * Park UI color packages — canonical source of truth for all color values.
 * Installed via `npx @park-ui/cli add <color>`.
 *
 * - Accent schemes (selectable at runtime via `data-color-scheme`): ALL 26
 *   Park UI accents (25 chromatic + neutral as monochrome accent). Every one
 *   is compiled to public/core/theme/colors/<name>.css by
 *   scripts/generate-theme-colors.mjs and loaded on demand by theme-loader.js.
 * - Gray / neutral scheme (via `data-gray-color`): neutral, mauve, olive, sage, sand, slate
 * - Only orange / neutral / red are ALSO registered as Panda semantic tokens
 *   in panda.config.ts (bundle defaults); every other palette is runtime-only.
 */
export const colorPackages = {
  // 26 selectable accents
  amber,
  blue,
  bronze,
  brown,
  crimson,
  cyan,
  gold,
  grass,
  green,
  indigo,
  iris,
  jade,
  lime,
  mint,
  neutral,
  orange,
  pink,
  plum,
  purple,
  red,
  ruby,
  sky,
  teal,
  tomato,
  violet,
  yellow,
  // remaining grays (neutral above doubles as a gray)
  mauve,
  olive,
  sage,
  sand,
  slate,
}
