import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiTable } from '@/lib/apiTable'
import type { Profile } from '@/types'

const profilesTable = () => apiTable<Profile>('profiles')

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null
      const profiles = await profilesTable().list({
        where: { userId },
        limit: 1,
      })
      return profiles[0] ?? null
    },
    enabled: !!userId,
  })
}

export function useCreateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>) => {
      return profilesTable().create(data)
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profile', variables.userId] })
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>> & { id: string }) => {
      return profilesTable().update(id, data)
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profile', variables.userId] })
      // Also invalidate the profile-by-id query since we have the profile id
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}
