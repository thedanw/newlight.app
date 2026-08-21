'use client'
import { useRef, useState, useEffect, useCallback } from 'react'
import { useDrag } from '@use-gesture/react'
import { css } from 'styled-system/css'
import { HStack, Stack } from 'styled-system/jsx'
import { Avatar, Menu, NavTile, PullTab, NavProvider, useNavContext, Text } from '@/core/ui'
import { Users, UsersRound, Wrench, CalendarDays, Sun, SlidersHorizontal } from 'lucide-react'

/* ---------------------------------------------------------------------------
   Sidebar — mobile-first right-side module menu (ui-ux #7):
   - module grid (grid-auto-flow: column, fill top→bottom then wrap)
   - 5px peek when closed (CLOSED_X = width - PEEK_WIDTH)
   - viewport-aware column calculation (88px tiles)
   - persistent pull-tab top-right (hamburger→X morph)
   - drag left open / right close; click toggles; click-outside closes
   - snap: |velocity|>100 wins else nearest half; spring-like CSS slide
   - open state app-level (NavContext); route change closes
   - wide-desktop ignores open state (always pinned)
   - respect useReducedMotion
   - account avatar pinned to footer
--------------------------------------------------------------------------- */

const MODULES = [
  { id: 'people', label: 'People', icon: Users },
  { id: 'groups', label: 'Groups', icon: UsersRound },
  { id: 'services', label: 'Services', icon: Wrench },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
] as const

const FOOTER_TILES = 2 // Account + Brand
const TILE_SIZE = 66 // px
const TILE_GAP = 12 // px
const SIDEBAR_PADDING = 12 // px
const PEEK_WIDTH = 5 // px
const SNAP_VELOCITY_THRESHOLD = 100 // px/s
const DRAG_CLICK_THRESHOLD = 6 // px of movement before a press counts as a drag
// Spring-like easing approximating the spec's 400/35 spring
const SLIDE_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'
const SLIDE_DURATION = '340ms'

// Calculate optimal column count and rows-per-column for given tile count and viewport height
function calculateLayout(mainTileCount: number, viewportHeight: number) {
  // Reference implementation:
  // Sidebar structure (top to bottom):
  //   padding-top(12) → brand header(66) → gap(12) → main grid → gap(12) → footer → padding-bottom(12)
  // Fixed height = 12 + 66 + 12 + 12 + footerHeight + 12 = 114 + footerHeight
  // 1. For each column count candidate C (1, 2, 3...):
  //    - Footer rows needed: Math.ceil(tileCount / C)
  //    - Footer height: footerRows * 66px + (footerRows - 1) * 12px gap
  //    - Fixed height: padding(24) + brand header(66) + gaps(24) + footerHeight = 114 + footerHeight
  //    - Usable main vertical space: containerHeight - 114 - footerHeight
  //    - Max boxes per vertical column: Math.floor((usableMainHeight + 12px) / (66px + 12px))
  //    - Balanced rows per column: Math.ceil(boxCount / C)
  // 2. The SMALLEST C where balancedRows <= maxPerCol is selected (minimum columns, max vertical stacking)
  const BRAND_HEADER_HEIGHT = TILE_SIZE // 66px
  const GAPS_BETWEEN_SECTIONS = 2 * TILE_GAP // 24px (brand→main, main→footer)
  const FIXED_OVERHEAD = 2 * SIDEBAR_PADDING + BRAND_HEADER_HEIGHT + GAPS_BETWEEN_SECTIONS // 24 + 66 + 24 = 114px
  
  for (let columns = 1; columns <= mainTileCount; columns++) {
    const footerRows = Math.ceil(FOOTER_TILES / columns)
    const footerHeight = footerRows * TILE_SIZE + (footerRows - 1) * TILE_GAP
    const usableMainHeight = viewportHeight - FIXED_OVERHEAD - footerHeight
    const maxBoxesPerCol = Math.max(1, Math.floor((usableMainHeight + TILE_GAP) / (TILE_SIZE + TILE_GAP)))
    const balancedRows = Math.ceil(mainTileCount / columns)
    // Check both: rows fit AND total height fits
    const mainGridHeight = balancedRows * TILE_SIZE + (balancedRows - 1) * TILE_GAP
    const totalHeight = FIXED_OVERHEAD + footerHeight + mainGridHeight
    if (balancedRows <= maxBoxesPerCol && totalHeight <= viewportHeight) {
      return { columns, boxesPerCol: balancedRows }
    }
  }
  // Fallback: minimum viable layout (1 column, 1 row) - ensures footer never overlaps
  // Minimum height for 1 col: FIXED_OVERHEAD + footerHeight(1col) + 1 row = 114 + 144 + 66 = 324px
  return { columns: 1, boxesPerCol: 1 }
}

// Hamburger (3 lines) → X morph. On open the top line rotates +45deg and the
// bottom −45deg (forming an X) while the middle line collapses to zero width
// (centered, scaleX around its own center) so it animates out. All via CSS
// transitions, so it reverses automatically on close.
const hamburgerLineBase: React.CSSProperties = {
  transformBox: 'fill-box',
  transformOrigin: 'center',
  transition: 'transform 200ms ease',
}

const HamburgerIcon = ({ open }: { open: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <line x1="4" y1="7" x2="20" y2="7" style={{ ...hamburgerLineBase, transform: open ? 'translateY(5px) rotate(45deg)' : 'none' }} />
    <line x1="4" y1="12" x2="20" y2="12" style={{ ...hamburgerLineBase, transform: open ? 'scaleX(0)' : 'none' }} />
    <line x1="4" y1="17" x2="20" y2="17" style={{ ...hamburgerLineBase, transform: open ? 'translateY(-5px) rotate(-45deg)' : 'none' }} />
  </svg>
)

const sidebarCss = css({
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  zIndex: 'modal',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--sidebar-bg)',
  color: 'var(--sidebar-fg)',
  borderLeft: '1px solid var(--sidebar-border)',
  overflow: 'hidden',
  contain: 'layout style',
  boxShadow:
    '-8px 0px 16px var(--colors-black-a3),0px 0px 1px var(--colors-black-a5)',
  width: `calc(var(--columns, 1) * ${TILE_SIZE}px + (var(--columns, 1) - 1) * ${TILE_GAP}px + 2 * ${SIDEBAR_PADDING}px)`,
  minWidth: `${TILE_SIZE + 2 * SIDEBAR_PADDING}px`,
  height: '100vh',
  maxHeight: '100vh',
  padding: `${SIDEBAR_PADDING}px`,
  paddingTop: '0px',
  gap: `${TILE_GAP}px`,
  boxSizing: 'border-box',
})

const pullTabWrapperCss = css({
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  zIndex: 'modal',
  pointerEvents: 'none',
  touchAction: 'none', // drag handle: keep the browser from hijacking the pan
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
})

const sidebarGridCss = css({
  display: 'grid',
  gridTemplateRows: `repeat(var(--boxes-per-col, 5), ${TILE_SIZE}px)`,
  gridAutoColumns: `${TILE_SIZE}px`,
  gridAutoFlow: 'column',
  gap: `${TILE_GAP}px`,
  flex: '1 1 0%',
  minHeight: 0,
  padding: '0',
  margin: '0',
  overflow: 'hidden',
  alignContent: 'start',
  justifyContent: 'start',
  boxSizing: 'border-box',
  borderRadius: 'l2',
})

const sidebarFooterCss = css({
  flexShrink: 0,
  width: '100%',
  borderTop: '1px solid var(--sidebar-border)',
  display: 'grid',
  gridTemplateColumns: `repeat(var(--columns, 1), ${TILE_SIZE}px)`,
  gap: `${TILE_GAP}px`,
  padding: '0',
  margin: '0',
  alignContent: 'start',
  justifyContent: 'start',
  boxSizing: 'border-box',
  borderRadius: 'l2',
})

const brandHeaderCss = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1.5',
  width: '100%',
  height: `${TILE_SIZE}px`,
  borderBottom: '1px solid var(--sidebar-border)',
  flexShrink: 0,
  boxSizing: 'border-box',
})

const brandTileCss = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1.5',
  width: `${TILE_SIZE}px`,
  height: `${TILE_SIZE}px`,
  padding: '0',
  borderRadius: 'l2',
  background: 'transparent',
  border: 'none',
  cursor: 'default',
  fontWeight: 'bold',
  textAlign: 'center',
  lineHeight: '1',
  userSelect: 'none',
})

interface SidebarInnerProps {
  onBrandSettings?: () => void
  /** Committed brand logo URL — replaces the Sun mark in the brand slot. */
  logo?: string | null
}

function SidebarInner({ onBrandSettings, logo }: SidebarInnerProps) {
  const { isOpen, open, close, toggle } = useNavContext()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartTimeRef = useRef(0)
  // True when a press has moved enough to count as a drag rather than a click
  const dragMovedRef = useRef(false)
  // Set after a real drag ends. The browser still fires a `click` on the tab
  // when the pointer is pressed AND released on it, which would toggle the
  // sidebar right back — this flag swallows exactly one such click.
  const suppressToggleRef = useRef(false)

  // Viewport-aware layout: calculate columns and boxes-per-col from tile count + viewport height
  const [layout, setLayout] = useState(() => calculateLayout(MODULES.length, window.innerHeight))
  useEffect(() => {
    const onResize = () => setLayout(calculateLayout(MODULES.length, window.innerHeight))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Sync CSS variables immediately during render so first paint uses correct values
  document.documentElement.style.setProperty('--columns', String(layout.columns))
  document.documentElement.style.setProperty('--boxes-per-col', String(layout.boxesPerCol))

  // Width = columns * TILE_SIZE + (columns - 1) * TILE_GAP + 2 * SIDEBAR_PADDING
  const sidebarWidth = layout.columns * TILE_SIZE + (layout.columns - 1) * TILE_GAP + 2 * SIDEBAR_PADDING
  document.documentElement.style.setProperty('--dynamic-sidebar-width', `${sidebarWidth}px`)

  // Respect the user's reduced-motion preference (CSS-transition based, no framer)
  const [reduceMotion, setReduceMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduceMotion(mq.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  // Current translateX (px) for narrow/overlay mode. On wide desktop we
  // ignore this and always pin to 0 (open).
  // Right-side sidebar: closed = positive (peeking off the right edge),
  // open = 0 (flush with right edge).
  // Initialize to closed position; sync effect will correct based on isOpen/isWide.
  const [x, setX] = useState(sidebarWidth - PEEK_WIDTH)
  // Live ref so drag-end can read the current position without stale closures
  const xRef = useRef(x)
  useEffect(() => {
    xRef.current = x
  }, [x])

  // use-gesture drag handler for the pull tab. Tracking is intentionally NOT
  // gated on reduced motion: dragging is direct manipulation (an essential
  // interaction), so the sidebar follows the pointer 1:1 even when the user
  // prefers reduced motion — positionStyle still disables the release animation
  // in that case (instant snap).
  const bindDrag = useDrag(
    ({ down, offset: [ox], movement: [mx], first, last }) => {
      if (first) {
        setIsDragging(true)
        dragStartTimeRef.current = performance.now()
        dragMovedRef.current = false
        // A new press clears any stale post-drag suppression (in case the
        // release never produced a click, e.g. pointercancel).
        suppressToggleRef.current = false
      }

      if (down) {
        // Mark as a drag once the pointer moves meaningfully (distinguish from click)
        if (Math.abs(mx) > DRAG_CLICK_THRESHOLD) {
          dragMovedRef.current = true
        }

        // `offset` is seeded by `from` with the current resting x, so it is
        // already the live sidebar position in px. Clamp it so the sidebar can
        // never be dragged past the fully-open (0) or fully-closed edge.
        // Right-side: openX=0, closedX=sidebarWidth-PEEK_WIDTH (positive).
        const clampedX = Math.max(openX, Math.min(closedX, ox))
        xRef.current = clampedX
        setX(clampedX)
      }

      if (last) {
        // Always leave dragging state, even for a plain tap on the tab
        setIsDragging(false)

        // A press without meaningful movement is a click, not a drag
        if (!dragMovedRef.current) return

        // Real drag: swallow the click the browser fires after pointerup so it
        // doesn't toggle the sidebar right back to its pre-drag state.
        suppressToggleRef.current = true

        // Real velocity in px/s so a fast flick beats the nearest-half rule
        const elapsedMs = Math.max(performance.now() - dragStartTimeRef.current, 1)
        const velocity = (mx / elapsedMs) * 1000

        // Right-side snap logic: drag left (negative velocity) → OPEN,
        // drag right (positive velocity) → CLOSED.
        // |velocity| > 100 wins, else nearest half.
        const shouldOpen =
          Math.abs(velocity) > SNAP_VELOCITY_THRESHOLD
            ? velocity < 0
            : xRef.current < (closedX + openX) / 2

        // Sync the NavContext open state with the snap result
        if (shouldOpen) {
          setX(openX)
          open()
        } else {
          setX(closedX)
          close()
        }
      }
    },
    { axis: 'x', from: () => [xRef.current, 0] },
  )

  // Determine if we're on wide desktop (xl breakpoint)
  const [isWide, setIsWide] = useState(() => window.innerWidth >= 1280)
  useEffect(() => {
    const handleResize = () => setIsWide(window.innerWidth >= 1280)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Calculate closed position (5px peek). Right-side: closed = positive
  // offset (peeking off right edge).
  const closedX = sidebarWidth - PEEK_WIDTH
  const openX = 0

  // Sync position with open state (also on width/breakpoint changes)
  useEffect(() => {
    if (!isDragging) {
      setX(isOpen ? openX : closedX)
    }
  }, [isOpen, isDragging, closedX, openX, isWide])

  // Click outside to close (on body)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Swallow the click that follows a real drag (released off the tab, so
      // it landed on the page instead of the button).
      if (suppressToggleRef.current) {
        suppressToggleRef.current = false
        return
      }
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        // Also ignore clicks on the pull-tab toggle itself
        const target = event.target as HTMLElement
        if (target.closest('button.pull-tab')) {
          return
        }
        close()
      }
    }
    
    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
    }
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isOpen, close])

  // Tab click: a genuine click toggles. After a real drag the browser still
  // fires a click on release — suppress exactly one of those so the drag snap
  // (open()/close() above) isn't immediately reversed by toggle().
  const handleTabClick = useCallback(() => {
    if (suppressToggleRef.current) {
      suppressToggleRef.current = false
      return
    }
    toggle()
  }, [toggle])

  // Handle module click - close sidebar on narrow screens
  const handleModuleClick = useCallback(() => {
    // On narrow screens, close the overlay when a tile is clicked
    if (window.innerWidth < 1280) { // xl breakpoint
      close()
    }
    // TODO: Navigate to module route
  }, [close])

  // On wide desktop, sidebar is always pinned (ignore open state)
  const displayX = isWide ? 0 : x
  const effectiveIsOpen = isWide ? true : isOpen

  // Inline transform + spring-like slide; disabled while dragging (1:1
  // tracking) and on wide desktop / reduced motion (instant).
  // Right-side: positive translateX pushes sidebar off the right edge.
  const positionStyle = (translate: number): React.CSSProperties => ({
    transform: `translateX(${translate}px)`,
    transition:
      isWide || isDragging || reduceMotion
        ? 'none'
        : `transform ${SLIDE_DURATION} ${SLIDE_EASING}`,
  })

  return (
    <>
      <div
        ref={sidebarRef}
        className={sidebarCss}
        style={positionStyle(displayX)}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Brand header - single 66x66 tile with logo + name */}
        <div className={brandHeaderCss}>
          <div className={brandTileCss}>
            <div style={{ background: 'var(--sidebar-accent)', borderRadius: 'var(--radii-l2)', display: 'grid', placeItems: 'center', width: '40px', height: '40px', overflow: 'hidden' }}>
              {logo ? (
                <img
                  src={logo}
                  alt="Brand logo"
                  className={css({ width: '100%', height: '100%', objectFit: 'contain' })}
                />
              ) : (
                <Sun className={css({ width: '24px', height: '24px', color: 'var(--sidebar-accent-fg)' })} />
              )}
            </div>
          </div>
        </div>

        {/* Module grid */}
        <nav className={sidebarGridCss} aria-label="Modules">
          {MODULES.map((module) => {
            const ModuleIcon = module.icon
            return (
              <NavTile
                key={module.id}
                icon={<ModuleIcon className={css({ width: '24px', height: '24px' })} />}
                label={module.label}
                onClick={handleModuleClick}
              />
            )
          })}
        </nav>

        {/* Footer: account menu + brand settings — row-priority grid */}
        <nav className={sidebarFooterCss} aria-label="Account">
          <Menu.Root positioning={{ placement: 'top-start' }}>
            <Menu.Trigger asChild>
              <NavTile
                icon={
                  <Avatar.Root size="lg" className={css({ width: '24px', height: '24px' })}>
                    <Avatar.Fallback name="Account" />
                  </Avatar.Root>
                }
                label="Account"
              />
            </Menu.Trigger>
            <Menu.Positioner>
              <Menu.Content minWidth="13rem">
                <Menu.ItemGroup id="account">
                  <Menu.ItemGroupLabel>
                    <HStack gap="2">
                      <Avatar.Root size="2xs">
                        <Avatar.Fallback name="Account" />
                      </Avatar.Root>
                      <Stack gap="0">
                        <Text textStyle="sm" fontWeight="semibold">Account</Text>
                        <Text textStyle="xs" color="fg.muted">New Light</Text>
                      </Stack>
                    </HStack>
                  </Menu.ItemGroupLabel>
                  <Menu.Item value="brand-settings" onSelect={onBrandSettings}>
                    <SlidersHorizontal />
                    <Menu.ItemText>Brand settings</Menu.ItemText>
                  </Menu.Item>
                </Menu.ItemGroup>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Root>

          <NavTile
            icon={<SlidersHorizontal className={css({ width: '24px', height: '24px' })} />}
            label="Brand"
            onClick={onBrandSettings}
          />
        </nav>
      </div>

      {/* Pull tab - rendered OUTSIDE the sidebar so overflow:hidden can't crop
          it. The wrapper is fixed at right:0 and shares the sidebar's transform,
          so the tab hugs the sidebar's left edge as it slides. The wrapper is
          pointer-events:none; the tab button re-enables them. */}
      {!isWide && (
        <div
          className={pullTabWrapperCss}
          style={{ ...positionStyle(displayX), width: sidebarWidth }}
          {...bindDrag()}
        >
          <PullTab
            open={effectiveIsOpen}
            onClick={handleTabClick}
            className={css({ pointerEvents: 'auto', touchAction: 'none' })}
          >
            <HamburgerIcon open={effectiveIsOpen} />
          </PullTab>
        </div>
      )}
    </>
  )
}

interface SidebarProps {
  onBrandSettings?: () => void
  /** Committed brand logo URL — shown in the brand slot instead of the Sun. */
  logo?: string | null
}

export function Sidebar({ onBrandSettings, logo }: SidebarProps) {
  return (
    <NavProvider>
      <SidebarInner onBrandSettings={onBrandSettings} logo={logo} />
    </NavProvider>
  )
}
