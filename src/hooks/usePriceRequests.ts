import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiTable } from '@/lib/apiTable'
import type { PriceRequest } from '@/types'

const priceRequestsTable = () => apiTable<PriceRequest>('priceRequests')

/** All price-change requests for a job, newest first. */
export function usePriceRequests(jobId: string | undefined) {
  return useQuery({
    queryKey: ['priceRequests', jobId],
    queryFn: async () => {
      if (!jobId) return []
      const requests = await priceRequestsTable().list({ where: { jobId } })
      return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    },
    enabled: !!jobId,
  })
}

export function useCreatePriceRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<PriceRequest, 'id' | 'createdAt' | 'status' | 'resolvedAt'>) => {
      return priceRequestsTable().create({ ...data, status: 'pending', resolvedAt: null })
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['priceRequests', variables.jobId] })
    },
  })
}

export function useResolvePriceRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected'; jobId: string }) => {
      return priceRequestsTable().update(id, { status, resolvedAt: new Date().toISOString() })
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['priceRequests', variables.jobId] })
      queryClient.invalidateQueries({ queryKey: ['job', variables.jobId] })
    },
  })
}
