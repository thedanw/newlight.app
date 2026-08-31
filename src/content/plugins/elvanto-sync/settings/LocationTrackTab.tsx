import { Stack } from 'styled-system/jsx'
import { Heading, Text } from '@/core/ui'
import { LocationTrackPairing } from './components/LocationTrackPairing'

/**
 * Location ↔ Track Pairing Tab — Full implementation
 */
export function LocationTrackTab() {
  return (
    <Stack gap="6">
      <Heading textStyle="md">Location ↔ Track Pairing</Heading>
      <Text color="fg.muted" textStyle="sm">
        Pair Elvanto locations to journey tracks. Each location becomes a Campus track.
      </Text>

      <LocationTrackPairing />
    </Stack>
  )
}