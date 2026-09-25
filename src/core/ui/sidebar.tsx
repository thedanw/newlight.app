'use client'
import { useRef, useState, useEffect, useCallback } from 'react'
import { animate, motion, useMotionValue } from 'framer-motion'
import { css } from 'styled-system/css'
import { Avatar, NavTile, PullTab, PullTabDots, NavProvider, useNavContext } from '@/core/ui'
import { Sun, Settings, LogIn } from 'lucide-react'
import { useAuth } from '@/core/auth'
import { isSettingsTileVisible } from '@/core/auth/lib/permissions'
import { getAccountTileState } from '@/core/auth/lib/tile-state'
import { getSidebarModules } from './sidebar-registry'

/* ---------------------------------------------------------------------------
    Sidebar — mobile-first left-side module menu (ui-ux #7):
    - module grid (grid-auto-flow: column, fill top→bottom then wrap)
    - 5px peek when closed (CLOSED_X = -(width - PEEK_WIDTH))
    - viewport-aware column calculation (88px tiles)
    - persistent pull-tab top-left (hamburger→X morph)
   - drag left open / right close; click toggles; click-outside closes
   - snap: |velocity|>100 wins else nearest half; spring-like CSS slide
   - open state app-level (NavContext); route change closes
   - wide-desktop ignores open state (always pinned)
   - respect useReducedMotion
   - account avatar pinned to footer
--------------------------------------------------------------------------- */

const FOOTER_TILES = 2 // Account + Settings
const TILE_SIZE = 66 // px

const TILE_GAP = 12 // px
const SIDEBAR_PADDING = 12 // px
const PEEK_WIDTH = 5 // px
const SNAP_VELOCITY_THRESHOLD = 100 // px/s
const DRAG_CLICK_THRESHOLD = 6 // px of movement before a press counts as a drag

// Get dynamically registered modules from sidebar registry
const MODULES = getSidebarModules()

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

// Pull-tab indicator: the 9-cell glyph (PullTabDots) — its 3 × 3 lattice, the
// gap between cells and the open-state spread all come from the shared
// pull-tab-dots-geometry.ts constants, styled by the `pullTabDots` recipe.

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
  boxShadow:
    '8px 0px 16px var(--colors-black-a3),0px 0px 1px var(--colors-black-a5)',
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
  left: '44px',
  bottom: 0,
  zIndex: 'modal',
  pointerEvents: 'none',
  touchAction: 'none',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'flex-end',
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
  onSettingsNavigate?: () => void
  onModuleNavigate?: (moduleId: string) => void
  /** Navigate to the account surface (/login when signed out, /account when signed in). */
  onAccountNavigate?: (path: string) => void
  /** Committed brand logo URL — replaces the Sun mark in the brand slot. */
  logo?: string | null
}

function SidebarInner({ onSettingsNavigate, onModuleNavigate, onAccountNavigate, logo }: SidebarInnerProps) {
  const { isOpen, open, close, toggle } = useNavContext()
  const { user, initials, firstName, person, isProfileLoading } = useAuth()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
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

  // The sidebar's translateX is a framer-motion value shared 1:1 by the
  // sidebar and the pull-tab drag surface. Framer-motion owns drag + snap in
  // this app (ui-ux design: drag/drop is framer-motion; @use-gesture/react
  // is not used). Left-side: closed = negative (peeking off the left edge),
  // open = 0. Narrow screens start closed; the sync effect below corrects
  // based on isOpen / isWide.
  const [isWide, setIsWide] = useState(() => window.innerWidth >= 1280)
  useEffect(() => {
    const handleResize = () => setIsWide(window.innerWidth >= 1280)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const closedX = -(sidebarWidth - PEEK_WIDTH)
  const openX = 0

  const x = useMotionValue(isWide ? openX : closedX)

  // Keep x in sync with open state / breakpoint / reduced-motion. While a
  // drag is live framer drives x 1:1 (we bail), so this only animates the
  // snap-back spring on release/click. Reduced motion -> instant (no spring).
  useEffect(() => {
    if (isDragging) return
    const target = isWide ? openX : isOpen ? openX : closedX
    if (Math.abs(x.get() - target) < 0.5) return
    if (reduceMotion) {
      x.set(target)
      return
    }
    const controls = animate(x, target, { type: 'spring', stiffness: 400, damping: 35 })
    return () => controls.stop()
  }, [x, isOpen, isWide, isDragging, closedX, openX, reduceMotion])

  // Drag handling lives on the pull-tab motion.div below (framer-motion's
  // `drag` prop). Tracking is intentionally NOT gated on reduced motion:
  // dragging is direct manipulation, so the sidebar follows the pointer 1:1;
  // only the release snap animation is suppressed (instant) for reduced
  // motion. Click-vs-drag suppression and the velocity snap are handled on
  // the motion.div's onDragStart / onDrag / onDragEnd callbacks.

  // Breakpoint + closedX/openX + snap state now live with the motion value
  // above; wide desktop pins the sidebar at openX via the same sync effect.

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
      document.addEventListener('pointerdown', handleClickOutside)
    }
    return () => document.removeEventListener('pointerdown', handleClickOutside)
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
  const handleModuleClick = useCallback((moduleId: string) => {
    if (window.innerWidth < 1280) {
      close()
    }
    onModuleNavigate?.(moduleId)
  }, [close, onModuleNavigate])

  // Handle settings click - close sidebar on narrow screens
  const handleSettingsClick = useCallback(() => {
    if (window.innerWidth < 1280) {
      close()
    }
    onSettingsNavigate?.()
  }, [close, onSettingsNavigate])

  // Handle account click - close sidebar on narrow screens
  const handleAccountClick = useCallback((path: string) => {
    if (window.innerWidth < 1280) {
      close()
    }
    onAccountNavigate?.(path)
  }, [close, onAccountNavigate])

  // On wide desktop, sidebar is always pinned (ignore open state)
  const effectiveIsOpen = isWide ? true : isOpen

  return (
    <>
      <motion.div
        ref={sidebarRef}
        className={sidebarCss}
        style={{ x }}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Brand header - single 66x66 tile with logo + name */}
        <div className={brandHeaderCss}>
          <div className={brandTileCss}>
            {/* Logo rule: never paint a background behind a logo — transparent
                PNG/SVG marks must sit directly on the sidebar surface. The
                accent tile is reserved for the Sun fallback mark. */}
            <div
              style={{
                background: logo ? 'transparent' : 'var(--sidebar-accent)',
                borderRadius: 'var(--radii-l2)',
                display: 'grid',
                placeItems: 'center',
                width: '40px',
                height: '40px',
                overflow: 'hidden',
              }}
            >
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
                onClick={() => handleModuleClick(module.id)}
              />
            )
          })}
        </nav>

        {/* Footer: account/log-in tile + brand settings — row-priority grid */}
        <nav className={sidebarFooterCss} aria-label="Account">
          {getAccountTileState(user) === 'account' ? (
            <NavTile
              icon={
                <Avatar.Root size="lg" className={css({ width: '24px', height: '24px' })}>
                  <Avatar.Fallback>{initials}</Avatar.Fallback>
                </Avatar.Root>
              }
              label={firstName}
              onClick={() => handleAccountClick('/account')}
            />
          ) : (
            <NavTile
              icon={<LogIn className={css({ width: '24px', height: '24px' })} />}
              label="Log in"
              onClick={() => handleAccountClick('/login')}
            />
          )}

          {/* Settings tile: super-admin only (audit REQ-2). Fail closed —
              hidden while the profile loads and for every other role. */}
          {isSettingsTileVisible(person, isProfileLoading) && (
            <NavTile
              icon={<Settings className={css({ width: '24px', height: '24px' })} />}
              label="Settings"
              onClick={handleSettingsClick}
            />
          )}
        </nav>
      </motion.div>

      {/* Pull tab - rendered OUTSIDE the sidebar so overflow:hidden can't crop
          it. The wrapper is fixed at left:0 and shares the sidebar's transform,
          so the tab hugs the sidebar's right edge as it slides. The wrapper is
          pointer-events:none; the tab button re-enables them. */}
      {!isWide && (
        <motion.div
          className={pullTabWrapperCss}
          style={{ x, width: sidebarWidth }}
          drag="x"
          dragConstraints={{ left: closedX, right: openX }}
          dragElastic={0}
          dragMomentum={false}
          onDragStart={() => {
            setIsDragging(true)
            suppressToggleRef.current = false
            dragMovedRef.current = false
          }}
          onDrag={(_event, info) => {
            // Mark as a drag once the pointer moves meaningfully (click vs drag)
            if (Math.abs(info.offset.x) > DRAG_CLICK_THRESHOLD) {
              dragMovedRef.current = true
            }
          }}
          onDragEnd={(_event, info) => {
            // Always leave dragging state, even for a plain tap on the tab
            setIsDragging(false)

            // A press without meaningful movement is a click, not a drag
            if (!dragMovedRef.current) return

            // Real drag: swallow the click the browser fires after pointerup so
            // it doesn't toggle the sidebar right back to its pre-drag state.
            suppressToggleRef.current = true

            // framer's PanInfo.velocity is px/s — a fast flick beats the
            // nearest-half rule. Snap rule unchanged: >100 px/s wins, else
            // nearest half; the sync effect above animates the spring snap.
            const velocity = info.velocity.x
            const shouldOpen =
              Math.abs(velocity) > SNAP_VELOCITY_THRESHOLD
                ? velocity > 0
                : x.get() > (closedX + openX) / 2

            if (shouldOpen) open()
            else close()
          }}
        >
          <PullTab
            open={effectiveIsOpen}
            onClick={handleTabClick}
            className={css({ pointerEvents: 'auto' })}
          >
            <PullTabDots open={effectiveIsOpen} />
          </PullTab>
        </motion.div>
      )}
    </>
  )
}

interface SidebarProps {
  onSettingsNavigate?: () => void
  onModuleNavigate?: (moduleId: string) => void
  /** Navigate to the account surface (/login when signed out, /account when signed in). */
  onAccountNavigate?: (path: string) => void
  /** Committed brand logo URL — shown in the brand slot instead of the Sun. */
  logo?: string | null
}

export function Sidebar({ onSettingsNavigate, onModuleNavigate, onAccountNavigate, logo }: SidebarProps) {
  return (
    <NavProvider>
      <SidebarInner
        onSettingsNavigate={onSettingsNavigate}
        onModuleNavigate={onModuleNavigate}
        onAccountNavigate={onAccountNavigate}
        logo={logo}
      />
    </NavProvider>
  )
}
