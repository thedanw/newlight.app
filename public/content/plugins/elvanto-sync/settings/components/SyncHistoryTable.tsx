import { Stack } from 'styled-system/jsx'
import { Heading, Text, Card, Table, Badge, Button, Input, Dialog, Alert, Select } from '@/core/ui'
import { usePluginAPIContext } from '@/core/plugins/PluginAPI'
import { useState, useEffect, useMemo } from 'react'
import { createListCollection } from '@ark-ui/react'
import { ChevronsUpDownIcon, CheckIcon } from 'lucide-react'

interface SyncHistoryItem {
  id: string
  entity: string
  trigger: 'cron' | 'manual' | 'webhook'
  started_at: string
  completed_at: string | null
  status: 'running' | 'completed' | 'partial' | 'failed'
  items_processed: number
  items_failed: number
  error_summary: string | null
  triggered_by_user: string | null
}

/**
 * Sync History Table — Paginated table with filters and "View Details" modal
 */
export function SyncHistoryTable() {
  const { toast, supabase } = usePluginAPIContext()
  const [history, setHistory] = useState<SyncHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({
    entity: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  })
  const [selectedItem, setSelectedItem] = useState<SyncHistoryItem | null>(null)

  // Load history on mount and when filters/page change
  useEffect(() => {
    loadHistory()
  }, [page, pageSize, filters])

  const loadHistory = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('elvanto_sync_history')
        .select('*', { count: 'exact' })
        .order('started_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      // Apply filters
      if (filters.entity) {
        query = query.eq('entity', filters.entity)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.dateFrom) {
        query = query.gte('started_at', filters.dateFrom)
      }
      if (filters.dateTo) {
        query = query.lte('started_at', filters.dateTo)
      }

      const { data, error, count } = await query

      if (error) throw error

      setHistory(data || [])
      setTotal(count || 0)
    } catch (err) {
      console.error('[SyncHistoryTable] Failed to load history:', err)
      toast.error('Failed to load sync history')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="solid">{status}</Badge>
      case 'partial': return <Badge variant="surface">{status}</Badge>
      case 'failed': return <Badge variant="outline">{status}</Badge>
      case 'running': return <Badge variant="subtle">{status}</Badge>
      default: return <Badge variant="subtle">{status}</Badge>
    }
  }

  const getTriggerBadge = (trigger: string) => {
    switch (trigger) {
      case 'cron': return <Badge variant="subtle">{trigger}</Badge>
      case 'manual': return <Badge variant="outline">{trigger}</Badge>
      case 'webhook': return <Badge variant="solid">{trigger}</Badge>
      default: return <Badge variant="subtle">{trigger}</Badge>
    }
  }

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleString()
  }

  const formatDuration = (started: string, completed: string | null) => {
    if (!completed) return 'Running...'
    const diff = new Date(completed).getTime() - new Date(started).getTime()
    const seconds = Math.floor(diff / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m`
  }

  const handleViewDetails = (item: SyncHistoryItem) => {
    setSelectedItem(item)
  }

  const pageSizeCollection = useMemo(() => createListCollection({
    items: [
      { label: '10', value: '10' },
      { label: '20', value: '20' },
      { label: '50', value: '50' },
      { label: '100', value: '100' },
    ]
  }), [])

  const entityCollection = useMemo(() => createListCollection({
    items: [
      { label: 'All', value: '' },
      { label: 'People', value: 'people' },
      { label: 'Households', value: 'households' },
      { label: 'Journey', value: 'journey' },
      { label: 'Groups', value: 'groups' },
      { label: 'Services', value: 'services' },
      { label: 'Songs', value: 'songs' },
      { label: 'Calendar Events', value: 'calendar_events' },
      { label: 'Transactions', value: 'transactions' },
    ]
  }), [])

  const statusCollection = useMemo(() => createListCollection({
    items: [
      { label: 'All', value: '' },
      { label: 'Completed', value: 'completed' },
      { label: 'Partial', value: 'partial' },
      { label: 'Failed', value: 'failed' },
      { label: 'Running', value: 'running' },
    ]
  }), [])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <Stack gap="6">
      <Stack flexDirection="row" gap="3" justify="space-between" align="center">
        <Heading textStyle="md">Sync History</Heading>
        <Stack flexDirection="row" gap="2">
          <Select.Root collection={pageSizeCollection} value={[String(pageSize)]} onValueChange={(details) => { setPageSize(Number(details.value[0])); setPage(1); }}>
            <Select.Control>
              <Select.Trigger minWidth="80px">
                <Select.ValueText />
                <Select.Indicator><ChevronsUpDownIcon /></Select.Indicator>
              </Select.Trigger>
            </Select.Control>
            <Select.Positioner>
              <Select.Content>
                {pageSizeCollection.items.map((item) => (
                  <Select.Item key={item.value} item={item}>
                    <Select.ItemText>{item.label}</Select.ItemText>
                    <Select.ItemIndicator><CheckIcon /></Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Select.Root>
        </Stack>
      </Stack>

      {/* Filters */}
      <Card.Root>
        <Card.Header>
          <Card.Title>Filters</Card.Title>
        </Card.Header>
        <Card.Body>
          <Stack flexDirection="row" gap="3" flexWrap="wrap">
            <Stack gap="1" minWidth="150px">
              <Text textStyle="xs" color="fg.muted">Entity</Text>
              <Select.Root collection={entityCollection} value={[filters.entity]} onValueChange={(details) => setFilters({ ...filters, entity: details.value[0] })}>
                <Select.Control>
                  <Select.Trigger width="100%">
                    <Select.ValueText placeholder="All" />
                    <Select.Indicator><ChevronsUpDownIcon /></Select.Indicator>
                  </Select.Trigger>
                </Select.Control>
                <Select.Positioner>
                  <Select.Content>
                    {entityCollection.items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        <Select.ItemText>{item.label}</Select.ItemText>
                        <Select.ItemIndicator><CheckIcon /></Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Select.Root>
            </Stack>
            <Stack gap="1" minWidth="150px">
              <Text textStyle="xs" color="fg.muted">Status</Text>
              <Select.Root collection={statusCollection} value={[filters.status]} onValueChange={(details) => setFilters({ ...filters, status: details.value[0] })}>
                <Select.Control>
                  <Select.Trigger width="100%">
                    <Select.ValueText placeholder="All" />
                    <Select.Indicator><ChevronsUpDownIcon /></Select.Indicator>
                  </Select.Trigger>
                </Select.Control>
                <Select.Positioner>
                  <Select.Content>
                    {statusCollection.items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        <Select.ItemText>{item.label}</Select.ItemText>
                        <Select.ItemIndicator><CheckIcon /></Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Select.Root>
            </Stack>
            <Stack gap="1" minWidth="180px">
              <Text textStyle="xs" color="fg.muted">Date From</Text>
              <Input type="date" value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} />
            </Stack>
            <Stack gap="1" minWidth="180px">
              <Text textStyle="xs" color="fg.muted">Date To</Text>
              <Input type="date" value={filters.dateTo} onChange={e => setFilters({ ...filters, dateTo: e.target.value })} />
            </Stack>
            <Button variant="outline" onClick={() => setFilters({ entity: '', status: '', dateFrom: '', dateTo: '' })}>
              Clear Filters
            </Button>
          </Stack>
        </Card.Body>
      </Card.Root>

      {/* History Table */}
      <Card.Root>
        <Card.Header>
          <Stack flexDirection="row" justify="space-between" align="center">
            <Card.Title>Sync Runs</Card.Title>
            <Text textStyle="sm" color="fg.muted">
              Showing {history.length} of {total} runs
            </Text>
          </Stack>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <Text color="fg.muted" textAlign="center" p="6">Loading history...</Text>
          ) : history.length === 0 ? (
            <Text color="fg.muted" textAlign="center" p="6">No sync history found</Text>
          ) : (
            <>
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.Head>Entity</Table.Head>
                    <Table.Head>Trigger</Table.Head>
                    <Table.Head>Started</Table.Head>
                    <Table.Head>Completed</Table.Head>
                    <Table.Head>Duration</Table.Head>
                    <Table.Head>Status</Table.Head>
                    <Table.Head>Processed</Table.Head>
                    <Table.Head>Failed</Table.Head>
                    <Table.Head>Actions</Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {history.map((run) => (
                    <Table.Row key={run.id}>
                      <Table.Cell>{run.entity}</Table.Cell>
                      <Table.Cell>{getTriggerBadge(run.trigger)}</Table.Cell>
                      <Table.Cell>{formatDate(run.started_at)}</Table.Cell>
                      <Table.Cell>{formatDate(run.completed_at)}</Table.Cell>
                      <Table.Cell>{formatDuration(run.started_at, run.completed_at)}</Table.Cell>
                      <Table.Cell>{getStatusBadge(run.status)}</Table.Cell>
                      <Table.Cell>{run.items_processed.toLocaleString()}</Table.Cell>
                      <Table.Cell>{run.items_failed.toLocaleString()}</Table.Cell>
                      <Table.Cell>
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(run)}>
                          View Details
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>

              {/* Pagination */}
              {totalPages > 1 && (
                <Stack flexDirection="row" gap="2" justify="center" mt="4">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    Previous
                  </Button>
                  <Stack flexDirection="row" gap="1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (page <= 3) {
                        pageNum = i + 1
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = page - 2 + i
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? 'solid' : 'outline'}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </Stack>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    Next
                  </Button>
                </Stack>
              )}
            </>
          )}
        </Card.Body>
      </Card.Root>

      {/* Details Modal */}
      <Dialog.Root open={!!selectedItem} onOpenChange={open => !open && setSelectedItem(null)}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Sync Run Details</Dialog.Title>
              <Dialog.Description>Entity: {selectedItem?.entity} | ID: {selectedItem?.id}</Dialog.Description>
            </Dialog.Header>
            <Stack gap="4">
              <Stack gap="2">
                <Stack flexDirection="row" gap="4">
                  <Text textStyle="sm" color="fg.muted" minWidth="120px">Entity</Text>
                  <Text textStyle="sm" fontWeight="medium">{selectedItem?.entity}</Text>
                </Stack>
                <Stack flexDirection="row" gap="4">
                  <Text textStyle="sm" color="fg.muted" minWidth="120px">Trigger</Text>
                  <Text textStyle="sm">{selectedItem?.trigger}</Text>
                </Stack>
                <Stack flexDirection="row" gap="4">
                  <Text textStyle="sm" color="fg.muted" minWidth="120px">Status</Text>
                  <Text textStyle="sm" fontWeight="medium">{getStatusBadge(selectedItem?.status || '')}</Text>
                </Stack>
                <Stack flexDirection="row" gap="4">
                  <Text textStyle="sm" color="fg.muted" minWidth="120px">Started</Text>
                  <Text textStyle="sm">{formatDate(selectedItem?.started_at)}</Text>
                </Stack>
                <Stack flexDirection="row" gap="4">
                  <Text textStyle="sm" color="fg.muted" minWidth="120px">Completed</Text>
                  <Text textStyle="sm">{formatDate(selectedItem?.completed_at)}</Text>
                </Stack>
                <Stack flexDirection="row" gap="4">
                  <Text textStyle="sm" color="fg.muted" minWidth="120px">Duration</Text>
                  <Text textStyle="sm">{formatDuration(selectedItem?.started_at || '', selectedItem?.completed_at || null)}</Text>
                </Stack>
                <Stack flexDirection="row" gap="4">
                  <Text textStyle="sm" color="fg.muted" minWidth="120px">Processed</Text>
                  <Text textStyle="sm">{selectedItem?.items_processed.toLocaleString()}</Text>
                </Stack>
                <Stack flexDirection="row" gap="4">
                  <Text textStyle="sm" color="fg.muted" minWidth="120px">Failed</Text>
                  <Text textStyle="sm" color={selectedItem && selectedItem.items_failed > 0 ? 'red' : 'inherit'}>
                    {selectedItem?.items_failed.toLocaleString()}
                  </Text>
                </Stack>
                <Stack flexDirection="row" gap="4">
                  <Text textStyle="sm" color="fg.muted" style={{ minWidth: '120px' }}>Triggered By</Text>
                  <Text textStyle="sm">{selectedItem?.triggered_by_user || 'System'}</Text>
                </Stack>
              </Stack>

              {selectedItem?.error_summary && (
                <Alert.Root variant="solid">
                  <Alert.Title>Error Summary</Alert.Title>
                  <Alert.Description>{selectedItem.error_summary}</Alert.Description>
                </Alert.Root>
              )}

              <Stack flexDirection="row" gap="2" justify="end">
                <Button variant="outline" onClick={() => setSelectedItem(null)}>Close</Button>
              </Stack>
            </Stack>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Stack>
  )
}