/**
 * Elvanto Sync Edge Function — Main entry point for Supabase Edge Function
 * Orchestrates entity syncs in FK-safe order, logs history, handles dead letters
 * 
 * Deploy: supabase functions deploy elvanto-sync-worker --project-ref <ref>
 * Trigger: pg_cron or manual POST
 */ import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// ============================================
// Configuration
// ============================================
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
// ELVANTO_API_KEY is now read from database (elvanto_settings table)
// const ELVANTO_API_KEY = Deno.env.get('ELVANTO_API_KEY') || '';
const ENCRYPTED_SETTINGS_ID = '00000000-0000-0000-0000-000000000001';
  'people_categories',
  'custom_fields',
  'families',
  'people',
  'groups',
  'financial_categories',
  'service_types',
  'locations',
  'services',
  'songs',
  'calendars',
  'calendar_events',
  'people_flows',
  'batches',
  'transactions'
];
// ============================================
// Supabase Client (Service Role)
// ============================================
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false
  }
});
// ============================================
// Helper Functions
// ============================================
async function logSyncStart(entity, trigger) {
  const { data, error } = await supabase.from('elvanto_sync_history').insert({
    entity,
    trigger,
    started_at: new Date().toISOString(),
    status: 'running',
    items_processed: 0,
    items_failed: 0,
    triggered_by_user: null
  }).select('id').single();
  if (error) {
    console.error(`[SyncLog] Failed to log start for ${entity}:`, error);
    return '';
  }
  return data.id;
}
async function logSyncComplete(historyId, entity, result) {
  const status = result.success ? result.itemsFailed > 0 ? 'partial' : 'completed' : 'failed';
  const errorSummary = result.errors.length > 0 ? result.errors.slice(0, 5).join('; ') : null;
  const { error } = await supabase.from('elvanto_sync_history').update({
    completed_at: new Date().toISOString(),
    status,
    items_processed: result.itemsProcessed,
    items_failed: result.itemsFailed,
    error_summary: errorSummary
  }).eq('id', historyId);
  if (error) {
    console.error(`[SyncLog] Failed to log completion for ${entity}:`, error);
  }
}
async function addToDeadLetter(entity, payload, error) {
  const { error: insertError } = await supabase.from('elvanto_sync_dead_letter').insert({
    entity,
    payload,
    error,
    attempt_count: 1,
    last_attempt_at: new Date().toISOString()
  });
  if (insertError) {
    console.error(`[DeadLetter] Failed to add dead letter for ${entity}:`, insertError);
  }
}
// ============================================
// Encrypted API Key (AES-GCM)
// ============================================
const ENCRYPTION_ALGORITHM = 'AES-GCM';
const ENCRYPTION_IV_LENGTH = 12 // 96 bits for GCM
;
const ENCRYPTED_SETTINGS_ID = '00000000-0000-0000-0000-000000000001';
/**
 * Get the MASTER encryption key from environment variable.
 * This key is used to decrypt the per-API-key encryption key stored in the database.
 */ async function getMasterEncryptionKey() {
  // 1. Get master key from environment variable
  const envKey = Deno.env.get('ELVANTO_ENCRYPTION_KEY');
  if (envKey) {
    const keyData = hexToArrayBuffer(envKey) ?? base64ToArrayBuffer(envKey);
    return crypto.subtle.importKey('raw', keyData, {
      name: ENCRYPTION_ALGORITHM
    }, false, ['decrypt']);
  }
  
  // 2. DEVELOPMENT ONLY - derive from a fixed string (NOT SECURE)
  const devKey = 'dev-key-elvanto-sync-plugin-change-in-production';
  const keyData = new TextEncoder().encode(devKey.padEnd(32, '0').slice(0, 32));
  return crypto.subtle.importKey('raw', keyData, {
    name: ENCRYPTION_ALGORITHM
  }, false, ['decrypt']);
}
/**
 * Decode a hex-encoded string to an ArrayBuffer, or null if not valid hex.
 */ function hexToArrayBuffer(hex) {
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2 !== 0) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for(let i = 0; i < bytes.length; i++){
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes.buffer;
}
/**
 * Decrypt the Elvanto API key using the per-API-key encryption key.
 * Expects base64(iv(12 bytes) + aes-gcm-ciphertext-with-auth-tag).
 * @param ciphertextB64 - The encrypted API key
 * @param encryptionKeyB64 - The per-API-key encryption key (base64-encoded raw key)
 */ async function decryptApiKey(ciphertextB64, encryptionKeyB64) {
  try {
    const keyData = base64ToArrayBuffer(encryptionKeyB64);
    const key = await crypto.subtle.importKey('raw', keyData, {
      name: ENCRYPTION_ALGORITHM
    }, false, ['decrypt']);
    
    const combined = base64ToArrayBuffer(ciphertextB64);
    if (combined.byteLength < ENCRYPTION_IV_LENGTH) {
      console.warn('[Sync] Invalid encrypted API key: too short');
      return null;
    }
    const iv = combined.slice(0, ENCRYPTION_IV_LENGTH);
    const ciphertext = combined.slice(ENCRYPTION_IV_LENGTH);
    const decrypted = await crypto.subtle.decrypt({
      name: ENCRYPTION_ALGORITHM,
      iv
    }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.warn('[Sync] Failed to decrypt Elvanto API key:', err);
    return null;
  }
}
/**
 * Convert base64 string to ArrayBuffer
 */ function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for(let i = 0; i < binary.length; i++){
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Decrypt the encryption key stored in elvanto_settings.encryption_key_encrypted.
 * Expects base64(iv(12 bytes) + aes-gcm-ciphertext-with-auth-tag).
 * Uses the MASTER encryption key from environment variable.
 */
async function decryptEncryptionKey(ciphertextB64) {
  try {
    const key = await getMasterEncryptionKey();
    const combined = base64ToArrayBuffer(ciphertextB64);
    if (combined.byteLength < ENCRYPTION_IV_LENGTH) {
      console.warn('[Sync] Invalid encrypted encryption key: too short');
      return null;
    }
    const iv = combined.slice(0, ENCRYPTION_IV_LENGTH);
    const ciphertext = combined.slice(ENCRYPTION_IV_LENGTH);
    const decrypted = await crypto.subtle.decrypt({
      name: ENCRYPTION_ALGORITHM,
      iv
    }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.warn('[Sync] Failed to decrypt encryption key:', err);
    return null;
  }
}

/**
 * Decrypt the Elvanto API key using a provided encryption key (base64-encoded raw key).
 * Expects base64(iv(12 bytes) + aes-gcm-ciphertext-with-auth-tag).
 */
async function decryptApiKeyWithKey(ciphertextB64, encryptionKeyB64) {
  try {
    const keyData = base64ToArrayBuffer(encryptionKeyB64);
    const key = await crypto.subtle.importKey('raw', keyData, {
      name: ENCRYPTION_ALGORITHM
    }, false, ['decrypt']);
    
    const combined = base64ToArrayBuffer(ciphertextB64);
    if (combined.byteLength < ENCRYPTION_IV_LENGTH) {
      console.warn('[Sync] Invalid encrypted API key: too short');
      return null;
    }
    const iv = combined.slice(0, ENCRYPTION_IV_LENGTH);
    const ciphertext = combined.slice(ENCRYPTION_IV_LENGTH);
    const decrypted = await crypto.subtle.decrypt({
      name: ENCRYPTION_ALGORITHM,
      iv
    }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.warn('[Sync] Failed to decrypt Elvanto API key with key:', err);
    return null;
  }
}

async function getCredentials() {
  lastCredentialError = null;
  // 1. Prefer the encrypted key stored in elvanto_settings (singleton row)
  try {
    const { data, error } = await supabase.from('elvanto_settings').select('api_key_encrypted, encryption_key_encrypted').eq('id', ENCRYPTED_SETTINGS_ID).maybeSingle();
    if (error) {
      lastCredentialError = `settings query error: ${error.message}`;
      console.warn('[Sync] Failed to read encrypted Elvanto API key:', error);
    } else if (!data?.api_key_encrypted || !data?.encryption_key_encrypted) {
      lastCredentialError = 'settings row not found or missing encryption key';
      console.warn('[Sync] elvanto_settings row not found or missing encryption key for singleton id');
    } else {
      // Decrypt the encryption key first
      const encryptionKey = await decryptEncryptionKey(data.encryption_key_encrypted);
      if (!encryptionKey) {
        lastCredentialError = 'decrypt encryption key failed';
        console.warn('[Sync] Failed to decrypt encryption key');
      } else {
        // Use the encryption key to decrypt the API key
        const apiKey = await decryptApiKey(data.api_key_encrypted, encryptionKey);
        if (apiKey) {
          return {
            apiKey
          };
        }
        lastCredentialError = 'decrypt API key failed (see decryptApiKey warning)';
      }
    }
  } catch (err) {
    lastCredentialError = `settings read threw: ${err instanceof Error ? err.message : String(err)}`;
    console.warn('[Sync] Failed to read encrypted Elvanto API key:', err);
  }
  // 2. Fall back to the legacy ELVANTO_API_KEY env var
  if (ELVANTO_API_KEY) {
    return {
      apiKey: ELVANTO_API_KEY
    };
  }
  console.error('[Sync] Could not obtain Elvanto API key (encrypted settings or ELVANTO_API_KEY env)');
  return null;
}
// Dynamic imports for each entity sync
const entitySyncs = {
  people: async (supabase, apiKey, options)=>{
    const { syncPeople } = await import('./people-sync.ts');
    return syncPeople(supabase, apiKey, options);
  },
  households: async (supabase, apiKey, options)=>{
    const { syncHouseholds } = await import('./household-sync.ts');
    return syncHouseholds(supabase, apiKey, options);
  },
  journey: async (supabase, apiKey, options)=>{
    const { syncJourney } = await import('./journey-sync.ts');
    return syncJourney(supabase, apiKey, options);
  },
  // Placeholder for other entities (mirror tables - read only for MVP)
  people_categories: async ()=>({
      success: true,
      itemsProcessed: 0,
      itemsFailed: 0,
      errors: [],
      lastDateModified: null
    }),
  custom_fields: async ()=>({
      success: true,
      itemsProcessed: 0,
      itemsFailed: 0,
      errors: [],
      lastDateModified: null
    }),
  families: async ()=>({
      success: true,
      itemsProcessed: 0,
      itemsFailed: 0,
      errors: [],
      lastDateModified: null
    }),
  groups: async ()=>({
      success: true,
      itemsProcessed: 0,
      itemsFailed: 0,
      errors: [],
      lastDateModified: null
    }),
  financial_categories: async ()=>({
      success: true,
      itemsProcessed: 0,
      itemsFailed: 0,
      errors: [],
      lastDateModified: null
    }),
  service_types: async ()=>({
      success: true,
      itemsProcessed: 0,
      itemsFailed: 0,
      errors: [],
      lastDateModified: null
    }),
  locations: async ()=>({
      success: true,
      itemsProcessed: 0,
      itemsFailed: 0,
      errors: [],
      lastDateModified: null
    }),
  services: async ()=>({
      success: true,
      itemsProcessed: 0,
      itemsFailed: 0,
      errors: [],
      lastDateModified: null
    }),
  songs: async ()=>({
      success: true,
      itemsProcessed: 0,
      itemsFailed: 0,
      errors: [],
      lastDateModified: null
    }),
  calendars: async ()=>({
      success: true,
      itemsProcessed: 0,
      itemsFailed: 0,
      errors: [],
      lastDateModified: null
    }),
  calendar_events: async ()=>({
      success: true,
      itemsProcessed: 0,
      itemsFailed: 0,
      errors: [],
      lastDateModified: null
    }),
  people_flows: async ()=>({
      success: true,
      itemsProcessed: 0,
      itemsFailed: 0,
      errors: [],
      lastDateModified: null
    }),
  batches: async ()=>({
      success: true,
      itemsProcessed: 0,
      itemsFailed: 0,
      errors: [],
      lastDateModified: null
    }),
  transactions: async ()=>({
      success: true,
      itemsProcessed: 0,
      itemsFailed: 0,
      errors: [],
      lastDateModified: null
    })
};
// ============================================
// Main Sync Orchestrator
// ============================================
async function runSync(request) {
  const startedAt = new Date().toISOString();
  const credentials = await getCredentials();
  if (!credentials) {
    return {
      success: false,
      trigger: request.trigger,
      startedAt,
      completedAt: new Date().toISOString(),
      entities: {},
      totalProcessed: 0,
      totalFailed: 0,
      errors: [
        `Could not obtain Elvanto API key${lastCredentialError ? ` (${lastCredentialError})` : ''}`
      ]
    };
  }
  const apiKey = credentials.apiKey;
  const entitiesToSync = request.entity ? [
    request.entity
  ] : SYNC_ORDER;
  const response = {
    success: true,
    trigger: request.trigger,
    startedAt,
    completedAt: '',
    entities: {},
    totalProcessed: 0,
    totalFailed: 0,
    errors: []
  };
  console.log(`[Sync] Starting ${request.trigger} sync for entities: ${entitiesToSync.join(', ')}`);
  for (const entity of entitiesToSync){
    const entityStartTime = Date.now();
    const historyId = await logSyncStart(entity, request.trigger);
    try {
      const syncFn = entitySyncs[entity];
      if (!syncFn) {
        console.warn(`[Sync] No sync function for entity: ${entity}`);
        response.entities[entity] = {
          entity,
          success: true,
          itemsProcessed: 0,
          itemsFailed: 0,
          durationMs: Date.now() - entityStartTime,
          errors: [
            `No sync function implemented for ${entity}`
          ]
        };
        continue;
      }
      console.log(`[Sync] Syncing ${entity}...`);
      const result = await syncFn(supabase, apiKey, {
        fullScan: request.fullScan
      });
      const durationMs = Date.now() - entityStartTime;
      response.entities[entity] = {
        entity,
        success: result.success,
        itemsProcessed: result.itemsProcessed,
        itemsFailed: result.itemsFailed,
        durationMs,
        errors: result.errors
      };
      response.totalProcessed += result.itemsProcessed;
      response.totalFailed += result.itemsFailed;
      response.errors.push(...result.errors.map((e)=>`${entity}: ${e}`));
      // Log completion
      if (historyId) {
        await logSyncComplete(historyId, entity, result);
      }
      // Add failed items to dead letter queue
      for (const error of result.errors){
        await addToDeadLetter(entity, {
          error
        }, error);
      }
      console.log(`[Sync] ${entity}: ${result.itemsProcessed} processed, ${result.itemsFailed} failed (${durationMs}ms)`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[Sync] Fatal error syncing ${entity}:`, err);
      response.entities[entity] = {
        entity,
        success: false,
        itemsProcessed: 0,
        itemsFailed: 0,
        durationMs: Date.now() - entityStartTime,
        errors: [
          errorMsg
        ]
      };
      response.totalFailed++;
      response.errors.push(`${entity}: ${errorMsg}`);
      if (historyId) {
        await logSyncComplete(historyId, entity, {
          success: false,
          itemsProcessed: 0,
          itemsFailed: 0,
          errors: [
            errorMsg
          ]
        });
      }
    }
  }
  response.completedAt = new Date().toISOString();
  response.success = response.totalFailed === 0;
  console.log(`[Sync] Completed: ${response.totalProcessed} processed, ${response.totalFailed} failed`);
  return response;
}
// ============================================
// HTTP Handler
// ============================================
serve(async (req)=>{
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
  // Auth gate: require service_role key or valid user JWT
  const authHeader = req.headers.get('authorization') || ''
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : ''
  let role = 'anon'
  if (authHeader.startsWith('Basic')) {
    role = 'service_role'
  } else if (jwt) {
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt)
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    role = user.role || 'anon'
  }
  // Deny anon access; only service_role or authenticated users allowed
  if (role === 'anon') {
    return new Response(JSON.stringify({ error: 'Unauthorized - service role or authenticated user required' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
  try {
    const body = await req.json();
    // Handle test connection action
    if (body.action === 'test_connection' && body.api_key) {
      try {
        // Use people/getAll.json with page_size: 1 to test connection
        // This is a lightweight call that verifies the API key works
        const response = await fetch('https://api.elvanto.com/v1/people/getAll.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${btoa(body.api_key + ':')}`
          },
          body: JSON.stringify({
            page_size: 1
          })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'ok') {
            return new Response(JSON.stringify({
              success: true,
              message: 'Connection successful! Elvanto API responded OK.'
            }), {
              status: 200,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            });
          } else {
            return new Response(JSON.stringify({
              success: false,
              error: data.error?.message || 'API returned error status'
            }), {
              status: 200,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            });
          }
        } else if (response.status === 401) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Invalid API key (401 Unauthorized)'
          }), {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        } else {
          return new Response(JSON.stringify({
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`
          }), {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
      } catch (err) {
        return new Response(JSON.stringify({
          success: false,
          error: err instanceof Error ? err.message : 'Network error'
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }
    // Handle list locations action (server-side proxy — Elvanto has no CORS)
    if (body.action === 'list_locations' && body.api_key) {
      try {
        const response = await fetch('https://api.elvanto.com/v1/calendar/getAll.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${btoa(body.api_key + ':')}`
          },
          body: JSON.stringify({
            page_size: 1000
          })
        });
        const data = await response.json().catch(()=>({}));
        if (response.ok && data.status === 'ok') {
          const raw = data.calendars;
          const calendars = Array.isArray(raw) ? raw : Array.isArray(raw?.calendar) ? raw.calendar : [];
          const locations = calendars.map((calendar)=>({
              id: calendar.id,
              name: calendar.name
            }));
          return new Response(JSON.stringify({
            success: true,
            locations
          }), {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
        return new Response(JSON.stringify({
          success: false,
          error: data.error?.message || `HTTP ${response.status}`
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({
          success: false,
          error: err instanceof Error ? err.message : 'Network error'
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }
    // Validate trigger
    if (![
      'cron',
      'manual',
      'webhook'
    ].includes(body.trigger)) {
      return new Response(JSON.stringify({
        error: 'Invalid trigger'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const result = await runSync(body);
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 207,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error('[EdgeFunction] Fatal error:', err);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : String(err)
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
console.log('[Elvanto Sync Worker] Edge Function started');
