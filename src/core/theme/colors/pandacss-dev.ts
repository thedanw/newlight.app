/**
 * Browser-safe stub for `@pandacss/dev`.
 *
 * The Park UI color packages (`src/core/theme/colors/*.ts`) are canonical
 * CLI-generated files that import `defineSemanticTokens` from `@pandacss/dev` —
 * a Node-only CLI package that must never ship to the browser. The theme loader
 * dynamically imports the non-default color packages (green, violet, mint) at
 * runtime, so Vite aliases `@pandacss/dev` to this file for the client bundle.
 *
 * `defineSemanticTokens` is an identity helper (Panda uses it purely for type
 * inference), so this stub is behaviorally identical to the real one for the
 * app bundle — while the Panda CLI keeps resolving the real package through its
 * own resolver when reading panda.config.ts.
 */
export const defineSemanticTokens = {
  colors: <T>(tokens: T): T => tokens,
  colorPalettes: <T>(tokens: T): T => tokens,
}
