import { useMemo, useState } from 'react'
import { createListCollection } from '@ark-ui/react'
import { Button, Card, Field, Input, Select, Text } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import { supabase } from '@/core/lib/supabase'
import { updatePerson, writePeopleAudit } from '../../lib/queries'
import { canChangePassword, canEditRole, canSendMagicLink, isAccessCardVisible } from './account-access-permissions'
import type { Person } from '../../lib/types'
type AP = Person['access_permission']
const ROLES: Array<{ label: string; value: AP }> = [
  { label: 'Public', value: 'public' },
  { label: 'Member area', value: 'member_area' },
  { label: 'Team leaders', value: 'team_leaders' },
  { label: 'Admin', value: 'admin' },
  { label: 'Super admin', value: 'super_admin' },
]
type Props = { person: Person; operatorPermission: AP | null; isSelf: boolean }
export function AccountAccessSection({ person, operatorPermission, isSelf }: Props) {
  const op = operatorPermission
  const email = person.email?.trim() || null
  const showPw = canChangePassword(op, isSelf)
  const showMagic = canSendMagicLink(op)
  const showRole = canEditRole(op)
  const isSuper = op === 'super_admin'
  const coll = useMemo(() => createListCollection({
    items: ROLES.filter((r) => r.value !== 'super_admin' || isSuper),
  }), [isSuper])
  const [pw, setPw] = useState('')
  const [pwE, setPwE] = useState<string | null>(null)
  const [pwO, setPwO] = useState<string | null>(null)
  const [pwB, setPwB] = useState(false)
  const [mO, setMO] = useState<string | null>(null)
  const [mE, setME] = useState<string | null>(null)
  const [mB, setMB] = useState(false)
  const [rO, setRO] = useState<string | null>(null)
  const [rE, setRE] = useState<string | null>(null)
  const [rB, setRB] = useState(false)
  const [role, setRole] = useState<AP>(person.access_permission)
  const [roleE, setRoleE] = useState<string | null>(null)
  const [roleO, setRoleO] = useState<string | null>(null)
  const [roleB, setRoleB] = useState(false)
  if (!isAccessCardVisible(op, isSelf)) return null
  return (
    <Card.Root>
      <Card.Header><Card.Title>Access</Card.Title></Card.Header>
      <Card.Body><Stack gap="5">
        {showPw && (
          <Stack gap="2">
            <Text fontWeight="semibold">Change password</Text>
            {isSelf ? (
              <form onSubmit={(e) => {
                e.preventDefault()
                setPwE(null); setPwO(null)
                if (pw.length < 6) { setPwE('Password must be at least 6 characters.'); return }
                setPwB(true)
                void supabase.auth.updateUser({ password: pw }).then(({ error }) => {
                  setPwB(false)
                  if (error) { setPwE(error.message); return }
                  setPw(''); setPwO('Password updated.')
                })
              }}>
                <Stack gap="2">
                  <Field.Root><Field.Label>New password</Field.Label>
                    <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
                  </Field.Root>
                  {pwE && <Text color="error">{pwE}</Text>}
                  {pwO && <Text>{pwO}</Text>}
                  <div><Button type="submit" size="sm" variant="outline" disabled={pwB || !pw}>Update</Button></div>
                </Stack>
              </form>
            ) : (
              <Stack gap="2">
                {rE && <Text color="error">{rE}</Text>}
                {rO && <Text>{rO}</Text>}
                <div><Button size="sm" variant="outline" disabled={rB} onClick={() => {
                  setRE(null); setRO(null)
                  if (!email) { setRE('No email on this profile.'); return }
                  setRB(true)
                  void supabase.auth.resetPasswordForEmail(email).then(({ error }) => {
                    setRB(false)
                    if (error) { setRE(error.message); return }
                    setRO(`Reset sent to ${email}.`)
                  })
                }}>Send reset</Button></div>
              </Stack>
            )}
          </Stack>
        )}
        {showMagic && (
          <Stack gap="2">
            <Text fontWeight="semibold">Magic link</Text>
            {mE && <Text color="error">{mE}</Text>}
            {mO && <Text>{mO}</Text>}
            <div><Button size="sm" variant="outline" disabled={mB || !email} onClick={() => {
              setME(null); setMO(null)
              if (!email) { setME('No email on this profile.'); return }
              setMB(true)
              void supabase.auth.signInWithOtp({ email }).then(({ error }) => {
                setMB(false)
                if (error) { setME(error.message); return }
                setMO(`Magic link sent to ${email}.`)
              })
            }}>Send magic link</Button></div>
          </Stack>
        )}
        {showRole ? (
          <Stack gap="2">
            <Text fontWeight="semibold">Role</Text>
            <Field.Root><Field.Label>Access permission</Field.Label>
              <Select.Root collection={coll} value={[role]} onValueChange={(d) => setRole((d.value[0] ?? role) as AP)}>
                <Select.Control><Select.Trigger><Select.ValueText placeholder="Select" /></Select.Trigger></Select.Control>
                <Select.Positioner><Select.Content>
                  {coll.items.map((i) => (<Select.Item key={i.value} item={i}><Select.ItemText>{i.label}</Select.ItemText></Select.Item>))}
                </Select.Content></Select.Positioner>
              </Select.Root>
            </Field.Root>
            {roleE && <Text color="error">{roleE}</Text>}
            {roleO && <Text>{roleO}</Text>}
            <div><Button size="sm" variant="outline" disabled={roleB} onClick={() => {
              setRoleE(null); setRoleO(null)
              if (role === person.access_permission) { setRoleO('No change.'); return }
              if (role === 'super_admin' && !isSuper) { setRoleE('Only super admins can assign super_admin.'); return }
              setRoleB(true)
              void updatePerson(person.id, { access_permission: role }).then(() =>
                writePeopleAudit(person.id, 'access_permission', person.access_permission, role),
              ).then(() => setRoleO(`Role updated to ${role}.`))
                .catch((e: unknown) => setRoleE(e instanceof Error ? e.message : String(e)))
                .finally(() => setRoleB(false))
            }}>Save role</Button></div>
          </Stack>
        ) : (
          <Stack gap="1"><Text fontWeight="semibold">Role</Text><Text color="fg.muted">{person.access_permission}</Text></Stack>
        )}
      </Stack></Card.Body>
    </Card.Root>
  )
}
