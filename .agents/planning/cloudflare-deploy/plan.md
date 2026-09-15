# Plan: Cloudflare Pages Deployment (Frontend Only)

**Goal:** Deploy the New Light Church CRM frontend to Cloudflare Pages with custom domain, keeping all backend services on Supabase
**Approach:** Hybrid deployment - Cloudflare Pages hosts the React SPA build output, Supabase continues to provide PostgreSQL database, Auth, Edge Functions, Storage, and Realtime. GitHub integration enables auto-deploy on push.
**Branch:** `feature/cloudflare-pages-deploy` (from `main`)

## Scope
- In: CFP project setup, build configuration, SPA routing, PWA compatibility, environment variables, custom domain, CI/CD
- Out: Backend migration (database, auth, functions, storage, realtime remain on Supabase)

## Action Items

### Batch 1: Cloudflare Pages Project Setup
## Batch 1 Start: Sync
- [x] Mark completed tasks in `plan.md` (update checkboxes/status)
- [x] Read `findings.md` for key discoveries
## Batch 1 Context
- Goal: Deploy frontend to Cloudflare Pages with Supabase backend
- This Batch: Create CFP project, configure build, add env vars
- Prev: (first batch)
- Key: findings.md#selected-approach
- [ ] Task 1.1: Create Cloudflare Pages project connected to GitHub repo
- [ ] Task 1.2: Configure build command: `pnpm run build`
- [ ] Task 1.3: Configure build output directory: `dist`
- [ ] Task 1.4: Set Node.js version to 20+ in CFP settings
- [ ] Task 1.5: Add environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- [ ] **Commit:** `chore: configure cloudflare pages project`

### Batch 2: SPA Routing & Build Fixes
## Batch 2 Start: Sync
- [ ] Mark completed tasks in `plan.md` (update checkboxes/status)
- [ ] Read `findings.md` for key discoveries
## Batch 2 Context
- Goal: Deploy frontend to Cloudflare Pages with Supabase backend
- This Batch: Add SPA fallback, verify build works on CFP
- Prev: Batch 1 complete — CFP project created, build configured, env vars set
- Key: findings.md#spa-routing
- [ ] Task 2.1: Create `public/_redirects` with SPA fallback rule (`/* /index.html 200`)
- [ ] Task 2.2: Test build locally with `pnpm run build && pnpm run preview`
- [ ] Task 2.3: Verify React Router v7 works with hash/history mode on CFP
- [ ] Task 2.4: Check asset paths work with CFP subdirectory deployment (if applicable)
- [ ] **Commit:** `feat: add spa routing support for cloudflare pages`

### Batch 3: PWA & Service Worker Verification
## Batch 3 Start: Sync
- [ ] Mark completed tasks in `plan.md` (update checkboxes/status)
- [ ] Read `findings.md` for key discoveries
## Batch 3 Context
- Goal: Deploy frontend to Cloudflare Pages with Supabase backend
- This Batch: Verify PWA works on CFP (SW, manifest, offline)
- Prev: Batch 2 complete — SPA routing works, build verified
- Key: findings.md#pwa-service-worker
- [ ] Task 3.1: Build and verify service worker generates correctly in `dist/sw.js`
- [ ] Task 3.2: Check `manifest.json` served with correct MIME type
- [ ] Task 3.3: Test PWA installability on CFP preview deployment
- [ ] Task 3.4: Verify offline caching works for static assets
- [ ] **Commit:** `test: verify pwa functionality on cloudflare pages`

### Batch 4: Supabase CORS & Integration
## Batch 4 Start: Sync
- [ ] Mark completed tasks in `plan.md` (update checkboxes/status)
- [ ] Read `findings.md` for key discoveries
## Batch 4 Context
- Goal: Deploy frontend to Cloudflare Pages with Supabase backend
- This Batch: Configure Supabase CORS for CFP domain, test auth/API
- Prev: Batch 3 complete — PWA verified on CFP preview
- Key: findings.md#supabase-cors
- [ ] Task 4.1: Add CFP preview domain (`*.pages.dev`) to Supabase Auth CORS origins
- [ ] Task 4.2: Add CFP preview domain to Supabase Storage CORS (if needed)
- [ ] Task 4.3: Test authentication flow on CFP preview deployment
- [ ] Task 4.4: Test Elvanto sync API calls from CFP domain
- [ ] **Commit:** `fix: configure supabase cors for cloudflare pages domain`

### Batch 5: Custom Domain Setup
## Batch 5 Start: Sync
- [ ] Mark completed tasks in `plan.md` (update checkboxes/status)
- [ ] Read `findings.md` for key discoveries
## Batch 5 Context
- Goal: Deploy frontend to Cloudflare Pages with Supabase backend
- This Batch: Add custom domain, configure DNS, verify SSL, update CORS
- Prev: Batch 4 complete — Supabase CORS configured, auth/API tested on preview
- Key: findings.md#custom-domain-dns
- [ ] Task 5.1: Add custom domain in CFP dashboard
- [ ] Task 5.2: Configure DNS CNAME record pointing to CFP hostname
- [ ] Task 5.3: Verify SSL certificate provisioning (automatic on CFP)
- [ ] Task 5.4: Add custom domain to Supabase Auth CORS origins
- [ ] Task 5.5: Test full app on custom domain (auth, API, realtime, PWA)
- [ ] **Commit:** `feat: configure custom domain for cloudflare pages`

### Batch 6: Polish & Validation
## Batch 6 Start: Sync
- [ ] Mark completed tasks in `plan.md` (update checkboxes/status)
- [ ] Read `findings.md` for key discoveries
## Batch 6 Context
- Goal: Deploy frontend to Cloudflare Pages with Supabase backend
- This Batch: Run full validation suite (tests, lint, typecheck, build, Lighthouse)
- Prev: Batch 5 complete — Custom domain live, full app tested
- Key: findings.md#validation
- [ ] Task 6.1: Run full test suite: `pnpm test`
- [ ] Task 6.2: Run lint: `pnpm lint`
- [ ] Task 6.3: Run typecheck: `pnpm typecheck`
- [ ] Task 6.4: Run production build: `pnpm run build`
- [ ] Task 6.5: Verify Lighthouse scores (Performance, PWA, Accessibility)
- [ ] **Commit:** `chore: lint, typecheck, test validation`

### Final
- [ ] **Push:** `git push origin feature/cloudflare-pages-deploy`

## Validation
- [ ] CFP build succeeds with zero errors
- [ ] Preview deployment loads correctly
- [ ] Authentication works (login, register, session persistence)
- [ ] All API calls to Supabase succeed (CORS configured)
- [ ] Real-time features work (journey updates, live data)
- [ ] PWA installs and works offline
- [ ] Custom domain resolves with valid SSL
- [ ] All tests pass
- [ ] Lint clean
- [ ] Typecheck clean
- [ ] Build succeeds

## Open Questions
- [ ] Does the Vite proxy config for `/api/elvanto` need adjustment for production?
- [ ] Are there any hardcoded localhost URLs in the codebase?
- [ ] Does the PWA service worker need `scope` adjustment for custom domain?