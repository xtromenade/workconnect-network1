import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'
import { useAuth } from '@/hooks/useAuth'
import { GoogleSignInButton } from '@/components/GoogleSignInButton'
import { Button, Input, Tabs, TabsList, TabsTrigger, TabsContent } from '@blinkdotnew/ui'
import { Briefcase, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <main className="min-h-dvh bg-background flex flex-col">
      <div className="flex items-center gap-2 px-6 h-16 border-b border-border">
        <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary text-primary-foreground">
          <Briefcase className="h-3.5 w-3.5" />
        </div>
        <span className="font-semibold text-sm tracking-tight">WorkConnect</span>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <BlinkClientBoundary
          fallback={
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          }
        >
          <AuthForm />
        </BlinkClientBoundary>
      </div>
    </main>
  )
}

function AuthForm() {
  const { user, isLoading, login, signup, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (user) {
    navigate({ to: '/onboarding', replace: true })
    return null
  }

  const handleGoogleCredential = async (credential: string) => {
    setError(null)
    setSubmitting(true)
    try {
      await loginWithGoogle(credential)
      toast.success('Signed in with Google!')
      navigate({ to: '/onboarding', replace: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed. Please try again.'
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      if (tab === 'login') {
        await login(email, password)
        toast.success('Welcome back!')
      } else {
        await signup(email, password, displayName)
        toast.success('Account created!')
      }
      navigate({ to: '/onboarding', replace: true })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="font-serif text-2xl font-bold tracking-tight">
          {tab === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {tab === 'login'
            ? 'Sign in to your WorkConnect account'
            : 'Start finding work or hiring talent'}
        </p>
      </div>

      {Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID) && (
        <>
          <div className="mb-6">
            <GoogleSignInButton onCredential={handleGoogleCredential} />
          </div>
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>
        </>
      )}

      <Tabs value={tab} onValueChange={(v) => { setTab(v as 'login' | 'signup'); setError(null) }}>
        <TabsList className="w-full mb-6">
          <TabsTrigger value="login" className="flex-1">
            Sign In
          </TabsTrigger>
          <TabsTrigger value="signup" className="flex-1">
            Sign Up
          </TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit}>
          <TabsContent value="login" className="space-y-4 mt-0">
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4 mt-0">
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="name"
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
          </TabsContent>

          {error && (
            <p className="text-sm text-destructive mt-3 text-center">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full mt-6 bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            {tab === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>
      </Tabs>

      <p className="text-center text-xs text-muted-foreground mt-6">
        By continuing, you agree to WorkConnect&apos;s Terms of Service and Privacy Policy.
      </p>
    </div>
  )
}
