/**
 * Pages Function middleware — injects runtime environment variables into the
 * HTML response so the client-side Vite SPA can read them at request time.
 *
 * Why this is needed: Vite inlines import.meta.env.VITE_* at BUILD time.
 * On Cloudflare Pages, plain Environment Variables (set in the project
 * dashboard) are available during the build, but Secrets are NOT guaranteed
 * to be available during the build step — they are only available at RUNTIME
 * in Workers/Functions via the env parameter.
 *
 * This middleware reads the env vars at runtime (where Secrets ARE available)
 * and injects them as window.__CF_PAGES_CONFIG__ before the app's JS loads.
 */

interface CfPagesConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  supabaseJwksUrl: string
}

interface MiddlewareContext {
  env: Record<string, string | undefined>
  next: () => Promise<Response>
  request: Request
}

const INJECT_MARKER = '</head>'

export const onRequest = async (ctx: MiddlewareContext): Promise<Response> => {
  const response = await ctx.next()

  const contentType = response.headers.get('content-type')
  if (!contentType?.includes('text/html')) {
    return response
  }

  const html = await response.text()

  const config: CfPagesConfig = {
    supabaseUrl: (ctx.env.VITE_SUPABASE_URL || '').trim(),
    supabaseAnonKey: (
      ctx.env.VITE_SUPABASE_ANON_KEY || ctx.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
    ).trim(),
    supabaseJwksUrl: (ctx.env.VITE_SUPABASE_JWKS_URL || '').trim(),
  }

  const configScript =
    '<script>window.__CF_PAGES_CONFIG__=' +
    JSON.stringify(config) +
    ';</script>\n'

  const modifiedHtml = html.includes(INJECT_MARKER)
    ? html.replace(INJECT_MARKER, configScript + INJECT_MARKER)
    : html

  return new Response(modifiedHtml, {
    status: response.status,
    headers: response.headers,
  })
}