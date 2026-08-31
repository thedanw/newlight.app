import { useRouteError, useLocation, useNavigate } from 'react-router-dom'
import { Button, Heading, Text, Card } from '@/core/ui'
import { HStack, Stack } from 'styled-system/jsx'
import { useState } from 'react'

export default function ErrorPage() {
  const error = useRouteError() as Error | undefined
  const location = useLocation()
  const navigate = useNavigate()
  const [showDetails, setShowDetails] = useState(false)

  const errorMessage = error?.message ?? 'An unexpected error occurred.'
  const errorStack = error?.stack
  const timestamp = new Date().toISOString()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100dvh', gap: 16, padding: 24 }}>
      <Heading textStyle="2xl">Something went wrong</Heading>
      <Text color="fg.muted">
        {errorMessage}
      </Text>

      <Card.Root maxW="md" w="full">
        <Card.Body gap="3">
          <Text fontWeight="medium">What you can try</Text>
          <Stack gap="2">
            <Text>1. Reload the page to try again.</Text>
            <Text>2. Go back to a dashboard page and look for the content there.</Text>
            <Text>3. If the problem keeps happening, share these details with an admin:</Text>
          </Stack>
          <Button size="sm" variant="outline" onClick={() => setShowDetails((v) => !v)}>
            {showDetails ? 'Hide' : 'Show'} technical details
          </Button>
          {showDetails && (
            <Card.Root variant="outline">
              <Card.Body>
                <Text fontFamily="mono" fontSize="xs" whiteSpace="pre-wrap" overflow="auto" maxH="64">
                  {`Path: ${location.pathname}\nTime: ${timestamp}\nError: ${errorMessage}\n${errorStack ?? ''}`}
                </Text>
              </Card.Body>
            </Card.Root>
          )}
        </Card.Body>
      </Card.Root>

      <HStack gap="2">
        <Button onClick={() => window.location.reload()}>Reload page</Button>
        <Button variant="outline" onClick={() => navigate('/people')}>Go to People</Button>
      </HStack>
    </div>
  )
}
