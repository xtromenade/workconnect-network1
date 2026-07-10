import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { blink } from '@/blink/client'
import type { Wallet, Transaction } from '@/types'

const walletsTable = () => blink.db.table<Wallet>('wallets')
const transactionsTable = () => blink.db.table<Transaction>('transactions')

export function useWallet(userId: string | undefined) {
  const queryClient = useQueryClient()

  const walletQuery = useQuery({
    queryKey: ['wallet', userId],
    queryFn: async () => {
      if (!userId) return null
      const wallets = await walletsTable().list({
        where: { userId },
        limit: 1,
      })
      return wallets[0] ?? null
    },
    enabled: !!userId,
  })

  const createWallet = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('No user ID')
      return walletsTable().create({
        userId,
        balance: 0,
        currency: 'NGN',
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', userId] })
    },
  })

  return {
    wallet: walletQuery.data ?? null,
    isLoading: walletQuery.isLoading,
    error: walletQuery.error,
    createWallet,
  }
}

export function useTransactions(walletId: string | undefined) {
  return useQuery({
    queryKey: ['transactions', walletId],
    queryFn: async () => {
      if (!walletId) return []
      return transactionsTable().list({
        where: { walletId },
        orderBy: { createdAt: 'desc' },
      })
    },
    enabled: !!walletId,
  })
}
