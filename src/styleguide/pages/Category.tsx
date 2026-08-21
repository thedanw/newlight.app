import { type TocCategory } from '../toc'
import { SubpageTemplate } from './SubpageTemplate'
import { TypographyShowcase } from './TypographyShowcase'

/* ---------------------------------------------------------------------------
   Category page — Batch 7 delegates rendering to the shared SubpageTemplate
   (category header + per-component Card grid with live demos; Accordion
   sections for grouped categories like Forms and Navigation). The typography
   category is special-cased: it renders a bespoke high-end type specimen
   (`TypographyShowcase`) instead of the generic card grid.
--------------------------------------------------------------------------- */

export function CategoryPage({ category }: { category: TocCategory }) {
  if (category.id === 'typography') {
    return <TypographyShowcase />
  }
  return <SubpageTemplate category={category} />
}
