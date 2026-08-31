import { useEffect, useState } from 'react'
import { Stack } from 'styled-system/jsx'
import { Badge, Button, Card, Heading, Switch, Text, toaster } from '@/core/ui'
import { getSettingsPages } from '../settings-schema'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../SettingsProvider'
import { getPluginSettingsPages } from '@/core/plugins/HookRegistry'
import { discoverPluginNames, fetchPluginManifest } from '@/core/plugins/discovery'
import { pluginManager } from '@/core/plugins/pluginManager'

/**
 * Integrations Section — Lists all registered integration pages
 * Plugins register their settings pages under this section via hooks
 * Also includes a "Plugins" card for managing installed plugins
 */
export function IntegrationsSection() {
  const navigate = useNavigate()
  const { supabase } = useSettings()
  const pages = getSettingsPages('integrations')
  const [plugins, setPlugins] = useState<PluginInfo[]>([])
  const [enabled, setEnabled] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  // Discover plugins + fetch their manifests
  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const names = await discoverPluginNames()
        const infos: PluginInfo[] = []
        for (const name of names) {
          const manifest = await fetchPluginManifest(name)
          if (!manifest) continue
          infos.push({
            name,
            displayName: (manifest.displayName as string) ?? name,
            version: (manifest.version as string) ?? '0.0.0',
            description: (manifest.description as string) ?? '',
            author: (manifest.author as string) ?? undefined,
          })
        }
        if (mounted) setPlugins(infos)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  // Load enabled states from Supabase
  useEffect(() => {
    let mounted = true
    async function loadStates() {
      const { data, error } = await supabase.from('plugins').select('id, enabled')
      if (!error && data) {
        const states: Record<string, boolean> = {}
        for (const row of data) states[row.id] = row.enabled
        if (mounted) setEnabled(states)
      }
    }
    loadStates()
    return () => { mounted = false }
  }, [supabase])

  const togglePlugin = async (name: string, next: boolean) => {
    setSaving(name)
    try {
      const { error } = await supabase
        .from('plugins')
        .upsert(
          { id: name, enabled: next, updated_at: new Date().toISOString() },
          { onConflict: 'id' },
        )
      if (error) throw error
      setEnabled((prev) => ({ ...prev, [name]: next }))

      // Dynamically load/unload the plugin WITHOUT a page reload.
      // The PluginManager registers/unregisters hooks and notifies the
      // PluginLoader, which re-renders the PluginProvider wrappers.
      if (next) {
        await pluginManager.enable(name)
      } else {
        pluginManager.disable(name)
      }

      toaster.success({
        title: next ? 'Plugin enabled' : 'Plugin disabled',
        description: next
          ? `${name} is now active.`
          : `${name} is now inactive.`,
      })
    } catch (err) {
      console.error(`[Plugins] Failed to toggle ${name}:`, err)
      toaster.error({
        title: 'Failed to update plugin',
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setSaving(null)
    }
  }

  const openSettings = (name: string) => {
    const pages = getPluginSettingsPages(name)
    if (pages.length === 0) return
    const first = pages[0]
    navigate(`/settings/${first.sectionId}/${first.id}`)
  }

  if (pages.length === 0 && plugins.length === 0) {
    return (
      <Stack gap="4">
        <Heading textStyle="md">Integrations</Heading>
        <Text color="fg.muted" textStyle="sm">
          No integrations configured yet. Install plugins to add integrations.
        </Text>
      </Stack>
    )
  }

  return (
    <Stack gap="4">
      <Heading textStyle="md">Integrations</Heading>
      <Text color="fg.muted" textStyle="sm">
        Manage your third-party integrations and external service connections.
      </Text>
      <Stack gap="3">
        {pages.map((page) => (
          <Card.Root
            key={page.id}
            onClick={() => navigate(`/settings/integrations/${page.id}`)}
            css={{ cursor: 'pointer', transition: 'box-shadow 0.2s' }}
          >
            <Card.Body>
              <Heading textStyle="sm">{page.title}</Heading>
            </Card.Body>
          </Card.Root>
        ))}
        {/* Plugins card — contains all installed plugins with toggles */}
        {plugins.length > 0 && (
          <Card.Root>
            <Card.Body>
              <Stack gap="3">
                <Stack direction="row" gap="2" justify="space-between" align="center">
                  <Heading textStyle="md">Plugins</Heading>
                  <Badge variant="outline">{plugins.length}</Badge>
                </Stack>
                {loading ? (
                  <Text color="fg.muted" textStyle="sm">Loading plugins…</Text>
                ) : (
                  <Stack gap="2">
                    {plugins.map((plugin) => {
                      const isEnabled = Boolean(enabled[plugin.name])
                      const settingsPages = getPluginSettingsPages(plugin.name)
                      return (
                        <Card.Root key={plugin.name} variant="outline">
                          <Card.Body>
                            <Stack direction="row" gap="4" justify="space-between" align="start">
                              <Stack gap="1" flex="1">
                                <Stack direction="row" gap="2">
                                  <Heading textStyle="sm">{plugin.displayName}</Heading>
                                  <Badge variant="outline">{plugin.version}</Badge>
                                  {isEnabled ? (
                                    <Badge variant="solid">Active</Badge>
                                  ) : (
                                    <Badge variant="subtle">Inactive</Badge>
                                  )}
                                </Stack>
                                {plugin.description && (
                                  <Text color="fg.muted" textStyle="sm">
                                    {plugin.description}
                                  </Text>
                                )}
                                {isEnabled && settingsPages.length > 0 && (
                                  <Stack direction="row" gap="2" mt="2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openSettings(plugin.name)}
                                    >
                                      Settings
                                    </Button>
                                  </Stack>
                                )}
                              </Stack>
                              <Switch.Root
                                checked={isEnabled}
                                disabled={saving === plugin.name}
                                onCheckedChange={(details) => togglePlugin(plugin.name, details.checked)}
                              >
                                <Switch.HiddenInput />
                                <Switch.Control>
                                  <Switch.Thumb />
                                </Switch.Control>
                              </Switch.Root>
                            </Stack>
                          </Card.Body>
                        </Card.Root>
                      )
                    })}
                  </Stack>
                )}
              </Stack>
            </Card.Body>
          </Card.Root>
        )}
      </Stack>
    </Stack>
  )
}

interface PluginInfo {
  name: string
  displayName: string
  version: string
  description: string
  author?: string
}