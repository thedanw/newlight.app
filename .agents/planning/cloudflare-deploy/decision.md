# Decision: Cloudflare Pages Deployment (Frontend Only)

## Aliases
CF = Cloudflare
CFP = Cloudflare Pages
SB = Supabase

## What & Why
Deploy React frontend to Cloudflare Pages for free unlimited bandwidth and custom domain. Keep all backend services (Auth, PostgreSQL, Edge Functions, Storage, Realtime) on Supabase.

## Who
Solo developer / small church team deploying first production instance.

## Constraints
- Zero hosting cost (free tier only)
- Custom domain required eventually
- Must preserve all existing backend functionality
- No database migration (keep PostgreSQL on Supabase)
- No auth migration (keep Supabase Auth)
- No realtime migration (keep Supabase Realtime)

## Non-Goals
- Migrate database to Cloudflare D1
- Migrate auth to Cloudflare Workers
- Migrate edge functions to Cloudflare Workers
- Migrate storage to Cloudflare R2
- Migrate realtime to Durable Objects

## Assumptions
- Current build output (`dist/`) works as static SPA on CFP
- Environment variables can be configured in CFP dashboard
- Supabase CORS allows CFP domain
- Vite PWA service worker compatible with CFP headers
- GitHub repo connects to CFP for auto-deploy

## Decision Log: decision → Rationale
1 Deploy frontend only to CFP → Zero cost, unlimited bandwidth, custom domain, minimal migration risk
2 Keep all backend on SB → Avoid PostgreSQL→SQLite migration, preserve Auth/Realtime/Functions/Storage
3 Use GitHub integration for CI/CD → Auto-deploy on push, preview deployments for PRs
4 Configure SB env vars in CFP dashboard → Secure secrets management, no code changes

## Decision Gap Log
1 CFP build command compatibility → Verify `npm run build` works in CFP environment
2 SPA routing fallback → Configure `_redirects` or CFP SPA fallback for React Router
3 PWA service worker scope → Ensure SW registers correctly on CFP domain
4 Supabase CORS → Add CFP domain to SB allowed origins
5 Custom domain DNS → Configure CNAME to CFP, verify SSL