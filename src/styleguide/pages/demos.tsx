'use client'
import type { ReactNode } from 'react'
import { buttonsDemos } from './demos/buttons'
import { displayDemos } from './demos/display'
import { feedbackDemos } from './demos/feedback'
import { formsDemos } from './demos/forms'
import { layoutDemos } from './demos/layout'
import { navigationDemos } from './demos/navigation'
import { overlaysDemos } from './demos/overlays'
import { typographyDemos } from './demos/typography'

/* ---------------------------------------------------------------------------
   DEMOS — one natural-context demo per catalogue component (Batch 7).
   Barrel: merges one module per category so no single file grows unbounded.
   Each module is keyed by the exact `name` in toc.ts and exports a small
   `Record<string, ReactNode>`. The subpage template renders one Card per
   component with these inside.
   YAGNI: no over-engineered demos; expand iteratively.
--------------------------------------------------------------------------- */

export const DEMOS: Record<string, ReactNode> = {
  ...layoutDemos,
  ...buttonsDemos,
  ...typographyDemos,
  ...formsDemos,
  ...feedbackDemos,
  ...overlaysDemos,
  ...navigationDemos,
  ...displayDemos,
}
