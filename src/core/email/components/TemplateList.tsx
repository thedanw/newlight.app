import { useState } from 'react'
import { Button, Card, Text } from '@/core/ui'
import { Box } from 'styled-system/jsx'
import type { EmailTemplate } from '../lib/types'

export interface TemplateListProps {
  templates: EmailTemplate[]
  onEdit: (template: EmailTemplate) => void
  onDelete: (template: EmailTemplate) => void
  loading?: boolean
}

const STATUS_COLORS = {
  all: { bg: 'colorPalette.subtle.bg', border: 'colorPalette.solid.bg', color: 'colorPalette.solid.fg' },
  draft: { bg: 'colorPalette.subtle.bg', border: 'colorPalette.solid.bg', color: 'colorPalette.solid.fg' },
  published: { bg: 'colorPalette.subtle.bg', border: 'colorPalette.solid.bg', color: 'colorPalette.solid.fg' },
  archived: { bg: 'colorPalette.subtle.bg', border: 'colorPalette.solid.bg', color: 'colorPalette.solid.fg' },
} as const

export function TemplateList({ templates, onEdit, onDelete, loading = false }: TemplateListProps) {
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all')

  const filtered =
    filter === 'all' ? templates : templates.filter((t) => t.status === filter)

  if (loading) {
    return <Text color="fg.muted">Loading templates...</Text>
  }

  return (
    <Box display="flex" flexDirection="column" gap="3">
      <Box display="flex" gap="2">
        {(['all', 'draft', 'published', 'archived'] as const).map((f) => {
          const active = f === filter
          return (
            <Button
              key={f}
              size="xs"
              variant={active ? 'solid' : 'outline'}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          )
        })}
      </Box>

      {filtered.length === 0 && (
        <Text color="fg.muted">No templates found.</Text>
      )}

      <Box display="flex" flexDirection="column" gap="2">
        {filtered.map((template) => (
          <Box
            key={template.id}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            p="3"
            borderWidth="1px"
            borderColor="border"
            borderRadius="l1"
            bg="canvas"
          >
            <Box flex="1" minW="0">
              <Text fontWeight="bold">{template.name}</Text>
              <Text color="fg.muted" textStyle="sm">
                {template.subject || 'No subject'} · {template.status}
              </Text>
              <Text color="fg.muted" textStyle="xs">
                Updated {new Date(template.updated_at).toLocaleDateString()}
              </Text>
            </Box>
            <Box display="flex" gap="2">
              <Button size="sm" variant="plain" onClick={() => onEdit(template)}>
                Edit
              </Button>
              <Button size="sm" variant="plain" onClick={() => onDelete(template)}>
                Delete
              </Button>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  )
}