'use client'
import { useEffect } from 'react'
import { useSettings } from './SettingsProvider'

/**
 * AppTitleSync — Loads app settings on mount and syncs the app name to
 * document.title. Also listens for settings changes to update dynamically.
 * 
 * Runs at app startup (inside SettingsProvider).
 */
export function AppTitleSync() {
  const { getAppSettings } = useSettings()

  useEffect(() => {
    let mounted = true

    async function syncTitle() {
      const settings = await getAppSettings()
      if (!mounted) return
      if (settings?.churchInfo?.appName) {
        const appName = settings.churchInfo.appName
        document.title = appName
      }
    }

    // Initial sync
    syncTitle()

    // Listen for settings changes (dispatched by ChurchInformationSection after save)
    const handleSettingsChange = () => {
      syncTitle()
    }
    window.addEventListener('app-settings-changed', handleSettingsChange)

    return () => {
      mounted = false
      window.removeEventListener('app-settings-changed', handleSettingsChange)
    }
  }, [getAppSettings])

  return null
}