import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Building2, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const GOOGLE_IDENTITY_SCRIPT = 'https://accounts.google.com/gsi/client'

type GoogleCredentialResponse = {
  credential?: string
}

type GoogleIdentityApi = {
  initialize: (options: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
  }) => void
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: string
      theme?: string
      size?: string
      text?: string
      width?: string
    },
  ) => void
}

function getGoogleIdentityApi(): GoogleIdentityApi | undefined {
  const withGoogle = window as Window & {
    google?: { accounts?: { id?: GoogleIdentityApi } }
  }
  return withGoogle.google?.accounts?.id
}

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const googleButtonRef = useRef<HTMLDivElement | null>(null)
  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim()
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const registered = Boolean(
    (location.state as { registered?: boolean } | null)?.registered,
  )

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      setSubmitting(true)
      setError('')
      try {
        await loginWithGoogle(credential)
        navigate('/dashboard')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Google sign-in failed')
      } finally {
        setSubmitting(false)
      }
    },
    [loginWithGoogle, navigate],
  )

  useEffect(() => {
    if (!googleClientId) return

    let cancelled = false

    const renderGoogleButton = () => {
      if (cancelled) return
      const googleIdentityApi = getGoogleIdentityApi()
      const target = googleButtonRef.current
      if (!googleIdentityApi || !target) return

      target.innerHTML = ''
      googleIdentityApi.initialize({
        client_id: googleClientId,
        callback: ({ credential }) => {
          if (!credential) {
            setError('Google sign-in failed. Please try again.')
            return
          }
          void handleGoogleCredential(credential)
        },
      })
      googleIdentityApi.renderButton(target, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        width: '320',
      })
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${GOOGLE_IDENTITY_SCRIPT}"]`,
    )
    if (existingScript) {
      if (getGoogleIdentityApi()) {
        renderGoogleButton()
      } else {
        existingScript.addEventListener('load', renderGoogleButton)
      }
      return () => {
        cancelled = true
        existingScript.removeEventListener('load', renderGoogleButton)
      }
    }

    const script = document.createElement('script')
    script.src = GOOGLE_IDENTITY_SCRIPT
    script.async = true
    script.defer = true
    script.addEventListener('load', renderGoogleButton)
    document.head.appendChild(script)

    return () => {
      cancelled = true
      script.removeEventListener('load', renderGoogleButton)
    }
  }, [googleClientId, handleGoogleCredential])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username || !password) {
      setError('Please enter both username and password')
      return
    }

    setSubmitting(true)
    try {
      await login(username, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      <div className="flex-1 px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-5xl gap-8 rounded-2xl border border-border/80 bg-card p-6 shadow-sm lg:grid-cols-2 lg:p-10">
          <div className="space-y-4">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <h1>Sign in to continue</h1>
            <p className="text-muted-foreground">
              Access SCH facilities, availability windows, and role-specific actions from one
              workspace.
            </p>
            <div className="space-y-2 rounded-lg border border-border/80 bg-muted/40 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Quick notes</p>
              <p>Use your registered username and password.</p>
              <p>Administrator privileges are managed by your deployment setup.</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Welcome back</CardTitle>
              <CardDescription>
                Enter your username and password.
                {registered && (
                  <span className="block mt-2 text-foreground/90">
                    You can sign in with the account you just created.
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>

                {error ? (
                  <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                    {error}
                  </p>
                ) : null}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Signing in…' : 'Sign In'}
                </Button>

                {googleClientId ? (
                  <>
                    <div className="relative py-1">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/70" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase tracking-wide text-muted-foreground">
                        <span className="bg-card px-2">Or continue with</span>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <div ref={googleButtonRef} />
                    </div>
                  </>
                ) : null}
              </form>
            </CardContent>
          </Card>

          <p className="text-sm text-center text-muted-foreground">
            Need an account?{' '}
            <Link to="/signup" className="text-primary underline-offset-4 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
