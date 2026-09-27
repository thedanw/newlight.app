import { useState } from 'react'
import { Button, Text } from '@/core/ui'
import type { EmailTemplate } from '../lib/types'

export interface TemplateListProps {
  templates: EmailTemplate[]
  onEdit: (template: EmailTemplate) => void
  onDelete: (template: EmailTemplate) => void
  loading?: boolean
}

export function TemplateList({ templates, onEdit, onDelete, loading = false }: TemplateListProps) {
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all')

  const filtered =
    filter === 'all' ? templates : templates.filter((t) => t.status === filter)

  if (loading) {
    return <Text color="fg.muted">Loading templates...</Text>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {(['all', 'draft', 'published', 'archived'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            style={{
              padding: '4px 12px',
              border: f === filter ? '2px solid #2563eb' : '1px solid #d1d5db',
              borderRadius: 'l1',
              background: f === filter ? '#eff6ff' : 'bg.canvas',
              cursor: 'pointer',
              fontSize: 'sm',
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <Text color="fg.muted">No templates found.</Text>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {filtered.map((template) => (
          <div
            key={template.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              border: '1px solid #e5e7eb',
              borderRadius: 'l1',
              background: 'bg.canvas',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontWeight: 'bold' }}>{template.name}</Text>
              <Text color="fg.muted" textStyle="sm">
                {template.subject || 'No subject'} · {template.status}
              </Text>
              <Text color="fg.muted" textStyle="xs">
                Updated {new Date(template.updated_at).toLocaleDateString()}
              </Text>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button size="sm" variant="plain" onClick={() => onEdit(template)}>
                Edit
              </Button>
              <Button size="sm" variant="plain" onClick={() => onDelete(template)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}