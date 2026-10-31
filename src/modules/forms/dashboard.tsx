import { useEffect, useState, useCallback, useRef } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Page, Text, SearchInput, MainList, Dialog, Icon, Collapsible, CloseButton } from '@/core/ui'
import type { MainListHeaderConfig } from '@/core/ui/main-list'
import { Plus, SlidersHorizontal, Eye, Pencil, Copy, Trash2, Save } from 'lucide-react'
import { deleteForm, getForms, duplicateForm, getFormSubmissionCounts, searchForms } from './lib/queries'
import { PageSkeleton } from '../people/components/PageSkeleton'
import { HStack, Stack } from 'styled-system/jsx'
import type { Form } from './lib/types'
import { Manifest } from './manifest'

/** A pending mass-delete confirmation — settles MainList's `onDeleteSelected` promise. */
type MassDeletePending = {
  keys: string[]
  resolve: () => void
  reject: (reason?: Error) => void
}

/**
 * Forms dashboard — shows the form list with search, actions, and pagination.
 */
export default function FormsDashboardPage() {
  const navigate = useNavigate()
  const [forms, setForms] = useState<Form[] | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Form[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<{ formId: string; formName: string } | null>(null)
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState<{ formId: string; formName: string } | null>(null)
  const [massDeleteDialog, setMassDeleteDialog] = useState<MassDeletePending | null>(null)
  const massDeletePendingRef = useRef<MassDeletePending | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 25
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({})
  const [filtersOpen, setFiltersOpen] = useState(false)
  // Editable row state: formId -> { nameEditable, visibilityValue }
  const [editableRows, setEditableRows] = useState<Record<string, { nameEditable: boolean; visibility: string }>>({})


  const load = useCallback(async () => {
    try {
      const [formsData, counts] = await Promise.all([getForms(), getFormSubmissionCounts()])
      setForms(formsData)
      setSubmissionCounts(counts)
    } catch (reason) {
      setError(reason instanceof Error ? reason : new Error(String(reason)))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Filter forms based on search term
  const filteredForms = searchTerm ? (searchResults ?? []) : (forms ?? [])

  // Pagination
  const paginatedForms = filteredForms.slice((page - 1) * pageSize, page * pageSize)

  const handleDelete = async (id: string) => {
    try {
      await deleteForm(id)
      setSelectedKeys(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      load()
    } catch {
      // Error handling could be added here
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const newForm = await duplicateForm(id)
      navigate(`/forms/${newForm.id}/edit`)
    } catch {
      // Error handling could be added here
    }
  }

  const handleSearch = useCallback(async (term: string) => {
    setSearchTerm(term)
    setPage(1)
    const results = await searchForms(term)
    setSearchResults(results)
  }, [])

  /**
   * MassManage delete flow: MainList awaits this promise before clearing the
   * selection, so the confirm dialog settles it. Confirm deletes the reported
   * keys and resolves (MainList then clears the selection); cancel rejects so
   * the selection is kept (see `handleDeleteSelected` in main-list.tsx).
   */
  const handleMassDelete = useCallback((keys: string[]): Promise<void> =>
    new Promise<void>((resolve, reject) => {
      const pending: MassDeletePending = { keys, resolve, reject }
      massDeletePendingRef.current = pending
      setMassDeleteDialog(pending)
    }), [])

  /** Take ownership of the pending confirmation (first claimer wins — guards
   *  against ActionTrigger's onClick and the resulting onOpenChange both firing). */
  const claimMassDelete = (): MassDeletePending | null => {
    const pending = massDeletePendingRef.current
    massDeletePendingRef.current = null
    setMassDeleteDialog(null)
    return pending
  }

  const confirmMassDelete = async () => {
    const pending = claimMassDelete()
    if (!pending) return
    setDeleting(true)
    try {
      for (const id of pending.keys) {
        await deleteForm(id)
      }
      load()
      pending.resolve()
    } catch {
      pending.reject(new Error('Unable to delete the selected forms.'))
    } finally {
      setDeleting(false)
    }
  }

  const cancelMassDelete = () => {
    claimMassDelete()?.reject(new Error('Mass delete cancelled.'))
  }

  const openDeleteDialog = (formId: string, formName: string) => {
    setDeleteDialogOpen({ formId, formName })
  }

  const openDuplicateDialog = (formId: string, formName: string) => {
    setDuplicateDialogOpen({ formId, formName })
  }

  /** Row content aligned with three-column header layout (name, visibility, submissions). */
  const renderRow = (form: Form, index: number, headers?: MainListHeaderConfig[]) => {
    const isEditable = editableRows[form.id]?.nameEditable ?? false
    const currentVisibility = editableRows[form.id]?.visibility ?? (form.is_public ? 'public' : 'private')
    
    // Build column styles from headers config for consistent alignment
    const colStyles = headers?.reduce((acc, h) => {
      acc[h.key] = {
        width: h.width,
        minWidth: h.width,
        maxWidth: h.width,
        textAlign: h.align,
      }
      return acc
    }, {} as Record<string, { width?: string; minWidth?: string; maxWidth?: string; textAlign?: string }>) || {}
    
    return (
      <>
        <MainList.RowContent>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4', width: '100%' }}>
            {/* Col1: Name - editable or display */}
            <div style={{ ...colStyles.name }}>
              {isEditable ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4' }}>
                  <Text fontWeight="medium" truncate>:</Text>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => {
                      // Update form name in state - would need to handle this
                      setEditableRows(prev => ({
                        ...prev,
                        [form.id]: { ...prev[form.id], nameEditable: true }
                      }))
                    }}
                    style={{ flex: '1', minWidth: 0 }}
                  />
                </div>
              ) : (
                <Text fontWeight="medium" truncate>{form.name}</Text>
              )}
            </div>
            {/* Col2: Visibility - 120px */}
            <div style={{...colStyles.visibility }}>
              {isEditable ? (
                <select
                  value={currentVisibility}
                  onChange={(e) => {
                    setEditableRows(prev => ({
                      ...prev,
                      [form.id]: { ...prev[form.id], visibility: e.target.value }
                    }))
                  }}
                  style={{ width: '100%' }}
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              ) : (
                <Badge colorPalette={form.is_public ? 'green' : 'gray'}>
                  {form.is_public ? 'Public' : 'Private'}
                </Badge>
              )}
            </div>
            {/* Col3: Submissions */}
            <div style={{ color: 'fg.muted', fontSize: 'sm', ...colStyles.submissions }}>
              {submissionCounts[form.id] ?? 0}
            </div>
          </div>
        </MainList.RowContent>
        <MainList.RowHeader>
            {headers?.map(h => (
              <span key={h.key} style={{ width: h.width, minWidth: h.width, maxWidth: h.width, textAlign: h.align, flexShrink: 0 }}>
                {h.label}
              </span>
            ))}
        </MainList.RowHeader>
      </>
    )
  }
  /** Row actions rendered inside the managed row toolbar (Row owns open/close). */
  const renderRowToolbar = (form: Form) => (
    <>
      <Button variant="plain" size="fluidSm" onClick={() => navigate(`/forms/${form.id}`)}>
        <Icon><Eye /></Icon>
        View
      </Button>
      <Button variant="plain" size="fluidSm" onClick={() => navigate(`/forms/${form.id}/edit`)}>
        <Icon><Pencil /></Icon>
        Edit
      </Button>
      <Button variant="plain" size="fluidSm" onClick={() => openDuplicateDialog(form.id, form.name)}>
        <Icon><Copy /></Icon>
        Duplicate
      </Button>
      <Button variant="plain" size="fluidSm" colorPalette="red" onClick={() => openDeleteDialog(form.id, form.name)}>
        <Icon><Trash2 /></Icon>
        Delete
      </Button>
    </>
  )

  if (error) return (
    <Page.Main>
      <Page.Header style={{ '--module-number': Manifest.number } as CSSProperties}>
        <Page.Heading level={1} icon={Manifest.icon} title={Manifest.name} />
      </Page.Header>
      <Page.Body><Text>{error.message}</Text></Page.Body>
    </Page.Main>
  )
  if (!forms) return (
    <Page.Main><Page.HeaderTop />
      <Page.Header style={{ '--module-number': Manifest.number } as CSSProperties}>
        <Page.Heading level={0} icon={Manifest.icon} title={Manifest.name} />
      </Page.Header>
      <Page.Body><PageSkeleton /></Page.Body>
    </Page.Main>
  )

  return (
    <Page.Main>
      <Page.HeaderTop />
      <Page.Header style={{ '--module-number': Manifest.number } as CSSProperties}>
        <Page.Heading level={0} icon={Manifest.icon} title={Manifest.name} />
      </Page.Header>
      <Page.HeaderBottom style={{ '--module-number': Manifest.number } as CSSProperties}>
        <Stack gap="3">
          <Text textStyle="sm">
            Find forms by name or description.
          </Text>
          <SearchInput<Form[]>
            search={searchForms}
            onResults={setSearchResults}
            onSearching={setSearching}
            placeholder="Search forms"
            ariaLabel="Search forms"
            value={searchTerm}
            onChange={handleSearch}
          />
          {searching && <Text color="fg.muted">Searching...</Text>}
          <HStack gap="2">
            <Button variant="surface" onClick={() => navigate('/forms/new')}>
              <Plus />
              New Form
            </Button>
            <Button variant="surface" onClick={() => setFiltersOpen((v) => !v)}>
              <SlidersHorizontal />
              Filter
            </Button>
          </HStack>
          <Collapsible.Root open={filtersOpen} onOpenChange={(details) => setFiltersOpen(details.open)}>
            <Collapsible.Content>
              <Stack gap="3" css={{ overflow: 'hidden', animation: 'slideDown 0.2s ease-out' }}>
                <HStack justifyContent="flex-end">
                  <CloseButton onClick={() => setFiltersOpen(false)} />
                </HStack>
                {/* Filter controls go here */}
              </Stack>
            </Collapsible.Content>
          </Collapsible.Root>
        </Stack>
      </Page.HeaderBottom>
      <Page.Body>
        <MainList.Root
          items={paginatedForms}
          getKey={(form) => form.id}
          renderRow={renderRow}
          renderRowToolbar={renderRowToolbar}
          onRowClick={(form: Form) => navigate(`/forms/${form.id}`)}
          headers={[
            { key: 'name', label: 'Name', width: '1fr' },
            { key: 'visibility', label: 'Visibility', width: '120px' },
            { key: 'submissions', label: 'Submissions', width: '120px' },
          ]}
          pagination={{
            page,
            pageSize,
            total: filteredForms.length,
            onPageChange: setPage,
          }}
          toolbar={{
            primaryActions: (
              <MainList.PrimaryActions>
                <MainList.MassManageButton
                  isOpen={selectedKeys.size > 0}
                  onClick={() => {
                    // Trigger mass manage by selecting all visible items
                    const visibleKeys = paginatedForms.map((f) => f.id)
                    setSelectedKeys((prev) => new Set([...prev, ...visibleKeys]))
                  }}
                />
              </MainList.PrimaryActions>
            ),
            secondaryActions: (
              <MainList.SecondaryActions />
            ),
          }}
          selection={{
            selectedKeys,
            // MainList computes select-all/select-visible and notifies via this.
            onSelectionChange: setSelectedKeys,
            // Every key matching the current search (all pages) — decision #28.
            allFilteredKeys: filteredForms.map((form) => form.id),
          }}
          massManage={{
            visible: selectedKeys.size > 0,
            onClose: () => {
              setSelectedKeys(new Set())
            },
            onDeleteSelected: handleMassDelete,
            selectedCount: selectedKeys.size,
            deleting,
          }}
        />
      </Page.Body>

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (
        <Dialog.Root open={true} onOpenChange={open => !open && setDeleteDialogOpen(null)}>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Title>Delete Form</Dialog.Title>
              <Dialog.Description>
                Are you sure you want to delete <strong>{deleteDialogOpen.formName}</strong>? This action cannot be undone.
              </Dialog.Description>
              <Dialog.Footer>
                <Button variant="plain" onClick={() => setDeleteDialogOpen(null)}>Cancel</Button>
                <Button colorPalette="red" onClick={() => { handleDelete(deleteDialogOpen.formId); setDeleteDialogOpen(null); }}>
                  Delete
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>
      )}

      {/* Duplicate Confirmation Dialog */}
      {duplicateDialogOpen && (
        <Dialog.Root open={true} onOpenChange={open => !open && setDuplicateDialogOpen(null)}>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Title>Duplicate Form</Dialog.Title>
              <Dialog.Description>
                Create a copy of <strong>{duplicateDialogOpen.formName}</strong>?
              </Dialog.Description>
              <Dialog.Footer>
                <Button variant="plain" onClick={() => setDuplicateDialogOpen(null)}>Cancel</Button>
                <Button onClick={() => { handleDuplicate(duplicateDialogOpen.formId); setDuplicateDialogOpen(null); }}>
                  Duplicate
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>
      )}

      {/* Mass Delete Confirmation Dialog */}
      {massDeleteDialog && (
        <Dialog.Root open={true} onOpenChange={open => !open && cancelMassDelete()}>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
                    <Dialog.Title>Delete Selected Forms</Dialog.Title>
              <Dialog.Description>
                Are you sure you want to delete {massDeleteDialog.keys.length} selected form{massDeleteDialog.keys.length === 1 ? '' : 's'}? This action cannot be undone.
              </Dialog.Description>
              <Dialog.Footer>
                <Button variant="plain" onClick={cancelMassDelete}>Cancel</Button>
                <Button colorPalette="red" loading={deleting} onClick={confirmMassDelete}>
                        Delete {massDeleteDialog.keys.length}
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>
      )}
    </Page.Main>
  )
}
