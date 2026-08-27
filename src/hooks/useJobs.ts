import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiTable } from '@/lib/apiTable'
import type { Job, Profile, Bid } from '@/types'

const jobsTable = () => apiTable<Job>('jobs')
const profilesTable = () => apiTable<Profile>('profiles')
const bidsTable = () => apiTable<Bid>('bids')

interface JobFilters {
  status?: string
  city?: string
  category?: string
}

async function attachCustomerNames(jobs: Job[]): Promise<Job[]> {
  if (jobs.length === 0) return jobs

  const customerIds = [...new Set(jobs.map((j) => j.customerId))]
  const profiles = await Promise.all(
    customerIds.map((uid) =>
      profilesTable()
        .list({ where: { userId: uid }, limit: 1 })
        .then((r) => r[0]),
    ),
  )

  const nameMap = new Map(
    profiles.filter(Boolean).map((p) => [p!.userId, { name: p!.displayName, avatar: p!.avatarUrl }]),
  )

  return jobs.map((j) => ({
    ...j,
    customerName: nameMap.get(j.customerId)?.name,
    customerAvatar: nameMap.get(j.customerId)?.avatar,
  }))
}

/** So a customer can see how many bids each of their posted jobs has gotten right on
 * the job card, without opening each one. */
async function attachBidCounts(jobs: Job[]): Promise<Job[]> {
  if (jobs.length === 0) return jobs

  const counts = await Promise.all(
    jobs.map((j) => bidsTable().list({ where: { jobId: j.id } }).then((bids) => bids.length)),
  )

  return jobs.map((j, i) => ({ ...j, bidCount: counts[i] }))
}

export function useJobs(filters?: JobFilters) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: async () => {
      const where: Record<string, unknown> = {}
      if (filters?.status) where.status = filters.status
      if (filters?.city) where.city = filters.city
      if (filters?.category) where.category = filters.category

      const jobs = await jobsTable().list({
        where: Object.keys(where).length > 0 ? where : undefined,
        orderBy: { createdAt: 'desc' },
      })

      return attachCustomerNames(jobs)
    },
  })
}

export function useJob(jobId: string | undefined) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      if (!jobId) return null
      const job = await jobsTable().get(jobId)
      if (!job) return null

      const [enriched] = await attachCustomerNames([job])
      return enriched
    },
    enabled: !!jobId,
  })
}

export function useMyJobs(userId: string | undefined) {
  return useQuery({
    queryKey: ['jobs', 'my', userId],
    queryFn: async () => {
      if (!userId) return []
      const jobs = await jobsTable().list({
        where: { customerId: userId },
        orderBy: { createdAt: 'desc' },
      })
      const withNames = await attachCustomerNames(jobs)
      return attachBidCounts(withNames)
    },
    enabled: !!userId,
  })
}

export function useCreateJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      data: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'customerName' | 'customerAvatar' | 'bidCount'>,
    ) => {
      return jobsTable().create(data)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

export function useUpdateJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<
      Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'customerName' | 'customerAvatar' | 'bidCount'>
    > & { id: string }) => {
      return jobsTable().update(id, { ...data, updatedAt: new Date().toISOString() })
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['job', variables.id] })
    },
  })
}
