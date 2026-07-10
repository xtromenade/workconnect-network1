import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { blink } from '@/blink/client'
import type { Job, Profile } from '@/types'

const jobsTable = () => blink.db.table<Job>('jobs')
const profilesTable = () => blink.db.table<Profile>('profiles')

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
      return attachCustomerNames(jobs)
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
