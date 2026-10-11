import { useEffect, useState, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Page, Text, SearchInput, MainList, Dialog, Icon } from '@/core/ui'
import { Users, Plus, SlidersHorizontal, Eye, Edit2, Copy, Trash2, Check, X } from 'lucide-react'
import { deleteForm, getForms, duplicateForm } from '../lib/queries'
import { PageSkeleton } from '../../people/components/PageSkeleton'
import type { Form } from '../lib/types'

export default function FormsListPage() {
  const navigate = useNavigate()
  const [forms, setForms] = useState<Form[] | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<{ formId: string; formName: string } | null>(null)
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState<{ formId: string; formName: string } | null>(null)
  const [massDeleteDialogOpen, setMassDeleteDialogOpen] = useState(false)
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

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setPage(1)
  }

  const handleSelectionChange = (keys: Set<string>) => {
    setSelectedKeys(keys)
  }

  const handleSelectAll = () => {
    const allKeys = filteredForms.map(f => f.id)
    setSelectedKeys(new Set(allKeys))
  }

  const handleSelectVisible = () => {
    const visibleKeys = paginatedForms.map(f => f.id)
    setSelectedKeys(prev => new Set([...prev, ...visibleKeys]))
  }

  const handleMassDelete = async () => {
    try {
      for (const id of selectedKeys) {
        await deleteForm(id)
      }
      setSelectedKeys(new Set())
      setMassDeleteDialogOpen(false)
      load()
    } catch {
      // Error handling could be added here
    }
  }

  const openDeleteDialog = (formId: string, formName: string) => {
    setDeleteDialogOpen({ formId, formName })
  }

  const openDuplicateDialog = (formId: string, formName: string) => {
    setDuplicateDialogOpen({ formId, formName })
  }

  const renderRow = (form: Form) => (
    <>
      <MainList.RowContent
        primary={form.name}
        secondary={form.description}
        meta={<Badge colorPalette={form.is_public ? 'green' : 'gray'}>{form.is_public ? 'Public' : 'Private'}</Badge>}
      />
      <MainList.RowToolbar open={false} onClose={() => {}}>
        <Button variant="plain" size="sm" onClick={() => navigate(`/forms/${form.id}/view`)}>
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
        <Button variant="plain" size="sm" onClick={() => {
          const newKeys = new Set(selectedKeys)
          newKeys.add(form.id)
          setSelectedKeys(newKeys)
        }}>
          <Icon size="sm"><Check /></Icon>
          Select
        </Button>
        <Button variant="plain" size="sm" onClick={() => {}}>
          <Icon size="sm"><X /></Icon>
        </Button>
      </MainList.RowToolbar>
    </>
  )

  if (error) return (
    <>
      <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
        <Page.Heading level={1} icon={Users} title="Forms" />
      </Page.Header>
      <Page.Body><Text>{error.message}</Text></Page.Body>
    </>
  )
  if (!forms) return (
    <>
      <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
        <Page.Heading level={1} icon={Users} title="Forms" />
      </Page.Header>
      <Page.Body><PageSkeleton /></Page.Body>
    </>
  )

  return (
    <>
      <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
        <Page.Heading level={1} icon={Users} title="Forms" />
        <Page.HeaderBottom>
          <SearchInput
            search={async (term) => {
              handleSearch(term)
              return [] as any
            }}
            onResults={() => {}}
            onSearching={() => {}}
            placeholder="Search forms..."
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
            onSelectionChange: handleSelectionChange,
            onSelectAll: handleSelectAll,
            onSelectVisible: handleSelectVisible,
          }}
          massManage={{
            visible: selectedKeys.size > 0,
            onClose: () => {
              setSelectedKeys(new Set())
            },
            onDeleteSelected: handleMassDelete,
            selectedCount: selectedKeys.size,
          }}
        />
      </Page.Body>

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (
        <Dialog.Root open={true} onOpenChange={open => !open && setDeleteDialogOpen(null)}>
          <Dialog.Trigger asChild>
            <span />
          </Dialog.Trigger>
          <Dialog.Backdrop />
          <Dialog.Content>
            <Dialog.Title>Delete Form</Dialog.Title>
            <Dialog.Description>
              Are you sure you want to delete "{deleteDialogOpen.formName}"? This action cannot be undone.
            </Dialog.Description>
            <Dialog.Footer>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(null)}>Cancel</Button>
              <Button colorPalette="red" onClick={() => { handleDelete(deleteDialogOpen.formId); setDeleteDialogOpen(null) }}>
                Delete
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Root>
      )}

      {/* Duplicate Confirmation Dialog */}
      {duplicateDialogOpen && (
        <Dialog.Root open={true} onOpenChange={open => !open && setDuplicateDialogOpen(null)}>
          <Dialog.Trigger asChild>
            <span />
          </Dialog.Trigger>
          <Dialog.Backdrop />
          <Dialog.Content>
            <Dialog.Title>Duplicate Form</Dialog.Title>
            <Dialog.Description>
              Create a copy of "{duplicateDialogOpen.formName}"? The duplicate will open in the editor.
            </Dialog.Description>
            <Dialog.Footer>
              <Button variant="outline" onClick={() => setDuplicateDialogOpen(null)}>Cancel</Button>
              <Button onClick={() => { handleDuplicate(duplicateDialogOpen.formId); setDuplicateDialogOpen(null) }}>
                Duplicate
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Root>
      )}

      {/* Mass Delete Confirmation Dialog */}
      {massDeleteDialogOpen && selectedKeys.size > 0 && (
        <Dialog.Root open={true} onOpenChange={open => !open && setMassDeleteDialogOpen(false)}>
          <Dialog.Trigger asChild>
            <span />
          </Dialog.Trigger>
          <Dialog.Backdrop />
          <Dialog.Content>
            <Dialog.Title>Delete Selected Forms</Dialog.Title>
            <Dialog.Description>
              Are you sure you want to delete {selectedKeys.size} form(s)? This action cannot be undone.
            </Dialog.Description>
            <Dialog.Footer>
              <Button variant="outline" onClick={() => setMassDeleteDialogOpen(false)}>Cancel</Button>
              <Button colorPalette="red" onClick={handleMassDelete}>
                Delete {selectedKeys.size}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Root>
      )}
    </>
  )
}
