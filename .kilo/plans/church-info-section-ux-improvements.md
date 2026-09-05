# Implementation Plan: ChurchInformationSection UX Improvements

> **How to execute this plan with small-context LLMs**
>
> 1. Use the `todowrite` tool to create a todo list from each phase's subtasks before starting.
> 2. Launch a subagent (`task` tool, `subagent_type: general`) per phase. Give it the phase block below verbatim — it contains its own `compact` instructions and context.
> 3. After each phase completes, update the todo list, then spawn the next phase subagent.
> 4. Do NOT pass the entire plan file to subagents. Pass only the current phase block (50–120 lines).
> 5. Each subagent returns only: diff summary, files changed, and verification notes.

---

## Phase 1: Dirty State, Revert Logic, and Navigation Guard

### Compact
- Read ONLY: `src/core/settings/sections/ChurchInformationSection.tsx` (full file), `src/core/theme/theme-loader.js` (lines 1–50, 130–190), `src/core/theme/font-loader.ts` (lines 112–132).
- Keep in working memory: current `handleApply`, `handleCancel`, `switchTheme` signature, `applyFont` signature.
- Do NOT read other files in this phase.

### Context
`ChurchInformationSection.tsx` currently loads defaults on boot (`orange`, `neutral`, `light`), then hydrates from Supabase and live-applies every knob change via `switchTheme()`. There is no dirty tracking. If the user navigates away without Apply, the live theme stays at the uncommitted values. This phase adds dirty tracking, a revert path, and auto-revert on navigation.

### Subtasks
1. Add `isDirty` state (`boolean`, default `false`).
2. Add `initialTheme` ref (`BrandState`, snapshot from `getAppSettings()` on mount).
3. Add `initialChurchInfo` ref (`ChurchInfo`, snapshot from `getAppSettings()` on mount).
4. Implement `revertToInitial()`:
   - `setTheme(initialTheme.current)`
   - `setChurchInfo(initialChurchInfo.current)`
   - `switchTheme(initialTheme.current)`
   - `applyFont(initialTheme.current.font)`
   - `setIsDirty(false)`
5. Update `handleApply`:
   - After `saveAppSettings()` succeeds, update `initialTheme` and `initialChurchInfo` refs to the new values.
   - `setIsDirty(false)`.
6. Update `handleCancel`:
   - Call `revertToInitial()`.
   - `navigate('/settings')`.
7. Add `useLocation()` from `react-router-dom`.
8. Add `useEffect` watching `location.pathname`:
   - When pathname changes and `isDirty` is `true`, call `revertToInitial()`.
   - This auto-reverts on sidebar nav, browser back, or any route change.
9. Set `isDirty` to `true` inside every theme field setter and church-info field setter.
10. Set `isDirty` to `true` inside `handleFileAccept` (draft logo change).

### Completion Criteria
- Editing any field sets `isDirty` to `true`.
- Navigating away while dirty reverts live theme + state to the last committed values.
- `handleCancel` reverts and navigates to `/settings`.
- `handleApply` saves, updates the initial snapshot, and clears dirty.

---

## Phase 2: forwardRef + Page.Footer Wiring

### Compact
- Read ONLY: `src/core/settings/sections/ChurchInformationSection.tsx` (full file), `src/core/settings/SettingsPage.tsx` (full file), `src/core/ui/page.tsx` (full file), `src/core/theme/recipes/page.ts` (lines 82–98).
- Keep in working memory: `forwardRef`/`useImperativeHandle` pattern, `Page.Footer` slot, `footerVariant="fixed"` recipe variant.
- Do NOT read other files in this phase.

### Context
Phase 1 added dirty tracking and revert logic inside `ChurchInformationSection`. Now we need to expose `cancel` and `apply` to `SettingsPage` so it can render fixed `Page.Footer` buttons. The section component is rendered inside `Page.Body`, so it cannot render `Page.Footer` directly — `SettingsPage` must render the footer as a sibling of `Page.Body` inside `Page.Root`.

### Subtasks
1. Wrap `ChurchInformationSection` export in `React.forwardRef`.
2. Add `interface ChurchInformationSectionHandle { cancel: () => void; apply: () => Promise<void> }`.
3. Inside the component, call `useImperativeHandle(ref, () => ({ cancel: handleCancel, apply: handleApply }))`.
4. Remove the inline `<HStack justify="flex-end" gap="2">` Cancel/Apply buttons from the bottom of the scrollable content in `ChurchInformationSection.tsx`.
5. In `SettingsPage.tsx`:
   - Import `Page` from `@/core/ui` (already imported) and ensure `Page.Footer` is available.
   - Compute `isChurchInfo = current.kind === 'section' && current.sectionId === 'church-info'`.
   - When rendering the panel stack, pass `footerVariant={isChurchInfo ? 'fixed' : undefined}` to `<Page.Root>`.
   - After `<Page.Body>`, conditionally render `<Page.Footer>` when `isChurchInfo` is true.
   - Create `const sectionRef = useRef<{ cancel: () => void; apply: () => Promise<void> }>(null)`.
   - Pass `ref={sectionRef}` to the rendered `SectionComponent`.
   - Inside `<Page.Footer>`, render:
     - `<Button variant="outline" onClick={() => sectionRef.current?.cancel()}>Cancel</Button>`
     - `<Button onClick={async () => { setSaving(true); await sectionRef.current?.apply(); setSaving(false); }}>Apply</Button>`
   - Note: `SettingsPage` does not currently hold `saving` state. Either lift it into `SettingsPage` or let the section expose `isSaving` via the ref. Simplest: expose `{ cancel, apply, isSaving }` from the section, and disable the footer Apply button when `isSaving` is true.

### Completion Criteria
- `ChurchInformationSection` is wrapped in `forwardRef` and exposes `cancel`, `apply`, `isSaving`.
- Inline action buttons are removed from the section's scrollable content.
- `SettingsPage` renders a fixed `Page.Footer` with Cancel/Apply only for the `church-info` section.
- Cancel reverts and navigates; Apply saves and stays.
- Buttons are disabled during save.

---

## Phase 3: Card-Based Layout Refactor

### Compact
- Read ONLY: `src/core/settings/sections/ChurchInformationSection.tsx` (full file), `.agents/rules/design.md` (lines 93–156 for card rules, lines 38–46 for Page scaffold).
- Keep in working memory: card rules (full-width default, 2-column only for paired short fields, no nested cards, no Card.Footer when Page.Footer exists), responsive Panda syntax (`{ base: '3', md: '6' }`).
- Do NOT read other files in this phase.

### Context
Phase 2 moved actions to `Page.Footer`. The section's scrollable content is now free of buttons. This phase restructures the single vertical stack into 4 full-width cards per design.md: Church Information, Brand Identity, Appearance, Heading Style. Paired short fields (Church Name/App Name/Email/Website, Gray/Accent) use 2-column grids that collapse to 1 column on mobile.

### Subtasks
1. Replace the outer `<Stack gap="6">` with `<Stack gap="4">`.
2. Wrap Church Name, App Name, Church Email, Website in `<Card.Root>`:
   - `<Card.Header><Heading textStyle="md">Church Information</Heading></Card.Header>`
   - `<Card.Body><Stack gap="4"> ... </Stack></Card.Body>`
3. Inside Card 1 Body, wrap the 4 inputs in a responsive grid:
   - `css={{ base: { display: 'grid', gridTemplateColumns: '1fr', gap: '4' }, md: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4' } }}`
   - Place Church Name + App Name in row 1, Church Email + Website in row 2.
4. Wrap Logo upload + preview in `<Card.Root>`:
   - `<Card.Header><Heading textStyle="md">Brand Identity</Heading></Card.Header>`
   - `<Card.Body>` with smaller dropzone (placeholder for Phase 4) and preview.
5. Wrap Color scheme, Sidebar style, Gray, Accent, Radius, Font in `<Card.Root>`:
   - `<Card.Header><Heading textStyle="md">Appearance</Heading></Card.Header>`
   - `<Card.Body><Stack gap="4"> ... </Stack></Card.Body>`
   - Color scheme toggle at top (full-width).
   - Gray + Accent in a 2-column responsive grid (side-by-side on md+ because they are visual swatches the user compares).
   - Sidebar style, Radius, Font as full-width fields below.
6. Wrap Heading style checkboxes in `<Card.Root>`:
   - `<Card.Header><Heading textStyle="md">Heading Style</Heading></Card.Header>`
   - `<Card.Body><Stack gap="2"> ... </Stack></Card.Body>`
7. Remove all `<Box borderTopWidth="1px" borderColor="border" />` dividers — cards provide the visual separation.
8. Ensure no `Card.Footer` is used anywhere (actions are in `Page.Footer`).
9. Verify all grids collapse to 1 column at `base` (sm).

### Completion Criteria
- 4 cards rendered, each with `<Card.Header>` + `<Card.Body>`.
- Church Name/App Name and Email/Website are paired 2-column on md+.
- Gray + Accent are paired 2-column on md+.
- No nested cards, no Card.Footer, no inline action buttons.
- Mobile view stacks everything to 1 column.

---

## Phase 4: Smaller Dropzone

### Compact
- Read ONLY: `src/core/settings/sections/ChurchInformationSection.tsx` (lines 285–304 for dropzone, lines 405–434 for current upload UI).
- Keep in working memory: current dropzone markup, `FileUpload.Dropzone` API, `css` prop syntax.
- Do NOT read other files in this phase.

### Context
Phase 3 introduced the Brand Identity card. The dropzone currently uses `py="6"` (large vertical padding) and a centered vertical stack, making it tall. This phase shrinks it to a compact horizontal bar (~48px tall) while keeping the same upload behavior.

### Subtasks
1. Replace the current `<FileUpload.Dropzone>` children with:
   ```tsx
   <FileUpload.Dropzone
     className={css({
       borderStyle: 'dashed',
       borderWidth: '1px',
       borderRadius: 'l2',
       padding: '4',
       display: 'flex',
       alignItems: 'center',
       gap: '3',
       cursor: 'pointer',
       transition: 'colors 0.2s',
       _hover: { borderColor: 'colorPalette.9' },
     })}
   >
     <Icon size="md">
       <CloudUploadIcon />
     </Icon>
     <Stack gap="0" flex="1">
       <Text textStyle="sm" fontWeight="medium">
         Drop logo or click to browse
       </Text>
       <Text textStyle="xs" color="fg.muted">
         PNG, SVG, WebP, JPG · max 1 MB
       </Text>
     </Stack>
     <Badge variant="subtle" size="sm">
       Upload
     </Badge>
   </FileUpload.Dropzone>
   ```
2. Remove `py="6"` from the old dropzone.
3. Remove the large `Icon size="lg"` — change to `size="md"`.
4. Ensure `Badge` is imported from `@/core/ui`.
5. Verify the dropzone clickable area meets 44px minimum height (padding + text line height).

### Completion Criteria
- Dropzone is a single horizontal bar, ~48px tall.
- Icon + text + badge are laid out horizontally.
- Hover state changes border color to `colorPalette.9`.
- Upload behavior (drag/drop, click, validation) is unchanged.

---

## Phase 5: Verification and Design Compliance

### Compact
- Read ONLY: `.agents/rules/design.md` (lines 93–183), `src/core/settings/sections/ChurchInformationSection.tsx` (full file after Phase 4), `src/core/settings/SettingsPage.tsx` (full file after Phase 2).
- Keep in working memory: card rules, semantic tokens, responsive spacing rules.
- Do NOT read other files in this phase.

### Context
Phases 1–4 are complete. This phase verifies design.md compliance and tests the navigation/dirty behavior end-to-end.

### Subtasks
1. Run visual check against design.md card rules:
   - [ ] Cards are grouping containers (no padding-box cards).
   - [ ] All cards are full-width.
   - [ ] 2-column grids exist only for paired short fields (Church Name/App Name, Email/Website, Gray/Accent).
   - [ ] No nested cards.
   - [ ] No Card.Footer (actions in Page.Footer only).
   - [ ] Page chrome (breadcrumbs, back button) is in Page.Header, not inside a card.
2. Token audit:
   - [ ] No raw palette values (`accent.9`, `gray.12`, etc.) in the section.
   - [ ] Semantic tokens only (`fg.muted`, `colorPalette.solid`, `border`, etc.).
3. Responsive check:
   - [ ] All 2-column grids collapse to 1 column at `base` (sm, 640px).
   - [ ] Card padding and gaps use `{ base: '3', md: '6' }` or equivalent.
4. Behavioral test:
   - [ ] Edit a field → click sidebar navigation → live theme reverts to committed settings.
   - [ ] Edit a field → click Cancel → revert + navigate to `/settings`.
   - [ ] Edit a field → click Apply → save succeeds, toast appears, dirty cleared.
   - [ ] Edit a field → browser back → revert.
   - [ ] Edit a field → refresh → page loads with committed settings (not defaults).
5. Run lint/typecheck:
   - [ ] `pnpm lint` passes.
   - [ ] `pnpm typecheck` passes (if available).

### Completion Criteria
- All checklist items pass.
- No design.md violations.
- No lint or type errors.
