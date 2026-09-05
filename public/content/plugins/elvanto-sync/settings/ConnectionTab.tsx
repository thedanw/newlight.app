import { Heading, Text, Input, Button, Card, Alert } from '@/core/ui'
import { usePluginAPIContext } from '@/core/plugins/PluginAPI'
import { useState, useEffect } from 'react'
import { Stack } from 'styled-system/jsx'
import { encrypt, decrypt } from '../utils/encryption'

/**
 * Connection Tab — API key management and connection testing
 */
export function ConnectionTab() {
  const { settings, toast } = usePluginAPIContext()
  const [apiKey, setApiKey] = useState('')
  const [savedKey, setSavedKey] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCredentials()
  }, [])

  const loadCredentials = async () => {
    try {
      const creds = await settings.getCredentials()
      if (creds?.apiKey) {
        setSavedKey(creds.apiKey)
      }
    } catch (err) {
      console.error('[ConnectionTab] Failed to load credentials:', err)
    }
  }

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key')
      return
    }

    setSaving(true)
    try {
      const encrypted = await encrypt(apiKey)
      await settings.setCredentials(encrypted)
      setSavedKey(encrypted)
      setApiKey('')
      setTestResult(null)
      toast.success('API key saved successfully')
    } catch (err) {
      console.error('[ConnectionTab] Failed to save credentials:', err)
      toast.error('Failed to save API key')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    const keyToTest = apiKey.trim() || (savedKey ? await decrypt(savedKey) : '')

    if (!keyToTest) {
      toast.error('No API key to test. Enter or save a key first.')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const isDev = import.meta.env.DEV
      const base = isDev ? '/api/elvanto' : 'https://api.elvanto.com'
      const response = await fetch(`${base}/v1/people/getAll.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(keyToTest + ':')}`,
        },
        body: JSON.stringify({ page_size: 1 }),
      })

      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        const message = 'Connection successful! Elvanto API responded OK.'
        setTestResult({ success: true, message })
        toast.success(message)
      } else {
        const message = data.error?.message || `HTTP ${response.status}`
        setTestResult({ success: false, message })
        toast.error(message)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error'
      setTestResult({ success: false, message })
      toast.error(message)
    } finally {
      setTesting(false)
    }
  }

  const handleClear = async () => {
    setSavedKey(null)
    setApiKey('')
    setTestResult(null)
    toast.info('Saved API key cleared')
  }

  const hasSavedKey = Boolean(savedKey)

  return (
    <Stack gap="6">
      <Heading textStyle="md">Connection</Heading>
      <Text color="fg.muted" textStyle="sm">
        Enter your Elvanto API key to enable synchronization. The key is encrypted before storage.
      </Text>

      {!hasSavedKey && (
        <Card.Root>
          <Card.Header>
            <Card.Title>API Key</Card.Title>
            <Card.Description>Your Elvanto API key (found in Elvanto Settings → API)</Card.Description>
          </Card.Header>
          <Card.Body>
            <Stack gap="4">
              <Input
                type="password"
                placeholder="Enter Elvanto API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={saving || testing}
              />
              <Button onClick={handleSave} disabled={saving || testing || !apiKey.trim()} loading={saving}>
                Save API Key
              </Button>
            </Stack>
          </Card.Body>
        </Card.Root>
      )}

      {hasSavedKey && (
        <Card.Root>
          <Card.Header>
            <Card.Title>Saved API Key</Card.Title>
            <Card.Description>An API key is saved and encrypted in the database.</Card.Description>
          </Card.Header>
          <Card.Body>
            <Stack gap="4">
              <Alert.Root variant={testResult?.success ? 'solid' : testResult ? 'outline' : 'subtle'}>
                {testResult && (
                  <>
                    <Alert.Title>{testResult.success ? 'Test Passed' : 'Test Failed'}</Alert.Title>
                    <Alert.Description>{testResult.message}</Alert.Description>
                  </>
                )}
                {!testResult && (
                  <Text color="fg.muted" textStyle="sm">
                    API key is saved. Click "Test Connection" to verify.
                  </Text>
                )}
              </Alert.Root>
              <Stack gap="3" flexDirection="row">
                <Button variant="outline" onClick={handleTest} disabled={testing} loading={testing}>
                  Test Connection
                </Button>
                <Button variant="outline" color="red" onClick={handleClear} disabled={saving || testing}>
                  Clear Saved Key
                </Button>
              </Stack>
            </Stack>
          </Card.Body>
        </Card.Root>
      )}

      <Card.Root>
        <Card.Header>
          <Card.Title>Connection Details</Card.Title>
          <Card.Description>Elvanto API endpoint and authentication method</Card.Description>
        </Card.Header>
        <Card.Body>
          <Stack gap="2" textStyle="sm">
            <Text><strong>Base URL:</strong> https://api.elvanto.com/v1/</Text>
            <Text><strong>Auth:</strong> Basic Auth (API key as username, blank password)</Text>
            <Text><strong>Format:</strong> JSON request/response</Text>
            <Text><strong>Rate Limit:</strong> ≤2 concurrent requests, honor 429 Retry-After</Text>
          </Stack>
        </Card.Body>
      </Card.Root>
    </Stack>
  )
}
