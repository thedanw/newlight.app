import { useCallback } from 'react'
import grapesjs from 'grapesjs'
import newsletterPreset from 'grapesjs-preset-newsletter'
import { Editor, useEditorMaybe } from '@grapesjs/react'
import type { ProjectData, Editor as EditorInstance } from 'grapesjs'
import type { EmailEditorJson } from '../lib/types'
import { getAllEmailBlocks } from '../lib/blocks'
import { renderSnapshot } from '../lib/renderer'

export interface EmailEditorProps {
  initialJson?: EmailEditorJson | null
  onChange?: (editorJson: EmailEditorJson, htmlSnapshot: string) => void
}

export function EmailEditor({ initialJson, onChange }: EmailEditorProps) {
  const blocks = getAllEmailBlocks()

  const handleUpdate = useCallback(
    (projectData: ProjectData) => {
      const html = renderSnapshot(projectData as EmailEditorJson) || ''
      onChange?.(projectData as EmailEditorJson, html)
    },
    [onChange],
  )

  const handleEditor = useCallback(
    (editor: EditorInstance) => {
      if (initialJson) {
        const projectData = initialJson as ProjectData
        editor.setComponents(projectData.components ?? (initialJson as any))
      }
    },
    [initialJson],
  )

  return (
    <Editor
      grapesjs={grapesjs}
      plugins={[newsletterPreset]}
      options={{
        container: '#email-editor-container',
        storageManager: false,
        panels: { defaults: [] },
        deviceManager: { devices: [] },
        blockManager: {
          blocks: blocks.map((b) => ({
            id: b.type,
            label: b.label,
            category: b.category,
            content: b.defaultContent,
            class: b.icon,
          })),
        },
      }}
      onEditor={handleEditor}
      onUpdate={handleUpdate}
      waitReady={false}
    />
  )
}

export function useEmailEditor() {
  const editor = useEditorMaybe()
  return { editor: editor ?? null }
}
