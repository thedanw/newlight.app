'use client'
import { createListCollection } from '@ark-ui/react'
import type { FileUploadFileRejectDetails } from '@ark-ui/react/file-upload'
import { CloudUploadIcon } from 'lucide-react'
import { switchTheme } from '@/core/theme/theme-loader'
import type {
  AccentScheme as Accent,
  GrayScheme as Gray,
  RadiusKey,
  SidebarStyle,
} from '@/core/theme/theme-loader'
import { applyFont, FONT_OPTIONS, type FontKey } from '@/core/theme/font-loader'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Box, HStack, Stack } from 'styled-system/jsx'
import { css } from 'styled-system/css'
import {
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Field,
  FileUpload,
  Heading,
  Icon,
  Input,
  RadioCardGroup,
  Select,
  Slider,
  Text,
} from '@/core/ui'
import { useSettings } from '../lib/provider'
import {
  activeHeadingTokens,
  HEADING_TOKENS,
  useAppSettingsForm,
  type ThemeState,
} from '../lib/app-settings'

/* ---------------------------------------------------------------------------
   ChurchAppearancePage — hosted content-only "Appearance" settings section
   (decision #13): app name, logo (uploaded to the `brand-assets` bucket,
   decision #11), and every theme knob (scheme, accent, gray, sidebar,
   radius, font, headings) with live preview (ui-ux 10.9), persisted to
   `platform_settings` (single `app-settings` key, decision #15).

   Hydration / Apply / Cancel live in `useAppSettingsForm`
   (../lib/app-settings.ts), which re-saves the whole `app-settings` object
   so the General page's fields pass through untouched. Hosted content-only
   page — the settings split shell (../dashboard.tsx) owns the Page scaffold.
------------------------------------------------------------------------- */

type HeadingToken = (typeof HEADING_TOKENS)[number]

const RADII: RadiusKey[] = ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl']
const RADIUS_MARKS = RADII.map((radius, index) => ({ value: index, label: radius }))

const GRAY_OPTIONS: Array<{ label: string; value: Gray }> = [
  { label: 'neutral', value: 'neutral' },
  { label: 'mauve', value: 'mauve' },
  { label: 'olive', value: 'olive' },
  { label: 'sage', value: 'sage' },
  { label: 'sand', value: 'sand' },
  { label: 'slate', value: 'slate' },
]

const GRAY_SWATCHES: Record<Gray, string> = {
  neutral: '#8d8d8d',
  mauve: '#8e8c99',
  olive: '#898e87',
  sage: '#868e8b',
  sand: '#8d8d86',
  slate: '#8b8d98',
}

const ACCENT_OPTIONS: Array<{ label: string; value: Accent }> = [
  { label: 'neutral', value: 'neutral' },
  { label: 'tomato', value: 'tomato' },
  { label: 'red', value: 'red' },
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

export default function ChurchAppearancePage() {
  const { supabase } = useSettings()

  const uploadLogo = async (file: File): Promise<string> => {
    const path = `logos/${crypto.randomUUID()}-${file.name}`
    const { error } = await supabase.storage.from('brand-assets').upload(path, file)
    if (error) throw error
    const { data } = supabase.storage.from('brand-assets').getPublicUrl(path)
    return data.publicUrl
  }

  const {
    theme,
    setTheme,
    churchInfo,
    setChurchField,
    logoUrl,
    setLogoUrl,
    hydrated,
    markDirty,
  } = useAppSettingsForm({
    // Upload any pending draft logo before the shared save runs, so the new
    // URL lands in the same `app-settings` payload (decision #11).
    prepareApply: async () => {
      if (draftLogoFile === null) return
      const finalLogoUrl = await uploadLogo(draftLogoFile)
      logoTransferred.current = true
      setLogoUrl(finalLogoUrl)
      setDraftLogoUrl(null)
      setDraftLogoFile(null)
    },
  })

  const [draftLogoUrl, setDraftLogoUrl] = useState<string | null>(null)
  const [draftLogoFile, setDraftLogoFile] = useState<File | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const logoTransferred = useRef(false)

  // Live theme preview — re-themes the shell on every draft change
  // (ui-ux 10.9). Gated on hydration so the boot theme isn't clobbered.
  useEffect(() => {
    if (!hydrated) return
    switchTheme({
      accent: theme.accent,
      gray: theme.gray,
      radius: theme.radius,
      sidebarStyle: theme.sidebarStyle,
      colorScheme: theme.scheme,
      headingStyle: activeHeadingTokens(theme.headings),
      font: theme.font,
    })
    applyFont(theme.font)
  }, [theme, hydrated])

  useEffect(() => {
    return () => {
      if (draftLogoUrl !== null && !logoTransferred.current) {
        URL.revokeObjectURL(draftLogoUrl)
      }
    }
  }, [draftLogoUrl])

  /** Single dirty-marking theme update for every control on this page. */
  const changeTheme = useCallback(
    (patch: Partial<ThemeState> | ((previous: ThemeState) => ThemeState)) => {
      setTheme((previous) =>
        typeof patch === 'function' ? patch(previous) : { ...previous, ...patch },
      )
      markDirty()
    },
    [setTheme, markDirty],
  )

  const handleFileAccept = (file: File) => {
    setLogoError(null)
    const url = URL.createObjectURL(file)
    setDraftLogoUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return url
    })
    setDraftLogoFile(file)
    markDirty()
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
    changeTheme((previous) => ({
      ...previous,
      headings: { ...previous.headings, [token]: checked },
    }))
  }

  const previewLogo = draftLogoUrl ?? logoUrl

  return (
    <>
        <Stack>
               
          <Card.Root>
            <Card.Header>
              <Heading textStyle="md">Brand Identity</Heading>
            </Card.Header>
            <Card.Body>
              <Stack>
                <Field.Root>
                  <Field.Label>App Name</Field.Label>
                  <Input
                    value={churchInfo.appName}
                    onChange={(event) => setChurchField('appName', event.target.value)}
                    placeholder="New Light"
                  />
                  <Field.HelperText>
                    Shown in the browser tab and on the login screen.
                  </Field.HelperText>
                </Field.Root>
                <Stack
                 
                  display={{ base: 'grid', md: 'grid' }}
                  gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }}
                  alignItems="center"
                >
                  <Field.Root invalid={logoError !== null}>
                    <Field.Label>Logo</Field.Label>
                    <FileUpload.Root
                      accept="image/png,image/svg+xml,image/webp,image/jpeg"
                      maxFiles={1}
                      maxFileSize={1024 * 1024}
                      onFileAccept={(details) => handleFileAccept(details.files[0])}
                      onFileReject={handleFileReject}
                    >
                      <FileUpload.Dropzone
                        className={css({
                          borderStyle: 'dashed',
                          borderWidth: '1px',
                          borderRadius: 'l2',
                          padding: '4',
                          minHeight: '0',
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
                      <FileUpload.HiddenInput />
                    </FileUpload.Root>
                    {logoError && <Field.ErrorText>{logoError}</Field.ErrorText>}
                    <Field.HelperText>
                      {draftLogoUrl !== null
                        ? 'Pending — press Apply to upload it to Storage.'
                        : 'Saved on Apply only — uploaded to Storage and persisted.'}
                    </Field.HelperText>
                  </Field.Root>

                  <Stack align="center" justify="center">
                    <Avatar.Root
                      size="lg"
                      className={previewLogo ? css({ background: 'transparent' }) : undefined}
                    >
                      {previewLogo ? <Avatar.Image src={previewLogo} alt="Logo" /> : null}
                      <Avatar.Fallback name="New Light" />
                    </Avatar.Root>
                    <Stack gap="0" textAlign="center">
                      <Text textStyle="sm" fontWeight="semibold">
                        {previewLogo ? 'Logo ready' : 'No logo yet'}
                      </Text>
                      <Text textStyle="xs" color="fg.muted">
                        {draftLogoUrl !== null ? 'Preview — not applied yet.' : 'Current committed brand mark.'}
                      </Text>
                    </Stack>
                  </Stack>
                </Stack>
              </Stack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Heading textStyle="md">Appearance</Heading>
            </Card.Header>
            <Card.Body>
              <HStack alignItems="start">
                <Field.Root>
                  <Field.Label>Accent color</Field.Label>
                  <RadioCardGroup.Root
                    aria-label="Accent color"
                    display="grid"
                    gridTemplateColumns="repeat(3, 1fr)"
                    gap="1.5"
                    value={theme.accent}
                    onValueChange={(details) => {
                      changeTheme((s) => ({ ...s, accent: (details.value ?? s.accent) as Accent }))
                    }}
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
                <Stack>
                    <Field.Root>
                      <Field.Label>Color scheme</Field.Label>
                      <HStack gap="2">
                        <Button
                          flex="1"
                          size="sm"
                          variant={theme.scheme === 'light' ? 'solid' : 'outline'}
                          onClick={() => changeTheme((s) => ({ ...s, scheme: 'light' }))}
                        >
                        Light
                        </Button>
                        <Button
                         flex="1"
                         size="sm"
                         variant={theme.scheme === 'dark' ? 'solid' : 'outline'}
                         onClick={() => changeTheme((s) => ({ ...s, scheme: 'dark' }))}
                        >
                        Dark
                        </Button>
                      </HStack>
                      <Field.HelperText>Flips the whole shell between light and dark.</Field.HelperText>
                    </Field.Root>
                  <Field.Root>
                    <Field.Label>Gray</Field.Label>
                    <RadioCardGroup.Root
                      aria-label="Gray"
                      display="grid"
                      gridTemplateColumns="repeat(3, 1fr)"
                      gap="1.5"
                      value={theme.gray}
                      onValueChange={(details) => {
                        changeTheme((s) => ({ ...s, gray: (details.value ?? s.gray) as Gray }))
                      }}
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
                  <ThemeSelect
                   label="Sidebar style"
                   items={SIDEBAR_OPTIONS}
                   value={theme.sidebarStyle}
                   onChange={(value) => changeTheme({ sidebarStyle: value as SidebarStyle })}
                   helperText="Sidebar background / text pair (light, dark, or brand)."
                  />

                </Stack>
              </HStack>
              <Field.Root gap="1">
                      <Field.Label>Corner radius</Field.Label>
                      <Slider.Root
                        min={0}
                        max={RADII.length - 1}
                        step={1}
                        value={[RADII.indexOf(theme.radius)]}
                        onValueChange={(details) => changeTheme((s) => ({ ...s, radius: RADII[details.value[0]] }))}
                      >
                        <Slider.Control>
                          <Slider.Track>
                            <Slider.Range />
                          </Slider.Track>
                          <Slider.Thumbs />
                        </Slider.Control>
                        <Slider.Marks marks={RADIUS_MARKS} />
                      </Slider.Root>
                    </Field.Root>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>

              <Heading textStyle="md">Typography</Heading>
            </Card.Header>
            <Card.Body>
              <HStack>
              <ThemeSelect
                  label="Font"
                  items={FONT_OPTIONS}
                  value={theme.font}
                  onChange={(value) => changeTheme({ font: value as FontKey })}
                  helperText="Fetches the selected webfont and re-fonts the whole shell live."
                />
              <Field.Root>
                <Field.Label>Heading style</Field.Label>
                <Stack gap="2">
                  {HEADING_OPTIONS.map((option) => (
                    <Checkbox.Root
                      key={option.value}
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
              </HStack>
            </Card.Body>
          </Card.Root>
        </Stack>
    </>
  )
}

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


