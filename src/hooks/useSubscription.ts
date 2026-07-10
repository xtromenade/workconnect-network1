import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { blink } from '@/blink/client'
import type { Subscription } from '@/types'

const subscriptionsTable = () => blink.db.table<Subscription>('subscriptions')

/** Pricing config by country and role */
const PRICING: Record<string, { worker: { amount: number; currency: string }; customer: { amount: number; currency: string } }> = {
  NG: {
    worker: { amount: 5000, currency: 'NGN' },
    customer: { amount: 3000, currency: 'NGN' },
  },
}

function getTrialMonths(role: string): number {
  return role === 'worker' ? 3 : 6
}

function getPricing(country: string, role: string): { amount: number; currency: string; trialMonths: number } {
  const config = PRICING[country.toUpperCase()]
  if (config) {
    const rolePricing = role === 'worker' ? config.worker : config.customer
    return { ...rolePricing, trialMonths: getTrialMonths(role) }
  }
  // Default: USD pricing
  return {
    amount: role === 'worker' ? 7 : 5,
    currency: 'USD',
    trialMonths: getTrialMonths(role),
  }
}

export function useSubscription(userId: string | undefined) {
  return useQuery({
    queryKey: ['subscription', userId],
    queryFn: async () => {
      if (!userId) return null
      const subs = await subscriptionsTable().list({
        where: { userId },
        limit: 1,
      })
      return subs[0] ?? null
    },
    enabled: !!userId,
  })
}

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
      const pricing = getPricing(country, role)
      const now = new Date()
      const expiresAt = new Date(now)
      expiresAt.setMonth(expiresAt.getMonth() + pricing.trialMonths)

      return subscriptionsTable().create({
        userId,
        plan: 'free_trial',
        startedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        country,
        amountPaid: 0,
        currency: pricing.currency,
      })
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subscription', variables.userId] })
    },
  })
}
