import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { blink } from '@/blink/client'
import type { Review } from '@/types'

const reviewsTable = () => blink.db.table<Review>('reviews')

export function useReviews(userId: string | undefined) {
  return useQuery({
    queryKey: ['reviews', userId],
    queryFn: async () => {
      if (!userId) return []
      return reviewsTable().list({
        where: { reviewedUserId: userId },
        orderBy: { createdAt: 'desc' },
      })
    },
    enabled: !!userId,
  })
}

export function useCreateReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<Review, 'id' | 'createdAt'>) => {
      return reviewsTable().create(data)
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.reviewedUserId] })
      queryClient.invalidateQueries({ queryKey: ['jobs', variables.jobId] })
    },
  })
}
