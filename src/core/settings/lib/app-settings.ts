'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { switchTheme } from '@/core/theme/theme-loader'
import type {
  AccentScheme,
  ColorMode,
  GrayScheme,
  RadiusKey,
  SidebarStyle,
} from '@/core/theme/theme-loader'
import { applyFont, detectFont } from '@/core/theme/font-loader'
import { toaster, useRegisterPageActions } from '@/core/ui'
import { useSettings, type AppSettings } from './provider'

/* ---------------------------------------------------------------------------
   Shared form machinery for the hosted General + Appearance settings pages
   (decision #13). `app-settings` is a single upserted JSON value
   (decision #15), so BOTH pages hydrate the full object and re-save it whole
   on Apply — each page edits only its own slice and the other page's fields
   pass through untouched.
 ------------------------------------------------------------------------- */

/** Church identity fields — `churchAddress` added 2026-09 (decision #13). */
export type ChurchInfo = {
  churchName: string
  appName: string
  churchEmail: string
  website: string
  churchAddress: string
}

export const EMPTY_CHURCH_INFO: ChurchInfo = {
  churchName: '',
  appName: '',
  churchEmail: '',
  website: '',
  churchAddress: '',
}

/** Theme slice shape — mirrors `AppSettings['theme']` (see provider.tsx). */
export type ThemeState = AppSettings['theme']

/** Heading tokens written space-separated to `data-heading-style`. */
export const HEADING_TOKENS = ['bold', 'uppercase', 'accent'] as const

/** Read the live theme off the `<html>` data-* attributes (theme-loader boot). */
export function getInitialTheme(): ThemeState {
  const root = document.documentElement
  const headingTokens = (root.getAttribute('data-heading-style') ?? '')
    .split(' ')
    .filter(Boolean)
  return {
    scheme: (root.getAttribute('data-mode') as ColorMode) ?? 'light',
    accent: (root.getAttribute('data-color-scheme') as AccentScheme) ?? 'orange',
    gray: (root.getAttribute('data-gray-color') as GrayScheme) ?? 'neutral',
    font: detectFont(root),
    radius: (root.getAttribute('data-radius') as RadiusKey) ?? 'md',
    sidebarStyle: (root.getAttribute('data-sidebar-style') as SidebarStyle) ?? 'light',
    headings: Object.fromEntries(
      HEADING_TOKENS.map((token) => [token, headingTokens.includes(token)]),
    ),
  }
}

/** Serialize the heading toggles to the space-separated attribute value. */
export function activeHeadingTokens(headings: ThemeState['headings']): string {
  return HEADING_TOKENS.filter((token) => headings[token]).join(' ')
}

/** Push a theme snapshot onto the live DOM (Appearance preview + cancel revert). */
function applyThemeToDom(themeState: ThemeState) {
  switchTheme({
    accent: themeState.accent,
    gray: themeState.gray,
    radius: themeState.radius,
    sidebarStyle: themeState.sidebarStyle,
    colorScheme: themeState.scheme,
    headingStyle: activeHeadingTokens(themeState.headings),
    font: themeState.font,
  })
  applyFont(themeState.font)
}

/**
 * useAppSettingsForm — hydrate/apply/cancel machinery shared by the General
 * and Appearance settings pages.
 *
 *  - Hydrates the full `app-settings` object once; legacy rows are
 *    back-filled (`churchAddress` from EMPTY_CHURCH_INFO, missing theme keys
 *    from the live DOM theme).
 *  - `apply` (wired to the shell footer) runs the optional `prepareApply`
 *    hook first (the Appearance page uploads a pending logo there), saves
 *    the whole object, toasts, and dispatches `app-settings-changed` so
 *    AppTitleSync re-syncs title/favicon.
 *  - `cancel` restores the hydrated snapshot — re-applying it to the DOM
 *    synchronously, since the pages navigate away on cancel and the
 *    Appearance preview effect would otherwise never run.
 */
export function useAppSettingsForm(options?: {
  /** Runs inside the saving window, before the save request. */
  prepareApply?: () => Promise<void>
}) {
  const { getAppSettings, saveAppSettings } = useSettings()
  const navigate = useNavigate()
  const [theme, setTheme] = useState<ThemeState>(getInitialTheme)
  const [churchInfo, setChurchInfo] = useState<ChurchInfo>(EMPTY_CHURCH_INFO)
  const [logoUrl, setLogoUrlState] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const initialTheme = useRef<ThemeState>(getInitialTheme())
  const initialChurchInfo = useRef<ChurchInfo>(EMPTY_CHURCH_INFO)
  const initialLogoUrl = useRef<string | null>(null)
  // Ref mirror so `apply` always saves the freshly-uploaded logo even when
  // `prepareApply` sets it in the same tick as the save.
  const logoUrlRef = useRef<string | null>(null)
  const prepareApplyRef = useRef(options?.prepareApply)
  prepareApplyRef.current = options?.prepareApply

  useEffect(() => {
    let cancelled = false
    getAppSettings()
      .then((settings) => {
        if (cancelled) return
        if (settings?.theme) {
          const merged = { ...getInitialTheme(), ...settings.theme }
          setTheme(merged)
          initialTheme.current = merged
        }
        if (settings?.churchInfo) {
          const merged = { ...EMPTY_CHURCH_INFO, ...settings.churchInfo }
          setChurchInfo(merged)
          initialChurchInfo.current = merged
        }
        if (settings?.logoUrl) {
          logoUrlRef.current = settings.logoUrl
          setLogoUrlState(settings.logoUrl)
          initialLogoUrl.current = settings.logoUrl
        }
        setHydrated(true)
      })
      .catch((error) => {
        console.error('Failed to hydrate app settings:', error)
        setHydrated(true)
      })
    return () => {
      cancelled = true
    }
  }, [getAppSettings])

  const setLogoUrl = useCallback((url: string | null) => {
    logoUrlRef.current = url
    setLogoUrlState(url)
  }, [])

  const setChurchField = useCallback((field: keyof ChurchInfo, value: string) => {
    setChurchInfo((previous) => ({ ...previous, [field]: value }))
    setIsDirty(true)
  }, [])

  const markDirty = useCallback(() => setIsDirty(true), [])

  const apply = useCallback(async () => {
    setSaving(true)
    try {
      if (prepareApplyRef.current) await prepareApplyRef.current()
      await saveAppSettings({ theme, churchInfo, logoUrl: logoUrlRef.current })
      initialTheme.current = theme
      initialChurchInfo.current = churchInfo
      initialLogoUrl.current = logoUrlRef.current
      setIsDirty(false)
      toaster.create({ title: 'Settings saved', type: 'success' })
      window.dispatchEvent(new CustomEvent('app-settings-changed'))
    } catch (error) {
      console.error('Failed to save settings:', error)
      toaster.create({ title: 'Failed to save settings', type: 'error' })
    } finally {
      setSaving(false)
    }
  }, [theme, churchInfo, saveAppSettings])

  const cancel = useCallback(() => {
    setTheme(initialTheme.current)
    setChurchInfo(initialChurchInfo.current)
    setLogoUrl(initialLogoUrl.current)
    setIsDirty(false)
    applyThemeToDom(initialTheme.current)
    navigate('/settings')
  }, [navigate])

  useRegisterPageActions({
    cancel,
    apply,
    isSaving: saving,
    isDirty,
    applyLabel: 'Apply',
  })

  return {
    theme,
    setTheme,
    churchInfo,
    setChurchField,
    logoUrl,
    setLogoUrl,
    saving,
    isDirty,
    hydrated,
    markDirty,
    apply,
    cancel,
  }
}