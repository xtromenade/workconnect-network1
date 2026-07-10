import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { blink } from '@/blink/client'
import type { Bid, Profile } from '@/types'

const bidsTable = () => blink.db.table<Bid>('bids')
const profilesTable = () => blink.db.table<Profile>('profiles')

async function attachWorkerProfiles(bids: Bid[]): Promise<Bid[]> {
  if (bids.length === 0) return bids

  const workerIds = [...new Set(bids.map((b) => b.workerId))]
  const profiles = await Promise.all(
    workerIds.map((uid) =>
      profilesTable()
        .list({ where: { userId: uid }, limit: 1 })
        .then((r) => r[0]),
    ),
  )

  const profileMap = new Map(
    profiles.filter(Boolean).map((p) => [p!.userId, p!]),
  )

  return bids.map((b) => {
    const profile = profileMap.get(b.workerId)
    return {
      ...b,
      workerName: profile?.displayName,
      workerAvatar: profile?.avatarUrl,
      workerSkills: profile?.skills,
    }
  })
}

export function useBids(jobId: string | undefined) {
  return useQuery({
    queryKey: ['bids', jobId],
    queryFn: async () => {
      if (!jobId) return []
      const bids = await bidsTable().list({
        where: { jobId },
        orderBy: { createdAt: 'desc' },
      })
      return attachWorkerProfiles(bids)
    },
    enabled: !!jobId,
  })
}

export function useMyBids(workerId: string | undefined) {
  return useQuery({
    queryKey: ['bids', 'my', workerId],
    queryFn: async () => {
      if (!workerId) return []
      const bids = await bidsTable().list({
        where: { workerId },
        orderBy: { createdAt: 'desc' },
      })
      return attachWorkerProfiles(bids)
    },
    enabled: !!workerId,
  })
}

export function useCreateBid() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      data: Omit<Bid, 'id' | 'createdAt' | 'workerName' | 'workerAvatar' | 'workerSkills'>,
    ) => {
      return bidsTable().create(data)
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bids', variables.jobId] })
      queryClient.invalidateQueries({ queryKey: ['bids', 'my'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['job', variables.jobId] })
    },
  })
}

export function useUpdateBidStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'accepted' | 'rejected' }) => {
      return bidsTable().update(id, { status })
    },
    onSettled: (_data, _error, variables) => {
      // Need to find the jobId — invalidate broadly
      queryClient.invalidateQueries({ queryKey: ['bids'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}
