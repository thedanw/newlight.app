export default {
  async fetch(request: Request, env: Record<string, string | undefined>, ctx: { next: () => Promise<Response> }): Promise<Response> {
    const response = await ctx.next()

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

    return new Response(modifiedHtml, {
      status: response.status,
      headers: response.headers,
    })
  },
}
