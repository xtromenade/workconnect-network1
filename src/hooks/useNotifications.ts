import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiTable } from '@/lib/apiTable'
import { getSocket } from '@/lib/socket'
import type { Notification } from '@/types'

const notificationsTable = () => apiTable<Notification>('notifications')

/** Recent notifications for the current user, newest first. Also listens for live
 * pushes over the socket so the bell updates instantly without waiting on a refetch. */
export function useNotifications(userId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return []
      const notifications = await notificationsTable().list({ where: { userId } })
      return notifications
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 30)
    },
    enabled: !!userId,
  })

  useEffect(() => {
    if (!userId) return
    const socket = getSocket()
    if (!socket) return

    const onNew = (notification: Notification) => {
      if (notification.userId !== userId) return
      queryClient.setQueryData<Notification[]>(['notifications', userId], (prev) =>
        prev ? [notification, ...prev].slice(0, 30) : [notification],
      )
    }

    socket.on('notification:new', onNew)
    return () => {
      socket.off('notification:new', onNew)
    }
  }, [userId, queryClient])

  return query
}

/** Fire-and-forget from wherever an action creates activity the other party should know
 * about (new bid, bid accepted/rejected, price request, job completion handshake). */
export function useCreateNotification() {
  return useMutation({
    mutationFn: async (data: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
      return notificationsTable().create({ ...data, read: '0' })
    },
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string; userId: string }) => {
      return notificationsTable().update(id, { read: '1' })
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', variables.userId] })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, unreadIds }: { userId: string; unreadIds: string[] }) => {
      await Promise.all(unreadIds.map((id) => notificationsTable().update(id, { read: '1' })))
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', variables.userId] })
    },
  })
}
