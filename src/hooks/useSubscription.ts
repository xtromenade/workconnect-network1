import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/apiClient'
import type { Subscription } from '@/types'

interface BackendSubscription {
  id: string
  user_id: string
  plan: 'artisan_yearly' | 'customer_yearly'
  status: string
  trial_ends_at: string | null
  current_period_end: string | null
  currency: string
  amount: number
  created_at: string
  effectiveStatus: 'trial' | 'free_period' | 'active' | 'expired'
  daysRemaining: number
}

function toSubscription(userId: string, sub: BackendSubscription): Subscription {
  const isActive = sub.effectiveStatus === 'active'
  return {
    id: sub.id,
    userId,
    plan: sub.effectiveStatus === 'expired' ? 'expired' : isActive ? 'paid' : 'free_trial',
    startedAt: sub.created_at,
    expiresAt: (isActive ? sub.current_period_end : sub.trial_ends_at) || '',
    country: '',
    amountPaid: isActive ? sub.amount : 0,
    currency: sub.currency,
    createdAt: sub.created_at,
  }
}

export function useSubscription(userId: string | undefined) {
  return useQuery({
    queryKey: ['subscription', userId],
    queryFn: async () => {
      if (!userId) return null
      const data = await apiRequest<{ subscription: BackendSubscription }>('/api/subscription/me')
      return toSubscription(userId, data.subscription)
    },
    enabled: !!userId,
  })
}

/**
 * The backend already provisions a subscription automatically at signup (defaulting
 * to the customer plan). This finalizes it with the real role + country once the
 * person picks that during onboarding — same call signature as before so
 * onboarding.tsx doesn't need to change.
 */
export function useCreateSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      country,
      role,
    }: {
      userId: string
      country: string
      role: 'worker' | 'customer'
    }) => {
      const data = await apiRequest<{ subscription: BackendSubscription }>('/api/users/me/finalize-role', {
        method: 'PATCH',
        body: { role, country },
      })
      return toSubscription(userId, data.subscription)
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subscription', variables.userId] })
    },
  })
}

/**
 * Lets an already-onboarded person switch between worker and customer at any time
 * (e.g. from Settings). Each role keeps its own independent trial/paid subscription —
 * switching back to a role you've already paid for won't reset it.
 */
export function useSwitchRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      country,
      role,
    }: {
      userId: string
      country?: string
      role: 'worker' | 'customer'
    }) => {
      const data = await apiRequest<{ subscription: BackendSubscription }>('/api/users/me/switch-role', {
        method: 'PATCH',
        body: { role, country },
      })
      return toSubscription(userId, data.subscription)
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subscription', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['profile', variables.userId] })
    },
  })
}

/** Checkout — wires to the backend's real (currently simulated) Paystack/Stripe flow. */
export function useCreateCheckout() {
  return useMutation({
    mutationFn: async () => {
      return apiRequest<{ checkoutUrl: string; paymentId: string; simulated?: boolean; note?: string }>(
        '/api/subscription/checkout',
        { method: 'POST' },
      )
    },
  })
}

export function useConfirmMockPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ paymentId }: { paymentId: string }) => {
      return apiRequest<{ subscription: BackendSubscription }>('/api/subscription/mock-confirm', {
        method: 'POST',
        body: { paymentId },
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
    },
  })
}
