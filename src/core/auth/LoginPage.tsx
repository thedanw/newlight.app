'use client'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Field, Heading, Input, Text } from '@/core/ui'
import { css } from 'styled-system/css'
import { Stack, VStack } from 'styled-system/jsx'
import { useAuth } from './use-auth'
import { useSettings } from '@/core/settings/lib/provider'
import { validateIdentifier } from './lib/validation'
import { LogIn } from 'lucide-react'

type Mode = 'password' | 'magic'

const pageCss = css({
  minHeight: '100dvh',
  display: 'grid',
  placeItems: 'center',
  padding: '6',
  background: 'var(--canvas-bg)',
})

const cardCss = css({
  width: '100%',
  maxWidth: '24rem',
})

const logoWrapCss = css({
  width: '16',
  height: '16',
  borderRadius: 'l2',
  display: 'grid',
  placeItems: 'center',
  background: 'var(--sidebar-accent)',
  color: 'var(--sidebar-accent-fg)',
  overflow: 'hidden',
})

const logoImgCss = css({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
})

const modeToggleCss = css({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '2',
})

export default function LoginPage() {
  const navigate = useNavigate()
  const { signInWithPassword, signInWithOtp, resetPasswordForEmail, user } = useAuth()
  const { logoUrl, getAppSettings } = useSettings()
  const [appName, setAppName] = useState('New Light')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<Mode>('password')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    getAppSettings()
      .then((settings) => {
        if (settings?.churchInfo?.appName) setAppName(settings.churchInfo.appName)
      })
      .catch(() => {})
  }, [getAppSettings])

  // Signed-in users don't need the login page
  useEffect(() => {
    if (user) navigate('/people', { replace: true })
  }, [user, navigate])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setNotice(null)
    const identifierError = validateIdentifier(email)
    if (identifierError) {
      setError(identifierError)
      return
    }
    setLoading(true)
    try {
      if (mode === 'password') {
        const { error } = await signInWithPassword(email.trim(), password)
        if (error) {
          setError(error.message)
          setLoading(false)
          return
        }
        // Session change → user effect navigates to /people
      } else {
        const { error } = await signInWithOtp(email.trim())
        if (error) {
          setError(error.message)
          setLoading(false)
          return
        }
        setNotice('Check your email for the sign-in link.')
        setLoading(false)
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to sign in.')
      setLoading(false)
    }
  }

  const handleForgot = async () => {
    setError(null)
    setNotice(null)
    const identifierError = validateIdentifier(email)
    if (identifierError) {
      setError(identifierError)
      return
    }
    setLoading(true)
    const { error } = await resetPasswordForEmail(email.trim())
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setNotice('Check your email to reset your password.')
  }

  return (
    <main className={pageCss}>
      <Card.Root className={cardCss}>
        <Card.Body>
          <VStack gap="6">
            <VStack gap="3">
              <div className={logoWrapCss}>
                {logoUrl ? (
                  <img src={logoUrl} alt="Brand logo" className={logoImgCss} />
                ) : (
                  <LogIn className={css({ width: '8', height: '8' })} />
                )}
              </div>
              <Heading>{appName}</Heading>
              <Text color="fg.muted">Sign in to continue</Text>
            </VStack>

            {notice ? (
              <VStack gap="3">
                <Text>{notice}</Text>
                <Button variant="outline" onClick={() => setNotice(null)}>
                  Back
                </Button>
              </VStack>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <Stack gap="4">
                  <Field.Root>
                    <Field.Label>Email</Field.Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </Field.Root>

                  {mode === 'password' && (
                    <Field.Root>
                      <Field.Label>Password</Field.Label>
                      <Input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                    </Field.Root>
                  )}

                  <div className={modeToggleCss}>
                    <Button
                      type="button"
                      variant={mode === 'password' ? 'solid' : 'outline'}
                      size="sm"
                      onClick={() => setMode('password')}
                    >
                      Password
                    </Button>
                    <Button
                      type="button"
                      variant={mode === 'magic' ? 'solid' : 'outline'}
                      size="sm"
                      onClick={() => setMode('magic')}
                    >
                      Magic link
                    </Button>
                  </div>

                  {error && <Text color="error">{error}</Text>}

                  <Button type="submit" disabled={loading} width="full">
                    {loading
                      ? 'Please wait…'
                      : mode === 'password'
                        ? 'Sign in'
                        : 'Send magic link'}
                  </Button>

                  {mode === 'password' && (
                    <Button
                      type="button"
                      variant="plain"
                      size="sm"
                      onClick={handleForgot}
                      disabled={loading}
                    >
                      Forgot password?
                    </Button>
                  )}
                </Stack>
              </form>
            )}
          </VStack>
        </Card.Body>
      </Card.Root>
    </main>
  )
}