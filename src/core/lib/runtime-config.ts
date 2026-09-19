/**
 * Runtime configuration reader.
 *
 * Reads Supabase configuration from `window.__CF_PAGES_CONFIG__` (injected by
 * the Cloudflare Pages _middleware.ts at request time) when available, falling
 * back to Vite build-time env vars (import.meta.env.VITE_*) for local dev.
 *
 * All values are trimmed to handle whitespace/newline issues that can occur
 * when copying secrets from dashboards.
 */

export interface RuntimeConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  supabaseJwksUrl?: string
}

declare global {
  interface Window {
    __CF_PAGES_CONFIG__?: {
      supabaseUrl?: string
      supabaseAnonKey?: string
      supabaseJwksUrl?: string
    }
  }
}

function readEnv(name: string, runtimeKey?: string): string {
  if (typeof window !== 'undefined' && window.__CF_PAGES_CONFIG__) {
    const runtimeValue = runtimeKey
      ? window.__CF_PAGES_CONFIG__[runtimeKey as keyof typeof window.__CF_PAGES_CONFIG__]
      : undefined
    if (runtimeValue) return (runtimeValue as string).trim()
  }
  const buildValue = import.meta.env[name]
  return buildValue ? String(buildValue).trim() : ''
}

export function getRuntimeConfig(): RuntimeConfig {
  return {
    supabaseUrl: readEnv('VITE_SUPABASE_URL', 'supabaseUrl'),
    supabaseAnonKey:
      readEnv('VITE_SUPABASE_ANON_KEY', 'supabaseAnonKey') ||
      readEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'supabaseAnonKey'),
    supabaseJwksUrl: readEnv('VITE_SUPABASE_JWKS_URL', 'supabaseJwksUrl') || undefined,
  }
}

export const runtimeConfig = getRuntimeConfig()

export function getSupabaseUrl(): string {
  return runtimeConfig.supabaseUrl
}

export function getSupabaseAnonKey(): string {
  return runtimeConfig.supabaseAnonKey
}

export function getSupabaseJwksUrl(): string | undefined {
  return runtimeConfig.supabaseJwksUrl
}
