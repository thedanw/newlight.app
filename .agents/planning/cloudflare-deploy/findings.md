# Findings: Cloudflare Deployment Research

## Current Project Architecture

### Frontend
- **Framework**: React 19 + Vite 7
- **Styling**: Panda CSS (Park UI components)
- **State Management**: React hooks + Context
- **Routing**: React Router DOM v7
- **PWA**: Vite PWA plugin with auto-update
- **Build Output**: Static assets in `dist/` directory

### Backend/Database
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Edge Functions**: Supabase Edge Functions (Deno runtime)
  - Email sending/unsubscribe
  - Elvanto sync worker
- **Real-time**: Supabase Realtime

### Key Integrations
- **Elvanto API**: Church management system sync
- **Email**: Custom email system with templates
- **File Storage**: Supabase Storage (brand assets bucket)

### Build Scripts
```json
{
  "dev": "node scripts/generate-theme-colors.mjs && node scripts/copy-plugins.mjs && node scripts/copy-theme.mjs && vite",
  "build": "node scripts/generate-theme-colors.mjs && node scripts/copy-plugins.mjs && node scripts/copy-theme.mjs && node scripts/lint-pages.mjs && node scripts/lint-tokens.mjs && tsc -b && vite build",
  "preview": "vite preview"
}
```

## Cloudflare Services Mapping

| Current Service | Cloudflare Alternative | Notes |
|----------------|------------------------|-------|
| Vite Dev Server | Cloudflare Pages (dev) | Pages supports Vite dev |
| Static Hosting | Cloudflare Pages | Native SPA support |
| Supabase PostgreSQL | Cloudflare D1 (SQLite) | Schema migration needed |
| Supabase Auth | Cloudflare Workers + D1 | Custom auth or use external |
| Supabase Edge Functions | Cloudflare Workers | Direct port (Deno → JS/TS) |
| Supabase Storage | Cloudflare R2 | S3-compatible API |
| Supabase Realtime | Cloudflare Workers + WebSockets | Durable Objects for WebSockets |

## Decision Gaps Identified

1. **Database Migration Strategy**: Supabase (PostgreSQL) → Cloudflare D1 (SQLite) - schema differences, data migration
2. **Authentication**: Keep Supabase Auth? Use Cloudflare Access? Custom Workers auth?
3. **Edge Functions**: Port Deno workers to Cloudflare Workers (Node.js compatible)
4. **Real-time Features**: Supabase Realtime → Cloudflare Durable Objects + WebSockets
5. **File Storage**: Supabase Storage → Cloudflare R2
6. **Environment Variables**: Managing secrets in Cloudflare (Pages + Workers)
7. **Custom Domain**: DNS configuration on Cloudflare
8. **CI/CD**: GitHub Actions → Cloudflare Pages deploy hooks
9. **PWA Service Worker**: Vite PWA plugin compatibility with Cloudflare Pages
10. **Proxy Configuration**: Vite proxy for Elvanto API → Workers proxy

## Technical Constraints

- Cloudflare D1 has 10GB database limit (per database)
- Cloudflare Workers have 10ms CPU time limit (Bundled) / 30ms (Unbound)
- Cloudflare Pages has 25MB asset size limit
- D1 uses SQLite dialect (not full PostgreSQL)
- No native connection pooling for D1 (use D1 HTTP API or Workers binding)

## Migration Complexity Assessment

| Component | Complexity | Risk |
|-----------|------------|------|
| Frontend (Pages) | Low | Low |
| Auth | N/A (stay on SB) | N/A |
| Database (D1) | N/A (stay on SB) | N/A |
| Edge Functions (Workers) | N/A (stay on SB) | N/A |
| Storage (R2) | N/A (stay on SB) | N/A |
| Realtime | N/A (stay on SB) | N/A |

## Selected Approach: Cloudflare Pages + Supabase (Hybrid)

### Scope
- **In**: Frontend hosting on Cloudflare Pages, custom domain setup, CI/CD via GitHub integration
- **Out**: Any backend migration (database, auth, functions, storage, realtime remain on Supabase)

### Updated Decision Gaps (Frontend Only)
1. **CFP Build Command**: Verify `npm run build` works in CFP build environment (Node 20+, pnpm)
2. **SPA Routing**: Configure `_redirects` or CFP SPA fallback for React Router v7
3. **PWA Service Worker**: Ensure Vite PWA plugin SW registers correctly on CFP domain
4. **Supabase CORS**: Add CFP domain (`*.pages.dev` + custom domain) to SB allowed origins
5. **Environment Variables**: Configure `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` in CFP dashboard
6. **Custom Domain DNS**: Configure CNAME to CFP, verify SSL certificate provisioning
7. **Build Output**: Confirm `dist/` directory structure works with CFP asset serving