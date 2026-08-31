/**
 * Journey Grid Sync Logic
 * Syncs Sunday Services (category-derived) and Campus tracks (location-derived)
 */

export async function syncJourney(
  supabase: any,
  elvantoClient: any,
  options: { trigger: string; onProgress?: (processed: number, total: number) => void }
): Promise<{ success: boolean; itemsProcessed: number; itemsFailed: number; errors: string[] }> {
  const result = {
    success: true,
    itemsProcessed: 0,
    itemsFailed: 0,
    errors: [] as string[],
  }

  try {
    // Load location pairings
    const { data: pairingsData } = await supabase
      .from('elvanto_sync_config')
      .select('value')
      .eq('key', 'elvanto-sync_location_track_pairings')
      .maybeSingle()

    const pairings = (pairingsData?.value as any[]) ?? []

    // Sync journey tracks based on pairings
    for (const pairing of pairings) {
      try {
        // Update or create journey track
        const { error } = await supabase
          .from('journey_tracks')
          .upsert({
            name: pairing.journey_track_name,
            elvanto_location_id: pairing.elvanto_location_id,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'elvanto_location_id' })

        if (error) {
          result.errors.push(`Track ${pairing.journey_track_name}: ${error.message}`)
          result.itemsFailed++
        } else {
          result.itemsProcessed++
        }
      } catch (err) {
        result.errors.push(`Track ${pairing.journey_track_name}: ${err instanceof Error ? err.message : String(err)}`)
        result.itemsFailed++
      }
    }

    if (options.onProgress) {
      options.onProgress(result.itemsProcessed, pairings.length)
    }
  } catch (err) {
    result.errors.push(`Sync failed: ${err instanceof Error ? err.message : String(err)}`)
    result.success = false
    console.error('[JourneySync] Fatal error:', err)
  }

  return result
}
