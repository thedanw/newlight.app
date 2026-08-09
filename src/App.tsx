import { useState } from 'react'
import { Badge, Button, Heading, Kbd, Separator, Text } from '@/core/ui'
import { Box, HStack, Stack } from 'styled-system/jsx'

/* ---------------------------------------------------------------------------
   Batch 4 smoke harness — flip <html data-*> attrs → the whole shell
   re-themes live (theme emission block in src/core/theme/theme.css).
   This seeds the Batch 6 BrandForm controls.
--------------------------------------------------------------------------- */

const ACCENTS = ['orange', 'red', 'green'] as const
const RADII = ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const
const SIDEBAR_STYLES = ['light', 'dark', 'brand-dark', 'brand-light'] as const

function setHtmlAttr(name: string, value: string) {
  document.documentElement.setAttribute(name, value)
}

function SchemeToggle({ scheme, onChange }: { scheme: string; onChange: (v: string) => void }) {
  const next = scheme === 'light' ? 'dark' : 'light'
  return (
    <Button
      variant="outline"
      colorPalette="gray"
      onClick={() => {
        setHtmlAttr('data-color-scheme', next)
        onChange(next)
      }}
    >
      scheme: {scheme} → {next}
    </Button>
  )
}

function OptionButtons<T extends string>({
  label,
  value,
  options,
  attr,
  onPick,
}: {
  label: string
  value: string
  options: readonly T[]
  attr: string
  onPick: (v: T) => void
}) {
  return (
    <HStack gap="2" alignItems="center">
      <Text textStyle="sm" minWidth="7rem" color="fg.muted">
        {label}
      </Text>
      {options.map((opt) => (
        <Button
          key={opt}
          size="xs"
          variant={opt === value ? 'solid' : 'outline'}
          colorPalette={attr === 'data-accent-color' ? opt : 'gray'}
          onClick={() => {
            setHtmlAttr(attr, opt)
            onPick(opt)
          }}
        >
          {opt}
        </Button>
      ))}
    </HStack>
  )
}

function App() {
  const [scheme, setScheme] = useState('light')
  const [accent, setAccent] = useState('orange')
  const [radius, setRadius] = useState('md')
  const [sidebar, setSidebar] = useState('light')
  const [heading, setHeading] = useState('')

  const toggleHeading = (token: string) => {
    const tokens = heading.split(' ').filter(Boolean)
    const next = tokens.includes(token) ? tokens.filter((t) => t !== token) : [...tokens, token]
    const value = next.join(' ')
    setHtmlAttr('data-heading-style', value)
    setHeading(value)
  }

  return (
    <Box bg="gray.1" color="fg.default" minH="100dvh" padding="8">
      <Stack gap="6" maxWidth="52rem" alignItems="flex-start">
        <Heading textStyle="2xl">New Light — UI/UX Design Lab</Heading>
        <Text color="fg.muted">
          Theme emission — flip a <Kbd>data-*</Kbd> attr, the shell re-themes instantly.
        </Text>
        <Separator />

        <Stack gap="3" width="100%" borderWidth="1px" borderColor="border" padding="5" borderRadius="l2">
          <Heading textStyle="sm">Theme knobs (writes to &lt;html&gt;)</Heading>

          <HStack gap="2" alignItems="center">
            <Text textStyle="sm" minWidth="7rem" color="fg.muted">
              color-scheme
            </Text>
            <SchemeToggle scheme={scheme} onChange={setScheme} />
          </HStack>

          <OptionButtons label="accent" value={accent} options={ACCENTS} attr="data-accent-color" onPick={setAccent} />
          <OptionButtons label="radius" value={radius} options={RADII} attr="data-radius" onPick={setRadius} />
          <OptionButtons label="sidebar" value={sidebar} options={SIDEBAR_STYLES} attr="data-sidebar-style" onPick={setSidebar} />

          <HStack gap="2" alignItems="center">
            <Text textStyle="sm" minWidth="7rem" color="fg.muted">
              heading
            </Text>
            {(['bold', 'uppercase', 'accent'] as const).map((token) => {
              const active = heading.split(' ').includes(token)
              return (
                <Button
                  key={token}
                  size="xs"
                  variant={active ? 'solid' : 'outline'}
                  colorPalette="gray"
                  onClick={() => toggleHeading(token)}
                >
                  {token}
                </Button>
              )
            })}
          </HStack>
        </Stack>

        <Stack gap="4" borderWidth="1px" borderColor="border" padding="5" borderRadius="l2">
          <Heading textStyle="sm">
            Live sample (accent from <Kbd>data-accent-color</Kbd>, no explicit colorPalette)
          </Heading>
          <HStack gap="4">
            <Button>Primary</Button>
            <Button variant="outline" colorPalette="gray">
              Outline
            </Button>
            <Badge>Default badge</Badge>
            <Badge colorPalette="green">Explicit green</Badge>
          </HStack>
          <Text textStyle="sm" color="fg.muted">
            Sidebar vars: bg <Kbd>var(--sidebar-bg)</Kbd> fg <Kbd>var(--sidebar-fg)</Kbd> · heading color{' '}
            <Kbd>var(--heading-color)</Kbd>
          </Text>
        </Stack>
      </Stack>
    </Box>
  )
}

export default App
