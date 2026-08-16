'use client'
import { createListCollection } from '@ark-ui/react/collection'
import type { FileUploadFileRejectDetails } from '@ark-ui/react/file-upload'
import { CloudUploadIcon } from 'lucide-react'
import { switchTheme } from '@/core/theme/theme-loader'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, HStack, Stack } from 'styled-system/jsx'
import {
  Avatar,
  Button,
  Checkbox,
  Field,
  FileUpload,
  Heading,
  Icon,
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
type Accent = 'orange' | 'green' | 'violet' | 'mint'
type Gray = 'neutral'
type RadiusKey = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
type SidebarStyle = 'light' | 'dark' | 'brand-dark' | 'brand-light'
type FontKey = 'inter' | 'poppins' | 'raleway' | 'dm-sans'
type HeadingToken = 'bold' | 'uppercase' | 'accent'

type BrandState = {
  scheme: ColorScheme
  accent: Accent
  gray: Gray
  font: FontKey
  radius: RadiusKey
  sidebarStyle: SidebarStyle
  headingStyle: HeadingToken[]
}

/* --- Preset catalog (tokens.md knobs table) -------------------------------- */

const RADII: RadiusKey[] = ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl']
const RADIUS_MARKS = RADII.map((radius, index) => ({ value: index, label: radius }))

/** Only Inter is actually loaded (B4); the others preview via font fallback. */
const FONT_FAMILIES: Record<FontKey, string> = {
  inter: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
  poppins: "'Poppins', 'Inter', ui-sans-serif, system-ui, sans-serif",
  raleway: "'Raleway', 'Inter', ui-sans-serif, system-ui, sans-serif",
  'dm-sans': "'DM Sans', 'Inter', ui-sans-serif, system-ui, sans-serif",
}

const FONT_OPTIONS: Array<{ label: string; value: FontKey }> = [
  { label: 'Inter', value: 'inter' },
  { label: 'Poppins', value: 'poppins' },
  { label: 'Raleway', value: 'raleway' },
  { label: 'DM Sans', value: 'dm-sans' },
]

const GRAY_OPTIONS: Array<{ label: string; value: Gray }> = [{ label: 'Neutral', value: 'neutral' }]

const ACCENT_OPTIONS: Array<{ label: string; value: Accent }> = [
  { label: 'Orange', value: 'orange' },
  { label: 'Green', value: 'green' },
  { label: 'Violet', value: 'violet' },
  { label: 'Mint', value: 'mint' },
]

const SIDEBAR_OPTIONS: Array<{ label: string; value: SidebarStyle }> = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'Brand (dark text)', value: 'brand-dark' },
  { label: 'Brand (light text)', value: 'brand-light' },
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
      headingStyle: state.headingStyle.join(' '),
      font: state.font,
    })
    const root = document.documentElement
    root.style.fontFamily = FONT_FAMILIES[state.font]
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

  const toggleHeading = (token: HeadingToken, checked: boolean) => {
    setState((previous) => ({
      ...previous,
      headingStyle: checked
        ? [...previous.headingStyle, token]
        : previous.headingStyle.filter((entry) => entry !== token),
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
      <Stack gap="1">
        <Heading textStyle="md">Brand settings</Heading>
        <Text color="fg.muted" textStyle="sm">
          Theme knobs re-theme the whole shell live. Your logo is committed when
          you press Apply.
        </Text>
      </Stack>

      <Box borderTopWidth="1px" borderColor="border" />

      {/* 1 — Logo (save-on-apply, decisions #40/#42/#43/#45) */}
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

      {/* Brand slot preview (Avatar or Image, decision #33) */}
      <HStack gap="3">
        <Avatar.Root size="lg">
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

      {/* 3 — Font (decisions #41/#44 — Inter only loads in-lab) */}
      <ThemeSelect
        label="Font"
        items={FONT_OPTIONS}
        value={state.font}
        onChange={(value) => setState((s) => ({ ...s, font: value as FontKey }))}
        helperText="Inter is the only bundled font — the others preview via fallback."
      />

      {/* 4 — Gray */}
      <ThemeSelect
        label="Neutral (gray)"
        items={GRAY_OPTIONS}
        value={state.gray}
        onChange={(value) => setState((s) => ({ ...s, gray: value as Gray }))}
        helperText="Sand is the only installed neutral right now."
      />

      {/* 5 — Accent */}
      <ThemeSelect
        label="Accent color"
        items={ACCENT_OPTIONS}
        value={state.accent}
        onChange={(value) => setState((s) => ({ ...s, accent: value as Accent }))}
        helperText="Re-maps the color-palette across every recipe."
      />

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

      {/* 7 — Sidebar style (decision #45/#60) */}
      <ThemeSelect
        label="Sidebar style"
        items={SIDEBAR_OPTIONS}
        value={state.sidebarStyle}
        onChange={(value) => setState((s) => ({ ...s, sidebarStyle: value as SidebarStyle }))}
        helperText="Sidebar background / text pair (light, dark, or brand)."
      />

      {/* 8 — Heading style checkboxes (decision #46/#61) */}
      <Field.Root>
        <Field.Label>Heading style</Field.Label>
        <Stack gap="2">
          {HEADING_OPTIONS.map((option) => (
            <Checkbox.Root
              key={option.value}
              checked={state.headingStyle.includes(option.value)}
              onCheckedChange={(details) => toggleHeading(option.value, details.checked === true)}
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
  return {
    scheme: (root.getAttribute('data-mode') as ColorScheme) ?? 'light',
    accent: (root.getAttribute('data-color-scheme') as Accent) ?? 'orange',
    gray: (root.getAttribute('data-gray-color') as Gray) ?? 'neutral',
    font: getInitialFont(root),
    radius: (root.getAttribute('data-radius') as RadiusKey) ?? 'md',
    sidebarStyle: (root.getAttribute('data-sidebar-style') as SidebarStyle) ?? 'light',
    headingStyle: ((root.getAttribute('data-heading-style') ?? '').split(' ').filter(
      Boolean,
    ) as HeadingToken[]),
  }
}

function getInitialFont(root: HTMLElement): FontKey {
  const inline = root.style.fontFamily
  if (inline.includes('Poppins')) return 'poppins'
  if (inline.includes('Raleway')) return 'raleway'
  if (inline.includes('DM Sans')) return 'dm-sans'
  return 'inter'
}
