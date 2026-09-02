'use client'
import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { css } from 'styled-system/css'
import { Stack } from 'styled-system/jsx'
import {
  BackButton,
  Breadcrumb,
  Card,
  Heading,
  Page,
  Text,
} from '@/core/ui'
import {
  getSettingsPage,
  getSettingsSection,
  getSettingsSections,
} from './settings-schema'

/* ---------------------------------------------------------------------------
   SettingsPage — dashboard shell for `/settings/:section?/:page?`.

   Rendered inside the shared `AppShell` (the app shell with the Sidebar + page
   chrome), structured like any module dashboard (push/pop panel stack):
   - `/settings`                → section list (root dashboard)
   - `/settings/:section`       → section panel (slides in from the right)
   - `/settings/:section/:page` → page panel (slides in from the right)

   Each level is a full-stage panel that slides in from the right (mobile
   first) and is URL-addressable. The browser/phone Back button and the in-UI
   Back button both pop the topmost panel (history-backed), so Back always
   slides back to the previous panel. Unknown section/page ids fall back to
   the section list.

   Uses the `Page` slot recipe scaffold: `Page.Root` + `Page.Header` +
   `Page.Body`. The panel stage lives inside `Page.Body`.

   NOTE: the slide is a pure CSS keyframe animation on the panel container
   (keyed by route so it re-runs on each navigation). We deliberately avoid
   framer-motion's AnimatePresence here: mounting/unmounting panels that
   contain Ark UI portal components (Select/Dialog) inside an animated
   context throws "Invalid hook call" under React 19.
-------------------------------------------------------------------------- */

type Panel =
  | { kind: 'list' }
  | { kind: 'section'; sectionId: string }
  | { kind: 'page'; sectionId: string; pageId: string }

const SLIDE_MS = 340
const SLIDE_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'

// Page.Body is the scroll container for the current panel: it fills the
// remaining height under the header and scrolls independently. minHeight:0
// lets it shrink below its content so overflowY:auto actually scrolls.
const panelScrollerCss = css({
  flex: '1',
  minHeight: '0',
  overflowY: 'auto',
  overflowX: 'hidden',
})

// Slide-in keyframes. Push (deeper) slides in from the right; pop (back)
// slides in from the left. The animation runs once on mount (keyed by route).
const slideInFromRight = css({
  animation: `settings-slide-in-right ${SLIDE_MS}ms ${SLIDE_EASING} both`,
})
const slideInFromLeft = css({
  animation: `settings-slide-in-left ${SLIDE_MS}ms ${SLIDE_EASING} both`,
})

export default function SettingsPage() {
  const { section: sectionId, page: pageId } = useParams()
  const navigate = useNavigate()

  // Resolve registered section/page; unknown ids fall back to the list.
  const section = sectionId ? getSettingsSection(sectionId) : undefined
  const page = sectionId && pageId ? getSettingsPage(sectionId, pageId) : undefined

  // Build the panel stack from the URL depth. Invalid ids collapse to the
  // section list (the deepest valid panel).
  const stack: Panel[] = (() => {
    if (page && section) {
      return [
        { kind: 'list' },
        { kind: 'section', sectionId: section.id },
        { kind: 'page', sectionId: section.id, pageId: page.id },
      ]
    }
    if (section) {
      return [{ kind: 'list' }, { kind: 'section', sectionId: section.id }]
    }
    return [{ kind: 'list' }]
  })()

  const current = stack[stack.length - 1]
  const currentKey =
    current.kind === 'page'
      ? `page:${current.sectionId}:${current.pageId}`
      : current.kind === 'section'
        ? `section:${current.sectionId}`
        : 'list'

  // Direction: pushing deeper (more panels) slides in from the right;
  // popping (fewer panels) slides in from the left. The slide class is
  // computed SYNCHRONOUSLY during render (so the keyed panel mounts with the
  // correct animation on the first frame) from the PREVIOUS committed depth,
  // which is tracked in a ref updated in a useEffect — NOT during render —
  // so React StrictMode's double-render doesn't corrupt the direction.
  const depth = stack.length
  const prevDepthRef = useRef(depth)
  const slideClass = depth >= prevDepthRef.current ? slideInFromRight : slideInFromLeft
  useEffect(() => {
    prevDepthRef.current = depth
  }, [depth])

  const goBack = () => {
    // Pop the topmost panel: navigate to the previous URL level.
    if (current.kind === 'page') {
      navigate(`/settings/${current.sectionId}`)
    } else if (current.kind === 'section') {
      navigate('/settings')
    } else {
      navigate(-1)
    }
  }

  const renderPanel = (panel: Panel) => {
    if (panel.kind === 'page') {
      const PageComponent = getSettingsPage(panel.sectionId, panel.pageId)?.component
      return PageComponent ? <PageComponent /> : null
    }
    if (panel.kind === 'section') {
      // The section component owns its panel content — including any page
      // links. (e.g. `IntegrationsSection` lists its registered pages.) This
      // avoids a generic "Pages" block duplicating what the section already
      // renders.
      const SectionComponent = getSettingsSection(panel.sectionId)?.component
      return SectionComponent ? <SectionComponent /> : null
    }
    // Section list (root dashboard)
    const sections = getSettingsSections()
    if (sections.length === 0) {
      return (
        <Text color="fg.muted" textStyle="sm">
          No settings sections registered yet.
        </Text>
      )
    }
    return (
      <Stack gap="3">
        {sections.map((s) => (
          <Card.Root
            key={s.id}
            onClick={() => navigate(`/settings/${s.id}`)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                navigate(`/settings/${s.id}`)
              }
            }}
            tabIndex={0}
            role="link"
            css={{ cursor: 'pointer' }}
          >
            <Card.Body>
              <Heading textStyle="md">{s.title}</Heading>
              {s.description && (
                <Text color="fg.muted" textStyle="sm">
                  {s.description}
                </Text>
              )}
            </Card.Body>
          </Card.Root>
        ))}
      </Stack>
    )
  }

  // Breadcrumb trail reflects the current stack depth.
  const renderBreadcrumbs = () => {
    const crumbSection =
      current.kind !== 'list' ? getSettingsSection(current.sectionId) : undefined
    const crumbPage =
      current.kind === 'page' ? getSettingsPage(current.sectionId, current.pageId) : undefined
    return (
      <Breadcrumb.Root>
        <Breadcrumb.List>
          <Breadcrumb.Item>
            <Breadcrumb.Link
              href="/settings"
              onClick={(event) => {
                event.preventDefault()
                navigate('/settings')
              }}
            >
              Settings
            </Breadcrumb.Link>
          </Breadcrumb.Item>
          {crumbSection && (
            <>
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                <Breadcrumb.Link
                  href={`/settings/${crumbSection.id}`}
                  aria-current={crumbPage ? undefined : 'page'}
                  onClick={(event) => {
                    event.preventDefault()
                    navigate(`/settings/${crumbSection.id}`)
                  }}
                >
                  {crumbSection.title}
                </Breadcrumb.Link>
              </Breadcrumb.Item>
            </>
          )}
          {crumbPage && (
            <>
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                <Breadcrumb.Link aria-current="page">{crumbPage.title}</Breadcrumb.Link>
              </Breadcrumb.Item>
            </>
          )}
        </Breadcrumb.List>
      </Breadcrumb.Root>
    )
  }

  return (
    <>
      <Page.Header>
        <BackButton onClick={goBack} />
        {renderBreadcrumbs()}
      </Page.Header>

      <Page.Body key={currentKey} className={`${panelScrollerCss} ${slideClass}`}>
        {renderPanel(current)}
      </Page.Body>
    </>
  )
}
