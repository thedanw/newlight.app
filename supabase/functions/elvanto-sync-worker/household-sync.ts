/**
 * Household/Family Sync Logic
 * Derives households from family_id changes in people
 */

export async function syncHouseholds(
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
    // Load people with family_ids
    const { data: people, error } = await supabase
      .from('people')
      .select('id, family_id, household_id, firstname, lastname')
      .not('family_id', 'is', null)

    if (error) throw error

    // Group by family_id
    const familyMap = new Map<string, any[]>()
    for (const person of people || []) {
      const fid = String(person.family_id)
      if (!familyMap.has(fid)) familyMap.set(fid, [])
      familyMap.get(fid)!.push(person)
    }

    // Create/update households
    for (const [familyId, members] of familyMap) {
      try {
        const primaryContact = members[0]
        const name = `${primaryContact?.lastname || 'Unknown'} Family`

        const { error: householdError } = await supabase
          .from('households')
          .upsert({
            elvanto_family_id: familyId,
            name,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'elvanto_family_id' })

        if (householdError) {
          result.errors.push(`Household ${familyId}: ${householdError.message}`)
          result.itemsFailed++
        } else {
          result.itemsProcessed++
        }
      } catch (err) {
        result.errors.push(`Household ${familyId}: ${err instanceof Error ? err.message : String(err)}`)
        result.itemsFailed++
      }
    }

    if (options.onProgress) {
      options.onProgress(result.itemsProcessed, familyMap.size)
    }
  } catch (err) {
    result.errors.push(`Sync failed: ${err instanceof Error ? err.message : String(err)}`)
    result.success = false
    console.error('[HouseholdSync] Fatal error:', err)
  }

  return result
}
