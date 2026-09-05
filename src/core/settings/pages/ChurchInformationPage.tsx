'use client'
import { createListCollection } from '@ark-ui/react'
import type { FileUploadFileRejectDetails } from '@ark-ui/react/file-upload'
import { CloudUploadIcon, Settings } from 'lucide-react'
import { switchTheme } from '@/core/theme/theme-loader'
import {
  applyFont,
  detectFont,
  FONT_OPTIONS,
  type FontKey,
} from '@/core/theme/font-loader'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Page,
  RadioCardGroup,
  Select,
  Slider,
  Text,
  toaster,
} from '@/core/ui'
import { useSettings } from '../lib/provider'

/* ---------------------------------------------------------------------------
   ChurchInformationPage — the migrated BrandForm surface (8 fields) plus
   4 new fields (Church Name, App Name, Church Email, Website), persisted to
   `platform_settings` (single `app-settings` key, decision #15) and the logo
   uploaded to the `brand-assets` Storage bucket (decision #11).

   Self-contained settings page with its own Page.Header, Page.Body, and
   Page.Footer.
------------------------------------------------------------------------- */

type ColorScheme = 'light' | 'dark'
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

export default function ChurchInformationPage() {
  const { supabase, getAppSettings, saveAppSettings } = useSettings()
  const navigate = useNavigate()
  const [theme, setTheme] = useState<BrandState>(getInitialState)
  const [churchInfo, setChurchInfo] = useState<ChurchInfo>(EMPTY_CHURCH_INFO)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [draftLogoUrl, setDraftLogoUrl] = useState<string | null>(null)
  const [draftLogoFile, setDraftLogoFile] = useState<File | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const initialTheme = useRef<BrandState>(getInitialState())
  const initialChurchInfo = useRef<ChurchInfo>(EMPTY_CHURCH_INFO)
  const logoTransferred = useRef(false)
  const isDirtyRef = useRef(false)
  const hasHydrated = useRef(false)

  useEffect(() => {
    isDirtyRef.current = isDirty
  }, [isDirty])

  useEffect(() => {
    let cancelled = false
    getAppSettings()
      .then((settings) => {
        if (cancelled || !settings) return
        if (settings.theme) {
          setTheme((previous) => {
            const merged = { ...previous, ...settings.theme }
            const changed =
              merged.scheme !== previous.scheme ||
              merged.accent !== previous.accent ||
              merged.gray !== previous.gray ||
              merged.font !== previous.font ||
              merged.radius !== previous.radius ||
              merged.sidebarStyle !== previous.sidebarStyle ||
              merged.headings.bold !== previous.headings.bold ||
              merged.headings.uppercase !== previous.headings.uppercase ||
              merged.headings.accent !== previous.headings.accent
            return changed ? merged : previous
          })
          initialTheme.current = { ...getInitialState(), ...settings.theme }
        }
        if (settings.churchInfo) {
          setChurchInfo(settings.churchInfo)
          initialChurchInfo.current = settings.churchInfo
        }
        if (settings.logoUrl) {
          setLogoUrl(settings.logoUrl)
        }
        hasHydrated.current = true
      })
      .catch((error) => {
        console.error('Failed to hydrate app settings:', error)
        hasHydrated.current = true
      })
    return () => {
      cancelled = true
    }
  }, [getAppSettings])

  useEffect(() => {
    if (!hasHydrated.current) return
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
  }, [theme])

  useEffect(() => {
    return () => {
      if (draftLogoUrl !== null && !logoTransferred.current) {
        URL.revokeObjectURL(draftLogoUrl)
      }
    }
  }, [draftLogoUrl])

  const revertToInitial = useCallback(() => {
    setTheme(initialTheme.current)
    setChurchInfo(initialChurchInfo.current)
    switchTheme(initialTheme.current)
    applyFont(initialTheme.current.font)
    setIsDirty(false)
  }, [])

  const handleFileAccept = (file: File) => {
    setLogoError(null)
    const url = URL.createObjectURL(file)
    setDraftLogoUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return url
    })
    setDraftLogoFile(file)
    setIsDirty(true)
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
    setIsDirty(true)
  }

  const setChurchField = useCallback((field: keyof ChurchInfo, value: string) => {
    setChurchInfo((previous) => ({ ...previous, [field]: value }))
    setIsDirty(true)
  }, [])

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
      initialTheme.current = theme
      initialChurchInfo.current = churchInfo
      setIsDirty(false)
      toaster.create({ title: 'Settings saved', type: 'success' })
      window.dispatchEvent(new CustomEvent('app-settings-changed'))
    } catch (error) {
      console.error('Failed to save settings:', error)
      toaster.create({ title: 'Failed to save settings', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    revertToInitial()
    navigate('/settings')
  }

  const previewLogo = draftLogoUrl ?? logoUrl

  return (
    <Page.Main>
      <Page.Header
        style={{ '--module-number': 0 } as CSSProperties}
      >
        <Page.Heading level={1} icon={Settings} title="Church Information" />
      </Page.Header>

      <Page.Body>
        <Stack gap="4">
          <Card.Root>
            <Card.Header>
              <Heading textStyle="md">Church Information</Heading>
            </Card.Header>
            <Card.Body>
              <Stack
                gap="4"
                display={{ base: 'grid', md: 'grid' }}
                gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }}
              >
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
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Heading textStyle="md">Brand Identity</Heading>
            </Card.Header>
            <Card.Body>
              <Stack gap="4">
                <Stack
                  gap="4"
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

                  <Stack gap="3" align="center" justify="center">
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
              <Stack gap="4">
                <Field.Root>
                  <Field.Label>Color scheme</Field.Label>
                  <HStack gap="2">
                    <Button
                      flex="1"
                      size="sm"
                      variant={theme.scheme === 'light' ? 'solid' : 'outline'}
                      onClick={() => { setTheme((s) => ({ ...s, scheme: 'light' })); setIsDirty(true) }}
                    >
                      Light
                    </Button>
                    <Button
                      flex="1"
                      size="sm"
                      variant={theme.scheme === 'dark' ? 'solid' : 'outline'}
                      onClick={() => { setTheme((s) => ({ ...s, scheme: 'dark' })); setIsDirty(true) }}
                    >
                      Dark
                    </Button>
                  </HStack>
                  <Field.HelperText>Flips the whole shell between light and dark.</Field.HelperText>
                </Field.Root>

                <Stack
                  gap="4"
                  display={{ base: 'grid', md: 'grid' }}
                  gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }}
                >
                  <Field.Root>
                    <Field.Label>Gray</Field.Label>
                    <RadioCardGroup.Root
                      aria-label="Gray"
                      display="grid"
                      gridTemplateColumns="repeat(3, 1fr)"
                      gap="1.5"
                      value={theme.gray}
                      onValueChange={(details) => {
                        setIsDirty(true)
                        setTheme((s) => ({ ...s, gray: (details.value ?? s.gray) as Gray }))
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

                  <Field.Root>
                    <Field.Label>Accent color</Field.Label>
                    <RadioCardGroup.Root
                      aria-label="Accent color"
                      display="grid"
                      gridTemplateColumns="repeat(3, 1fr)"
                      gap="1.5"
                      value={theme.accent}
                      onValueChange={(details) => {
                        setIsDirty(true)
                        setTheme((s) => ({ ...s, accent: (details.value ?? s.accent) as Accent }))
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
                </Stack>

                <ThemeSelect
                  label="Sidebar style"
                  items={SIDEBAR_OPTIONS}
                  value={theme.sidebarStyle}
                  onChange={(value) => { setTheme((s) => ({ ...s, sidebarStyle: value as SidebarStyle })); setIsDirty(true) }}
                  helperText="Sidebar background / text pair (light, dark, or brand)."
                />
                <Field.Root>
                  <Field.Label>Corner radius</Field.Label>
                  <Slider.Root
                    min={0}
                    max={RADII.length - 1}
                    step={1}
                    value={[RADII.indexOf(theme.radius)]}
                    onValueChange={(details) => { setIsDirty(true); setTheme((s) => ({ ...s, radius: RADII[details.value[0]] })) }}
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

                <ThemeSelect
                  label="Font"
                  items={FONT_OPTIONS}
                  value={theme.font}
                  onChange={(value) => { setTheme((s) => ({ ...s, font: value as FontKey })); setIsDirty(true) }}
                  helperText="Fetches the selected webfont and re-fonts the whole shell live."
                />
              </Stack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Heading textStyle="md">Heading Style</Heading>
            </Card.Header>
            <Card.Body>
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
            </Card.Body>
          </Card.Root>
        </Stack>
      </Page.Body>

      <Page.Footer>
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          onClick={handleApply}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Apply'}
        </Button>
      </Page.Footer>
    </Page.Main>
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

function activeHeadingTokens(headings: Record<HeadingToken, boolean>): string {
  return HEADING_OPTIONS.filter((option) => headings[option.value])
    .map((option) => option.value)
    .join(' ')
}
