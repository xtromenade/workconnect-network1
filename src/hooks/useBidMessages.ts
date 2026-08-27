import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiTable } from '@/lib/apiTable'
import type { BidMessage } from '@/types'

const bidMessagesTable = () => apiTable<BidMessage>('bidMessages')

/** Message history for a single bid's negotiation thread, oldest first. */
export function useBidMessages(bidId: string | undefined) {
  return useQuery({
    queryKey: ['bidMessages', bidId],
    queryFn: async () => {
      if (!bidId) return []
      const messages = await bidMessagesTable().list({ where: { bidId } })
      return messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    },
    enabled: !!bidId,
  })
}

export function useSendBidMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<BidMessage, 'id' | 'createdAt'>) => {
      return bidMessagesTable().create(data)
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bidMessages', variables.bidId] })
    },
  })
}
