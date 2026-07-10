import { useState, useEffect, useCallback } from 'react'
import { blink } from '@/blink/client'
import type { BlinkUser } from '@blinkdotnew/sdk'

export function useAuth() {
  const [user, setUser] = useState<BlinkUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (!state.isLoading) setIsLoading(false)
    })
    return unsubscribe
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    await blink.auth.signInWithEmail(email, password)
  }, [])

  const signup = useCallback(
    async (email: string, password: string, displayName: string) => {
      await blink.auth.signUp({ email, password, displayName })
    },
    [],
  )

  const logout = useCallback(async () => {
    await blink.auth.signOut()
    setUser(null)
  }, [])

  return { user, isLoading, login, signup, logout }
}
