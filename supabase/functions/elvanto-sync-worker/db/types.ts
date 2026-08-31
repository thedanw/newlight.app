/**
 * Local type definitions for Edge Function
 * (avoids importing from app source tree)
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface FieldMappingRule {
  appField: string
  elvantoField: string
  direction: 'pull' | 'push' | 'both'
  condition?: any
  transform?: string
  priority: number
}

export interface LocationTrackPairing {
  elvanto_location_id: string
  elvanto_location_name: string
  journey_track_id: string
  journey_track_name: string
  follow_elvanto: boolean
}
