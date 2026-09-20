export default {
  async fetch(request: Request, env: Record<string, string | undefined>, ctx: { next?: () => Promise<Response> }): Promise<Response> {
    let response: Response
    if (typeof ctx.next === 'function') {
      response = await ctx.next()
    } else if (env.ASSETS) {
      response = await (env.ASSETS as { fetch: (req: Request) => Promise<Response> }).fetch(request)
    } else {
      response = new Response('Internal Error', { status: 500 })
    }

    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('text/html')) {
      return response
    }

    const html = await response.text()
    const config = {
      supabaseUrl: (env.VITE_SUPABASE_URL || '').trim(),
      supabaseAnonKey: (env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim(),
      supabaseJwksUrl: (env.VITE_SUPABASE_JWKS_URL || '').trim(),
    }

    const configScript =
      '<script>window.__CF_PAGES_CONFIG__=' +
      JSON.stringify(config) +
      ';</script>\n'

    const modifiedHtml = html.includes('</head>')
      ? html.replace('</head>', configScript + '</head>')
      : html

    const newHeaders = new Headers(response.headers)
    return new Response(modifiedHtml, {
      status: response.status,
      headers: newHeaders,
    })
  },
}
