import type { ReactNode } from 'react'
import { css } from 'styled-system/css'
import { Badge } from '@/core/ui'

/**
 * Semantic colour roles exposed as CSS variables by
 * src/core/theme/semantic-colors.ts (injected at runtime by theme-loader.js,
 * derived from the active Park UI accent for light + dark mode).
 */
export type SemanticTone = 'success' | 'warning' | 'error' | 'info'

// NOTE: Panda extracts styles STATICALLY at build time, so every colour must
// be a string literal inside these css() call sites. A lookup of computed
// values (e.g. `css={{ color: TONE_VAR[tone] }}`) mints a class name at
// runtime with NO matching rule in the generated stylesheet — the colour
// silently renders nothing (verified with `panda debug`).
const TONE_CLASS: Record<SemanticTone, string> = {
  success: css({ color: 'var(--colors-success)', borderColor: 'currentColor' }),
  warning: css({ color: 'var(--colors-warning)', borderColor: 'currentColor' }),
  error: css({ color: 'var(--colors-error)', borderColor: 'currentColor' }),
  info: css({ color: 'var(--colors-info)', borderColor: 'currentColor' }),
}

interface SemanticStatusBadgeProps {
  tone: SemanticTone
  children: ReactNode
}

/**
 * Status chip on the Park UI Badge, coloured with the theme's semantic
 * palette (success / warning / error / info). The colour follows the active
 * accent and light/dark mode automatically because the vars are re-derived
 * by theme-loader.js on theme changes.
 */
export function SemanticStatusBadge({ tone, children }: SemanticStatusBadgeProps) {
  return (
    <Badge variant="outline" className={TONE_CLASS[tone]}>
      {children}
    </Badge>
  )
}
