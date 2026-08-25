'use client'
import { useRef, useState, useEffect, useCallback } from 'react'
import { useDrag } from '@use-gesture/react'
import { css } from 'styled-system/css'
import { NavTile, PullTab, NavProvider, useNavContext, Text } from '@/core/ui'
import { Settings2, Users, UsersRound, Wrench, CalendarDays, Sun } from 'lucide-react'

/* ---------------------------------------------------------------------------
   WaffleSidebar — mobile-first left waffle menu (ui-ux #7):
   - waffle grid (grid-auto-flow: column, fill top→bottom then wrap)
   - 5px peek when closed (CLOSED_X = -(width-5))
   - dynamic width measurement (min 90px) + publish --dynamic-sidebar-width
   - persistent pull-tab top-left (hamburger→X morph)
   - drag right open / left close; click toggles; click-outside closes
   - snap: |velocity|>100 wins else nearest half; spring-like CSS slide
   - open state app-level (NavContext); route change closes
   - wide-desktop ignores open state (always pinned)
   - respect useReducedMotion
--------------------------------------------------------------------------- */

const MODULES = [
  { id: 'people', label: 'People', icon: Users },
  { id: 'groups', label: 'Groups', icon: UsersRound },
  { id: 'services', label: 'Services', icon: Wrench },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'admin', label: 'Admin', icon: Settings2 },
] as const

const SIDEBAR_MIN_WIDTH = 90 // px
const PEEK_WIDTH = 5 // px
const SNAP_VELOCITY_THRESHOLD = 100 // px/s
const DRAG_CLICK_THRESHOLD = 6 // px of movement before a press counts as a drag
// Spring-like easing approximating the spec's 400/35 spring
const SLIDE_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'
const SLIDE_DURATION = '340ms'

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
  left: 0,
  bottom: 0,
  zIndex: 'modal',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--sidebar-bg)',
  color: 'var(--sidebar-fg)',
  borderRight: '1px solid var(--sidebar-border)',
  overflow: 'hidden',
  contain: 'layout style',
  boxShadow: 'lg',
})

const pullTabWrapperCss = css({
  position: 'fixed',
  top: 0,
  left: 0,
  bottom: 0,
  zIndex: 'modal',
  pointerEvents: 'none',
  touchAction: 'none', // drag handle: keep the browser from hijacking the pan
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'flex-end',
})

const waffleGridCss = css({
  display: 'grid',
  gridTemplateRows: 'repeat(auto-fill, 90px)',
  gridAutoColumns: '90px',
  gridAutoFlow: 'column',
  gap: '0', // 10px = spacing.2.5
  width: 'max-content',
  flex: '1',
  padding: '2.5',
  overflowY: 'auto',
  overflowX: 'hidden',
  alignContent: 'start',
})

const adminBlockCss = css({
  marginTop: 'auto',
  paddingTop: '3',
  borderTop: '1px solid var(--sidebar-border)',
})

const brandHeaderCss = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1.5',
  p: '2.5',
  borderBottom: '1px solid var(--sidebar-border)',
})

const brandLogoCss = css({
  boxSize: '9',
  borderRadius: 'l2',
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
  overflow: 'hidden',
  padding: '0',
})

function WaffleSidebarInner() {
  const { isOpen, open, close, toggle } = useNavContext()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_MIN_WIDTH)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartTimeRef = useRef(0)
  // True when a press has moved enough to count as a drag rather than a click
  const dragMovedRef = useRef(false)
  // Set after a real drag ends. The browser still fires a `click` on the tab
  // when the pointer is pressed AND released on it, which would toggle the
  // sidebar right back — this flag swallows exactly one such click.
  const suppressToggleRef = useRef(false)

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
  const [x, setX] = useState(() =>
    window.innerWidth >= 1280 ? 0 : -(SIDEBAR_MIN_WIDTH - PEEK_WIDTH),
  )
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
        const clampedX = Math.max(closedX, Math.min(openX, ox))
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

        // Snap logic: |velocity| > 100 wins, else nearest half
        const shouldOpen =
          Math.abs(velocity) > SNAP_VELOCITY_THRESHOLD
            ? velocity > 0
            : xRef.current > (closedX + openX) / 2

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

  // Measure sidebar width on mount and resize
  useEffect(() => {
    const measure = () => {
      if (sidebarRef.current) {
        const width = Math.max(sidebarRef.current.offsetWidth, SIDEBAR_MIN_WIDTH)
        setSidebarWidth(width)
        // Publish CSS variable for #page-panel offset
        document.documentElement.style.setProperty('--dynamic-sidebar-width', `${width}px`)
      }
    }
    
    measure()
    const ro = new ResizeObserver(measure)
    if (sidebarRef.current) ro.observe(sidebarRef.current)
    return () => ro.disconnect()
  }, [])

  // Calculate closed position (5px peek)
  const closedX = -(sidebarWidth - PEEK_WIDTH)
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
        style={{
          ...positionStyle(displayX),
          width: sidebarWidth,
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Brand header */}
        <div className={brandHeaderCss}>
          <div className={brandLogoCss} style={{ background: 'var(--sidebar-accent)' }}>
            <Sun className={css({ width: '20px', height: '20px', color: 'var(--sidebar-accent-fg)' })} />
          </div>
          <Text textStyle="sm" fontWeight="bold" color="var(--sidebar-fg)" textAlign="center">
            New Light
          </Text>
        </div>

        {/* Waffle grid */}
        <nav className={waffleGridCss} aria-label="Modules">
          {MODULES.slice(0, -1).map((module) => {
            const ModuleIcon = module.icon
            return (
              <NavTile
                key={module.id}
                icon={<ModuleIcon className={css({ width: '32px', height: '32px' })} />}
                label={module.label}
                onClick={handleModuleClick}
              />
            )
          })}
        </nav>

        {/* Admin block - pinned bottom */}
        <div className={adminBlockCss}>
          {MODULES.slice(-1).map((module) => {
            const ModuleIcon = module.icon
            return (
              <NavTile
                key={module.id}
                icon={<ModuleIcon className={css({ width: '32px', height: '32px' })} />}
                label={module.label}
                onClick={handleModuleClick}
              />
            )
          })}
        </div>
      </div>

      {/* Pull tab - rendered OUTSIDE the sidebar so overflow:hidden can't crop
          it. The wrapper is fixed at left:0 and shares the sidebar's transform,
          so the tab hugs the sidebar's right edge as it slides. The wrapper is
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

export function WaffleSidebar() {
  return (
    <NavProvider>
      <WaffleSidebarInner />
    </NavProvider>
  )
}