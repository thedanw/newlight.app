'use client'
import { Text, Input, Button, Badge, Combobox } from '@/core/ui'
import { useState, useEffect, useMemo } from 'react'
import { HStack, Stack } from 'styled-system/jsx'
import { createListCollection } from '@ark-ui/react'
import { CheckIcon } from 'lucide-react'

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

  const appFieldCollection = useMemo(() => createListCollection({
    items: [{ label: 'Select app field...', value: '' }, ...appFields.map((f) => ({ label: f, value: f }))]
  }), [appFields])

  const elvantoFieldCollection = useMemo(() => createListCollection({
    items: [{ label: 'Select Elvanto field...', value: '' }, ...elvantoFields.map((f) => ({ label: f, value: f })), ...dynamicElvantoFieldOptions]
  }), [elvantoFields, dynamicElvantoFieldOptions])

  const transformCollection = useMemo(() => createListCollection({
    items: [
      { label: '— None (Identity) —', value: '' },
      { label: 'category_to_journey_stage', value: 'category_to_journey_stage' },
      { label: 'location_to_journey_tracks', value: 'location_to_journey_tracks' },
      { label: 'defacto_to_partner', value: 'defacto_to_partner' },
      { label: 'school_grade_to_kindy_year', value: 'school_grade_to_kindy_year' },
      { label: 'kindy_year_to_school_grade', value: 'kindy_year_to_school_grade' },
      { label: 'admin_to_access_permission', value: 'admin_to_access_permission' },
      { label: 'access_permission_to_admin', value: 'access_permission_to_admin' },
      { label: 'bool_to_yes_no', value: 'bool_to_yes_no' },
      { label: 'yes_no_to_bool', value: 'yes_no_to_bool' },
      { label: 'int_flag_to_bool', value: 'int_flag_to_bool' },
      { label: 'bool_to_int_flag', value: 'bool_to_int_flag' },
      { label: 'capitalize_enum', value: 'capitalize_enum' },
      { label: 'lowercase_enum', value: 'lowercase_enum' },
      { label: 'trim_suffix', value: 'trim_suffix' },
    ]
  }), [])

  const appFieldValue = rule.appField ? [rule.appField] : []
  const elvantoFieldValue = rule.elvantoField ? [rule.elvantoField] : []
  const transformValue = rule.transform ? [rule.transform] : []

  return (
    <Stack gap="3" css={{ borderWidth: '1px', borderRadius: 'l2', p: '4' }}>
      <HStack gap="3" alignItems="flex-start">
        <Text textStyle="sm" color="fg.muted" minWidth="40px" textAlign="center">
          {index + 1}
        </Text>

        <Stack gap="1" flex="1" minWidth="0">
          <Text textStyle="xs" color="fg.muted">App Field</Text>
          <Combobox.Root collection={appFieldCollection} value={appFieldValue} onValueChange={(details) => onUpdate(index, { appField: details.value[0] || '' })}>
            <Combobox.Control>
              <Combobox.Input placeholder="Select app field..." />
              <Combobox.IndicatorGroup>
                <Combobox.Trigger />
              </Combobox.IndicatorGroup>
            </Combobox.Control>
            <Combobox.Positioner>
              <Combobox.Content css={{ maxHeight: '400px', overflowY: 'auto' }}>
                {appFieldCollection.items.map((item) => (
                  <Combobox.Item key={item.value} item={item}>
                    <Combobox.ItemText>{item.label}</Combobox.ItemText>
                    <Combobox.ItemIndicator><CheckIcon /></Combobox.ItemIndicator>
                  </Combobox.Item>
                ))}
              </Combobox.Content>
            </Combobox.Positioner>
          </Combobox.Root>
        </Stack>

        <Stack gap="1" alignItems="center" minWidth="80px">
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
          <Combobox.Root collection={elvantoFieldCollection} value={elvantoFieldValue} onValueChange={(details) => onUpdate(index, { elvantoField: details.value[0] || '' })}>
            <Combobox.Control>
              <Combobox.Input placeholder="Select Elvanto field..." />
              <Combobox.IndicatorGroup>
                <Combobox.Trigger />
              </Combobox.IndicatorGroup>
            </Combobox.Control>
            <Combobox.Positioner>
              <Combobox.Content css={{ maxHeight: '400px', overflowY: 'auto' }}>
                {elvantoFieldCollection.items.map((item) => (
                  <Combobox.Item key={item.value} item={item}>
                    <Combobox.ItemText>{item.label}</Combobox.ItemText>
                    <Combobox.ItemIndicator><CheckIcon /></Combobox.ItemIndicator>
                  </Combobox.Item>
                ))}
              </Combobox.Content>
            </Combobox.Positioner>
          </Combobox.Root>
        </Stack>

        <Stack gap="1" flex="1" minWidth="0">
          <Text textStyle="xs" color="fg.muted">Transform</Text>
          <Combobox.Root collection={transformCollection} value={transformValue} onValueChange={(details) => onUpdate(index, { transform: details.value[0] || undefined })}>
            <Combobox.Control>
              <Combobox.Input placeholder="— None (Identity) —" />
              <Combobox.IndicatorGroup>
                <Combobox.Trigger />
              </Combobox.IndicatorGroup>
            </Combobox.Control>
            <Combobox.Positioner>
              <Combobox.Content css={{ maxHeight: '400px', overflowY: 'auto' }}>
                {transformCollection.items.map((item) => (
                  <Combobox.Item key={item.value} item={item}>
                    <Combobox.ItemText>{item.label}</Combobox.ItemText>
                    <Combobox.ItemIndicator><CheckIcon /></Combobox.ItemIndicator>
                  </Combobox.Item>
                ))}
              </Combobox.Content>
            </Combobox.Positioner>
          </Combobox.Root>
          {transformDesc && <Text textStyle="xs" color="fg.muted">{transformDesc}</Text>}
        </Stack>

        <Stack gap="1" alignItems="center" minWidth="70px">
          <Text textStyle="xs" color="fg.muted">Priority</Text>
          <Input
            type="number"
            value={rule.priority}
            onChange={e => onUpdate(index, { priority: parseInt(e.target.value) || 0 })}
            width="60px"
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
        <Stack mt="3" pt="3" borderTopWidth="1px" borderColor="border">
          <ConditionEditor
            condition={rule.condition}
            onChange={cond => onUpdate(index, { condition: cond })}
            availableFields={[...appFields, ...elvantoFields]}
          />
        </Stack>
      )}
      </HStack>
    </Stack>
  )
}

function ConditionEditor({ condition, onChange, availableFields }: {
  condition: any
  onChange: (cond: any) => void
  availableFields: string[]
}) {
  const [editMode, setEditMode] = useState<'simple' | 'advanced'>('simple')

  const fieldCollection = useMemo(() => createListCollection({
    items: [{ label: 'Field', value: '' }, ...availableFields.map(f => ({ label: f, value: f }))]
  }), [availableFields])

  const operatorCollection = useMemo(() => createListCollection({
    items: [
      { label: 'Equals', value: 'equals' },
      { label: 'Not Equals', value: 'not_equals' },
      { label: 'In List', value: 'in' },
      { label: 'Exists', value: 'exists' },
    ]
  }), [])

  const typeCollection = useMemo(() => createListCollection({
    items: [
      { label: 'AND (all)', value: 'and' },
      { label: 'OR (any)', value: 'or' },
    ]
  }), [])

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

  const fieldValue = condition.field ? [condition.field] : []
  const operatorValue = condition.operator ? [condition.operator] : []
  const typeValue = condition.type ? [condition.type] : []

  if (editMode === 'simple') {
    return (
      <Stack gap="3">
        <HStack gap="3" flexWrap="wrap">
          <Combobox.Root collection={fieldCollection} value={fieldValue} onValueChange={(details) => onChange({ ...condition, field: details.value[0] || '' })}>
            <Combobox.Control>
              <Combobox.Input placeholder="Field" />
              <Combobox.IndicatorGroup>
                <Combobox.Trigger />
              </Combobox.IndicatorGroup>
            </Combobox.Control>
            <Combobox.Positioner>
              <Combobox.Content css={{ maxHeight: '400px', overflowY: 'auto' }}>
                {fieldCollection.items.map((item) => (
                  <Combobox.Item key={item.value} item={item}>
                    <Combobox.ItemText>{item.label}</Combobox.ItemText>
                    <Combobox.ItemIndicator><CheckIcon /></Combobox.ItemIndicator>
                  </Combobox.Item>
                ))}
              </Combobox.Content>
            </Combobox.Positioner>
          </Combobox.Root>

          <Combobox.Root collection={operatorCollection} value={operatorValue} onValueChange={(details) => onChange({ ...condition, operator: details.value[0] || 'equals' })}>
            <Combobox.Control>
              <Combobox.Input placeholder="Operator" />
              <Combobox.IndicatorGroup>
                <Combobox.Trigger />
              </Combobox.IndicatorGroup>
            </Combobox.Control>
            <Combobox.Positioner>
              <Combobox.Content css={{ maxHeight: '400px', overflowY: 'auto' }}>
                {operatorCollection.items.map((item) => (
                  <Combobox.Item key={item.value} item={item}>
                    <Combobox.ItemText>{item.label}</Combobox.ItemText>
                    <Combobox.ItemIndicator><CheckIcon /></Combobox.ItemIndicator>
                  </Combobox.Item>
                ))}
              </Combobox.Content>
            </Combobox.Positioner>
          </Combobox.Root>

          {condition.operator !== 'exists' && (
            <Input
              value={condition.value || ''}
              onChange={e => onChange({ ...condition, value: e.target.value })}
              placeholder="Value"
              minWidth="150px"
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
        <Combobox.Root collection={typeCollection} value={typeValue} onValueChange={(details) => onChange({ ...condition, type: details.value[0] || 'and' })}>
          <Combobox.Control>
            <Combobox.Input placeholder="Type" />
            <Combobox.IndicatorGroup>
              <Combobox.Trigger />
            </Combobox.IndicatorGroup>
          </Combobox.Control>
          <Combobox.Positioner>
            <Combobox.Content css={{ maxHeight: '400px', overflowY: 'auto' }}>
              {typeCollection.items.map((item) => (
                <Combobox.Item key={item.value} item={item}>
                  <Combobox.ItemText>{item.label}</Combobox.ItemText>
                  <Combobox.ItemIndicator><CheckIcon /></Combobox.ItemIndicator>
                </Combobox.Item>
              ))}
            </Combobox.Content>
          </Combobox.Positioner>
        </Combobox.Root>
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
