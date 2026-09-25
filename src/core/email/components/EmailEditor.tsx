import { useCallback, useMemo } from 'react'
import '../styles/editor.css'
import '@grapesjs/studio-sdk/style'
import StudioEditor, { useStudioEditor } from '@grapesjs/studio-sdk/react'
import type { ProjectData, Editor as EditorInstance } from 'grapesjs'
import type { ProjectFile } from '@grapesjs/studio-sdk'
import type { EmailEditorJson, EmailEditorConfig } from '../lib/types'
import { getRegisteredBlocks } from '../lib/blocks'
import { renderSnapshot } from '../lib/renderer'
import { useAppTheme } from '@/core/theme/ThemeContext'

export interface EmailEditorProps {
  initialJson?: EmailEditorJson | null
  onChange?: (editorJson: EmailEditorJson, htmlSnapshot: string) => void
  editorConfig?: Partial<EmailEditorConfig>
}

const DEFAULT_EMAIL_CONTENT =
  '<mjml><mj-body><mj-section><mj-column><mj-text>Edit your text here...</mj-text></mj-column></mj-section></mj-body></mjml>'

const DEFAULT_EDITOR_CONFIG: EmailEditorConfig = {
  theme: 'light',
  licenseKey: 'DEV_LICENSE_KEY',
  showBlocksPanel: true,
  showLayersPanel: true,
  showStylesPanel: true,
  defaultTemplate: DEFAULT_EMAIL_CONTENT,
}

function convertJsonToStudioProject(json: EmailEditorJson | null): ProjectData {
  if (!json) return { pages: [{ name: 'Email', component: DEFAULT_EMAIL_CONTENT }] }

  if (typeof json === 'object' && json !== null) {
    if (Array.isArray((json as Record<string, unknown>).pages)) {
      return json as unknown as ProjectData
    }
    const html = renderSnapshot(json as Parameters<typeof renderSnapshot>[0])
    if (html) return { pages: [{ name: 'Email', component: html }] }
  }

  if (typeof json === 'string') {
    return { pages: [{ name: 'Email', component: json }] }
  }

  return { pages: [{ name: 'Email', component: DEFAULT_EMAIL_CONTENT }] }
}

export { DEFAULT_EDITOR_CONFIG }

export function EmailEditor({ initialJson, onChange, editorConfig }: EmailEditorProps) {
  const config = { ...DEFAULT_EDITOR_CONFIG, ...editorConfig }
  const { theme: appTheme } = useAppTheme()

  const grapesjsTheme = appTheme.mode === 'dark' ? 'dark' : 'light'

  const customTheme = useMemo(() => ({
    default: {
      colors: {
        primary: {
          background1: `var(--color-${appTheme.accent}-9)`,
          backgroundHover: `var(--color-${appTheme.accent}-8)`,
          text: '#ffffff',
        },
        global: {
          border: `var(--color-${appTheme.gray}-6)`,
          background1: `var(--color-${appTheme.gray}-1)`,
          background2: `var(--color-${appTheme.gray}-2)`,
          background3: `var(--color-${appTheme.gray}-3)`,
        },
        component: {
          background1: `var(--color-${appTheme.gray}-2)`,
          backgroundHover: `var(--color-${appTheme.gray}-3)`,
        },
      },
    },
  }), [appTheme.accent, appTheme.gray])

  const handleUpdate = useCallback(
    async (projectData: ProjectData, editor: EditorInstance) => {
      const files = (await editor.runCommand('studio:projectFiles')) as ProjectFile[]
      const htmlFile = files.find((f) => f.mimeType === 'text/html')
      const html = htmlFile?.content ?? ''
      onChange?.(projectData as unknown as EmailEditorJson, html)
    },
    [onChange],
  )

  const blocks = useMemo(() => {
    const registered = getRegisteredBlocks()
    return registered.map((b) => ({
      id: b.type,
      label: b.label,
      media: `<span style="font-size:18px;font-weight:bold">${b.icon}</span>`,
      content: b.defaultContent,
      category: { id: b.category, label: b.category },
    }))
  }, [])

  const initialProject = useMemo(() => convertJsonToStudioProject(initialJson ?? null), [initialJson])

  return (
    <StudioEditor
      options={{
        licenseKey: config.licenseKey,
        project: {
          type: 'email',
          default: { pages: [{ name: 'Email', component: config.defaultTemplate }] },
        },
        storage: {
          type: 'self',
          project: initialProject,
        },
        blocks: { default: blocks },
        theme: grapesjsTheme,
        customTheme,
        settingsMenu: false,
        onUpdate: handleUpdate,
      }}
    />
  )
}

export function useEmailEditor() {
  const editor = useStudioEditor()
  return { editor: editor ?? null }
}
