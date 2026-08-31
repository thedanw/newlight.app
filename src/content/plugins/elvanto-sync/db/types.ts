import type { Json } from '@/core/lib/database.types'

/**
 * TypeScript types for Elvanto Sync plugin database tables
 * Generated from migration files
 */

// ============================================
// elvanto_settings
// ============================================

export interface ElvantoSettingsRow {
  id: string
  api_key_encrypted: string
  oauth_tokens_encrypted: string | null
  environment: string
  updated_at: string
  updated_by: string | null
}

export interface ElvantoSettingsInsert {
  id?: string
  api_key_encrypted: string
  oauth_tokens_encrypted?: string | null
  environment?: string
  updated_at?: string
  updated_by?: string | null
}

export interface ElvantoSettingsUpdate {
  id?: string
  api_key_encrypted?: string
  oauth_tokens_encrypted?: string | null
  environment?: string
  updated_at?: string
  updated_by?: string | null
}

// ============================================
// elvanto_sync_config
// ============================================

export interface ElvantoSyncConfigRow {
  id: string
  key: string
  value: Json
  environment: string
  updated_at: string
  updated_by: string | null
}

export interface ElvantoSyncConfigInsert {
  id?: string
  key: string
  value: Json
  environment?: string
  updated_at?: string
  updated_by?: string | null
}

export interface ElvantoSyncConfigUpdate {
  id?: string
  key?: string
  value?: Json
  environment?: string
  updated_at?: string
  updated_by?: string | null
}

// Known config keys
export type SyncConfigKey =
  | 'field_mappings'
  | 'location_track_pairings'
  | 'cron_expression'
  | 'sync_direction'
  | `watermark_${string}`

export interface FieldMappingRule {
  appField: string
  elvantoField: string
  direction: 'pull' | 'push' | 'both'
  condition?: ConditionGroup
  transform?: string
  priority: number
}

export type ConditionGroup =
  | { type: 'field_equals'; field: string; value: string | number | boolean }
  | { type: 'field_in'; field: string; values: (string | number)[] }
  | { type: 'field_not_equals'; field: string; value: string | number | boolean }
  | { type: 'field_exists'; field: string }
  | { type: 'and'; conditions: ConditionGroup[] }
  | { type: 'or'; conditions: ConditionGroup[] }

export interface LocationTrackPairing {
  elvanto_location_id: string
  elvanto_location_name: string
  journey_track_id: string
  journey_track_name: string
  follow_elvanto: boolean
}

// ============================================
// elvanto_sync_history
// ============================================

export interface ElvantoSyncHistoryRow {
  id: string
  entity: string
  trigger: 'cron' | 'manual' | 'webhook'
  started_at: string
  completed_at: string | null
  status: 'running' | 'completed' | 'partial' | 'failed'
  items_processed: number
  items_failed: number
  error_summary: string | null
  triggered_by_user: string | null
}

export interface ElvantoSyncHistoryInsert {
  id?: string
  entity: string
  trigger: 'cron' | 'manual' | 'webhook'
  started_at?: string
  completed_at?: string | null
  status?: 'running' | 'completed' | 'partial' | 'failed'
  items_processed?: number
  items_failed?: number
  error_summary?: string | null
  triggered_by_user?: string | null
}

export interface ElvantoSyncHistoryUpdate {
  id?: string
  entity?: string
  trigger?: 'cron' | 'manual' | 'webhook'
  started_at?: string
  completed_at?: string | null
  status?: 'running' | 'completed' | 'partial' | 'failed'
  items_processed?: number
  items_failed?: number
  error_summary?: string | null
  triggered_by_user?: string | null
}

// ============================================
// elvanto_sync_dead_letter
// ============================================

export interface ElvantoSyncDeadLetterRow {
  id: string
  entity: string
  payload: Json
  error: string
  attempt_count: number
  last_attempt_at: string
  created_at: string
  resolved_at: string | null
  resolved_by: string | null
}

export interface ElvantoSyncDeadLetterInsert {
  id?: string
  entity: string
  payload: Json
  error: string
  attempt_count?: number
  last_attempt_at?: string
  created_at?: string
  resolved_at?: string | null
  resolved_by?: string | null
}

export interface ElvantoSyncDeadLetterUpdate {
  id?: string
  entity?: string
  payload?: Json
  error?: string
  attempt_count?: number
  last_attempt_at?: string
  created_at?: string
  resolved_at?: string | null
  resolved_by?: string | null
}
