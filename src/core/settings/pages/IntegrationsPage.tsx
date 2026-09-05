'use client'
import { type CSSProperties, useEffect, useState } from 'react'
import { Stack } from 'styled-system/jsx'
import { Settings } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  Heading,
  Page,
  Switch,
  Text,
  toaster,
} from '@/core/ui'
import { getSettingsPages } from '../lib/schema'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../lib/provider'
import { getPluginSettingsPages } from '@/core/plugins/HookRegistry'
import { discoverPluginNames, fetchPluginManifest } from '@/core/plugins/discovery'
import { pluginManager } from '@/core/plugins/pluginManager'

interface PluginInfo {
  name: string
  displayName: string
  version: string
  description: string
  author?: string
}

export default function IntegrationsPage() {
  const navigate = useNavigate()
  const { supabase } = useSettings()
  const pages = getSettingsPages('integrations')
  const [plugins, setPlugins] = useState<PluginInfo[]>([])
  const [enabled, setEnabled] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

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
    const pluginPages = getPluginSettingsPages(name)
    if (pluginPages.length === 0) return
    const first = pluginPages[0]
    navigate(`/settings/${first.sectionId}/${first.id}`)
  }

  if (pages.length === 0 && plugins.length === 0) {
    return (
      <Page.Main>
        <Page.Header
          style={{ '--module-number': 0 } as CSSProperties}
        >
          <Page.Heading level={1} icon={Settings} title="Integrations" />
        </Page.Header>
        <Page.Body>
          <Stack gap="4">
            <Heading textStyle="md">Integrations</Heading>
            <Text color="fg.muted" textStyle="sm">
              No integrations configured yet. Install plugins to add integrations.
            </Text>
          </Stack>
        </Page.Body>
      </Page.Main>
    )
  }

  return (
    <Page.Main>
      <Page.Header
        style={{ '--module-number': 0 } as CSSProperties}
      >
        <Page.Heading level={1} icon={Settings} title="Integrations" />
      </Page.Header>

      <Page.Body>
        <Stack gap="4">
          <Heading textStyle="md">Integrations</Heading>
          <Text color="fg.muted" textStyle="sm">
            Manage your third-party integrations and external service connections.
          </Text>
          <Stack gap="3">
            {pages.map((pageItem) => (
              <Card.Root
                key={pageItem.id}
                onClick={() => navigate(`/settings/integrations/${pageItem.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    navigate(`/settings/integrations/${pageItem.id}`)
                  }
                }}
                tabIndex={0}
                role="link"
                css={{ cursor: 'pointer' }}
              >
                <Card.Body>
                  <Heading textStyle="sm">{pageItem.title}</Heading>
                </Card.Body>
              </Card.Root>
            ))}
            {plugins.length > 0 && (
              <Stack gap="3">
                <Heading textStyle="md">Plugins</Heading>
                <Badge variant="outline">{plugins.length}</Badge>
                {loading ? (
                  <Text color="fg.muted" textStyle="sm">Loading plugins…</Text>
                ) : (
                  <Stack gap="2">
                    {plugins.map((plugin) => {
                      const isEnabled = Boolean(enabled[plugin.name])
                      const pluginPages = getPluginSettingsPages(plugin.name)
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
                          {isEnabled && pluginPages.length > 0 && (
                            <Card.Footer>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openSettings(plugin.name)}
                              >
                                Settings
                              </Button>
                            </Card.Footer>
                          )}
                        </Card.Root>
                      )
                    })}
                  </Stack>
                )}
              </Stack>
            )}
          </Stack>
        </Stack>
      </Page.Body>
    </Page.Main>
  )
}
