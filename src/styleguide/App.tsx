'use client'
import { useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
import {
  ChevronLeftIcon,
} from 'lucide-react'
import { css } from 'styled-system/css'
import { token } from 'styled-system/tokens'
import { HStack, Stack } from 'styled-system/jsx'
import { Breadcrumb, CloseButton, Dialog, Drawer, Heading, IconButton, Text, Toaster, Sidebar } from '@/core/ui'
import { BrandForm } from './BrandForm'
import { Dashboard } from './pages/Dashboard'
import { CategoryPage } from './pages/Category'
import { type TocCategory } from './toc'

/* ---------------------------------------------------------------------------
   Styleguide shell (temp-styleguide #38) — the app root while the lab runs.
   Sidebar + `#page-panel` header (breadcrumbs) + a component-level
   push/pop panel stack (no router) via AnimatePresence. The Dashboard's
   overlay demos open native Park UI Dialog/Drawer overlays.
--------------------------------------------------------------------------- */

type Panel = { kind: 'dashboard' } | { kind: 'category'; category: TocCategory }

type OverlayState = {
  key: string
  kind: 'dialog' | 'drawer'
  title: ReactNode
  children: ReactNode
} | null

const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1]
const SLOWEST_S = Number.parseFloat(token('durations.slowest')) / 1000

const slideVariants: Variants = {
  enter: (direction: number) => ({ x: direction > 0 ? '100%' : '-33%', opacity: 0.6 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? '-33%' : '100%', opacity: 0.6 }),
}

const fadeVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
}

const shellCss = css({
  display: 'flex',
  height: '100dvh',
  overflow: 'hidden',
  bg: 'var(--canvas-bg)',
  color: 'fg.default',
})

const pagePanelCss = css({
  display: 'flex',
  flexDirection: 'column',
  flex: '1',
  minWidth: '0',
  height: '100%',
  overflow: 'hidden',
  marginRight: '5px',
  '@media (min-width: 1280px)': {
    marginRight: 'var(--dynamic-sidebar-width, 100px)',
  },
})

const pageHeaderCss = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
  px: '6',
  py: '3',
  borderBottom: '1px solid var(--colors-border)',
  flexShrink: '0',
  marginRight: '44px', /* leave space for sidebar pull tab */
  '@media (min-width: 1280px)': {
    marginRight: '0px',
  },
})

const contentCss = css({ flex: '1', overflowY: 'auto', px: '6', py: '6' })

export default function StyleguideApp() {
  const [stack, setStack] = useState<Panel[]>([{ kind: 'dashboard' }])
  const [direction, setDirection] = useState(1)
  const [overlay, setOverlay] = useState<OverlayState>(null)
  const [brandDrawerOpen, setBrandDrawerOpen] = useState(false)
  const [brandLogo, setBrandLogo] = useState<string | null>(null)
  const brandLogoRef = useRef<string | null>(null)
  const reduceMotion = useReducedMotion()

  const current = stack[stack.length - 1]
  const currentKey = current.kind === 'category' ? `category:${current.category.id}` : 'dashboard'

  const push = (panel: Panel) => {
    setDirection(1)
    setStack((previous) => [...previous, panel])
  }

  const pop = () => {
    if (stack.length <= 1) return
    setDirection(-1)
    setStack((previous) => previous.slice(0, -1))
  }

  const goHome = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    setDirection(1)
    setStack([{ kind: 'dashboard' }])
  }

  const openOverlayDemo = (kind: 'dialog' | 'drawer') => {
    setOverlay({
      key: `overlay:${kind}`,
      kind,
      title: kind === 'dialog' ? 'Dialog demo' : 'Drawer demo',
      children: (
        <Stack gap="3">
          <Heading textStyle="md">{kind === 'dialog' ? 'Dialog' : 'Drawer'} demo</Heading>
          <Text color="fg.muted" textStyle="sm">
            A native Park UI {kind} opened from the Dashboard demo strip.
          </Text>
        </Stack>
      ),
    })
  }

  // BrandForm — opens from the header kebab as a Drawer (decision
  // #46). The logo commits to the sidebar brand slot on Apply (decision #45);
  // old committed URLs are revoked so object URLs never leak.
  const commitLogo = (url: string) => {
    if (brandLogoRef.current) URL.revokeObjectURL(brandLogoRef.current)
    brandLogoRef.current = url
    setBrandLogo(url)
  }

  const openBrandForm = () => {
    setBrandDrawerOpen(true)
  }

  const renderPanel = (panel: Panel) => {
    if (panel.kind === 'category') {
      return <CategoryPage category={panel.category} />
    }
    return (
      <Dashboard
        onOpenCategory={(category) => push({ kind: 'category', category })}
        onOpenOverlay={openOverlayDemo}
      />
    )
  }

  return (
    <div className={shellCss}>
      {/* Sidebar */}
      <Sidebar onBrandSettings={openBrandForm} />

      {/* #page-panel — header + push/pop stack */}
      <div id="page-panel" className={pagePanelCss}>
        <header className={pageHeaderCss}>
          <HStack gap="2" flex="1" minWidth="0">
            {stack.length > 1 && (
              <IconButton variant="plain" colorPalette="gray" aria-label="Back" onClick={pop}>
                <ChevronLeftIcon />
              </IconButton>
            )}
          </HStack>


        </header>

        <div className={contentCss}>
            <Breadcrumb.Root>
              <Breadcrumb.List>
                <Breadcrumb.Item>
                  <Breadcrumb.Link href="#" onClick={goHome}>
                    Style Guide
                  </Breadcrumb.Link>
                </Breadcrumb.Item>
                {current.kind === 'category' && (
                  <>
                    <Breadcrumb.Separator />
                    <Breadcrumb.Item>
                      <Breadcrumb.Link href="#" aria-current="page">
                        {current.category.name}
                      </Breadcrumb.Link>
                    </Breadcrumb.Item>
                  </>
                )}
              </Breadcrumb.List>
            </Breadcrumb.Root>
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={currentKey}
              custom={direction}
              variants={reduceMotion ? fadeVariants : slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: SLOWEST_S, ease: EASE }}
              className={css({ minHeight: '100%' })}
            >
              {renderPanel(current)}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Native Park UI overlay demos — Dialog + Drawer (replaces SlidePanel) */}
      <Dialog.Root
        open={overlay?.kind === 'dialog'}
        onOpenChange={(details) => {
          if (!details.open) setOverlay(null)
        }}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.CloseTrigger asChild>
              <CloseButton />
            </Dialog.CloseTrigger>
            <Dialog.Header>
              <Dialog.Title>{overlay?.title}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>{overlay?.children}</Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      <Drawer.Root
        open={overlay?.kind === 'drawer'}
        onOpenChange={(details) => {
          if (!details.open) setOverlay(null)
        }}
      >
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.CloseTrigger asChild>
              <CloseButton />
            </Drawer.CloseTrigger>
            <Drawer.Header>
              <Drawer.Title>{overlay?.title}</Drawer.Title>
            </Drawer.Header>
            <Drawer.Body>{overlay?.children}</Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>

      {/* Brand settings Drawer (decision #46) — form body + pinned footer */}
      <Drawer.Root open={brandDrawerOpen} onOpenChange={(details) => setBrandDrawerOpen(details.open)}>
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
                onClose={() => setBrandDrawerOpen(false)}
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
