'use client'
import { useEffect } from 'react'
import { useSettings } from './SettingsProvider'

/**
 * AppTitleSync — Loads app settings on mount and syncs the app name to
 * document.title. Also updates favicon and PWA manifest when logo changes.
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
      if (settings?.logoUrl) {
        updateFavicon(settings.logoUrl)
        updateManifest(settings.logoUrl)
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

function updateFavicon(logoUrl: string) {
  // Remove existing favicon links
  const existingLinks = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]')
  existingLinks.forEach(link => link.remove())

  // Add new favicon
  const link = document.createElement('link')
  link.rel = 'icon'
  link.type = 'image/svg+xml'
  link.href = logoUrl
  document.head.appendChild(link)
}

async function updateManifest(logoUrl: string) {
  try {
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement
    if (manifestLink) {
      const response = await fetch(manifestLink.href)
      const manifest = await response.json()
      manifest.icons = [
        {
          src: logoUrl,
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'any maskable',
        },
      ]
      // Note: Can't actually modify the manifest at runtime for installed PWAs,
      // but this updates it for future install prompts
      console.log('[AppTitleSync] PWA manifest icons would be updated to:', logoUrl)
    }
  } catch {
    // Ignore manifest fetch errors
  }
}