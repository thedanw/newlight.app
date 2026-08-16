import { orange } from './orange'
import { green } from './green'
import { violet } from './violet'
import { mint } from './mint'
import { neutral } from './neutral'
import { red } from './red'

/**
 * Park UI color packages — canonical source of truth for all color values.
 * Installed via `npx @park-ui/cli add <color>`.
 *
 * - Accent schemes (selectable at runtime via `data-color-scheme`): orange, green, violet, mint
 * - Gray / neutral scheme (via `data-gray-color`): neutral
 * - Semantic supporting color (error/status): red
 */
export const colorPackages = { orange, green, violet, mint, neutral, red }
