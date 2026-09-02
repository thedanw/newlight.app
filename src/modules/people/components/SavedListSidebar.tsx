import { useEffect, useState } from 'react'
import { Button, Card, Dialog, Input, Switch, Text } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import type { EmailRecipient } from '@/core/lib/email'
import { deleteSavedList, updateSavedList } from '../lib/queries'
import { useSavedLists } from '../lib/saved-list-hooks'
import { getEmailRecipients } from '../lib/email'
import type { PeopleListOptions } from '../lib/types'
import { SendEmailDialog } from './SendEmailDialog'

export function SavedListSidebar({ onLoad, refreshKey = 0 }: { onLoad: (conditions: PeopleListOptions) => void; refreshKey?: number }) {
  const { data, loading, error, refresh } = useSavedLists()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editShared, setEditShared] = useState(false)
  const [emailListId, setEmailListId] = useState<string | null>(null)
  const [emailRecipients, setEmailRecipients] = useState<EmailRecipient[]>([])
  const [emailLoading, setEmailLoading] = useState(false)

  useEffect(() => { if (refreshKey > 0) refresh() }, [refreshKey, refresh])

  const openEmail = async (listId: string) => {
    setEmailLoading(true)
    try {
      const recipients = await getEmailRecipients(listId)
      setEmailRecipients(recipients)
      setEmailListId(listId)
    } catch (reason: unknown) {
      setEmailRecipients([])
      setEmailListId(listId)
      console.error(reason)
    } finally {
      setEmailLoading(false)
    }
  }

  if (loading) return <Text>Loading saved lists...</Text>
  if (error) return <Text>{error.message}</Text>

  const openEdit = (id: string, name: string, isShared: boolean) => {
    setEditingId(id)
    setEditName(name)
    setEditShared(isShared)
  }

  const saveEdit = async () => {
    if (!editingId) return
    await updateSavedList(editingId, { name: editName, is_shared: editShared })
    setEditingId(null)
    refresh()
  }

  const handleDelete = async (id: string) => {
    await deleteSavedList(id)
    refresh()
  }

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>Saved lists</Card.Title>
      </Card.Header>
      <Card.Body>
        <Stack gap="3">
          {data?.map((list) => (
            <Stack key={list.id} gap="2">
              <Stack flexDirection="row" gap="2" alignItems="center">
                <Button variant="plain" onClick={() => onLoad(list.conditions as PeopleListOptions)}>{list.name}</Button>
                {list.is_shared && <Text color="fg.muted">shared</Text>}
              </Stack>
              <Stack flexDirection="row" gap="2">
                <Button variant="outline" onClick={() => void openEmail(list.id)} disabled={emailLoading}>Email</Button>
                <Button variant="outline" onClick={() => openEdit(list.id, list.name, list.is_shared)}>Edit</Button>
                <Button variant="outline" onClick={() => void handleDelete(list.id)}>Delete</Button>
              </Stack>
            </Stack>
          ))}
        </Stack>
      </Card.Body>
      <SendEmailDialog
        open={emailListId !== null}
        onOpenChange={(next) => { if (!next) setEmailListId(null) }}
        recipients={emailRecipients}
      />
      <Dialog.Root open={editingId !== null} onOpenChange={(details) => { if (!details.open) setEditingId(null) }}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Title>Edit saved list</Dialog.Title>
            <Dialog.Body>
              <Input value={editName} onChange={(event) => setEditName(event.target.value)} placeholder="List name" />
              <Switch.Root checked={editShared} onCheckedChange={(details) => setEditShared(details.checked)}>
                <Switch.HiddenInput />
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <Switch.Label>Share with editors</Switch.Label>
              </Switch.Root>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger onClick={() => void saveEdit()}>Save</Dialog.ActionTrigger>
              <Dialog.CloseTrigger>Cancel</Dialog.CloseTrigger>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Card.Root>
  )
}