import { useEffect, useState, useCallback, useRef } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Page, Text, SearchInput, MainList, Dialog, Icon } from '@/core/ui'
import { Plus, SlidersHorizontal, Eye, Edit2, Copy, Trash2 } from 'lucide-react'
import { deleteForm, getForms, duplicateForm } from './lib/queries'
import { PageSkeleton } from '../people/components/PageSkeleton'
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
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<{ formId: string; formName: string } | null>(null)
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState<{ formId: string; formName: string } | null>(null)
  const [massDeleteDialog, setMassDeleteDialog] = useState<MassDeletePending | null>(null)
  const massDeletePendingRef = useRef<MassDeletePending | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 25

  const load = useCallback(() => {
    getForms().then(setForms).catch((reason: unknown) => setError(reason instanceof Error ? reason : new Error(String(reason))))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Filter forms based on search term
  const filteredForms = forms?.filter(form =>
    form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (form.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  ) ?? []

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

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term)
    setPage(1)
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

  /** Row content only — Row supplies select, trigger button and toolbar. */
  const renderRow = (form: Form) => (
    <MainList.RowContent
      primary={form.name}
      secondary={form.description}
      meta={<Badge colorPalette={form.is_public ? 'green' : 'gray'}>{form.is_public ? 'Public' : 'Private'}</Badge>}
    />
  )

  /** Row actions rendered inside the managed row toolbar (Row owns open/close). */
  const renderRowToolbar = (form: Form) => (
    <>
      <Button variant="plain" size="sm" onClick={() => navigate(`/forms/${form.id}`)}>
        <Icon size="sm"><Eye /></Icon>
        View
      </Button>
      <Button variant="plain" size="sm" onClick={() => navigate(`/forms/${form.id}/edit`)}>
        <Icon size="sm"><Edit2 /></Icon>
        Edit
      </Button>
      <Button variant="plain" size="sm" onClick={() => openDuplicateDialog(form.id, form.name)}>
        <Icon size="sm"><Copy /></Icon>
        Duplicate
      </Button>
      <Button variant="plain" size="sm" colorPalette="red" onClick={() => openDeleteDialog(form.id, form.name)}>
        <Icon size="sm"><Trash2 /></Icon>
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
    <Page.Main>
      <Page.Header style={{ '--module-number': Manifest.number } as CSSProperties}>
        <Page.Heading level={1} icon={Manifest.icon} title={Manifest.name} />
      </Page.Header>
      <Page.Body><PageSkeleton /></Page.Body>
    </Page.Main>
  )

  return (
    <Page.Main>
      <Page.Header style={{ '--module-number': Manifest.number } as CSSProperties}>
        <Page.Heading level={1} icon={Manifest.icon} title={Manifest.name} />
        <Page.HeaderBottom>
          {/* Search lives in the header, not MainList (D5); filtering is
              instant via onChange (#23), so the debounced callback is inert. */}
          <SearchInput<Form[]>
            search={async () => []}
            onResults={() => {}}
            onSearching={() => {}}
            placeholder="Search forms..."
            ariaLabel="Search forms"
            value={searchTerm}
            onChange={handleSearch}
          />
        </Page.HeaderBottom>
      </Page.Header>
      <Page.Body>
        <MainList.Root
          items={paginatedForms}
          getKey={(form) => form.id}
          renderRow={renderRow}
          renderRowToolbar={renderRowToolbar}
          onRowClick={(form) => navigate(`/forms/${form.id}`)}
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
                <Button onClick={() => navigate('/forms/new')}>
                  <Icon size="sm"><Plus /></Icon>
                  New Form
                </Button>
              </MainList.PrimaryActions>
            ),
            secondaryActions: (
              <MainList.SecondaryActions>
                <Button variant="outline">
                  <Icon size="sm"><SlidersHorizontal /></Icon>
                  Filter/Lists
                </Button>
              </MainList.SecondaryActions>
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