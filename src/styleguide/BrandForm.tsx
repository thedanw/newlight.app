'use client'
import { createListCollection } from '@ark-ui/react/collection'
import type { FileUploadFileRejectDetails } from '@ark-ui/react/file-upload'
import { CloudUploadIcon } from 'lucide-react'
import { switchTheme } from '@/core/theme/theme-loader'
import {
  applyFont,
  detectFont,
  FONT_OPTIONS,
  type FontKey,
} from '@/core/theme/font-loader'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, HStack, Stack } from 'styled-system/jsx'
import {
  Avatar,
  Button,
  Checkbox,
  Field,
  FileUpload,
  Icon,
  RadioCardGroup,
  Select,
  Slider,
  Text,
} from '@/core/ui'

/* ---------------------------------------------------------------------------
   BrandForm — the 8-field brand-settings surface (temp-styleguide #38, #13).
   Opens as a native Park UI Drawer from the header kebab. The 7 theme knobs
   write `<html>` data-* attributes and re-theme the WHOLE shell live
   (tokens.md, decision #16); the logo is the ONLY save-on-apply field
   (decision #45) — a dropped file becomes a pending object URL and only lands
   in the committed brand slot (sidebar, App.tsx) when Apply is pressed.
   Pure local emulation: no persistence, no super-admin gate (YAGNI yet).
--------------------------------------------------------------------------- */

type ColorScheme = 'light' | 'dark'
/** All 26 Park UI accents (25 chromatic + neutral as monochrome accent). */
type Accent =
  | 'amber'
  | 'blue'
  | 'bronze'
  | 'brown'
  | 'crimson'
  | 'cyan'
  | 'gold'
  | 'grass'
  | 'green'
  | 'indigo'
  | 'iris'
  | 'jade'
  | 'lime'
  | 'mint'
  | 'neutral'
  | 'orange'
  | 'pink'
  | 'plum'
  | 'purple'
  | 'red'
  | 'ruby'
  | 'sky'
  | 'teal'
  | 'tomato'
  | 'violet'
  | 'yellow'
type Gray = 'neutral' | 'mauve' | 'olive' | 'sage' | 'sand' | 'slate'
type RadiusKey = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
type SidebarStyle = 'light' | 'dark' | 'accent-dark' | 'accent-light'
type HeadingToken = 'bold' | 'uppercase' | 'accent'

type BrandState = {
  scheme: ColorScheme
  accent: Accent
  gray: Gray
  font: FontKey
  radius: RadiusKey
  sidebarStyle: SidebarStyle
  /** One independent boolean per heading token (decision #46/#61). */
  headings: Record<HeadingToken, boolean>
}

/* --- Preset catalog (tokens.md knobs table) -------------------------------- */

const RADII: RadiusKey[] = ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl']
const RADIUS_MARKS = RADII.map((radius, index) => ({ value: index, label: radius }))

/** The six Park UI greys (all CLI-installed into src/core/theme/colors). */
const GRAY_OPTIONS: Array<{ label: string; value: Gray }> = [
  { label: 'neutral', value: 'neutral' },
  { label: 'mauve', value: 'mauve' },
  { label: 'olive', value: 'olive' },
  { label: 'sage', value: 'sage' },
  { label: 'sand', value: 'sand' },
  { label: 'slate', value: 'slate' },
]

/**
 * Step-9 swatch hexes, hard-coded on purpose: only the selected palette's
 * compiled CSS is loaded at runtime, so token vars (--colors-mauve-9) don't
 * exist for the inactive greys and can't paint the swatches. Values =
 * light-mode step 9 of each Park UI package.
 */
const GRAY_SWATCHES: Record<Gray, string> = {
  neutral: '#8d8d8d',
  mauve: '#8e8c99',
  olive: '#898e87',
  sage: '#868e8b',
  sand: '#8d8d86',
  slate: '#8b8d98',
}

/**
 * All 26 Park UI accents in hue order (mirrors the Park UI docs picker).
 * Every palette is CLI-installed into src/core/theme/colors/<name>.ts and
 * compiled ahead of time to public/core/theme/colors/<name>.css;
 * theme-loader.js dynamically fetches ONLY the file for the scheme in use.
 */
const ACCENT_OPTIONS: Array<{ label: string; value: Accent }> = [
  { label: 'neutral', value: 'neutral' },
  { label: 'tomato', value: 'tomato' },
  { label: 'red', value: 'red' },
  { label: 'ruby', value: 'ruby' },
  { label: 'crimson', value: 'crimson' },
  { label: 'pink', value: 'pink' },
  { label: 'plum', value: 'plum' },
  { label: 'purple', value: 'purple' },
  { label: 'violet', value: 'violet' },
  { label: 'iris', value: 'iris' },
  { label: 'indigo', value: 'indigo' },
  { label: 'blue', value: 'blue' },
  { label: 'cyan', value: 'cyan' },
  { label: 'teal', value: 'teal' },
  { label: 'jade', value: 'jade' },
  { label: 'green', value: 'green' },
  { label: 'grass', value: 'grass' },
  { label: 'bronze', value: 'bronze' },
  { label: 'gold', value: 'gold' },
  { label: 'brown', value: 'brown' },
  { label: 'orange', value: 'orange' },
  { label: 'amber', value: 'amber' },
  { label: 'yellow', value: 'yellow' },
  { label: 'lime', value: 'lime' },
  { label: 'mint', value: 'mint' },
  { label: 'sky', value: 'sky' },
]

/**
 * Step-9 swatch hexes, hard-coded on purpose (same rationale as
 * GRAY_SWATCHES): only the selected palette's compiled CSS is loaded at
 * runtime, so token vars (--colors-blue-9) don't exist for the inactive
 * accents and can't paint the swatches. Values = light-mode step 9 of each
 * Park UI accent package, extracted from the generated
 * public/core/theme/colors/<name>.css files.
 */
const ACCENT_SWATCHES: Record<Accent, string> = {
  amber: '#ffc53d',
  blue: '#0090ff',
  bronze: '#a18072',
  brown: '#ad7f58',
  crimson: '#e93d82',
  cyan: '#00a2c7',
  gold: '#978365',
  grass: '#46a758',
  green: '#30a46c',
  indigo: '#3e63dd',
  iris: '#5b5bd6',
  jade: '#29a383',
  lime: '#bdee63',
  mint: '#86ead4',
  neutral: '#8d8d8d',
  orange: '#f76b15',
  pink: '#d6409f',
  plum: '#ab4aba',
  purple: '#8e4ec6',
  red: '#e5484d',
  ruby: '#e54666',
  sky: '#7ce2fe',
  teal: '#12a594',
  tomato: '#e54d2e',
  violet: '#6e56cf',
  yellow: '#ffe629',
}

const SIDEBAR_OPTIONS: Array<{ label: string; value: SidebarStyle }> = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'Accent Dark', value: 'accent-dark' },
  { label: 'Accent Light', value: 'accent-light' },
]

const HEADING_OPTIONS: Array<{ value: HeadingToken; label: string }> = [
  { value: 'bold', label: 'Bold' },
  { value: 'uppercase', label: 'Uppercase' },
  { value: 'accent', label: 'Accent color' },
]

export type BrandFormProps = {
  /** Currently committed logo object URL (parent-owned), or null. */
  logo: string | null
  /** Called with the new committed logo URL when Apply is pressed. */
  onApplyLogo: (url: string) => void
  onClose: () => void
}

export function BrandForm({ logo, onApplyLogo, onClose }: BrandFormProps) {
  const [state, setState] = useState<BrandState>(getInitialState)
  const [draftLogoUrl, setDraftLogoUrl] = useState<string | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  // Becomes true when Apply hands the draft URL to the parent, so the unmount
  // cleanup below doesn't revoke a URL the sidebar is now rendering.
  const logoTransferred = useRef(false)

  // Live whole-shell re-theme (tokens.md, decision #16): every knob change
  // rewrites the `<html>` data-* attributes immediately — the entire shell
  // (sidebar, header, visible components) re-themes with no rebuild. The logo
  // is deliberately NOT touched here (save-on-apply, decision #45).
  useEffect(() => {
    // Live whole-shell re-theme via the dynamic theme loader: it loads the
    // selected color-scheme CSS (remap-only, no hex) and writes the matching
    // <html> data-* attributes. data-color-scheme carries the accent scheme;
    // light/dark mode lives on data-mode (Park UI color refactor).
    switchTheme({
      accent: state.accent,
      gray: state.gray,
      radius: state.radius,
      sidebarStyle: state.sidebarStyle,
      colorScheme: state.scheme,
      headingStyle: activeHeadingTokens(state.headings),
      font: state.font,
    })
    // Fetch the selected family's webfont CSS (once) and write the stack
    // onto <html> — body text AND headings inherit it app-wide.
    applyFont(state.font)
  }, [state])

  // Pending logo: revoke the draft on unmount unless it was transferred to the
  // parent (App.tsx owns committed URLs once Apply hands them over).
  useEffect(() => {
    return () => {
      if (draftLogoUrl !== null && !logoTransferred.current) {
        URL.revokeObjectURL(draftLogoUrl)
      }
    }
  }, [draftLogoUrl])

  const handleFileAccept = (file: File) => {
    setLogoError(null)
    const url = URL.createObjectURL(file)
    setDraftLogoUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return url
    })
  }

  const handleFileReject = (details: FileUploadFileRejectDetails) => {
    const error = details.files[0]?.errors[0]
    if (error === 'FILE_TOO_LARGE') {
      setLogoError('Logo is too large — keep it under 1 MB.')
    } else if (error === 'FILE_INVALID_TYPE') {
      setLogoError('Unsupported file type — use PNG, SVG, WebP or JPG.')
    } else {
      setLogoError('That file could not be used — use a PNG, SVG, WebP or JPG up to 1 MB.')
    }
  }

  const setHeading = (token: HeadingToken, checked: boolean) => {
    setState((previous) => ({
      ...previous,
      headings: { ...previous.headings, [token]: checked },
    }))
  }

  const handleApply = () => {
    if (draftLogoUrl !== null) {
      logoTransferred.current = true
      onApplyLogo(draftLogoUrl)
      setDraftLogoUrl(null)
    }
    onClose()
  }

  const handleCancel = () => {
    if (draftLogoUrl !== null) URL.revokeObjectURL(draftLogoUrl)
    setDraftLogoUrl(null)
    setLogoError(null)
    onClose()
  }

  const previewLogo = draftLogoUrl ?? logo

  return (
    <Stack gap="6">

      {/* 1 — Logo (save-on-apply) */}
      <Field.Root invalid={logoError !== null}>
        <Field.Label>Logo</Field.Label>
        <FileUpload.Root
          accept="image/png,image/svg+xml,image/webp,image/jpeg"
          maxFiles={1}
          maxFileSize={1024 * 1024}
          onFileAccept={(details) => handleFileAccept(details.files[0])}
          onFileReject={handleFileReject}
        >
          <FileUpload.Dropzone>
            <Stack gap="2" align="center" py="6">
              <Icon size="lg">
                <CloudUploadIcon />
              </Icon>
              <Text textStyle="sm" fontWeight="medium">
                Drag a logo here or click to browse
              </Text>
              <Text textStyle="xs" color="fg.muted">
                PNG, SVG, WebP or JPG · max 1 MB · square
              </Text>
            </Stack>
          </FileUpload.Dropzone>
          <FileUpload.HiddenInput />
        </FileUpload.Root>
        {logoError && <Field.ErrorText>{logoError}</Field.ErrorText>}
        <Field.HelperText>
          {draftLogoUrl !== null
            ? 'Pending — press Apply to save it to the brand slot.'
            : 'Saved on Apply only — appears in the sidebar brand slot.'}
        </Field.HelperText>
      </Field.Root>

      {/* Brand slot preview (Avatar or Image, decision #33). Logo rule:
          transparent background behind a logo — strip the Avatar recipe bg
          whenever an image is shown; keep it for the initials fallback. */}
      <HStack gap="3">
        <Avatar.Root
          size="lg"
          style={previewLogo ? { background: 'transparent' } : undefined}
        >
          {previewLogo ? <Avatar.Image src={previewLogo} alt="Logo" /> : null}
          <Avatar.Fallback name="New Light" />
        </Avatar.Root>
        <Stack gap="0.5">
          <Text textStyle="sm" fontWeight="semibold">
            {previewLogo ? 'Logo ready' : 'No logo yet'}
          </Text>
          <Text textStyle="xs" color="fg.muted">
            {draftLogoUrl !== null ? 'Preview — not applied yet.' : 'Current committed brand mark.'}
          </Text>
        </Stack>
      </HStack>

      <Box borderTopWidth="1px" borderColor="border" />

      {/* 2 — Color scheme (segmented toggle, decision #13) */}
      <Field.Root>
        <Field.Label>Color scheme</Field.Label>
        <HStack gap="2">
          <Button
            flex="1"
            size="sm"
            variant={state.scheme === 'light' ? 'solid' : 'outline'}
            onClick={() => setState((s) => ({ ...s, scheme: 'light' }))}
          >
            Light
          </Button>
          <Button
            flex="1"
            size="sm"
            variant={state.scheme === 'dark' ? 'solid' : 'outline'}
            onClick={() => setState((s) => ({ ...s, scheme: 'dark' }))}
          >
            Dark
          </Button>
        </HStack>
        <Field.HelperText>Flips the whole shell between light and dark.</Field.HelperText>
      </Field.Root>

      {/* 7 — Sidebar style (decision #45/#60) */}
      <ThemeSelect
        label="Sidebar style"
        items={SIDEBAR_OPTIONS}
        value={state.sidebarStyle}
        onChange={(value) => setState((s) => ({ ...s, sidebarStyle: value as SidebarStyle }))}
        helperText="Sidebar background / text pair (light, dark, or brand)."
      />
      {/* 4 — Gray (radio cards; swatch hexes are hard-coded — see GRAY_SWATCHES) */}
      <Field.Root>
        <Field.Label>Gray</Field.Label>
        <RadioCardGroup.Root
          aria-label="Gray"
          display="grid"
          gridTemplateColumns="repeat(3, 1fr)"
          gap="1.5"
          value={state.gray}
          onValueChange={(details) =>
            setState((s) => ({ ...s, gray: (details.value ?? s.gray) as Gray }))
          }
        >
          {GRAY_OPTIONS.map((option) => (
            <RadioCardGroup.Item
              key={option.value}
              value={option.value}
              height="9"
              py="0"
              justifyContent="flex-start"
              css={{ _checked: { borderColor: 'gray.9', boxShadowColor: 'gray.9' } }}
            >
              <Box
                flex="0 0 auto"
                width="3.5"
                height="3.5"
                borderRadius="full"
                style={{ background: GRAY_SWATCHES[option.value] }}
              />
              <RadioCardGroup.ItemText textTransform="capitalize">{option.label}</RadioCardGroup.ItemText>
              <RadioCardGroup.ItemHiddenInput />
            </RadioCardGroup.Item>
          ))}
        </RadioCardGroup.Root>
        <Field.HelperText>
          Only the selected theme file loads at runtime — swatches are hard-coded hexes.
        </Field.HelperText>
      </Field.Root>

      {/* 5 — Accent (radio cards; swatch hexes are hard-coded — see
          ACCENT_SWATCHES). Selecting one swaps data-color-scheme and
          theme-loader.js fetches only that palette's compiled CSS. */}
      <Field.Root>
        <Field.Label>Accent color</Field.Label>
        <RadioCardGroup.Root
          aria-label="Accent color"
          display="grid"
          gridTemplateColumns="repeat(3, 1fr)"
          gap="1.5"
          value={state.accent}
          onValueChange={(details) =>
            setState((s) => ({ ...s, accent: (details.value ?? s.accent) as Accent }))
          }
        >
          {ACCENT_OPTIONS.map((option) => (
            <RadioCardGroup.Item
              key={option.value}
              value={option.value}
              height="9"
              py="0"
              justifyContent="flex-start"
              css={{ _checked: { borderColor: 'gray.9', boxShadowColor: 'gray.9' } }}
            >
              <Box
                flex="0 0 auto"
                width="3.5"
                height="3.5"
                borderRadius="full"
                style={{ background: ACCENT_SWATCHES[option.value] }}
              />
              <RadioCardGroup.ItemText textTransform="capitalize">{option.label}</RadioCardGroup.ItemText>
              <RadioCardGroup.ItemHiddenInput />
            </RadioCardGroup.Item>
          ))}
        </RadioCardGroup.Root>
        <Field.HelperText>
          Only the selected theme file loads at runtime — swatches are hard-coded hexes.
        </Field.HelperText>
      </Field.Root>

      {/* 6 — Radius (native Slider + marks, decision #49) */}
      <Field.Root>
        <Field.Label>Corner radius</Field.Label>
        <Slider.Root
          min={0}
          max={RADII.length - 1}
          step={1}
          value={[RADII.indexOf(state.radius)]}
          onValueChange={(details) => setState((s) => ({ ...s, radius: RADII[details.value[0]] }))}
        >
          <Slider.Control>
            <Slider.Track>
              <Slider.Range />
            </Slider.Track>
            <Slider.Thumbs />
          </Slider.Control>
          <Slider.Marks marks={RADIUS_MARKS} />
        </Slider.Root>
        <Field.HelperText>
          {state.radius} — shifts radii l1/l2/l3 across the shell.
        </Field.HelperText>
      </Field.Root>

      {/* 3 — Font (webfont CSS fetched per selection — see font-loader.ts) */}
      <ThemeSelect
        label="Font"
        items={FONT_OPTIONS}
        value={state.font}
        onChange={(value) => setState((s) => ({ ...s, font: value as FontKey }))}
        helperText="Fetches the selected webfont and re-fonts the whole shell live."
      />
      {/* 8 — Heading style checkboxes (decision #46/#61) */}
      <Field.Root>
        <Field.Label>Heading style</Field.Label>
        <Stack gap="2">
          {HEADING_OPTIONS.map((option) => (
            <Checkbox.Root
              key={option.value}
              // Unique ids per checkbox: a shared Field.Root otherwise hands the
              // same hidden-input id to every control beneath it, so each
              // label's click lands on the FIRST input in the DOM.
              ids={{
                root: `heading-style-${option.value}`,
                hiddenInput: `heading-style-${option.value}-input`,
              }}
              checked={state.headings[option.value]}
              onCheckedChange={(details) => setHeading(option.value, details.checked === true)}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Label>{option.label}</Checkbox.Label>
            </Checkbox.Root>
          ))}
        </Stack>
        <Field.HelperText>
          Independent toggles — written space-separated to data-heading-style.
        </Field.HelperText>
      </Field.Root>

      <Box borderTopWidth="1px" borderColor="border" />

      {/* Footer — Apply commits the logo (+ re-applies attrs); Cancel discards */}
      <HStack justify="flex-end" gap="2">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleApply}>Apply</Button>
      </HStack>
    </Stack>
  )
}

/* --- Small Select-field wrapper (4 of the 8 fields share this shape) ------- */

function ThemeSelect({
  label,
  items,
  value,
  onChange,
  helperText,
}: {
  label: string
  items: Array<{ label: string; value: string }>
  value: string
  onChange: (value: string) => void
  helperText?: string
}) {
  const collection = useMemo(() => createListCollection({ items }), [items])

  return (
    <Field.Root>
      <Field.Label>{label}</Field.Label>
      <Select.Root
        collection={collection}
        value={[value]}
        onValueChange={(details) => onChange(details.value[0])}
      >
        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder="Select…" />
            <Select.Indicator />
          </Select.Trigger>
        </Select.Control>
        <Select.Positioner>
          <Select.Content>
            {items.map((item) => (
              <Select.Item key={item.value} item={item}>
                <Select.ItemText>{item.label}</Select.ItemText>
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Select.Root>
      {helperText && <Field.HelperText>{helperText}</Field.HelperText>}
    </Field.Root>
  )
}

/* --- Initial state is read from the live `<html>` attributes -------------- */

function getInitialState(): BrandState {
  const root = document.documentElement
  const headingTokens = (root.getAttribute('data-heading-style') ?? '')
    .split(' ')
    .filter(Boolean)
  return {
    scheme: (root.getAttribute('data-mode') as ColorScheme) ?? 'light',
    accent: (root.getAttribute('data-color-scheme') as Accent) ?? 'orange',
    gray: (root.getAttribute('data-gray-color') as Gray) ?? 'neutral',
    font: detectFont(root),
    radius: (root.getAttribute('data-radius') as RadiusKey) ?? 'md',
    sidebarStyle: (root.getAttribute('data-sidebar-style') as SidebarStyle) ?? 'light',
    headings: Object.fromEntries(
      HEADING_OPTIONS.map(({ value }) => [value, headingTokens.includes(value)]),
    ) as Record<HeadingToken, boolean>,
  }
}

/** Canonical space-separated data-heading-style value, in knob order. */
function activeHeadingTokens(headings: Record<HeadingToken, boolean>): string {
  return HEADING_OPTIONS.filter((option) => headings[option.value])
    .map((option) => option.value)
    .join(' ')
}
