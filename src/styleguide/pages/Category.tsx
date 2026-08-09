import { type TocCategory } from '../toc'
import { SubpageTemplate } from './SubpageTemplate'

/* ---------------------------------------------------------------------------
   Category page — Batch 7 delegates rendering to the shared SubpageTemplate
   (category header + per-component Card grid with live demos; Accordion
   sections for grouped categories like Forms and Navigation).
--------------------------------------------------------------------------- */

export function CategoryPage({ category }: { category: TocCategory }) {
  return <SubpageTemplate category={category} />
}
