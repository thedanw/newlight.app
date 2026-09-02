'use client'
import { createListCollection } from '@ark-ui/react'
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
import { css } from 'styled-system/css'
import {
  Avatar,
  Button,
  Checkbox,
  Field,
  FileUpload,
  Icon,
  Input,
  RadioCardGroup,
  Select,
  Slider,
  Text,
  toaster,
} from '@/core/ui'
import { useSettings } from '../SettingsProvider'

/* ---------------------------------------------------------------------------
   ChurchInformationSection — the migrated BrandForm surface (8 fields) plus
   4 new fields (Church Name, App Name, Church Email, Website), persisted to
   `platform_settings` (single `app-settings` key, decision #15) and the logo
   uploaded to the `brand-assets` Storage bucket (decision #11).

   The 7 theme knobs write `<html>` data-* attributes and re-theme the WHOLE
   shell live (tokens.md, decision #16); the logo is the ONLY save-on-apply
   field (decision #45) — a dropped file becomes a pending object URL and only
   lands in the committed logo slot when Apply is pressed (uploaded to Storage
   + persisted to the DB).
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

type ChurchInfo = {
  churchName: string
  appName: string
  churchEmail: string
  website: string
}

const EMPTY_CHURCH_INFO: ChurchInfo = {
  churchName: '',
  appName: '',
  churchEmail: '',
  website: '',
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

export default function ChurchInformationSection() {
  const { supabase, getAppSettings, saveAppSettings } = useSettings()
  const [theme, setTheme] = useState<BrandState>(getInitialState)
  const [churchInfo, setChurchInfo] = useState<ChurchInfo>(EMPTY_CHURCH_INFO)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [draftLogoUrl, setDraftLogoUrl] = useState<string | null>(null)
  const [draftLogoFile, setDraftLogoFile] = useState<File | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  // Becomes true when Apply hands the draft URL to the upload path, so the
  // unmount cleanup below doesn't revoke a URL now owned by Storage.
  const logoTransferred = useRef(false)

  // Hydrate initial state from `platform_settings` (key `app-settings`) on
  // mount — theme + church info + committed logo URL.
  useEffect(() => {
    let cancelled = false
    getAppSettings()
      .then((settings) => {
        if (cancelled || !settings) return
        if (settings.theme) {
          setTheme((previous) => ({ ...previous, ...settings.theme }))
        }
        if (settings.churchInfo) {
          setChurchInfo(settings.churchInfo)
        }
        if (settings.logoUrl) {
          setLogoUrl(settings.logoUrl)
        }
      })
      .catch((error) => {
        console.error('Failed to hydrate app settings:', error)
      })
    return () => {
      cancelled = true
    }
  }, [getAppSettings])

  // Live whole-shell re-theme (tokens.md, decision #16): every knob change
  // rewrites the `<html>` data-* attributes immediately — the entire shell
  // (sidebar, header, visible components) re-themes with no rebuild. The logo
  // is deliberately NOT touched here (save-on-apply, decision #45).
  useEffect(() => {
    switchTheme({
      accent: theme.accent,
      gray: theme.gray,
      radius: theme.radius,
      sidebarStyle: theme.sidebarStyle,
      colorScheme: theme.scheme,
      headingStyle: activeHeadingTokens(theme.headings),
      font: theme.font,
    })
    // Fetch the selected family's webfont CSS (once) and write the stack
    // onto <html> — body text AND headings inherit it app-wide.
    applyFont(theme.font)
  }, [theme])

  // Pending logo: revoke the draft on unmount unless it was transferred to
  // Storage (the committed URL is owned by the DB once Apply runs).
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
    setDraftLogoFile(file)
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
    setTheme((previous) => ({
      ...previous,
      headings: { ...previous.headings, [token]: checked },
    }))
  }

  const setChurchField = (field: keyof ChurchInfo, value: string) => {
    setChurchInfo((previous) => ({ ...previous, [field]: value }))
  }

  /** Uploads the draft logo to Storage and returns its public URL. */
  const uploadLogo = async (file: File): Promise<string> => {
    const path = `logos/${crypto.randomUUID()}-${file.name}`
    const { error } = await supabase.storage.from('brand-assets').upload(path, file)
    if (error) throw error
    const { data } = supabase.storage.from('brand-assets').getPublicUrl(path)
    return data.publicUrl
  }

  const handleApply = async () => {
    setSaving(true)
    try {
      let finalLogoUrl = logoUrl
      if (draftLogoFile !== null) {
        finalLogoUrl = await uploadLogo(draftLogoFile)
        logoTransferred.current = true
        setLogoUrl(finalLogoUrl)
        setDraftLogoUrl(null)
        setDraftLogoFile(null)
      }
      await saveAppSettings({
        theme,
        churchInfo,
        logoUrl: finalLogoUrl,
      })
      toaster.create({ title: 'Settings saved', type: 'success' })
      // Notify AppTitleSync to update document.title
      window.dispatchEvent(new CustomEvent('app-settings-changed'))
    } catch (error) {
      console.error('Failed to save settings:', error)
      toaster.create({ title: 'Failed to save settings', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (draftLogoUrl !== null) URL.revokeObjectURL(draftLogoUrl)
    setDraftLogoUrl(null)
    setDraftLogoFile(null)
    setLogoError(null)
  }

  const previewLogo = draftLogoUrl ?? logoUrl

  return (
    <Stack gap="6">
      {/* 0 — Church info (4 new fields) */}
      <Stack gap="4">
        <Field.Root>
          <Field.Label>Church Name</Field.Label>
          <Input
            value={churchInfo.churchName}
            onChange={(event) => setChurchField('churchName', event.target.value)}
            placeholder="New Light Church"
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>App Name</Field.Label>
          <Input
            value={churchInfo.appName}
            onChange={(event) => setChurchField('appName', event.target.value)}
            placeholder="New Light"
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>Church Email</Field.Label>
          <Input
            type="email"
            value={churchInfo.churchEmail}
            onChange={(event) => setChurchField('churchEmail', event.target.value)}
            placeholder="hello@newlight.church"
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>Website</Field.Label>
          <Input
            type="url"
            value={churchInfo.website}
            onChange={(event) => setChurchField('website', event.target.value)}
            placeholder="https://newlight.church"
          />
        </Field.Root>
      </Stack>

      <Box borderTopWidth="1px" borderColor="border" />

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
            ? 'Pending — press Apply to upload it to Storage.'
            : 'Saved on Apply only — uploaded to Storage and persisted.'}
        </Field.HelperText>
      </Field.Root>

      {/* Brand slot preview (Avatar or Image, decision #33). Logo rule:
          transparent background behind a logo — strip the Avatar recipe bg
          whenever an image is shown; keep it for the initials fallback. */}
      <HStack gap="3">
        <Avatar.Root
          size="lg"
          className={previewLogo ? css({ background: 'transparent' }) : undefined}
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
            variant={theme.scheme === 'light' ? 'solid' : 'outline'}
            onClick={() => setTheme((s) => ({ ...s, scheme: 'light' }))}
          >
            Light
          </Button>
          <Button
            flex="1"
            size="sm"
            variant={theme.scheme === 'dark' ? 'solid' : 'outline'}
            onClick={() => setTheme((s) => ({ ...s, scheme: 'dark' }))}
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
        value={theme.sidebarStyle}
        onChange={(value) => setTheme((s) => ({ ...s, sidebarStyle: value as SidebarStyle }))}
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
          value={theme.gray}
          onValueChange={(details) =>
            setTheme((s) => ({ ...s, gray: (details.value ?? s.gray) as Gray }))
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
          value={theme.accent}
          onValueChange={(details) =>
            setTheme((s) => ({ ...s, accent: (details.value ?? s.accent) as Accent }))
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
          value={[RADII.indexOf(theme.radius)]}
          onValueChange={(details) => setTheme((s) => ({ ...s, radius: RADII[details.value[0]] }))}
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
          {theme.radius} — shifts radii l1/l2/l3 across the shell.
        </Field.HelperText>
      </Field.Root>

      {/* 3 — Font (webfont CSS fetched per selection — see font-loader.ts) */}
      <ThemeSelect
        label="Font"
        items={FONT_OPTIONS}
        value={theme.font}
        onChange={(value) => setTheme((s) => ({ ...s, font: value as FontKey }))}
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
              checked={theme.headings[option.value]}
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

      {/* Footer — Apply persists everything (+ uploads the logo); Cancel
          discards the pending logo draft. */}
      <HStack justify="flex-end" gap="2">
        <Button variant="outline" onClick={handleCancel} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleApply} disabled={saving}>
          {saving ? 'Saving…' : 'Apply'}
        </Button>
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