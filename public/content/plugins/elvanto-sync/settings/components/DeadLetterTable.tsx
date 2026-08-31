import { Heading, Text, Card, Table, Badge, Button, Dialog } from '@/core/ui'
import { usePluginAPIContext } from '@/core/plugins/PluginAPI'
import { useState, useEffect } from 'react'
import { HStack, Stack } from 'styled-system/jsx'

interface DeadLetterItem {
  id: string
  entity: string
  payload: Record<string, any>
  error: string
  attempt_count: number
  last_attempt_at: string
  created_at: string
  resolved_at: string | null
  resolved_by: string | null
}

export function DeadLetterTable() {
  const { supabase, toast } = usePluginAPIContext()
  const [deadLetters, setDeadLetters] = useState<DeadLetterItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({
    entity: '',
    resolved: '',
  })
  const [selectedItem, setSelectedItem] = useState<DeadLetterItem | null>(null)

  useEffect(() => {
    loadDeadLetters()
  }, [page, pageSize, filters])

  const loadDeadLetters = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('elvanto_sync_dead_letter')
        .select('*', { count: 'exact' })
        .order('last_attempt_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (filters.entity) {
        query = query.eq('entity', filters.entity)
      }
      if (filters.resolved === 'resolved') {
        query = query.not('resolved_at', 'is', null)
      } else if (filters.resolved === 'pending') {
        query = query.is('resolved_at', null)
      }

      const { data, error, count } = await query

      if (error) throw error

      setDeadLetters(data || [])
      setTotal(count || 0)
    } catch (err) {
      console.error('[DeadLetterTable] Failed to load dead letters:', err)
      toast.error('Failed to load dead letter queue')
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = async (item: DeadLetterItem) => {
    try {
      const { error } = await supabase
        .from('elvanto_sync_dead_letter')
        .delete()
        .eq('id', item.id)

      if (error) throw error

      toast.success(`Re-queued ${item.entity} item for retry`)
      loadDeadLetters()
    } catch (err) {
      console.error('[DeadLetterTable] Retry failed:', err)
      toast.error('Failed to retry item')
    }
  }

  const handleResolve = async (item: DeadLetterItem) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const { error } = await (supabase as any)
        .from('elvanto_sync_dead_letter')
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: userData.user?.id,
        })
        .eq('id', item.id)

      if (error) throw error

      toast.success(`Marked ${item.entity} item as resolved`)
      loadDeadLetters()
    } catch (err) {
      console.error('[DeadLetterTable] Resolve failed:', err)
      toast.error('Failed to resolve item')
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <Stack gap="6">
      <HStack justify="space-between" style={{ alignItems: 'center' }}>
        <Heading textStyle="md">Dead Letter Queue</Heading>
        <HStack gap="2">
          <select value={String(pageSize)} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </HStack>
      </HStack>

      <Card.Root>
        <Card.Header>
          <Card.Title>Filters</Card.Title>
        </Card.Header>
        <Card.Body>
          <HStack gap="3" flexWrap="wrap">
            <Stack gap="1" style={{ minWidth: '150px' }}>
              <Text textStyle="xs" color="fg.muted">Entity</Text>
              <select value={filters.entity} onChange={e => setFilters({ ...filters, entity: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-default)', color: 'var(--fg-default)' }}>
                <option value="">All</option>
                <option value="people">People</option>
                <option value="households">Households</option>
                <option value="journey">Journey</option>
                <option value="groups">Groups</option>
                <option value="services">Services</option>
                <option value="songs">Songs</option>
                <option value="calendar_events">Calendar Events</option>
                <option value="transactions">Transactions</option>
              </select>
            </Stack>
            <Stack gap="1" style={{ minWidth: '150px' }}>
              <Text textStyle="xs" color="fg.muted">Status</Text>
              <select value={filters.resolved} onChange={e => setFilters({ ...filters, resolved: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-default)', color: 'var(--fg-default)' }}>
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
              </select>
            </Stack>
            <Button variant="outline" onClick={() => setFilters({ entity: '', resolved: '' })}>
              Clear Filters
            </Button>
          </HStack>
        </Card.Body>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <HStack justify="space-between" style={{ alignItems: 'center' }}>
            <Card.Title>Failed Items</Card.Title>
            <Text textStyle="sm" color="fg.muted">
              Showing {deadLetters.length} of {total} items
            </Text>
          </HStack>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <Text color="fg.muted" style={{ padding: '24px', textAlign: 'center' }}>Loading dead letter queue...</Text>
          ) : deadLetters.length === 0 ? (
            <Text color="fg.muted" style={{ padding: '24px', textAlign: 'center' }}>No failed items. Great job!</Text>
          ) : (
            <>
              <Table.Root>
                <Table.Head>
                  <Table.Row>
                    <Table.Header>Entity</Table.Header>
                    <Table.Header>Error</Table.Header>
                    <Table.Header>Attempts</Table.Header>
                    <Table.Header>Last Attempt</Table.Header>
                    <Table.Header>Status</Table.Header>
                    <Table.Header>Actions</Table.Header>
                  </Table.Row>
                </Table.Head>
                <Table.Body>
                  {deadLetters.map((item) => (
                    <Table.Row key={item.id}>
                      <Table.Cell>{item.entity}</Table.Cell>
                      <Table.Cell>
                        <Text textStyle="sm" style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.error}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>{item.attempt_count}</Table.Cell>
                      <Table.Cell>{item.last_attempt_at ? new Date(item.last_attempt_at).toLocaleString() : '—'}</Table.Cell>
                      <Table.Cell>
                        {item.resolved_at ? (
                          <Badge variant="solid" color="green">Resolved</Badge>
                        ) : (
                          <Badge variant="solid" color="red">Pending</Badge>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <HStack gap="2">
                          <Button variant="outline" size="sm" onClick={() => setSelectedItem(item)}>
                            View Payload
                          </Button>
                          {!item.resolved_at && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleRetry(item)}>
                                Retry
                              </Button>
                              <Button variant="solid" size="sm" color="red" onClick={() => handleResolve(item)}>
                                Resolve
                              </Button>
                            </>
                          )}
                        </HStack>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>

              {totalPages > 1 && (
                <HStack gap="2" justify="center" style={{ marginTop: '16px' }}>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    Previous
                  </Button>
                  <HStack gap="1">
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
                  </HStack>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    Next
                  </Button>
                </HStack>
              )}
            </>
          )}
        </Card.Body>
      </Card.Root>

      <Dialog.Root open={!!selectedItem} onOpenChange={(details) => !details.open && setSelectedItem(null)}>
        <Dialog.Trigger asChild>
          <Button variant="outline" size="sm">View Payload</Button>
        </Dialog.Trigger>
        <Dialog.Content style={{ maxWidth: '800px' }}>
          <Dialog.Header>
            <Dialog.Title>Payload Details</Dialog.Title>
          </Dialog.Header>
          <Stack gap="4">
            <Text textStyle="sm" fontFamily="monospace" style={{ whiteSpace: 'pre-wrap', maxHeight: '400px', overflow: 'auto' }}>
              {selectedItem ? JSON.stringify(selectedItem.payload, null, 2) : ''}
            </Text>
            <HStack gap="2" justify="end">
              <Button variant="outline" onClick={() => setSelectedItem(null)}>Close</Button>
            </HStack>
          </Stack>
        </Dialog.Content>
      </Dialog.Root>
    </Stack>
  )
}
