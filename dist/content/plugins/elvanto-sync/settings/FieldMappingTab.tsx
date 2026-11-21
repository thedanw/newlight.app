import { Stack, HStack } from 'styled-system/jsx'
import { Heading, Text, Button, Alert, Card } from '@/core/ui'
import { usePluginAPIContext } from '@/core/plugins/PluginAPI'
import { useState, useEffect, useCallback } from 'react'
import { useRegisterPageActions } from '@/core/ui'
import { FieldMappingTable } from './components/FieldMappingTable'
import { discoverElvantoFields, getElvantoFieldOptions } from '../utils/field-discovery'
import { decrypt } from '../utils/encryption'
import { getSupabaseUrl, getSupabaseAnonKey } from '@/core/lib/runtime-config'

/**
 * Field Mappings Tab — Full implementation with two-column mapping table
 */
export function FieldMappingTab() {
  const { settings, toast, supabase } = usePluginAPIContext()
  const [isDirty, setIsDirty] = useState(false)
  const [hasConnection, setHasConnection] = useState(false)
  const [checkingConnection, setCheckingConnection] = useState(true)
  const [discovering, setDiscovering] = useState(false)
  const [discoveredCatalog, setDiscoveredCatalog] = useState<any>(null)
  const [mappings, setMappings] = useState<any[]>([])
  const [savedMappings, setSavedMappings] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const setDirty = useCallback(() => setIsDirty(true), [])

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    setCheckingConnection(true)
    try {
      const creds = await settings.getCredentials()
      setHasConnection(Boolean(creds?.apiKey))
    } catch {
      setHasConnection(false)
    } finally {
      setCheckingConnection(false)
    }
  }

  const handleDiscoverFields = async () => {
    setDiscovering(true)
    try {
      const creds = await settings.getCredentials()
      if (!creds?.apiKey) {
        toast.error('No API key found. Please save a key in the Connection tab first.')
        return
      }

      const decrypted = await decrypt(creds.apiKey)
      
      // Get user's session for authentication
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token || ''
      const supabaseUrl = getSupabaseUrl() || ''
      
      const catalog = await discoverElvantoFields(decrypted, { supabaseUrl, accessToken })
      setDiscoveredCatalog(catalog)
      
      await settings.setConfig('elvanto_field_catalog', catalog)
      
      const totalFields = catalog.categories.length + catalog.customFields.length + catalog.locations.length + (catalog.demographics?.length ?? 0)
      toast.success(`Discovered ${totalFields} dynamic fields from Elvanto`)
    } catch (err) {
      console.error('[FieldMappingTab] Failed to discover fields:', err)
      toast.error('Failed to discover Elvanto fields')
    } finally {
      setDiscovering(false)
    }
  }

  const loadDiscoveredCatalog = async () => {
    try {
      const catalog = await settings.getConfig<any>('elvanto_field_catalog')
      if (catalog) {
        setDiscoveredCatalog(catalog)
      }
    } catch (err) {
      console.error('[FieldMappingTab] Failed to load discovered catalog:', err)
    }
  }

  // Load actual field mappings, not just the catalog
  const loadFieldMappings = async () => {
    try {
      const mappings = await settings.getConfig<any[]>('elvanto-sync_field_mappings')
      if (mappings) {
        setMappings(mappings)
        setSavedMappings(mappings)
      } else {
        setMappings([])
        setSavedMappings([])
      }
    } catch (err) {
      console.error('[FieldMappingTab] Failed to load field mappings:', err)
      setMappings([])
      setSavedMappings([])
    }
  }

  useEffect(() => {
    if (hasConnection) {
      loadDiscoveredCatalog()
      loadFieldMappings()
    }
  }, [hasConnection])

  const handleSaveMappings = async () => {
    try {
      await settings.setConfig('elvanto-sync_field_mappings', mappings)
      toast.success('Field mappings saved')
      setSavedMappings(JSON.parse(JSON.stringify(mappings)))
      setIsDirty(false)
    } catch (err) {
      console.error('[FieldMappingTab] Failed to save mappings:', err)
      toast.error('Failed to save mappings')
    }
  }

  const handleCancelMappings = () => {
    setMappings(JSON.parse(JSON.stringify(savedMappings)))
    setIsDirty(false)
  }

  // Update the mapping modification functions to mark as dirty
  const updateMappingWithDirty = (index: number, updates: Partial<MappingRule>) => {
    setMappings(mappings.map((rule, i) => i === index ? { ...rule, ...updates } : rule))
    setDirty()
  }

  const addMappingWithDirty = () => {
    setMappings([...mappings, { id: crypto.randomUUID(), appField: '', elvantoField: '', direction: 'pull', priority: 0 }])
    setDirty()
  }

  const deleteMappingWithDirty = (index: number) => {
    setMappings(mappings.filter((_, i) => i !== index))
    setDirty()
  }

  const duplicateMappingWithDirty = (index: number) => {
    const duplicated = { ...mappings[index], id: crypto.randomUUID(), priority: mappings[index].priority - 1 }
    setMappings([...mappings.slice(0, index + 1), duplicated, ...mappings.slice(index + 1)])
    setDirty()
  }

  useRegisterPageActions({
    cancel: handleCancelMappings,
    apply: handleSaveMappings,
    isSaving: saving,
    isDirty: isDirty,
    applyLabel: 'Save All',
  })

  if (checkingConnection) {
    return (
      <Stack align="center">
        <Text>Checking connection status...</Text>
      </Stack>
    )
  }

  if (!hasConnection) {
    return (
      <Stack>
        <Heading textStyle="md">Field Mappings</Heading>
        <Alert.Root>
          <Alert.Title>Connection required</Alert.Title>
          <Alert.Description>
            <Text color="fg.muted" textStyle="sm">
              You need to save and test an Elvanto API key before configuring field mappings.
              Go to the <strong>Connection</strong> tab to get started.
            </Text>
          </Alert.Description>
        </Alert.Root>
      </Stack>
    )
  }

  const dynamicFieldOptions = getElvantoFieldOptions(discoveredCatalog)

  return (
    <Stack>
      <Heading textStyle="md">Field Mappings</Heading>
      <Text color="fg.muted" textStyle="sm">
        Configure how Supabase fields map to Elvanto fields with conditional logic and transforms.
      </Text>

      <Card.Root>
        <Card.Header>
          <Card.Title>Elvanto Field Discovery</Card.Title>
        </Card.Header>
        <Card.Body>

          <HStack justify="space-between" alignItems="start" flexDirection={{ base: 'column', sm: 'row' }}>
            <Text fontSize="sm">
              Discover dynamic fields like categories, custom fields, and locations from your Elvanto account.
            </Text>
            <Stack>
            <Button 
              size="sm"
              onClick={handleDiscoverFields} 
              loading={discovering}
              disabled={discovering}
            >
              {discovering ? 'Discovering...' : 'Discover Elvanto Fields'}
            </Button>
            
            {discoveredCatalog && (
              <Text color="fg.muted" textStyle="sm">
                Last discovered: {new Date(discoveredCatalog.discoveredAt).toLocaleString()}
                {' • '}
                {(discoveredCatalog.categories?.length ?? 0)} categories, {' '}
                {(discoveredCatalog.customFields?.length ?? 0)} custom fields, {' '}
                {(discoveredCatalog.locations?.length ?? 0)} locations
              </Text>
            )}
            </Stack>
          </HStack>
        </Card.Body>
      </Card.Root>

      <FieldMappingTable 
        disabled={false}
        dynamicFieldOptions={dynamicFieldOptions}
        mappings={mappings}
        onUpdateMapping={updateMappingWithDirty}
        onAddMapping={addMappingWithDirty}
        onDeleteMapping={deleteMappingWithDirty}
        onDuplicateMapping={duplicateMappingWithDirty}
        onSaveMappings={handleSaveMappings}
        onCancelMappings={handleCancelMappings}
        isSaving={saving}
        isDirty={isDirty}
      />
    </Stack>
  )
}
