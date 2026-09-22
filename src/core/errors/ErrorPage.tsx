import { useRouteError, useLocation, useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Icon, Page, Text } from '@/core/ui'
import { HStack, VStack } from 'styled-system/jsx'
import { useState, type CSSProperties } from 'react'
import { AlertTriangle, RefreshCw, ArrowLeft, Copy, Check, Bug } from 'lucide-react'
import type { Location } from 'react-router-dom'

interface TechnicalRow {
  label: string
  value: string
}

interface ErrorDisplayProps {
  error: Error | undefined
  location: Location
}

function collectTechnicalDetails(error: Error | undefined, location: Location): TechnicalRow[] {
  const prevPage = (location.state as { from?: string } | undefined)?.from
    || document.referrer
    || 'Unknown'

  const rows: TechnicalRow[] = [
    { label: 'Timestamp', value: new Date().toISOString() },
    { label: 'Current page', value: location.pathname },
    { label: 'Previous page', value: prevPage },
    { label: 'Full URL', value: window.location.href },
    { label: 'Query string', value: location.search || '(none)' },
    { label: 'Hash', value: location.hash || '(none)' },
    { label: 'Error name', value: error?.name ?? 'Unknown' },
    { label: 'Error message', value: error?.message ?? 'An unexpected error occurred.' },
    { label: 'Stack trace', value: error?.stack ?? '(none available)' },
    { label: 'User agent', value: navigator.userAgent },
    { label: 'Platform', value: navigator.platform },
    { label: 'Browser language', value: navigator.language },
    { label: 'Timezone', value: Intl.DateTimeFormat().resolvedOptions().timeZone },
    { label: 'Viewport', value: `${window.innerWidth} × ${window.innerHeight}` },
    { label: 'Screen', value: `${screen.width} × ${screen.height}` },
    { label: 'Online', value: String(navigator.onLine) },
    { label: 'Cookies enabled', value: String(navigator.cookieEnabled) },
    { label: 'Hardware concurrency', value: String(navigator.hardwareConcurrency ?? 'unknown') },
    { label: 'Device memory', value: `${(navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 'unknown'} GB` },
  ]

  return rows
}

export function ErrorDisplay({ error, location }: ErrorDisplayProps) {
  const navigate = useNavigate()
  const [showDetails, setShowDetails] = useState(false)
  const [copied, setCopied] = useState(false)

  const errorMessage = error?.message ?? 'An unexpected error occurred.'
  const technicalDetails = collectTechnicalDetails(error, location)
  const detailsText = technicalDetails
    .map((row) => `${row.label}: ${row.value}`)
    .join('\n')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(detailsText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <Page.Main>
      <Page.Header style={{ '--module-number': 0 } as CSSProperties}>
        <Page.Heading level={1} icon={AlertTriangle} title="Something went wrong" />
      </Page.Header>
      <Page.Body>
        <VStack gap="6" w="full" maxW="2xl" mx="auto">
          <Alert.Root status="error" variant="subtle" maxW="2xl">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>An error occurred</Alert.Title>
              <Alert.Description>{errorMessage}</Alert.Description>
            </Alert.Content>
          </Alert.Root>

          <Card.Root maxW="2xl" w="full">
            <Card.Body>
              <VStack gap="3" alignItems="flex-start">
                <Text fontWeight="medium">What you can try</Text>
                <VStack gap="1" alignItems="flex-start">
                  <Text>1. Reload the page to try again.</Text>
                  <Text>2. Go back to a previous page and look for the content there.</Text>
                  <Text>3. If the problem keeps happening, copy the technical details below and share them with a developer.</Text>
                </VStack>
                <HStack>
                  <Button variant="outline" onClick={() => navigate(-1)}>
                    <Icon size="sm"><ArrowLeft /></Icon>
                    Go back
                  </Button>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    <Icon size="sm"><RefreshCw /></Icon>
                    Try again
                  </Button>
                </HStack>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root variant="outline" maxW="2xl" w="full">
            <Card.Body>
              <VStack gap="3" alignItems="flex-start">
                <Button size="sm" variant="outline" onClick={() => setShowDetails((v) => !v)}>
                  {showDetails ? 'Hide' : 'Show'} technical details
                </Button>
                {showDetails && (
                  <VStack gap="2" alignItems="flex-start" w="full">
                    {technicalDetails.map((row) => (
                      <HStack key={row.label} justify="space-between" w="full" gap="4">
                        <Text fontWeight="medium" whiteSpace="nowrap">{row.label}</Text>
                        <Text fontFamily="mono" fontSize="xs" textAlign="right" flex="1">{row.value}</Text>
                      </HStack>
                    ))}
                    <HStack gap="2" pt="2">
                      <Button size="sm" variant="outline" onClick={handleCopy}>
                        <Icon size="sm">{copied ? <Check /> : <Copy />}</Icon>
                        {copied ? 'Copied' : 'Copy details'}
                      </Button>
                      <Text fontSize="xs" color="fg.muted">
                        Paste into a message to a developer for faster diagnosis. Include your browser and any steps that triggered the error.
                      </Text>
                    </HStack>
                  </VStack>
                )}
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root variant="outline" maxW="2xl" w="full">
            <Card.Body>
              <VStack gap="2" alignItems="flex-start">
                <HStack gap="2">
                  <Icon size="sm"><Bug /></Icon>
                  <Text fontWeight="medium">Reporting a bug</Text>
                </HStack>
                <Text fontSize="xs" color="fg.muted">
                  When reporting this error to a developer, please include: the steps that led to the error, the browser and device you are using, and the technical details from the section above. If the error occurred during a specific action (e.g., saving a form), describe what you were trying to do.
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>
        </VStack>
      </Page.Body>
    </Page.Main>
  )
}

export default function ErrorPage() {
  const error = useRouteError() as Error | undefined
  const location = useLocation()
  return <ErrorDisplay error={error} location={location} />
}
