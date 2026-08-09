'use client'
import { useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
import {
  CalendarDays,
  ChevronLeftIcon,
  Settings2,
  SlidersHorizontalIcon,
  Sun,
  Users,
  UsersRound,
  Wrench,
} from 'lucide-react'
import { css } from 'styled-system/css'
import { token } from 'styled-system/tokens'
import { Box, HStack, Stack } from 'styled-system/jsx'
import { Avatar, Breadcrumb, Heading, Icon, IconButton, Menu, Text, Toaster } from '@/core/ui'
import { BrandForm } from './BrandForm'
import { Dashboard } from './pages/Dashboard'
import { CategoryPage } from './pages/Category'
import { SlidePanel, type SlidePanelVariant } from './SlidePanel'
import { type TocCategory } from './toc'

/* ---------------------------------------------------------------------------
   Styleguide shell (temp-styleguide #38) — the app root while the lab runs.
   Waffle sidebar mock + `#page-panel` header (breadcrumbs) + a component-level
   push/pop panel stack (no router) via AnimatePresence. Tapping a not-built
   module opens a 'not-built' SlidePanel; the Dashboard's variant demos open
   the SlidePanel trio.
--------------------------------------------------------------------------- */

type Panel = { kind: 'dashboard' } | { kind: 'category'; category: TocCategory }

const MODULES = [
  { id: 'people', label: 'People', icon: Users },
  { id: 'groups', label: 'Groups', icon: UsersRound },
  { id: 'services', label: 'Services', icon: Wrench },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'admin', label: 'Admin-Settings', icon: Settings2 },
] as const
type Module = (typeof MODULES)[number]

type SlideState = {
  key: string
  variant: SlidePanelVariant
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
  bg: 'canvas',
  color: 'fg.default',
})

const sidebarCss = css({
  display: 'flex',
  flexDirection: 'column',
  flexShrink: '0',
  width: '64',
  height: '100%',
  bg: 'var(--sidebar-bg)',
  color: 'var(--sidebar-fg)',
  borderRight: '1px solid var(--sidebar-border)',
})

const pagePanelCss = css({
  display: 'flex',
  flexDirection: 'column',
  flex: '1',
  minWidth: '0',
  height: '100%',
  overflow: 'hidden',
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
})

const contentCss = css({ flex: '1', overflowY: 'auto', px: '6', py: '6' })

const tileCss = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  width: '100%',
  px: '3',
  py: '2.5',
  borderRadius: 'l2',
  color: 'var(--sidebar-fg)',
  bg: 'transparent',
  border: '0',
  cursor: 'pointer',
  textAlign: 'left',
  font: 'inherit',
  _hover: { bg: 'var(--sidebar-subtle)' },
})

export default function StyleguideApp() {
  const [stack, setStack] = useState<Panel[]>([{ kind: 'dashboard' }])
  const [direction, setDirection] = useState(1)
  const [slide, setSlide] = useState<SlideState>(null)
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

  const goHome = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    setDirection(1)
    setStack([{ kind: 'dashboard' }])
  }

  const openNotBuilt = (module: Module) => {
    setSlide({
      key: `not-built:${module.id}`,
      variant: 'normal',
      title: module.label,
      children: (
        <Stack gap="3">
          <Heading textStyle="md">“{module.label}” is not built yet</Heading>
          <Text color="fg.muted" textStyle="sm">
            This module is a placeholder tile in the design-lab shell. Its real screen lands in a
            later phase — this SlidePanel keeps the mock from being dead UI.
          </Text>
        </Stack>
      ),
    })
  }

  const openSlideDemo = (variant: SlidePanelVariant) => {
    setSlide({
      key: `demo:${variant}`,
      variant,
      title: `SlidePanel — ${variant}`,
      children: (
        <Stack gap="3">
          <Heading textStyle="md">{variant} variant</Heading>
          <Text color="fg.muted" textStyle="sm">
            Minimal demo of the “{variant}” SlidePanel variant.
          </Text>
        </Stack>
      ),
    })
  }

  // BrandForm — opens from the header kebab as a SlidePanel 'normal' (decision
  // #46). The logo commits to the sidebar brand slot on Apply (decision #45);
  // old committed URLs are revoked so object URLs never leak.
  const commitLogo = (url: string) => {
    if (brandLogoRef.current) URL.revokeObjectURL(brandLogoRef.current)
    brandLogoRef.current = url
    setBrandLogo(url)
  }

  const openBrandForm = () => {
    setSlide({
      key: 'brand',
      variant: 'normal',
      title: 'Brand',
      children: (
        <BrandForm logo={brandLogo} onApplyLogo={commitLogo} onClose={() => setSlide(null)} />
      ),
    })
  }

  const renderPanel = (panel: Panel) => {
    if (panel.kind === 'category') {
      return <CategoryPage category={panel.category} />
    }
    return (
      <Dashboard
        onOpenCategory={(category) => push({ kind: 'category', category })}
        onOpenSlideDemo={openSlideDemo}
      />
    )
  }

  return (
    <div className={shellCss}>
      {/* Waffle sidebar mock */}
      <Box as="aside" className={sidebarCss}>
        <Box
          className={css({
            display: 'flex',
            alignItems: 'center',
            gap: '3',
            h: '16',
            px: '5',
            borderBottom: '1px solid var(--sidebar-border)',
          })}
        >
          <Box
            className={css({
              boxSize: '9',
              borderRadius: 'l2',
              bg: brandLogo ? 'transparent' : 'var(--sidebar-accent)',
              color: 'var(--sidebar-accent-fg)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: '0',
              overflow: 'hidden',
            })}
          >
            {brandLogo ? (
              <img
                src={brandLogo}
                alt="Logo"
                className={css({ boxSize: 'full', objectFit: 'contain' })}
              />
            ) : (
              <Icon size="sm">
                <Sun />
              </Icon>
            )}
          </Box>
          <Stack gap="0">
            <Text textStyle="sm" fontWeight="semibold" color="var(--sidebar-fg)">
              New Light
            </Text>
            <Text textStyle="xs" color="var(--sidebar-muted)">
              Design Lab
            </Text>
          </Stack>
        </Box>
        <Box as="nav" className={css({ py: '3', display: 'flex', flexDirection: 'column', gap: '1' })}>
          {MODULES.map((module) => {
            const ModuleIcon = module.icon
            return (
              <button key={module.id} type="button" className={tileCss} onClick={() => openNotBuilt(module)}>
                <Icon size="md">
                  <ModuleIcon />
                </Icon>
                <Text textStyle="sm" color="var(--sidebar-fg)">
                  {module.label}
                </Text>
              </button>
            )
          })}
        </Box>
      </Box>

      {/* #page-panel — header + push/pop stack */}
      <div id="page-panel" className={pagePanelCss}>
        <header className={pageHeaderCss}>
          <HStack gap="2" flex="1" minWidth="0">
            {stack.length > 1 && (
              <IconButton variant="plain" colorPalette="gray" aria-label="Back" onClick={pop}>
                <ChevronLeftIcon />
              </IconButton>
            )}
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
                      <Breadcrumb.Link href="#" onClick={goHome}>
                        Dashboard
                      </Breadcrumb.Link>
                    </Breadcrumb.Item>
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
          </HStack>

          {/* Header kebab (decision #29/#46): avatar trigger + brand settings */}
          <Menu.Root
            positioning={{ placement: 'bottom-end' }}
            onSelect={(details) => {
              if (details.value === 'brand-settings') openBrandForm()
            }}
          >
            <Menu.Trigger asChild>
              <IconButton variant="plain" colorPalette="gray" aria-label="Account menu">
                <Avatar.Root size="xs">
                  <Avatar.Fallback name="Design Lab" />
                </Avatar.Root>
              </IconButton>
            </Menu.Trigger>
            <Menu.Positioner>
              <Menu.Content minWidth="13rem">
                <Menu.ItemGroup id="account">
                  <Menu.ItemGroupLabel>
                    <HStack gap="2">
                      <Avatar.Root size="2xs">
                        <Avatar.Fallback name="Design Lab" />
                      </Avatar.Root>
                      <Stack gap="0">
                        <Text textStyle="sm" fontWeight="semibold">
                          Design Lab
                        </Text>
                        <Text textStyle="xs" color="fg.muted">
                          New Light
                        </Text>
                      </Stack>
                    </HStack>
                  </Menu.ItemGroupLabel>
                  <Menu.Item value="brand-settings">
                    <SlidersHorizontalIcon />
                    <Menu.ItemText>Brand settings</Menu.ItemText>
                  </Menu.Item>
                </Menu.ItemGroup>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Root>
        </header>

        <div className={contentCss}>
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

      {/* Single SlidePanel instance — not-built placeholder + variant demos */}
      <SlidePanel
        open={slide !== null}
        variant={slide?.variant ?? 'normal'}
        title={slide?.title}
        onClose={() => setSlide(null)}
      >
        {slide?.children}
      </SlidePanel>

      {/* Toaster — mounted once so Toast demos (Batch 7) have a surface */}
      <Toaster />
    </div>
  )
}
