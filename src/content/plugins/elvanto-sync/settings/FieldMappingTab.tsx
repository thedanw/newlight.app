import { Stack } from 'styled-system/jsx'
import { Heading, Text, Button, Alert, Card } from '@/core/ui'
import { usePluginAPIContext } from '@/core/plugins/PluginAPI'
import { useState, useEffect } from 'react'
import { FieldMappingTable } from './components/FieldMappingTable'
import { discoverElvantoFields, getElvantoFieldOptions } from '../utils/field-discovery'
import { decrypt } from '../utils/encryption'

/**
 * Field Mappings Tab — Full implementation with two-column mapping table
 */
export function FieldMappingTab() {
  const { settings, toast } = usePluginAPIContext()
  const [hasConnection, setHasConnection] = useState(false)
  const [checkingConnection, setCheckingConnection] = useState(true)
  const [discovering, setDiscovering] = useState(false)
  const [discoveredCatalog, setDiscoveredCatalog] = useState<any>(null)

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
      const catalog = await discoverElvantoFields(decrypted)
      setDiscoveredCatalog(catalog)
      
      await settings.setConfig('elvanto_field_catalog', catalog)
      
      const totalFields = catalog.categories.length + catalog.customFields.length + catalog.locations.length
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

  useEffect(() => {
    if (hasConnection) {
      loadDiscoveredCatalog()
    }
  }, [hasConnection])

  if (checkingConnection) {
    return (
      <Stack gap="4" align="center">
        <Text>Checking connection status...</Text>
      </Stack>
    )
  }

  if (!hasConnection) {
    return (
      <Stack gap="6">
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
    <Stack gap="6">
      <Heading textStyle="md">Field Mappings</Heading>
      <Text color="fg.muted" textStyle="sm">
        Configure how Supabase fields map to Elvanto fields with conditional logic and transforms.
      </Text>

      <Card.Root>
        <Card.Header>
          <Card.Title>Elvanto Field Discovery</Card.Title>
          <Card.Description>
            Discover dynamic fields like categories, custom fields, and locations from your Elvanto account.
          </Card.Description>
        </Card.Header>
        <Card.Body>
          <Stack gap="4">
            <Button 
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
                {discoveredCatalog.categories.length} categories, {' '}
                {discoveredCatalog.customFields.length} custom fields, {' '}
                {discoveredCatalog.locations.length} locations
              </Text>
            )}
          </Stack>
        </Card.Body>
      </Card.Root>

      <FieldMappingTable 
        disabled={false}
        dynamicFieldOptions={dynamicFieldOptions}
      />
    </Stack>
  )
}
