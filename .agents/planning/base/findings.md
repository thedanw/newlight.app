# Findings: New Light Anglican Church CRM - Base Platform

> **Research context only — resolved decisions live in `decision.md`.**

## Project Context
- New project (greenfield)
- Web application for church CRM
- Modular architecture with toggleable modules
- Baseline module: "people" (CRM for people and contacts)
- Additional modules: groups, services, calendar
- Database: Supabase free tier
- Lightweight as possible

## Technical Constraints Identified
- Supabase free tier limits (500MB database, 2GB bandwidth, 50MB file storage)
- Modular architecture requiring clean separation
- Module interdependencies (other modules depend on "people")
- Web application (browser-based)

## Research Notes (approaches explored & selected)

### 1. Technology Stack
- **Frontend:** SvelteKit (SSR-capable, lightweight, file-based routing)
- **Styling:** Panda CSS (zero-runtime, type-safe tokens, native theming, static CSS output for caching)
- **UI Components:** shadcn-svelte (copy-paste Radix + Tailwind, ownable) + Bits UI (native Svelte headless primitives)
- **Database:** Supabase (PostgreSQL, auth, realtime, edge functions)
- **Language:** TypeScript throughout

### 2. Styling & Theming Strategy
- **Panda CSS** for design system: tokens → semantic tokens → patterns/recipes
- **CSS Custom Properties** output for theming (light, church-brand, module-scoped)
- **Single cached `global.css`** — browser caches on first load, instant subsequent loads
- **Fonts preloaded** via service worker (Workbox) — Inter variable font WOFF2
- **AI-constrained vocabulary** via Panda schemas — consistent, no duplication

### 3. Authentication & Authorization
- **Supabase Auth** as invisible backend — all auth UI hosted in-app
- **Email/password + magic links** for primary authentication
- **OAuth providers:** Google (volunteers), Microsoft Entra ID / Azure AD (staff)
- **Admin-managed invites only** — no self-signup (disable in Supabase dashboard)
- **Custom email templates** in Supabase dashboard (branded, your domain)
- **MFA for admin roles** via Supabase MFA API
- **Row Level Security (RLS)** on all tables — auth.uid() based policies

### 4. Module System Architecture
- **File-based (SvelteKit native)** — modules in `src/lib/modules/{people,groups,services,calendar}/`
- **Each module:** routes, components, server API, types, config, public index.ts exports
- **People module** = foundation, always enabled, other modules import its API directly
- **Runtime toggling via database** — `module_config` table in Supabase
- **Admin UI in Settings** — toggle modules with dependency validation
- **Supabase Realtime** — instant propagation to all clients
- **Server cache (1 min) + client reactive stores** — navigation/routes update reactively
- **Route guards** — server-side layout checks before render
- **Env var fallback** — for CI/staging overrides

### 5. People Module Data Model
**Australian Anglican church context** — WWCC, Safe Ministry, conditional fields by demographic.

**Full schema moved to:** `.agents/planning/people/findings.md`

#### Summary
- **Core tables:** `households`, `addresses`, `people`, `people_relationships`, `tags`, `people_tags`, `user_roles`
- **Journey grid:** `ministries` (rows) × `journey_stages` (columns) via `people_ministry_journey` — replaces `people_category` + `locations[]`
- **PostgreSQL enums** for data integrity (demographic, marital_status, journey_stage_slug, etc.)
- **Conditional field visibility** by demographic (adult/youth/child)
- **Australian child safety fields:** WWCC, Safe Ministry Training (SMT), Safe Ministry Check (SMC)
- **Admin-only fields:** access_permissions, legacy_member_id, date_professed
- **Unified audit:** `people_audit` for journey changes + GDPR deletions
- **Household-based RLS** + admin override
- **Module API** exports types, server API, hooks, components for cross-module use

### 6. Admin Settings Architecture
**Requirement:** Base platform needs admin settings including:
- Module toggles (on/off with dependency validation)
- Per-module configuration
- Global platform settings (branding, timezone, defaults)

#### Storage Options to Explore

| Approach | Pros | Cons |
|----------|------|------|
| **Single `settings` table (key-value JSONB)** | Simple, flexible, single query | No schema validation, harder to type |
| **Separate tables per domain** (`module_config`, `platform_settings`, `branding`) | Typed, validated, clear ownership | More tables, joins needed |
| **Supabase Vault / Secrets** | Secure for secrets | Not for user-configurable settings |
| **PostgreSQL `hstore` / JSONB columns on existing tables** | Co-located with related data | Scattered, harder to audit |

#### Questions to Resolve
1. **Schema vs flexibility** — Strict typed columns or JSONB for extensibility?
2. **Module settings ownership** — Stored in base `module_config` or each module's own table?
3. **Versioning/history** — Audit trail for settings changes?
4. **Environment overrides** — Local/staging/production differences?
5. **UI generation** — Can settings schema auto-generate admin forms?

### 7. API Design for Module Interoperability
- **Direct database access with shared TypeScript types** — single repo, zero abstraction overhead
- **Shared types flow:** `people/types.ts` → imported by `groups/types.ts`, `services/types.ts`, `calendar/types.ts`
- **Module server APIs** compose: `servicesApi` uses `peopleApi` + `groupsApi` directly
- **Type-safe joins:** `select('*, person:people(*)')` returns fully typed data
- **RLS handles security** — row-level policies, not API-layer checks
- **Client hooks reactive** — Svelte stores + Supabase Realtime for live updates

#### Pattern
```typescript
// Each module exports: types, server API factory, client hooks, components
// src/lib/modules/people/index.ts
export * from './types';
export { createPeopleApi } from './server/api';
export { usePeople, usePerson, useHousehold, useGuardians } from './hooks';
export { PersonCard, PersonAvatar, PersonSearch, HouseholdSelector, GuardianPicker } from './components';

// Other modules import and compose
import { createPeopleApi } from '$lib/modules/people/server/api';
import { createGroupsApi } from '$lib/modules/groups/server/api';
```

### 8. Deployment Strategy
- **Platform:** Cloudflare Pages (free tier: unlimited bandwidth, 500 builds/mo, 1M requests/day)
- **Adapter:** `@sveltejs/adapter-cloudflare` — Workers-based, edge deployment
- **Supabase** handles all backend: Auth, DB, Realtime, Storage, Edge Functions, pg_cron
- **Static assets** served from Cloudflare's global CDN (300+ locations)
- **Edge Functions** for middleware, auth checks, API routes (via SvelteKit server routes)
- **Custom domains** free, automatic SSL, instant cache purge
- **Preview deployments** on every PR (Cloudflare Pages + GitHub integration)
- **Migration path:** Can switch to Vercel/Netlify by changing adapter only

#### Cloudflare Pages Config
```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-cloudflare';

export default {
  kit: {
    adapter: adapter({
      routes: {
        include: ['/*'],
        exclude: ['<all>']
      },
      platformProxy: {
        configPath: 'wrangler.toml',
        environment: undefined,
        experimentalJsonConfig: false,
        persist: './.wrangler/state'
      }
    })
  }
};
```

```toml
# wrangler.toml
name = "newlight-crm"
compatibility_date = "2024-01-01"
pages_build_output_dir = ".svelte-kit/cloudflare"

[vars]
PUBLIC_SUPABASE_URL = "https://xxx.supabase.co"
PUBLIC_SUPABASE_ANON_KEY = "xxx"

# Secrets set via Cloudflare dashboard (not in repo)
# SUPABASE_SERVICE_ROLE_KEY = "xxx"
```

#### Why Cloudflare Pages Over Vercel
| Factor | Cloudflare Pages | Vercel |
|--------|------------------|--------|
| **Free tier bandwidth** | Unlimited | 100GB |
| **Build minutes** | 500/mo | Unlimited (personal) |
| **Edge network** | 300+ locations | ~20 regions |
| **Workers/Edge Functions** | Native, cheap | Edge Functions (separate) |
| **D1/KV/Durable Objects** | Available if needed | ❌ |
| **Custom domains** | Free, instant SSL | Free |
| **Preview deployments** | ✅ | ✅ |
| **Vendor lock-in** | Low (standard Workers) | Medium |

### 9. Development Workflow
- **Strategy:** Trunk-based development (solo dev, feature flags for incomplete work)
- **Branch:** `main` only — direct commits with feature flags
- **Feature flags:** Module toggles in `module_config` table serve as runtime feature flags
- **Commits:** Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`)
- **Quality gates (local):** `pnpm check` (TypeScript), `pnpm lint`, `pnpm format`, `pnpm test`, `pnpm build`
- **CI/CD:** GitHub Actions on push to main — typecheck, lint, format, test, build, deploy to Cloudflare Pages
- **Environments:** Local → Preview (auto on push) → Production (tagged releases)
- **Release:** `pnpm version patch|minor|major` → git push tags → auto-deploy production

#### Tooling
| Category | Tool |
|----------|------|
| Package Manager | `pnpm` |
| Language | TypeScript (strict) |
| Framework | SvelteKit |
| Styling | Panda CSS |
| UI | shadcn-svelte + Bits UI |
| Database | Supabase (PostgreSQL) |
| Hosting | Cloudflare Pages |
| Testing | Vitest + Playwright |
| Linting | ESLint + Prettier |
| Git Hooks | Husky + lint-staged |
| CI/CD | GitHub Actions |

### 10. Testing Strategy
- **Approach:** E2E-heavy (Playwright) — focus on critical user journeys, minimal unit tests
- **Rationale:** Solo dev, limited time, E2E catches real regressions in user flows
- **Tools:** Playwright (E2E), Vitest (unit for pure logic only)

#### Test Structure
```
tests/
├── e2e/                    # Playwright tests
│   ├── auth/               # Login, magic link, OAuth flows
│   ├── people/             # CRUD, search, household, guardians
│   ├── modules/            # Module toggle, navigation
│   ├── groups/             # Group create, member management
│   ├── services/           # Roster, series, runsheet
│   ├── calendar/           # Events, bookings, RSVP
│   └── admin/              # Settings, user management
├── unit/                   # Vitest (pure functions only)
│   ├── utils/              # Date helpers, formatters
│   ├── validation/         # Schema validation
│   └── panda/              # Token/recipe logic
└── fixtures/               # Test data, mock Supabase
```

#### Critical E2E Scenarios (Priority Order)
| Priority | Scenario | Module |
|----------|----------|--------|
| P0 | Admin login → toggle module → verify navigation | Core |
| P0 | Create person → add to household → link guardians | People |
| P0 | Create group → add members → assign leader | Groups |
| P0 | Create service → build roster → assign people | Services |
| P0 | Create event → RSVP household → view calendar | Calendar |
| P1 | Magic link auth → redirect to dashboard | Auth |
| P1 | OAuth (Google/Microsoft) → first-time user setup | Auth |
| P1 | WWCC expiry validation → warning UI | People |
| P1 | Safe Ministry status → roster eligibility | Services |
| P2 | Theme switch → persists across reload | UI |
| P2 | Offline PWA → queue mutations → sync | PWA |

#### Playwright Config
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

#### CI Integration
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm test:e2e
        env:
          PLAYWRIGHT_BASE_URL: http://localhost:5173
```

#### Supabase Test Database
```bash
# Local: Use Supabase local dev (Docker)
supabase start
supabase db reset --linked

# CI: Ephemeral Supabase or seeded test project
# Use separate Supabase project for testing
```

#### Running Tests
```bash
# Local development
pnpm test:e2e           # Headed, interactive
pnpm test:e2e --ui      # Playwright UI mode
pnpm test:unit          # Vitest unit tests

# CI
pnpm test:e2e --reporter=github
```

#### Test Data Management
```typescript
// tests/fixtures/people.ts
export const testPerson = {
  first_name: 'Test',
  last_name: 'User',
  demographic: 'adult' as const,
  people_category: 'sunday_regular' as const,
  email: 'test@example.com',
  // ... required fields
};

export const testChild = {
  ...testPerson,
  demographic: 'child' as const,
  first_name: 'Test Child',
};

// tests/fixtures/auth.ts
export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('[name="email"]', 'admin@test.com');
  await page.fill('[name="password"]', 'testpass');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/people');
}
```

## Open Decision Gaps

> Resolved decision-gap questions are recorded in `decision.md` (Decision Log). Open items below.

1. Multi-tenancy — future-proof for multi-church? → open
2. Migration strategy — how to handle JSONB schema changes? → open
3. Offline/PWA support — extent + sync model → deferred