import { useState, useEffect, useCallback } from 'react'
import { apiRequest, getToken, setToken } from '@/lib/apiClient'
import { connectSocket, disconnectSocket } from '@/lib/socket'

/** Minimal user shape the rest of the app relies on (id, email, displayName). */
export interface AppUser {
  id: string
  email: string
  displayName: string | null
}

interface BackendUser {
  id: string
  email: string
  full_name: string
  role: 'artisan' | 'customer'
  country: string
}

function toAppUser(u: BackendUser): AppUser {
  return { id: u.id, email: u.email, displayName: u.full_name }
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }
    try {
      const data = await apiRequest<{ user: BackendUser }>('/api/users/me')
      setUser(toAppUser(data.user))
      connectSocket(token)
    } catch {
      setToken(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiRequest<{ token: string; user: BackendUser }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    setToken(data.token)
    setUser(toAppUser(data.user))
    connectSocket(data.token)
  }, [])

  const signup = useCallback(async (email: string, password: string, displayName: string) => {
    // No role yet — WorkConnect's onboarding flow collects that afterwards via
    // PATCH /api/users/me/finalize-role (see useSubscription.ts).
    const data = await apiRequest<{ token: string; user: BackendUser }>('/api/auth/signup', {
      method: 'POST',
      body: { fullName: displayName, email, password },
    })
    setToken(data.token)
    setUser(toAppUser(data.user))
    connectSocket(data.token)
  }, [])

  const logout = useCallback(async () => {
    setToken(null)
    setUser(null)
    disconnectSocket()
  }, [])

  return { user, isLoading, login, signup, logout }
}
