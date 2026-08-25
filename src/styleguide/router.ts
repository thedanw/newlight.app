'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

/* ---------------------------------------------------------------------------
   Hash router for the Styleguide shell.

   URL scheme (everything after `#`):
     #/                                        → Dashboard
     #/category/<categoryId>                   → Category page
     #/category/<categoryId>/component/<Name>  → Category page scrolled to the
                                                 component's card anchor

   History model — the browser history stack IS the navigation state:
   - Every panel push writes a matching history entry, so the native back
     button (browser + phone) walks the same path the UI does; Forward works
     for free.
   - Overlays (Dialog/Drawer demos, Brand settings) push a SAME-URL entry
     flagged in `history.state`, so Back closes the open drawer/dialog first
     and only then navigates to the previous page.
   - Deep links are seeded: loading `#/category/x` directly replaces that
     entry and pushes a synthetic `#/` beneath it, so the first Back press
     lands on the Dashboard instead of leaving the app.
--------------------------------------------------------------------------- */

export type Route =
  | { view: 'dashboard' }
  | { view: 'category'; categoryId: string; component?: string }

/** Overlay keys tracked in history.state so Back closes them first. */
export type OverlayKey = 'demo-dialog' | 'demo-drawer' | 'brand'

const CATEGORY_SEGMENT = 'category'
const COMPONENT_SEGMENT = 'component'

type HistoryOverlayState = { overlay?: OverlayKey } | null

export function hrefForDashboard(): string {
  return '#/'
}

export function hrefForCategory(categoryId: string): string {
  return `#/${CATEGORY_SEGMENT}/${encodeURIComponent(categoryId)}`
}

export function hrefForComponent(categoryId: string, component: string): string {
  return `${hrefForCategory(categoryId)}/${COMPONENT_SEGMENT}/${encodeURIComponent(component)}`
}

export function parseRoute(hash: string): Route {
  const segments = hash
    .replace(/^#\/?/, '')
    .split('/')
    .filter(Boolean)
    .map(decodeURIComponent)

  if (segments[0] !== CATEGORY_SEGMENT || segments.length < 2) {
    return { view: 'dashboard' }
  }
  if (segments[2] === COMPONENT_SEGMENT && segments[3]) {
    return { view: 'category', categoryId: segments[1], component: segments[3] }
  }
  return { view: 'category', categoryId: segments[1] }
}

const routeDepth = (route: Route) => (route.view === 'category' ? 1 : 0)

const readOverlayKey = (): OverlayKey | null => {
  const state = window.history.state as HistoryOverlayState
  return state?.overlay ?? null
}

/**
 * Single source of truth for shell navigation. UI state (`route`, `overlay`)
 * is derived from `location.hash` + `history.state`; every action mutates
 * history first, then re-syncs, so browser/phone Back always does the
 * user-expected thing.
 */
export function useHashNavigation() {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash))
  const [overlay, setOverlay] = useState<OverlayKey | null>(null)
  const [direction, setDirection] = useState(1)
  const depthRef = useRef(0)

  // Re-derive ALL UI state from the current history entry.
  const sync = useCallback(() => {
    const next = parseRoute(window.location.hash)
    const depth = routeDepth(next)
    setRoute(next)
    setOverlay(readOverlayKey())
    // Equal depth (e.g. overlay-only changes) keeps the last push direction.
    setDirection(depth >= depthRef.current ? 1 : -1)
    depthRef.current = depth
  }, [])

  useEffect(() => {
    const initialHash = window.location.hash

    // Deep link: seed a Dashboard entry beneath the loaded page so the first
    // Back press returns home instead of leaving the app. The `seeded` flag
    // keeps this idempotent under StrictMode double-invocation.
    const state = window.history.state as { seeded?: boolean } | null
    if (!state?.seeded && parseRoute(initialHash).view === 'category') {
      window.history.replaceState({ seeded: true }, '', hrefForDashboard())
      window.history.pushState(null, '', initialHash)
    } else if (readOverlayKey()) {
      // A reload must not resurrect an overlay that was open before it.
      window.history.replaceState(null, '')
    }

    sync()
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [sync])

  const navigate = useCallback(
    (href: string) => {
      if (window.location.hash !== href) {
        window.history.pushState(null, '', href)
      }
      sync()
    },
    [sync],
  )

  /** Push a category page onto the stack (new history entry). */
  const openCategory = useCallback(
    (categoryId: string) => navigate(hrefForCategory(categoryId)),
    [navigate],
  )

  /** Push a category page and scroll to a component anchor. */
  const openComponent = useCallback(
    (categoryId: string, component: string) => navigate(hrefForComponent(categoryId, component)),
    [navigate],
  )

  /** Reset the stack to the Dashboard. */
  const goHome = useCallback(() => navigate(hrefForDashboard()), [navigate])

  /** Native back — pops panels (and seeded deep links) via popstate. */
  const back = useCallback(() => window.history.back(), [])

  /** Open an overlay by pushing a same-URL entry flagged in history.state. */
  const openOverlay = useCallback(
    (key: OverlayKey) => {
      window.history.pushState({ overlay: key }, '')
      sync()
    },
    [sync],
  )

  /**
   * Close the topmost overlay by going back one entry — identical to pressing
   * the native back button while the drawer/dialog is open.
   */
  const closeOverlay = useCallback(() => {
    if (readOverlayKey()) window.history.back()
  }, [])

  return { route, direction, overlay, goHome, openCategory, openComponent, back, openOverlay, closeOverlay }
}
