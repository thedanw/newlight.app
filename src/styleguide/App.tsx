'use client'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { css } from 'styled-system/css'
import { token } from 'styled-system/tokens'
import { HStack, Stack } from 'styled-system/jsx'
import {
  BackButton,
  Breadcrumb,
  CloseButton,
  Dialog,
  Drawer,
  Heading,
  PageHeader,
  PagePanel,
  Text,
  Toaster,
  Sidebar,
} from '@/core/ui'
import { BrandForm } from './BrandForm'
import {
  hrefForCategory,
  hrefForDashboard,
  useHashNavigation,
  type Route,
} from './router'
import { Dashboard } from './pages/Dashboard'
import { CategoryPage } from './pages/Category'
import { tocCategories, type TocCategory } from './toc'

/* ---------------------------------------------------------------------------
   Styleguide shell (temp-styleguide #38) — the app root while the lab runs.
   Sidebar + `#page-panel` header (breadcrumbs) + a component-level
   push/pop panel stack via AnimatePresence. Navigation is URL-addressable
   (`#/category/<id>`, `#/category/<id>/component/<Name>` — see router.ts)
   and history-backed, so the browser/phone Back button closes the open
   drawer/dialog first, then pops to the previous page/panel.
--------------------------------------------------------------------------- */

type Panel = { kind: 'dashboard' } | { kind: 'category'; category: TocCategory }

const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1]
const SLOWEST_S = Number.parseFloat(token('durations.slowest')) / 1000
// Header items' handoff micro-transition duration.
const ITEM_S = Number.parseFloat(token('durations.normal')) / 1000

// Over-damped spring (damping > 2·√stiffness ≈ 35.8): one continuous push
// that settles without ever overshooting its resting point.
const PUSH_SPRING = { type: 'spring', stiffness: 400, damping: 35, mass: 1 } as const
const FADE_TWEEN = { duration: SLOWEST_S, ease: EASE } as const

// Panels travel the FULL viewport width so exit+enter read as one unbroken
// slide (a partial -33% target made the old page hop a third of the way,
// pause on unmount, then have the new page finish the trip separately).
// NOTE: the sliding element must span the full stage width — horizontal
// padding goes on its INNER wrapper, or ±100% stops one gutter short and
// the panel vanishes while a sliver is still visible.
const slideVariants: Variants = {
  enter: (direction: number) => ({ x: direction > 0 ? '100%' : '-100%' }),
  center: { x: 0 },
  exit: (direction: number) => ({ x: direction > 0 ? '-100%' : '100%' }),
}

const fadeVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
}

// iOS bar-item handoff: items arrive from / depart toward the trailing edge
// while the bar itself never moves. Mirrors UINavigationBar push/pop item
// transitions (the new back-button slides in with the incoming screen).
const headerItemVariants: Variants = {
  enter: { opacity: 0, x: 12 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 12 },
}

const shellCss = css({
  display: 'flex',
  height: '100dvh',
  overflow: 'hidden',
  bg: 'var(--canvas-bg)',
  color: 'fg.default',
})

// Panel stage: a NON-scrolling flex column that clips. position:relative
// keeps the popLayout-popped (position:absolute) exiting panel's containing
// block — and therefore its clipping — inside this region instead of body
// coordinate space (an escaped popped panel drags a transient document
// scrollbar behind it and shifts the whole shell).
const stageCss = css({
  flex: '1',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  overflow: 'hidden',
})

// Breadcrumbs live INSIDE the stack (each panel renders its own trail), so
// they physically cannot animate against their page — no separate crumb
// transition to keep in sync. Sticky keeps the trail visible while the
// panel scrolls; own padding + opaque bg so the pinned state stays clean
// while content slides beneath.
const crumbStickyCss = css({
  position: 'sticky',
  top: '0',
  zIndex: '1',
  pt: '6',
  pb: '4',
  bg: 'var(--canvas-bg)',
})

// Each panel is its OWN full-stage-width scroll container: a pushed page
// always mounts at scrollTop 0 (no inherited offset from the previous page)
// and the outgoing page keeps its scroll position while it slides away.
// Full width (padding on the inner wrapper) so ±100% exits completely.
const panelScrollerCss = css({
  flex: '1',
  minHeight: '0',
  overflowY: 'auto',
  overflowX: 'hidden',
})

const panelInnerCss = css({ px: '6', pb: '6', minHeight: '100%' })

export default function StyleguideApp() {
  const navigate = useNavigate()
  const {
    route,
    direction,
    overlay,
    goHome,
    openCategory,
    openComponent,
    back,
    openOverlay,
    closeOverlay,
  } = useHashNavigation()
  const [brandLogo, setBrandLogo] = useState<string | null>(null)
  const brandLogoRef = useRef<string | null>(null)
  const reduceMotion = useReducedMotion()

  // Resolve the routed category id against the TOC; unknown ids fall back to
  // the Dashboard view (and get their URL normalized below).
  const routedCategory =
    route.view === 'category' ? tocCategories.find((c) => c.id === route.categoryId) : undefined
  const effectiveRoute: Route =
    route.view === 'category' && routedCategory ? route : { view: 'dashboard' }

  useEffect(() => {
    if (route.view === 'category' && !routedCategory) {
      // Unknown category id in the URL — normalize it to the Dashboard.
      window.history.replaceState(null, '', hrefForDashboard())
    }
  }, [route, routedCategory])

  const stack: Panel[] =
    effectiveRoute.view === 'category' && routedCategory
      ? [{ kind: 'dashboard' }, { kind: 'category', category: routedCategory }]
      : [{ kind: 'dashboard' }]
  const current = stack[stack.length - 1]
  const currentKey = current.kind === 'category' ? `category:${current.category.id}` : 'dashboard'
  // Header renders only when it has content (iOS hidden-navigation-bar model).
  const hasHeaderContent = stack.length > 1

  // Deep-link anchor: once the target category panel has mounted, bring the
  // requested component card into view. Retries briefly because the panel
  // mounts through AnimatePresence/popLayout. A COLD deep link jumps
  // instantly (a page that opens with a long animated scroll reads as a
  // glitch); in-app navigation scrolls smoothly.
  const anchor = effectiveRoute.view === 'category' ? effectiveRoute.component ?? null : null
  const isColdLoadRef = useRef(true)
  const prevAnchorRef = useRef<string | null>(null)
  useEffect(() => {
    const hadAnchor = prevAnchorRef.current
    prevAnchorRef.current = anchor
    if (!anchor) {
      if (hadAnchor) {
        // Leaving an anchored view (e.g. Back to the plain category URL):
        // the panel instance survives the pop, so reset it to the top
        // instead of stranding the user at the anchored card.
        const stage = document.querySelector('#page-panel')?.lastElementChild
        const scroller = Array.from(stage?.children ?? []).find(
          (child) => getComputedStyle(child).position !== 'absolute',
        )
        scroller?.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
      }
      return
    }
    const elementId = `component-${anchor}`
    let attempts = 0
    let timer: number
    const scrollToComponent = () => {
      const el = document.getElementById(elementId)
      if (el) {
        // Flip the cold-load flag only when the scroll actually lands —
        // StrictMode's discarded first effect pass must not consume it.
        const instant = isColdLoadRef.current
        isColdLoadRef.current = false
        el.scrollIntoView({ behavior: reduceMotion || instant ? 'auto' : 'smooth', block: 'center' })
        return
      }
      if (attempts++ < 15) timer = window.setTimeout(scrollToComponent, 100)
    }
    timer = window.setTimeout(scrollToComponent, 80)
    return () => window.clearTimeout(timer)
  }, [anchor, currentKey, reduceMotion])

  const handleCrumbHome = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    goHome()
  }

  const openOverlayDemo = (kind: 'dialog' | 'drawer') => {
    openOverlay(kind === 'dialog' ? 'demo-dialog' : 'demo-drawer')
  }

  const renderOverlayDemoBody = (kind: 'dialog' | 'drawer'): ReactNode => (
    <Stack gap="3">
      <Heading textStyle="md">{kind === 'dialog' ? 'Dialog' : 'Drawer'} demo</Heading>
      <Text color="fg.muted" textStyle="sm">
        A native Park UI {kind} opened from the Dashboard demo strip.
      </Text>
    </Stack>
  )

  // BrandForm — opens from the header kebab as a Drawer (decision
  // #46). The logo commits to the sidebar brand slot on Apply (decision #45);
  // old committed URLs are revoked so object URLs never leak.
  const commitLogo = (url: string) => {
    if (brandLogoRef.current) URL.revokeObjectURL(brandLogoRef.current)
    brandLogoRef.current = url
    setBrandLogo(url)
  }

  // The committed logo also becomes the document favicon (browser tab).
  // Object URLs are content-sniffed, so drop the static SVG type attr while
  // one is active; restore the default mark when no logo is committed.
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!link) return
    if (brandLogo) {
      link.href = brandLogo
      link.removeAttribute('type')
    } else {
      link.href = '/vite.svg'
      link.type = 'image/svg+xml'
    }
  }, [brandLogo])

  const openBrandForm = () => {
    openOverlay('brand')
  }

  // Overlays are keyed in history.state so Back closes them first.
  const demoDialogOpen = overlay === 'demo-dialog'
  const demoDrawerOpen = overlay === 'demo-drawer'
  const brandDrawerOpen = overlay === 'brand'

  const renderPanel = (panel: Panel) => {
    if (panel.kind === 'category') {
      return (
        <CategoryPage category={panel.category} anchorComponent={anchor ?? undefined} />
      )
    }
    return (
      <Dashboard
        onOpenCategory={openCategory}
        onOpenComponent={openComponent}
        onOpenOverlay={openOverlayDemo}
      />
    )
  }

  return (
    <div className={shellCss}>
      {/* Sidebar */}
      <Sidebar
        onBrandSettings={openBrandForm}
        onModuleNavigate={(moduleId) => navigate(`/${moduleId}`)}
        logo={brandLogo}
      />

      {/* #page-panel — header + push/pop stack */}
      <PagePanel id="page-panel">
        {/* iOS nav-bar model: fixed chrome that collapses away entirely when
            it has no content (hidden navigation bar), while its items still
            get the trailing-edge handoff micro-transition. */}
        <AnimatePresence initial={false}>
          {hasHeaderContent && (
            <motion.div
              key="page-header"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              // Same spring as the panels so chrome and page land together —
              // mixed tween/spring timings read as a jump at animation end.
              transition={reduceMotion ? FADE_TWEEN : PUSH_SPRING}
              className={css({ overflow: 'hidden', flexShrink: '0' })}
            >
              <PageHeader>
                <HStack gap="2" flex="1" minWidth="0">
                  <motion.div
                    variants={reduceMotion ? fadeVariants : headerItemVariants}
                    initial="enter"
                    animate="center"
                    transition={{ duration: ITEM_S, ease: EASE }}
                  >
                    <BackButton onClick={back} />
                  </motion.div>
                </HStack>
              </PageHeader>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Panel stage — clips; each panel scrolls independently */}
        <div className={stageCss}>
          {/* popLayout overlays the outgoing panel on the incoming one so
              exit and enter run together as a single continuous push. */}
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.div
              key={currentKey}
              custom={direction}
              variants={reduceMotion ? fadeVariants : slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={reduceMotion ? FADE_TWEEN : PUSH_SPRING}
              className={panelScrollerCss}
            >
              <div className={panelInnerCss}>
                {/* Breadcrumbs travel WITH their page — no separate animation,
                    no direction to keep in sync. */}
                <div className={crumbStickyCss}>
                  <Breadcrumb.Root>
                    <Breadcrumb.List>
                      <Breadcrumb.Item>
                        <Breadcrumb.Link href={hrefForDashboard()} onClick={handleCrumbHome}>
                          Style Guide
                        </Breadcrumb.Link>
                      </Breadcrumb.Item>
                      {current.kind === 'category' && (
                        <>
                          <Breadcrumb.Separator />
                          <Breadcrumb.Item>
                            {/* The current crumb doubles as a canonical link:
                                following it re-enters the plain category URL
                                (dropping any /component/<Name> anchor). */}
                            <Breadcrumb.Link
                              href={hrefForCategory(current.category.id)}
                              aria-current="page"
                              onClick={(event) => {
                                event.preventDefault()
                                openCategory(current.category.id)
                              }}
                            >
                              {current.category.name}
                            </Breadcrumb.Link>
                          </Breadcrumb.Item>
                        </>
                      )}
                    </Breadcrumb.List>
                  </Breadcrumb.Root>
                </div>
                {renderPanel(current)}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </PagePanel>

      {/* Native Park UI overlay demos — Dialog + Drawer (replaces SlidePanel) */}
      <Dialog.Root
        open={demoDialogOpen}
        onOpenChange={(details) => {
          if (!details.open) closeOverlay()
        }}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.CloseTrigger asChild>
              <CloseButton />
            </Dialog.CloseTrigger>
            <Dialog.Header>
              <Dialog.Title>Dialog demo</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>{renderOverlayDemoBody('dialog')}</Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      <Drawer.Root
        open={demoDrawerOpen}
        onOpenChange={(details) => {
          if (!details.open) closeOverlay()
        }}
      >
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.CloseTrigger asChild>
              <CloseButton />
            </Drawer.CloseTrigger>
            <Drawer.Header>
              <Drawer.Title>Drawer demo</Drawer.Title>
            </Drawer.Header>
            <Drawer.Body>{renderOverlayDemoBody('drawer')}</Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>

      {/* Brand settings Drawer (decision #46) — form body + pinned footer */}
      <Drawer.Root
        open={brandDrawerOpen}
        onOpenChange={(details) => {
          if (!details.open) closeOverlay()
        }}
      >
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.CloseTrigger asChild>
                <CloseButton />
              </Drawer.CloseTrigger>
            <Drawer.Header>
              <Drawer.Title>Brand settings</Drawer.Title>
              <Drawer.Description>
                Theme knobs re-theme the whole shell live. Your logo is committed when you press
                Apply.
              </Drawer.Description>
            </Drawer.Header>
            <Drawer.Body>
              <BrandForm
                logo={brandLogo}
                onApplyLogo={commitLogo}
                onClose={closeOverlay}
              />
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>

      {/* Toaster — mounted once so Toast demos (Batch 7) have a surface */}
      <Toaster />
    </div>
  )
}
