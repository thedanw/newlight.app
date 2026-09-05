'use client'
import type { CSSProperties } from 'react'
import { Page } from '@/core/ui'
import { Stack } from 'styled-system/jsx'

/**
 * SubpageTemplate — boilerplate for any nested route subpage.
 *
 * Page layout (see module-design/decision.md § Page Layout Structure):
 *   - Uses <Page.Main> with ONLY <Page.Header> (sticky, contains <Page.Heading>).
 *   - No <Page.HeaderTop> or <Page.HeaderBottom> on subpages.
 *   - <Page.Heading> renders the breadcrumb level:
 *     level 1 = back chevron + icon + title
 *     level 2 = back chevron + icon → title
 *   - Pass --module-number via inline style so the hue-rotate background
 *     matches the module's palette.
 *
 * Usage in a module's routes.tsx:
 *   <Route path="/:id" element={<SubpageTemplate moduleNumber={MyManifest.number} />} />
 */
export interface SubpageTemplateProps {
  /** Module palette index — forwarded to --module-number for hue-rotate. */
  moduleNumber: number
}

export default function SubpageTemplate({ moduleNumber }: SubpageTemplateProps) {
  return (
    <Page.Main>
      {/* Sticky header — no HeaderTop/HeaderBottom on subpages */}
      <Page.Header style={{ '--module-number': moduleNumber } as CSSProperties}>
        <Page.Heading level={1} title="Subpage title" />
      </Page.Header>

      {/* Body scrolls within Page.Main */}
      <Page.Body>
        /* subpage content */
      </Page.Body>
    </Page.Main>
  )
}
