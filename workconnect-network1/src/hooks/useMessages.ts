import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiTable } from '@/lib/apiTable'
import type { Message, Profile } from '@/types'

const messagesTable = () => apiTable<Message>('messages')
const profilesTable = () => apiTable<Profile>('profiles')

async function attachSenderNames(messages: Message[]): Promise<Message[]> {
  if (messages.length === 0) return messages

  const senderIds = [...new Set(messages.map((m) => m.senderId))]
  const profiles = await Promise.all(
    senderIds.map((uid) =>
      profilesTable()
        .list({ where: { userId: uid }, limit: 1 })
        .then((r) => r[0]),
    ),
  )

  const nameMap = new Map(
    profiles.filter(Boolean).map((p) => [p!.userId, { name: p!.displayName, avatar: p!.avatarUrl }]),
  )

  return messages.map((m) => ({
    ...m,
    senderName: nameMap.get(m.senderId)?.name,
    senderAvatar: nameMap.get(m.senderId)?.avatar,
  }))
}

export function useConversation(jobId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['messages', jobId, userId],
    queryFn: async () => {
      if (!jobId || !userId) return []

      // Fetch messages where the current user is either sender or receiver
      const sent = await messagesTable().list({
        where: { jobId, senderId: userId },
      })

      const received = await messagesTable().list({
        where: { jobId, receiverId: userId },
      })

      const allMessages = [...sent, ...received].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )

      // Deduplicate by id (a message can match both queries in rare cases)
      const seen = new Set<string>()
      const unique = allMessages.filter((m) => {
        if (seen.has(m.id)) return false
        seen.add(m.id)
        return true
      })

      return attachSenderNames(unique)
    },
    enabled: !!jobId && !!userId,
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      data: Omit<Message, 'id' | 'createdAt' | 'senderName' | 'senderAvatar'>,
    ) => {
      return messagesTable().create(data)
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.jobId] })
    },
  })
}

export function useMarkRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      return messagesTable().update(id, { isRead: '1' })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    },
  })
}
