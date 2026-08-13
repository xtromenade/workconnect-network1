import { useEffect, useState } from 'react'
import { createFileRoute, useSearch, Link } from '@tanstack/react-router'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'
import { apiRequest } from '@/lib/apiClient'
import { Button } from '@blinkdotnew/ui'
import { CheckCircle2, XCircle, Loader2, Briefcase } from 'lucide-react'

export const Route = createFileRoute('/verify-email')({
  component: VerifyEmailPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : '',
  }),
})

function VerifyEmailPage() {
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
          fallback={<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
        >
          <VerifyEmailContent />
        </BlinkClientBoundary>
      </div>
    </main>
  )
}

function VerifyEmailContent() {
  const { token } = useSearch({ from: '/verify-email' })
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('This link is missing a verification token.')
      return
    }
    apiRequest<{ ok: boolean; email: string }>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(() => {
        setStatus('success')
      })
      .catch((err: Error) => {
        setStatus('error')
        setMessage(err.message || 'This verification link is invalid or has expired.')
      })
  }, [token])

  return (
    <div className="w-full max-w-sm text-center">
      {status === 'checking' && (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Verifying your email…</p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-4" />
          <h1 className="font-serif text-xl font-bold mb-2">Email verified</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Thanks for confirming your email address.
          </p>
          <Link to="/dashboard">
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              Go to dashboard
            </Button>
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <XCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
          <h1 className="font-serif text-xl font-bold mb-2">Verification failed</h1>
          <p className="text-sm text-muted-foreground mb-6">{message}</p>
          <p className="text-xs text-muted-foreground mb-4">
            You can request a new link from Settings once you're signed in.
          </p>
          <Link to="/login">
            <Button variant="outline">Back to sign in</Button>
          </Link>
        </>
      )}
    </div>
  )
}
