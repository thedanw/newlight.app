# Decision: Shell-Owned Action Footer (Path B)

Dirty-driven Save/Cancel bar owned by the app shell. Forms hook in via a core context; the footer animates into view only when the form is edited.

**Scope:** Core UI (`src/core/ui`), AppShell, `page.ts` recipe, in-scope forms, `lint-pages.mjs`.
**Constraints:** React 19, Panda CSS slot recipes, Park UI, `@/core/ui` barrel as sole UI import point, zero-dep `lint-pages.mjs` gate (no ESLint).
**Non-Goals:** elvanto-sync tabs (deferred — Tabs mount behavior), ESLint setup (future gate), multi-section dirty aggregation (follow-up), public pages (`LoginPage`/`FormPublicPage`).
**Assumptions:** `Page.Root` is `position: relative`; `Page.Main` is the scroll container; `ModuleBreadcrumbProvider` renders no DOM.

## Decision Log: decision → Rationale (hierarchical; parent = decision, sub = dependent)

1. Footer is shell-owned, not page-rendered → one Save/Cancel bar, no per-page duplication
   1.1 `PageActionsProvider` + `usePageActions` (core/ui) — `register(actions)` returns a cleanup; forms call it in a `useEffect` so route unmount clears the footer → no stale footer on the next route
   1.2 `useRegisterPageActions(actions, enabled?)` helper — ref-based callbacks + stable effect deps → prevents the infinite re-registration loop (register → provider re-render → page re-render → new fn → re-register)
   1.3 `ActionFooter` rendered once by AppShell as a direct child of `Page.Root` → single source of truth
2. Visibility is dirty-driven → footer appears only when there are unsaved edits
   2.1 `visible = actions && actions.isDirty` → pristine forms show no footer
   2.2 `EditPersonPage` registers `isDirty: true` first pass → multi-section dirty aggregation is a follow-up (gap)
3. Positioning is `absolute` in `Page.Root`, NOT `fixed` → never overlaps the sidebar
   3.1 `--footer-height` var on root → `Page.Main` `scrollPaddingBottom: var(--footer-height, 0)` → last field never occluded when the footer is visible
4. Hidden ≠ removed → `inert` + `aria-hidden` when hidden → keyboard focus and screen readers cannot reach hidden buttons (React 19 boolean `inert` prop)
5. Mobile-first → `env(safe-area-inset-bottom)` padding + `interactive-widget=resizes-content` viewport meta → footer clears the on-screen keyboard and home indicator
6. Reduced motion → `@media (prefers-reduced-motion: reduce) { transition: none }` → no slide
7. Enforcement via `lint-pages.mjs` → routed pages may not render `Page.Footer` (allowlist `page.tsx`/`app-shell.tsx`/`action-footer.tsx`); routed pages with `<form>` must use `usePageActions`/`useRegisterPageActions` (allowlist `LoginPage`/`FormPublicPage`) → single source of truth, fail-closed

## API

```ts
type PageActions = {
  cancel: () => void
  apply: () => Promise<void> | void
  isSaving: boolean
  isDirty: boolean
  applyLabel?: string // defaults to "Save"
}

// In a routed page:
useRegisterPageActions({ cancel, apply, isSaving, isDirty, applyLabel }, enabled?)
```

## Migrated Forms

| File | Actions |
|------|---------|
| `src/core/settings/pages/ChurchInformationPage.tsx` | `{ cancel: handleCancel, apply: handleApply, isSaving: saving, isDirty, applyLabel: 'Apply' }` |
| `src/modules/people/pages/EditPersonPage.tsx` | `{ cancel: handleCancel, apply: handleSaveAll, isSaving: false, isDirty: true }` (enabled when loaded) |
| `src/modules/people/components/PersonForm.tsx` | `{ cancel: onCancel, apply: submit, isSaving: saving, isDirty, applyLabel: submitLabel }` |
| `src/modules/people/pages/FormBuilderPage.tsx` | `{ cancel: () => navigate('/people/forms'), apply: save, isSaving: saving, isDirty: fieldsCollection.isDirty, applyLabel: 'Save form' }` |
| `src/core/auth/AccountPage.tsx` | `{ cancel: () => setPassword(''), apply: changePassword, isSaving: savingPassword, isDirty: password.length > 0, applyLabel: 'Update password' }` |

## Superseded

- `SettingsActionsProvider` / `useSettingsActions` (`src/core/settings/lib/actions-context.tsx`) + `SettingsActions` (`section-actions.ts`) — deleted (were unused)
- `footerVariant="fixed"` on `Page.Footer` — removed from `page.ts` recipe
- Per-page `<Page.Footer>` in `ChurchInformationPage` / `EditPersonPage` — deleted
- Inline submit/cancel buttons in `PersonForm` / `FormBuilderPage` / `AccountPage` — removed

## Open Gaps

- Multi-section dirty aggregation (`EditPersonPage` registers `isDirty: true` first pass) — expose `isDirty` on `EditableSectionHandle` and aggregate
- elvanto-sync per-tab save bars — deferred (Tabs mount behavior)
- ESLint `no-restricted-imports` as a future gate — `lint-pages.mjs` is the working gate today