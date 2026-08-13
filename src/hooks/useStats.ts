import { useQuery } from '@tanstack/react-query'
import { apiTable } from '@/lib/apiTable'
import type { Job, Bid, Review } from '@/types'

const jobsTable = () => apiTable<Job>('jobs')
const bidsTable = () => apiTable<Bid>('bids')
const reviewsTable = () => apiTable<Review>('reviews')

export interface WorkerStats {
  avgRating: number // 0 if no reviews yet
  reviewCount: number
  jobsAccepted: number // how many of this worker's bids have been accepted
  jobsCompleted: number // how many of those jobs actually got confirmed complete
  completionRate: number | null // jobsCompleted / jobsAccepted * 100, rounded — null if never accepted a bid yet
}

/** Shown to the customer on each bid, so they can judge a worker's track record before hiring. */
export function useWorkerStats(workerId: string | undefined) {
  return useQuery<WorkerStats | null>({
    queryKey: ['workerStats', workerId],
    queryFn: async () => {
      if (!workerId) return null

      const [acceptedBids, completedJobs, reviews] = await Promise.all([
        bidsTable().list({ where: { workerId, status: 'accepted' } }),
        jobsTable().list({ where: { workerId, status: 'completed' } }),
        reviewsTable().list({ where: { reviewedUserId: workerId } }),
      ])

      const jobsAccepted = acceptedBids.length
      const jobsCompleted = completedJobs.length
      const reviewCount = reviews.length
      const avgRating = reviewCount > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0

      return {
        avgRating,
        reviewCount,
        jobsAccepted,
        jobsCompleted,
        completionRate: jobsAccepted > 0 ? Math.round((jobsCompleted / jobsAccepted) * 100) : null,
      }
    },
    enabled: !!workerId,
  })
}

export interface CustomerStats {
  amountSpent: number // sum of budget across this customer's completed jobs
  currency: string
  numberOfHires: number // jobs where they've accepted a bid (i.e. hired someone), regardless of completion yet
}

/** Shown to the worker on the job they're bidding on, so they know who they'd be working with. */
export function useCustomerStats(customerId: string | undefined) {
  return useQuery<CustomerStats | null>({
    queryKey: ['customerStats', customerId],
    queryFn: async () => {
      if (!customerId) return null

      const jobs = await jobsTable().list({ where: { customerId } })
      const hired = jobs.filter((j) => !!j.acceptedBidId)
      const completed = jobs.filter((j) => j.status === 'completed')
      const amountSpent = completed.reduce((sum, j) => sum + (j.budget || 0), 0)
      const currency = completed[0]?.currency || jobs[0]?.currency || ''

      return { amountSpent, currency, numberOfHires: hired.length }
    },
    enabled: !!customerId,
  })
}
