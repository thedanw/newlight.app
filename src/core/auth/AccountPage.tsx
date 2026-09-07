'use client'
import { useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Button, Card, Field, Heading, Input, Page, Text } from '@/core/ui'
import { Stack, VStack, HStack } from 'styled-system/jsx'
import { useAuth } from './use-auth'
import { UserRound } from 'lucide-react'

export default function AccountPage() {
  const navigate = useNavigate()
  const { user, person, initials, displayName, firstName, signOut, updatePassword } = useAuth()
  const [signingOut, setSigningOut] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null)
  const [savingPassword, setSavingPassword] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
    navigate('/login', { replace: true })
  }

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault()
    setPasswordError(null)
    setPasswordNotice(null)
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.')
      return
    }
    setSavingPassword(true)
    const { error } = await updatePassword(password)
    setSavingPassword(false)
    if (error) {
      setPasswordError(error.message)
      return
    }
    setPassword('')
    setPasswordNotice('Password updated.')
  }

  return (
    <Page.Main>
      <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
        <Page.Heading level={1} icon={UserRound} title="Account" />
      </Page.Header>
      <Page.Body>
        <Stack gap="6" maxWidth="2xl">
          <Card.Root>
            <Card.Body>
              <HStack gap="4">
                <Avatar.Root size="xl">
                  <Avatar.Fallback>{initials}</Avatar.Fallback>
                </Avatar.Root>
                <VStack gap="0" alignItems="flex-start">
                  <Heading>{displayName}</Heading>
                  <Text color="fg.muted">{user?.email}</Text>
                </VStack>
              </HStack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Card.Title>Profile</Card.Title>
            </Card.Header>
            <Card.Body>
              <Stack gap="3">
                <Field.Root>
                  <Field.Label>First name</Field.Label>
                  <Input value={firstName} readOnly />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Email</Field.Label>
                  <Input value={user?.email ?? ''} readOnly />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Role</Field.Label>
                  <Input value={person?.access_permission ?? user?.role ?? '—'} readOnly />
                </Field.Root>
              </Stack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Card.Title>Change password</Card.Title>
            </Card.Header>
            <Card.Body>
              <form onSubmit={handleChangePassword}>
                <Stack gap="3">
                  <Field.Root>
                    <Field.Label>New password</Field.Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </Field.Root>
                  {passwordError && <Text color="error">{passwordError}</Text>}
                  {passwordNotice && <Text>{passwordNotice}</Text>}
                  <Button type="submit" disabled={savingPassword}>
                    {savingPassword ? 'Saving…' : 'Update password'}
                  </Button>
                </Stack>
              </form>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <Button variant="outline" color="red" onClick={handleSignOut} disabled={signingOut}>
                {signingOut ? 'Signing out…' : 'Sign out'}
              </Button>
            </Card.Body>
          </Card.Root>
        </Stack>
      </Page.Body>
    </Page.Main>
  )
}