import { Outlet, createFileRoute, useNavigate, useLocation } from '@tanstack/react-router'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'
import { SharedAppLayout } from '@/layouts/shared-app-layout'
import { AppSidebarShell } from '@/components/AppSidebarShell'
import { useAuth } from '@/hooks/useAuth'
import { CallProvider } from '@/context/CallContext'
import { CallOverlay } from '@/components/CallOverlay'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  return (
    <BlinkClientBoundary
      fallback={
        <div className="flex items-center justify-center min-h-dvh">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <AppLayoutContent />
    </BlinkClientBoundary>
  )
}

function AppLayoutContent() {
  const { user, isLoading, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) {
    navigate({ to: '/login', replace: true })
    return null
  }

  const handleSignOut = async () => {
    await logout()
    navigate({ to: '/', replace: true })
  }

  const userName = user.displayName ?? user.email?.split('@')[0] ?? 'User'
  const userEmail = user.email ?? ''

  return (
    <CallProvider>
      <CallOverlay />
      <SharedAppLayout
        appName="WorkConnect"
        sidebar={
          <AppSidebarShell
            userName={userName}
            userEmail={userEmail}
            onSignOut={handleSignOut}
            currentPath={location.pathname}
          />
        }
      >
        <Outlet />
      </SharedAppLayout>
    </CallProvider>
  )
}
