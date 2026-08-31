import { Text, Input, Button, Badge, Card } from '@/core/ui'
import { useState, useEffect } from 'react'
import { HStack, Stack } from 'styled-system/jsx'

interface MappingRule {
  appField: string
  elvantoField: string
  direction: 'pull' | 'push' | 'both'
  condition?: any
  transform?: string
  priority: number
}

interface MappingRowProps {
  rule: MappingRule
  index: number
  appFields: string[]
  elvantoFields: string[]
  dynamicElvantoFieldOptions?: Array<{ value: string; label: string }>
  onUpdate: (index: number, updates: Partial<MappingRule>) => void
  onDelete: (index: number) => void
  onDuplicate: (index: number) => void
}

export function MappingRow({ rule, index, appFields, elvantoFields, dynamicElvantoFieldOptions = [], onUpdate, onDelete, onDuplicate }: MappingRowProps) {
  const [expanded, setExpanded] = useState(false)
  const [transformDesc, setTransformDesc] = useState('')
  
  useEffect(() => {
    if (rule.transform) {
      setTransformDesc(`Transform: ${rule.transform}`)
    } else {
      setTransformDesc('No transform (identity)')
    }
  }, [rule.transform])

  return (
    <Card.Root>
      <Card.Body>
        <HStack gap="3" alignItems="flex-start">
          <Text textStyle="sm" color="fg.muted" style={{ minWidth: '40px', textAlign: 'center' }}>
            {index + 1}
          </Text>
          
          <Stack gap="1" flex="1" minWidth="0">
            <Text textStyle="xs" color="fg.muted">App Field</Text>
            <select
              value={rule.appField}
              onChange={e => onUpdate(index, { appField: e.target.value })}
              style={{ minWidth: '200px' }}
            >
              <option value="">Select app field...</option>
              {appFields.map(field => (
                <option key={field} value={field}>{field}</option>
              ))}
            </select>
          </Stack>
          
          <Stack gap="1" alignItems="center" style={{ minWidth: '80px' }}>
            <Text textStyle="xs" color="fg.muted">Direction</Text>
            <Badge variant="solid" color={
              rule.direction === 'pull' ? 'blue' :
              rule.direction === 'push' ? 'orange' : 'green'
            }>
              {rule.direction}
            </Badge>
          </Stack>
          
          <Stack gap="1" flex="1" minWidth="0">
            <Text textStyle="xs" color="fg.muted">Elvanto Field</Text>
            <select
              value={rule.elvantoField}
              onChange={e => onUpdate(index, { elvantoField: e.target.value })}
              style={{ minWidth: '200px' }}
            >
              <option value="">Select Elvanto field...</option>
              {elvantoFields.map(field => (
                <option key={field} value={field}>{field}</option>
              ))}
              {dynamicElvantoFieldOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </Stack>
          
          <Stack gap="1" flex="1" minWidth="0">
            <Text textStyle="xs" color="fg.muted">Transform</Text>
            <select
              value={rule.transform || ''}
              onChange={e => onUpdate(index, { transform: e.target.value || undefined })}
              style={{ minWidth: '200px' }}
            >
              <option value="">— None (Identity) —</option>
              <option value="category_to_journey_stage">category_to_journey_stage</option>
              <option value="location_to_journey_tracks">location_to_journey_tracks</option>
              <option value="defacto_to_partner">defacto_to_partner</option>
              <option value="school_grade_to_kindy_year">school_grade_to_kindy_year</option>
              <option value="kindy_year_to_school_grade">kindy_year_to_school_grade</option>
              <option value="admin_to_access_permission">admin_to_access_permission</option>
              <option value="access_permission_to_admin">access_permission_to_admin</option>
              <option value="bool_to_yes_no">bool_to_yes_no</option>
              <option value="yes_no_to_bool">yes_no_to_bool</option>
              <option value="int_flag_to_bool">int_flag_to_bool</option>
              <option value="bool_to_int_flag">bool_to_int_flag</option>
              <option value="capitalize_enum">capitalize_enum</option>
              <option value="lowercase_enum">lowercase_enum</option>
              <option value="trim_suffix">trim_suffix</option>
            </select>
            {transformDesc && <Text textStyle="xs" color="fg.muted">{transformDesc}</Text>}
          </Stack>
          
          <Stack gap="1" alignItems="center" style={{ minWidth: '70px' }}>
            <Text textStyle="xs" color="fg.muted">Priority</Text>
            <Input
              type="number"
              value={rule.priority}
              onChange={e => onUpdate(index, { priority: parseInt(e.target.value) || 0 })}
              style={{ width: '60px' }}
            />
          </Stack>
          
          <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? '▲' : '▼'}
          </Button>
          
          <HStack gap="1">
            <Button variant="outline" size="sm" onClick={() => onDuplicate(index)} title="Duplicate">
              📋
            </Button>
            <Button variant="solid" size="sm" color="red" onClick={() => onDelete(index)} title="Delete">
              🗑
            </Button>
          </HStack>
        
        {expanded && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
            <ConditionEditor 
              condition={rule.condition} 
              onChange={cond => onUpdate(index, { condition: cond })}
              availableFields={[...appFields, ...elvantoFields]}
            />
          </div>
        )}
      </HStack>
      </Card.Body>
    </Card.Root>
  )
}

function ConditionEditor({ condition, onChange, availableFields }: { 
  condition: any
  onChange: (cond: any) => void
  availableFields: string[]
}) {
  const [editMode, setEditMode] = useState<'simple' | 'advanced'>('simple')
  
  if (!condition) {
    return (
      <Stack gap="3">
        <Text textStyle="sm" color="fg.muted">No condition (always applies)</Text>
        <Button variant="outline" size="sm" onClick={() => setEditMode('simple')}>
          Add Condition
        </Button>
      </Stack>
    )
  }
  
  if (editMode === 'simple') {
    return (
      <Stack gap="3">
        <HStack gap="3" flexWrap="wrap">
          <select
            value={condition.field || ''}
            onChange={e => onChange({ ...condition, field: e.target.value })}
            style={{ minWidth: '200px' }}
          >
            <option value="">Field</option>
            {availableFields.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          
          <select
            value={condition.operator || 'equals'}
            onChange={e => onChange({ ...condition, operator: e.target.value })}
            style={{ minWidth: '140px' }}
          >
            <option value="equals">Equals</option>
            <option value="not_equals">Not Equals</option>
            <option value="in">In List</option>
            <option value="exists">Exists</option>
          </select>
          
          {condition.operator !== 'exists' && (
            <Input
              value={condition.value || ''}
              onChange={e => onChange({ ...condition, value: e.target.value })}
              placeholder="Value"
              style={{ minWidth: '150px' }}
            />
          )}
          
          <Button variant="outline" size="sm" onClick={() => setEditMode('advanced')}>
            Advanced (AND/OR)
          </Button>
          
          <Button variant="solid" size="sm" color="red" onClick={() => onChange(null)}>
            Remove Condition
          </Button>
        </HStack>
      </Stack>
    )
  }
  
  return (
    <Stack gap="3">
      <HStack gap="3">
        <Badge variant="outline">Advanced Mode</Badge>
        <select
          value={condition.type || 'and'}
          onChange={e => onChange({ ...condition, type: e.target.value })}
          style={{ width: '100px' }}
        >
          <option value="and">AND (all)</option>
          <option value="or">OR (any)</option>
        </select>
        <Button variant="outline" size="sm" onClick={() => setEditMode('simple')}>
          Simple Mode
        </Button>
      </HStack>
      
      <Stack gap="2">
        {(condition.conditions || []).map((cond: any, i: number) => (
          <HStack key={i} gap="2">
            <ConditionEditor 
              condition={cond} 
              onChange={newCond => {
                const newConditions = [...(condition.conditions || [])]
                newConditions[i] = newCond
                onChange({ ...condition, conditions: newConditions })
              }}
              availableFields={availableFields}
            />
            <Button variant="solid" size="sm" color="red" onClick={() => {
              const newConditions = [...(condition.conditions || [])]
              newConditions.splice(i, 1)
              onChange({ ...condition, conditions: newConditions })
            }}>
              ✕
            </Button>
          </HStack>
        ))}
        
        <Button variant="outline" size="sm" onClick={() => onChange({ 
          ...condition, 
          conditions: [...(condition.conditions || []), { type: 'field_equals', field: '', operator: 'equals', value: '' }] 
        })}>
          + Add Condition
        </Button>
      </Stack>
    </Stack>
  )
}
