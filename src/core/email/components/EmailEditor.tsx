import { useCallback, useEffect, useRef } from 'react'
import StudioEditor from '@grapesjs/studio-sdk/react'
import '@grapesjs/studio-sdk/style'
import type { StudioProject } from '../lib/types'
import type { AssetsConfig, FontsConfig, ComponentsConfig, PagesConfig } from '@grapesjs/studio-sdk'
import { getStudioComponents } from '../lib/blocks'
import { renderSnapshot } from '../lib/renderer'
import { useAppTheme } from '@/core/theme/ThemeContext'

export interface EmailEditorProps {
  initialJson?: StudioProject | null
  onChange?: (editorJson: StudioProject, htmlSnapshot: string) => void
  licenseKey?: string
  assets?: AssetsConfig
  fonts?: FontsConfig
  components?: ComponentsConfig
  pages?: PagesConfig
}

export function EmailEditor({ 
  initialJson, 
  onChange, 
  licenseKey = 'DEV_LICENSE_KEY',
  assets,
  fonts,
  components,
  pages,
}: EmailEditorProps) {
  const { theme } = useAppTheme()
  const studioComponents = getStudioComponents()
  const editorRef = useRef<any>(null)
  const themeRef = useRef(theme)

  // Keep theme ref in sync
  useEffect(() => {
    themeRef.current = theme
  }, [theme])

  const handleUpdate = useCallback(
    (projectData: any) => {
      const html = renderSnapshot(projectData) || ''
      onChange?.(projectData, html)
    },
    [onChange],
  )

  const handleEditor = useCallback(
    (editor: any) => {
      editorRef.current = editor
      if (initialJson) {
        editor.setProject(initialJson)
      }
    },
    [initialJson],
  )

  // Update Studio Editor theme when app theme changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setConfig({ theme })
    }
  }, [theme])

  // Pass config directly - Studio SDK will handle defaults
  return (
    <StudioEditor
      options={{
        licenseKey,
        theme: "dark",
        customTheme: {
          default: {
            colors: {
              global: {
                background1: "var(--colors-gray-surface-bg-active)",
                background2: "var(--colors-gray-surface-bg-hover)",
                background3: "var(--colors-gray-surface-bg)",
                backgroundHover: "var(--colors-gray-surface-bg-hover)",
                text: "var(--colors-fg-default)",
                border: "var(--global-color-border)",
                focus: "var(--global-color-focus-ring)",
                placeholder: "var(--colors-fg-subtle)"
              },
              primary: {
                background1: "var(--colors-color-palette-solid-bg)",
                background3: "var(--colors-color-palette-subtle-bg-active)",
                backgroundHover: "var(--colors-color-palette-solid-bg-hover)",
                text: "var(--colors-color-palette-solid-fg)"
              },
              component: {
                background1: "var(--colors-color-palette-solid-bg)",
                background2: "var(--colors-color-palette-surface-bg-active)",
                background3: "var(--colors-color-palette-solid-bg-hover)",
                text: "var(--colors-color-palette-solid-fg)"
              },
              selector: {
                background1: "var(--colors-color-palette-solid-bg)",
                background2: "var(--colors-color-palette-surface-bg-active)",
                text: "var(--colors-color-palette-solid-fg)"
              },
              symbol: {
                background1: "var(--colors-color-palette-solid-bg)",
                background2: "var(--colors-color-palette-surface-bg-active)",
                background3: "var(--colors-color-palette-surface-bg-active)",
                text: "var(--colors-color-palette-solid-fg)"
              }
            }
          }
        },
        project: { type: 'email' },
        assets,
        fonts,
        components: {
          ...studioComponents,
          ...components,
        },
        pages,
      }}
      onEditor={handleEditor}
      onUpdate={handleUpdate}
      style={{
        minHeight: '500px',
        height: 'calc(100dvh - 300px)',
      }}
    />
  )
}

export function useEmailEditor() {
  // Studio SDK doesn't have a direct equivalent to useEditorMaybe
  // Return null for now - can be implemented later if needed
  return { editor: null }
}
