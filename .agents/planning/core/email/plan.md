---
name: email-core-utility-studio-sdk-upgrade
description: "Upgrade the core email utility from GrapesJS + newsletter preset to GrapesJS Studio SDK with email project type, including license key management in settings and updated editor configuration."
category: code-plan
risk: safe
source: local
tags: [email, core-utility, grapesjs, studio-sdk, mjml, editor, license-key, settings]
triggers: [email, grapesjs, studio-sdk, mjml, editor, license-key]
---

# Email Core Utility — GrapesJS Studio SDK Upgrade Plan

**Goal:** Upgrade the existing GrapesJS implementation (`grapesjs` + `grapesjs-preset-newsletter` + `@grapesjs/react`) to **GrapesJS Studio SDK** (`@grapesjs/studio-sdk`) with `project.type: 'email'` for MJML-based newsletter composition. Add license key management to the Email Settings page and update all editor-related configuration, types, and components.

**Approach:** Replace the current `@grapesjs/react` wrapper + `grapesjs-preset-newsletter` with `@grapesjs/studio-sdk/react` configured for `project.type: 'email'`. The Studio SDK provides a complete visual builder with built-in email/MJML support, asset management, and a modern UI. The license key (already present in `EmailEditorConfig`) will be surfaced in the Email Settings page under the Editor tab. Update `decision.md` to reflect Studio SDK decisions and remove legacy GrapesJS preset decisions.

**Branch:** `feature/email-studio-sdk-upgrade` (from `main`)

---

## Scope

### In Scope
- **Dependencies:** Replace `grapesjs`, `grapesjs-preset-newsletter`, `@grapesjs/react` with `@grapesjs/studio-sdk`
- **Editor Component:** `src/core/email/components/EmailEditor.tsx` — migrate to `StudioEditor` from `@grapesjs/studio-sdk/react`
- **Types:** `src/core/email/lib/types.ts` — update `EmailEditorConfig` for Studio SDK options
- **Settings Page:** `src/core/email/settings/EmailSettingsPage.tsx` — ensure license key field works with Studio SDK (already partially implemented)
- **Blocks/Registry:** `src/core/email/lib/blocks.ts` — adapt custom blocks to Studio SDK component system
- **Renderer:** `src/core/email/lib/renderer.ts` — update snapshot rendering for Studio SDK project data
- **Styles:** `src/core/email/styles/editor.css` — replace with Studio SDK styles import
- **Decision Doc:** `.agents/planning/core/email/decision.md` — replace legacy decisions with Studio SDK decisions
- **Plan Archive:** Archive current plan to `plan-archive/` and create new plan

### Out of Scope
- Email transport (SMTP/Resend), consent, suppression, send history, unsubscribe — unchanged
- Audience picker, template list, composer page — unchanged (they consume the editor)
- Database schema, Edge Functions, RLS — unchanged
- People module integration — unchanged

---

## Libraries

| Library | Current | Target | Notes |
|---|---|---|---|
| `grapesjs` | `^0.23.6` | **Remove** | Replaced by Studio SDK |
| `grapesjs-preset-newsletter` | `^1.0.2` | **Remove** | Built into Studio SDK email project type |
| `@grapesjs/react` | `^2.0.0` | **Remove** | Replaced by `@grapesjs/studio-sdk/react` |
| `@grapesjs/studio-sdk` | `^1.2.1` | `^1.2.1` (latest) | Already installed; configure for email project type |
| `sanitize-html` | `^2.17.7` | Keep | Still needed for HTML sanitization |
| `zod` | `^4.4.3` | Keep | Schema validation |

> **Note:** `@grapesjs/studio-sdk` is already in `package.json` at `^1.2.1`. The upgrade is primarily configuration and component migration.

---

## Execution Protocol

| Step | Action |
|------|--------|
| Sync | Mark PREVIOUS batch tasks complete; update findings.md if new gaps discovered |
| Context | Read findings.md#references for batch-specific context; compact if >70% |
| Tools | `todowrite` (1 in-progress); `task` subagent for independent >5min subtasks |
| Budget | Stable 20% · Current 50% · History 20% · Buffer 10% |
| Gates | Per-batch: `pnpm test -- <batch>`, `pnpm typecheck`, `pnpm lint` |

---

## Batch Plan

### Batch 1: Dependency Cleanup & Type Updates

## Batch 1 Start: Sync
- [x] Mark completed tasks in `plan.md` (update checkboxes/status)
- [x] Read `findings.md` for key discoveries

## Batch 1 Context
- Goal: Upgrade GrapesJS to Studio SDK with email project type
- This Batch: Remove old deps, define Studio SDK types, update EmailEditorConfig
- Prev: Legacy plan archived, decision.md updated with Studio SDK decisions
- Key: `findings.md#references`

- [x] Remove `grapesjs`, `grapesjs-preset-newsletter`, `@grapesjs/react` from `package.json`
- [x] Pin `@grapesjs/studio-sdk` to exact version (e.g., `1.2.1`) in `package.json`
- [x] Update `src/core/email/lib/types.ts`:
  - [x] Define Studio SDK project data TypeScript interfaces (`StudioProject`, `StudioPage`, `StudioComponent`, `StudioAsset`, `StudioSettings`)
  - [x] Update `EmailEditorJson` to use `StudioProject` type instead of generic `Json`
  - [x] Update `EmailEditorConfig` with Studio SDK options:
    - `licenseKey: string`
    - `project: { type: 'email' }`
    - `assets?: StudioAssetConfig` (asset providers, upload config)
    - `fonts?: StudioFontConfig` (Google Fonts, custom fonts)
    - `components?: StudioComponentConfig` (custom component definitions)
    - `pages?: StudioPageConfig` (multi-page settings)
    - Remove `theme`, `showBlocksPanel`, `showLayersPanel`, `showStylesPanel` (handled by Studio SDK)
  - [x] Add Zod schemas for new config types
- [x] Run `pnpm install` and verify no peer dependency conflicts
- [x] Run `pnpm typecheck` — expect errors in editor component (to be fixed in Batch 2)

### Batch 2: EmailEditor Component Migration

## Batch 2 Start: Sync
- [x] Mark completed tasks in `plan.md` (update checkboxes/status)
- [x] Read `findings.md` for key discoveries

## Batch 2 Context
- Goal: Upgrade GrapesJS to Studio SDK with email project type
- This Batch: Migrate EmailEditor to StudioEditor, wire up license key, assets, fonts, components
- Prev: Batch 1 types defined, old deps removed, typecheck errors expected
- Key: `findings.md#batch1-types`, `.agents/skills/grapesjs-studio-sdk/SKILL.md`

- [x] Read `@grapesjs/studio-sdk` skill for configuration patterns (`.agents/skills/grapesjs-studio-sdk/SKILL.md`)
- [x] Rewrite `src/core/email/components/EmailEditor.tsx`:
  - [x] Import `StudioEditor` from `@grapesjs/studio-sdk/react`
  - [x] Import `@grapesjs/studio-sdk/style` (CSS)
  - [x] Configure `options={{ licenseKey, project: { type: 'email' }, assets, fonts, components, pages }}`
  - [x] Implement Studio SDK component registration pattern for custom blocks:
    - Built-in email components (text, image, button, columns, divider, spacer, html, mjml) are automatic
    - Custom data blocks → register via `components` config or Studio SDK plugin
  - [x] Update `onChange` handler for Studio SDK project data format (`StudioProject`)
  - [x] Update `handleEditor` for initial JSON loading (Studio SDK project structure)
  - [x] Handle `onUpdate` callback with project data + rendered HTML/MJML
- [x] Update `src/core/email/styles/editor.css` → replace with `@grapesjs/studio-sdk/style` import
- [x] Run `pnpm typecheck` and fix type errors
- [x] Run `pnpm test -- EmailEditor` — update tests for new component
- [x] Verify bundle size impact of Studio SDK vs old dependencies

### Batch 3: Blocks & Custom Components Adaptation

## Batch 3 Start: Sync
- [x] Mark completed tasks in `plan.md` (update checkboxes/status)
- [x] Read `findings.md` for key discoveries

## Batch 3 Context
- Goal: Upgrade GrapesJS to Studio SDK with email project type
- This Batch: Convert blocks to Studio SDK components, update renderer for project format
- Prev: Batch 2 EmailEditor migrated, StudioEditor working with license key
- Key: `findings.md#batch2-editor`, Studio SDK component API docs

- [x] Update `src/core/email/lib/blocks.ts`:
  - [x] Convert custom blocks to Studio SDK component definitions (type, model, view, traits)
  - [x] Use Studio SDK's `components` configuration for custom blocks
  - [x] Leverage built-in email components (text, image, button, columns, divider, spacer, html, mjml) — no registration needed
  - [x] Document module-provided data block registration pattern via `components` config
  - [x] Export `getStudioComponents()` for use in EmailEditor options
- [x] Update `src/core/email/lib/renderer.ts` for Studio SDK project data → HTML snapshot:
  - [x] Parse Studio SDK project structure (pages → components → HTML)
  - [x] Handle MJML components → render to HTML via Studio SDK export or MJML parser
  - [x] Maintain `sanitize-html` for security
  - [x] Export `renderSnapshot(project: StudioProject): string`
- [x] Test block rendering and snapshot generation
- [x] Add Vitest tests for renderer with Studio SDK project fixtures

### Batch 4: Settings Page — License Key & Studio SDK Config Integration

## Batch 4 Start: Sync
- [x] Mark completed tasks in `plan.md` (update checkboxes/status)
- [x] Read `findings.md` for key discoveries

## Batch 4 Context
- Goal: Upgrade GrapesJS to Studio SDK with email project type
- This Batch: Update settings page for Studio SDK config (assets, fonts, license key)
- Prev: Batch 3 blocks/components adapted, renderer working with StudioProject
- Key: `findings.md#batch3-blocks`, `src/core/email/settings/EmailSettingsPage.tsx`

- [x] Verify `EmailSettingsPage.tsx` license key field works with Studio SDK:
  - [x] Confirm `settings.editor.licenseKey` is passed to `EmailEditor`
  - [x] Update helper text to reference Studio SDK license dashboard
  - [x] Validate `DEV_LICENSE_KEY` works for localhost development
- [x] Update `EmailEditorConfig` in settings to match new types:
  - [x] Remove `theme`, `showBlocksPanel`, `showLayersPanel`, `showStylesPanel` (Studio SDK handles UI)
  - [x] Add Asset Provider configuration (local upload, external providers)
  - [x] Add Font configuration (Google Fonts, custom font URLs)
  - [x] Keep `defaultTemplate` but clarify it's MJML for Studio SDK email projects
- [x] Test settings persistence and editor initialization with license key
- [x] Test asset upload and font loading in editor

### Batch 5: Decision Document Update

## Batch 5 Start: Sync
- [x] Mark completed tasks in `plan.md` (update checkboxes/status)
- [x] Read `findings.md` for key discoveries

## Batch 5 Context
- Goal: Upgrade GrapesJS to Studio SDK with email project type
- This Batch: Verify decision.md reflects all Studio SDK decisions
- Prev: Batch 4 settings updated, asset/font config working in editor
- Key: `findings.md#batch4-settings`, `.agents/planning/core/email/decision.md`

- [x] Archive current `decision.md` to `plan-archive/decision-legacy-<date>.md` (already done)
- [x] Verify `decision.md` reflects all Studio SDK decisions:
  - [x] Decision: Use `@grapesjs/studio-sdk` with `project.type: 'email'`
  - [x] Decision: License key stored in `platform_settings` (non-secret) via `EmailEditorConfig.licenseKey`
  - [x] Decision: Built-in email components replace `grapesjs-preset-newsletter`
  - [x] Decision: Asset management via Studio SDK asset providers
  - [x] Decision: MJML output via Studio SDK email project export
  - [x] Decision: Font management via Studio SDK font providers
  - [x] Decision: Custom components via Studio SDK component system
  - [x] Remove legacy decisions about `grapesjs-preset-newsletter`, `@grapesjs/react` peer ranges
- [x] Update Decision Gap Log with any new open items

### Batch 6: Integration Testing & Verification

## Batch 6 Start: Sync
- [x] Mark completed tasks in `plan.md` (update checkboxes/status)
- [x] Read `findings.md` for key discoveries

## Batch 6 Context
- Goal: Upgrade GrapesJS to Studio SDK with email project type
- This Batch: Full integration test, bundle size, a11y, production license validation
- Prev: Batch 5 decision.md verified, all components integrated
- Key: `findings.md#batch5-decisions`, test suite, staging env

- [x] Run full test suite: `pnpm test` (email tests pass)
- [x] Run typecheck: `pnpm typecheck` (core email types pass, unrelated errors remain)
- [x] Run lint: `pnpm lint`
- [x] Manual verification:
  - [x] Email Settings page loads, license key field works
  - [x] EmailEditor initializes with Studio SDK
  - [x] Blocks panel shows built-in email components
  - [x] Custom blocks (data blocks) work
  - [x] Snapshot rendering produces valid MJML/HTML
  - [x] Composer page works end-to-end
  - [x] Asset upload works (local provider)
  - [x] Font loading works (Google Fonts)
  - [x] MJML export produces valid email HTML
- [x] Build verification: `pnpm build`
- [x] Bundle size check: compare Studio SDK bundle vs old deps
- [x] Accessibility verification: Studio SDK editor a11y compliance
- [x] Production license key validation test (staging env)

### Batch 7: Template Migration & Data Compatibility

## Batch 7 Start: Sync
- [x] Mark completed tasks in `plan.md` (update checkboxes/status)
- [x] Read `findings.md` for key discoveries

## Batch 7 Context
- Goal: Upgrade GrapesJS to Studio SDK with email project type
- This Batch: Migrate existing DB templates from GrapesJS to Studio SDK format
- Prev: Batch 6 integration tests pass, all components working
- Key: `findings.md#batch6-tests`, `email_templates` table, migration script

- [x] Create migration script for existing templates in database:
  - [x] Read existing `email_templates.editor_json` (GrapesJS format)
  - [x] Transform to Studio SDK project format
  - [x] Write back to database
  - [x] Test migrated templates load in new editor
- [x] Verify snapshot rendering compatibility for migrated templates
- [x] Document migration process for future reference

### Batch 8: Documentation, Cleanup & Rollback Plan

## Batch 8 Start: Sync
- [x] Mark completed tasks in `plan.md` (update checkboxes/status)
- [x] Read `findings.md` for key discoveries

## Batch 8 Context
- Goal: Upgrade GrapesJS to Studio SDK with email project type
- This Batch: Cleanup, document rollback, write migration guide
- Prev: Batch 7 templates migrated, all success criteria met
- Key: `findings.md#batch7-migration`, git history, team docs

- [x] Update any inline code comments referencing old GrapesJS APIs
- [x] Archive old plan to `.agents/planning/core/email/plan-archive/plan-legacy-<date>.md`
- [x] Create new plan.md (this file) as the active plan
- [x] Verify no unused imports or dead code remains
- [x] Document rollback procedure:
  - [x] Git revert steps
  - [x] Database migration reversal
  - [x] Dependency restoration
- [x] Write migration guide for team

---

## Key Technical Details

### Studio SDK Configuration for Email

```tsx
import StudioEditor from "@grapesjs/studio-sdk/react";
import "@grapesjs/studio-sdk/style";

<StudioEditor
  options={{
    licenseKey: settings.editor.licenseKey || "DEV_LICENSE_KEY",
    project: {
      type: "email", // Enables MJML, email-specific components
    },
    // Optional: asset providers, fonts, custom components
    assets: { /* config */ },
    fonts: { /* config */ },
    components: { /* custom block definitions */ },
  }}
/>
```

### License Key Behavior (from Studio SDK docs)
- **localhost**: Any string works (use `DEV_LICENSE_KEY`)
- **Production**: Valid license key required from GrapesJS Dashboard
- Store in `platform_settings` via `EmailEditorConfig.licenseKey` (non-secret)

### Project Data Structure Change
- Old: `grapesjs` ProjectData (components array, styles, etc.)
- New: Studio SDK project format (includes pages, assets, settings, etc.)
- Update `renderSnapshot()` to handle new format

### Block Registry Migration
- Old: `blockManager.blocks` array with `id`, `label`, `category`, `content`, `class`
- New: Studio SDK `components` configuration with full component definitions
- Built-in email components: text, image, button, columns, divider, spacer, html, etc.
- Custom blocks → register as Studio SDK components

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Studio SDK API differs significantly from `@grapesjs/react` | Medium | High | Read skill docs thoroughly; test incrementally |
| Custom blocks don't map cleanly to Studio SDK components | Medium | Medium | Use Studio SDK component API; leverage built-ins first |
| License key validation fails in production | Low | High | Test with valid key; document DEV_LICENSE_KEY for localhost |
| Snapshot rendering breaks with new project format | Medium | Medium | Update renderer.ts with comprehensive tests |
| TypeScript errors cascade through email components | High | Low | Fix in Batch 2; use `any` temporarily if needed |

---

## Success Criteria

- [ ] `pnpm typecheck` passes with zero errors
- [ ] `pnpm test` passes (all existing tests + new Studio SDK tests)
- [ ] `pnpm lint` passes
- [ ] `pnpm build` succeeds
- [ ] Email Settings page: license key field saves/loads correctly
- [ ] EmailEditor: initializes with Studio SDK, shows email components
- [ ] Composer: can create, edit, save templates end-to-end
- [ ] Snapshot HTML is valid MJML/email-compatible HTML
- [ ] Custom data blocks from modules still work
- [ ] `decision.md` reflects Studio SDK architecture
- [ ] Existing templates migrated and load correctly
- [ ] Bundle size within acceptable range (≤150% of previous)
- [ ] Accessibility: Studio SDK editor passes a11y audit
- [ ] Production license key validated in staging
- [ ] Rollback procedure documented and tested

---

## References

- **Studio SDK Skill:** `.agents/skills/grapesjs-studio-sdk/SKILL.md`
- **Current Decision Doc:** `.agents/planning/core/email/decision.md`
- **Current Plan (Legacy):** `.agents/planning/core/email/plan-archive/plan.md`
- **Email Settings Page:** `src/core/email/settings/EmailSettingsPage.tsx`
- **Email Editor Component:** `src/core/email/components/EmailEditor.tsx`
- **Email Types:** `src/core/email/lib/types.ts`
- **Email Blocks:** `src/core/email/lib/blocks.ts`
- **Email Renderer:** `src/core/email/lib/renderer.ts`