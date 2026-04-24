import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { signInWithPopup } from 'firebase/auth'
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
import {
  createGoogleProvider,
  firebaseAuthErrorMessage,
  getFirebaseAuth,
  isFirebaseConfigured,
} from '@/lib/firebase'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const firebaseConfigured = isFirebaseConfigured()
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const registered = Boolean(
    (location.state as { registered?: boolean } | null)?.registered,
  )

  const handleGoogleLogin = async () => {
    setSubmitting(true)
    setError('')
    try {
      const result = await signInWithPopup(getFirebaseAuth(), createGoogleProvider())
      const firebaseIdToken = await result.user.getIdToken()
      await loginWithGoogle(firebaseIdToken)
      navigate('/dashboard')
    } catch (err) {
      setError(firebaseAuthErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

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

                {firebaseConfigured ? (
                  <>
                    <div className="relative py-1">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/70" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase tracking-wide text-muted-foreground">
                        <span className="bg-card px-2">Or continue with</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={submitting}
                      onClick={() => void handleGoogleLogin()}
                    >
                      <span className="inline-flex size-5 items-center justify-center rounded-full border border-border text-xs font-semibold">
                        G
                      </span>
                      Continue with Google
                    </Button>
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
