'use client'
import { Heading, Text, Input, Button, Badge, Card, Combobox, NumberInput } from '@/core/ui'
import { usePluginAPIContext } from '@/core/plugins/PluginAPI'
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

interface FieldMappingTableProps {
  disabled?: boolean
  dynamicFieldOptions?: Array<{ value: string; label: string }>
}

const APP_FIELDS = [
  'firstname', 'preferred_name', 'lastname', 'middle_name',
  'demographic', 'gender', 'date_of_birth', 'marital_status',
  'kindy_start_year', 'school_name', 'school_email_permission', 'school_email',
  'address_line1', 'address_suburb', 'address_state', 'address_postcode',
  'email', 'contact_channels',
  'guardian_relationships',
  'medical_allergies', 'medical_other', 'medical_medication',
  'consent_external_photo', 'consent_internal_photo', 'consent_school_email',
  'consent_biscuit_under5', 'consent_girl_guide_offsite',
  'safe_ministry_leader_type', 'safe_ministry_notes', 'safe_ministry_start_date',
  'wwcc_number', 'wwcc_expiry_date', 'wwcc_verification_date',
  'wwcc_verification_by', 'wwcc_verification_outcome', 'wwcc_exemption',
  'smt_certificate_no', 'smt_completion_date', 'smt_last_type',
  'smc_exemption', 'smc_reviewer', 'smc_result_date', 'smc_result',
  'access_permission', 'date_professed',
  'legacy_date_added', 'legacy_member_id',
  'journey',
  'elvanto_category_id', 'elvanto_archived', 'elvanto_login_status',
  'elvanto_is_contact', 'elvanto_deceased', 'elvanto_custom_fields',
  'elvanto_school_grade', 'elvanto_giving_number', 'elvanto_locations',
]

const ELVANTO_FIELDS = [
  'id', 'date_added', 'date_modified', 'category_id',
  'firstname', 'preferred_name', 'middle_name', 'lastname',
  'email', 'phone', 'mobile', 'admin', 'archived', 'contact',
  'volunteer', 'status', 'username', 'last_login', 'country',
  'timezone', 'picture', 'family_id', 'family_relationship',
  'birthday', 'anniversary', 'gender', 'marital_status',
  'school_grade', 'security_code', 'receipt_name', 'giving_number',
  'deceased', 'development_child', 'special_needs_child',
  'locations', 'home_address', 'home_address2', 'home_city',
  'home_state', 'home_postcode', 'home_country',
  'mailing_address', 'mailing_address2', 'mailing_city',
  'mailing_state', 'mailing_postcode', 'mailing_country',
  'departments', 'service_types', 'demographics',
  'access_permissions', 'reports_to', 'family',
  'custom_<uuid>',
]

const DEFAULT_MAPPINGS: MappingRule[] = [
  { appField: 'firstname', elvantoField: 'firstname', direction: 'both', priority: 100 },
  { appField: 'lastname', elvantoField: 'lastname', direction: 'both', priority: 100 },
  { appField: 'preferred_name', elvantoField: 'preferred_name', direction: 'both', priority: 100 },
  { appField: 'middle_name', elvantoField: 'middle_name', direction: 'both', priority: 100 },
  { appField: 'email', elvantoField: 'email', direction: 'both', priority: 100 },
  { appField: 'contact_channels.primary_mobile.value', elvantoField: 'mobile', direction: 'both', priority: 90 },
  { appField: 'contact_channels.primary_home.value', elvantoField: 'phone', direction: 'both', priority: 90 },
  { appField: 'demographic', elvantoField: 'category_id', direction: 'pull', priority: 80, transform: 'category_to_demographic' },
  { appField: 'gender', elvantoField: 'gender', direction: 'both', priority: 80, transform: 'capitalize_enum' },
  { appField: 'date_of_birth', elvantoField: 'birthday', direction: 'both', priority: 80 },
  { appField: 'marital_status', elvantoField: 'marital_status', direction: 'both', priority: 80, transform: 'defacto_to_partner' },
  { appField: 'kindy_start_year', elvantoField: 'school_grade', direction: 'pull', priority: 80, transform: 'school_grade_to_kindy_year' },
  { appField: 'access_permission', elvantoField: 'admin', direction: 'pull', priority: 70, transform: 'admin_to_access_permission' },
  { appField: 'access_permission', elvantoField: 'admin', direction: 'push', priority: 70, transform: 'access_permission_to_admin' },
  { appField: 'journey.sunday_services', elvantoField: 'category_id', direction: 'pull', priority: 60, transform: 'category_to_journey_stage' },
  { appField: 'journey', elvantoField: 'locations.location[]', direction: 'pull', priority: 60, transform: 'location_to_journey_tracks' },
  { appField: 'custom_fields', elvantoField: 'custom_<uuid>', direction: 'pull', priority: 50 },
  { appField: 'elvanto_category_id', elvantoField: 'category_id', direction: 'pull', priority: 10 },
  { appField: 'elvanto_archived', elvantoField: 'archived', direction: 'pull', priority: 10, transform: 'int_flag_to_bool' },
  { appField: 'elvanto_login_status', elvantoField: 'status', direction: 'pull', priority: 10, transform: 'lowercase_enum' },
  { appField: 'elvanto_is_contact', elvantoField: 'contact', direction: 'pull', priority: 10, transform: 'int_flag_to_bool' },
  { appField: 'elvanto_deceased', elvantoField: 'deceased', direction: 'pull', priority: 10, transform: 'int_flag_to_bool' },
  { appField: 'elvanto_custom_fields', elvantoField: 'custom_<uuid>', direction: 'pull', priority: 10 },
  { appField: 'elvanto_school_grade', elvantoField: 'school_grade', direction: 'pull', priority: 10 },
  { appField: 'elvanto_giving_number', elvantoField: 'giving_number', direction: 'pull', priority: 10 },
  { appField: 'elvanto_locations', elvantoField: 'locations', direction: 'pull', priority: 10 },
]

export function FieldMappingTable({ disabled = false, dynamicFieldOptions = [] }: FieldMappingTableProps) {
  const { settings, toast } = usePluginAPIContext()
  const [mappings, setMappings] = useState<MappingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [appFields] = useState<string[]>(APP_FIELDS)
  const [elvantoFields, setElvantoFields] = useState<string[]>(ELVANTO_FIELDS)

  useEffect(() => {
    if (dynamicFieldOptions.length > 0) {
      const dynamicValues = new Set(dynamicFieldOptions.map(o => o.value))
      setElvantoFields(prev => prev.filter(f => !dynamicValues.has(f)))
    }
  }, [dynamicFieldOptions])

  useEffect(() => {
    loadMappings()
  }, [])

  const loadMappings = async () => {
    setLoading(true)
    try {
      const data = await settings.getConfig<MappingRule[]>('field_mappings')
      if (data) {
        setMappings(data)
      } else {
        setMappings(DEFAULT_MAPPINGS)
      }
    } catch (err) {
      console.error('[FieldMappingTable] Failed to load mappings:', err)
      toast.error('Failed to load field mappings')
    } finally {
      setLoading(false)
    }
  }

  const saveMappings = async () => {
    setSaving(true)
    try {
      const sorted = [...mappings].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
      await settings.setConfig('field_mappings', sorted)
      toast.success('Field mappings saved')
    } catch (err) {
      console.error('[FieldMappingTable] Failed to save mappings:', err)
      toast.error('Failed to save field mappings')
    } finally {
      setSaving(false)
    }
  }

  const addMapping = () => {
    setMappings([...mappings, { appField: '', elvantoField: '', direction: 'pull', priority: 0 }])
  }

  const updateMapping = (index: number, updates: Partial<MappingRule>) => {
    setMappings(mappings.map((rule, i) => i === index ? { ...rule, ...updates } : rule))
  }

  const deleteMapping = (index: number) => {
    setMappings(mappings.filter((_, i) => i !== index))
  }

  const duplicateMapping = (index: number) => {
    const duplicated = { ...mappings[index], priority: mappings[index].priority - 1 }
    setMappings([...mappings.slice(0, index + 1), duplicated, ...mappings.slice(index + 1)])
  }

  if (loading) {
    return (
      <Stack gap="4" align="center">
        <Text>Loading field mappings...</Text>
      </Stack>
    )
  }

  if (disabled) {
    return (
      <Card.Root>
        <Card.Body>
          <Stack gap="3" align="center" p="6">
            <Text color="fg.muted" textStyle="sm" textAlign="center">
              Field mappings are disabled until an Elvanto API key is saved and tested.
              Please go to the <strong>Connection</strong> tab to configure your API key.
            </Text>
          </Stack>
        </Card.Body>
      </Card.Root>
    )
  }

  return (
    <Stack gap="6">
      <Heading textStyle="md">Field Mappings</Heading>
      <Text color="fg.muted" textStyle="sm">
        Configure how Supabase fields map to Elvanto fields with conditional logic and transforms.
      </Text>

      <Card.Root>
        <Card.Header>
          <Card.Title>Mapping Rules</Card.Title>
          <Card.Description>Use + to expand conditions for each rule</Card.Description>
        </Card.Header>
        <Card.Body>
          {mappings.length === 0 ? (
            <Stack gap="4" align="center" p="6">
              <Text color="fg.muted">No mapping rules yet</Text>
              <Button onClick={addMapping}>Add First Mapping</Button>
            </Stack>
          ) : (
            <Stack gap="3">
              {mappings.map((rule, index) => (
                <MappingRuleCard
                  key={index}
                  rule={rule}
                  index={index}
                  appFields={appFields}
                  elvantoFields={elvantoFields}
                  dynamicElvantoFieldOptions={dynamicFieldOptions}
                  onUpdate={updateMapping}
                  onDelete={deleteMapping}
                  onDuplicate={duplicateMapping}
                />
              ))}
            </Stack>
          )}
        </Card.Body>
        <Card.Footer>
          <HStack gap="3" justify="end">
            <Button variant="outline" onClick={addMapping}>+ Add Mapping</Button>
            <Button onClick={saveMappings} loading={saving} disabled={saving}>Save All</Button>
          </HStack>
        </Card.Footer>
      </Card.Root>
    </Stack>
  )
}

interface MappingRuleCardProps {
  rule: MappingRule
  index: number
  appFields: string[]
  elvantoFields: string[]
  dynamicElvantoFieldOptions: Array<{ value: string; label: string }>
  onUpdate: (index: number, updates: Partial<MappingRule>) => void
  onDelete: (index: number) => void
  onDuplicate: (index: number) => void
}

function MappingRuleCard({ rule, index, appFields, elvantoFields, dynamicElvantoFieldOptions, onUpdate, onDelete, onDuplicate }: MappingRuleCardProps) {
  const [expanded, setExpanded] = useState(false)

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
    <Stack>
      <HStack gap="3" alignItems="center" justifyContent="space-between" flexWrap="wrap">
        <Stack gap="1" flex="1" minWidth="200px">
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

        <Stack gap="1" alignItems="center">
          <Text textStyle="xs" color="fg.muted">Direction</Text>
          <Text textStyle="sm" color="fg">
            {rule.direction === 'pull' ? '→' : rule.direction === 'push' ? '←' : '↔'}
          </Text>
        </Stack>

        <Stack gap="1" flex="1" minWidth="200px">
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

        <Stack gap="1" flex="1" minWidth="200px">
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
        </Stack>

        <Stack gap="1" alignItems="center" minWidth="80px">
          <Text textStyle="xs" color="fg.muted">Priority</Text>
          <NumberInput.Root value={String(rule.priority)} onValueChange={(e) => onUpdate(index, { priority: parseInt(e.value) || 0 })}>
            <NumberInput.Input width="60px" />
            <NumberInput.Control>
              <NumberInput.IncrementTrigger />
              <NumberInput.DecrementTrigger />
            </NumberInput.Control>
          </NumberInput.Root>
        </Stack>

        <HStack gap="1">
          <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? '−' : '+'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDuplicate(index)} title="Duplicate">
            📋
          </Button>
          <Button variant="solid" size="sm" onClick={() => onDelete(index)} title="Delete">
            🗑
          </Button>
        </HStack>
      </HStack>

      {expanded && (
        <Stack mt="3" pt="3" borderTopWidth="1px" borderColor="border">
          <ConditionEditor
            condition={rule.condition}
            onChange={cond => onUpdate(index, { condition: cond })}
            availableFields={[...appFields, ...elvantoFields, ...dynamicElvantoFieldOptions.map(o => o.value)]}
          />
        </Stack>
      )}
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
