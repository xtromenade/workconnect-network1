import { useState, useEffect, useRef, useCallback } from 'react'
import { getSocket } from '@/lib/socket'
import type { AppUser } from './useAuth'

export interface RealtimeMessage {
  id: string
  type: string
  data: { text: string; senderName?: string }
  timestamp: number
  userId: string
  metadata?: { displayName?: string }
}

export interface PresenceUser {
  userId: string
  metadata?: { displayName?: string; status?: string }
  joinedAt: number
  lastSeen: number
}

interface UseRealtimeChatReturn {
  messages: RealtimeMessage[]
  sendMessage: (text: string) => Promise<void>
  onlineUsers: PresenceUser[]
  isConnected: boolean
}

/**
 * Real-time chat over the ArtisanLink backend's Socket.io "generic room" channel
 * (room:join / room:message / room:presence) — a pure ephemeral relay + presence
 * layer, same role the old Blink realtime channel played. Message *persistence*
 * still goes through useSendMessage() (REST, via apiTable) exactly as before —
 * this hook is only responsible for the live/ephemeral half of the chat.
 */
export function useRealtimeChat(jobId: string, user: AppUser | null): UseRealtimeChatReturn {
  const [messages, setMessages] = useState<RealtimeMessage[]>([])
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const roomIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!user?.id) return
    const socket = getSocket()
    if (!socket) return

    const roomId = `job-${jobId}`
    roomIdRef.current = roomId
    const displayName = user.displayName || 'Anonymous'

    const doJoin = () => {
      socket.emit('room:join', { roomId, displayName })
      setIsConnected(true)
    }

    if (socket.connected) doJoin()
    socket.on('connect', doJoin)

    const onMessage = (msg: RealtimeMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
    }

    const onPresence = ({ roomId: incomingRoomId, users }: { roomId: string; users: { userId: string; displayName: string; joinedAt: number }[] }) => {
      if (incomingRoomId !== roomId) return
      setOnlineUsers(
        users.map((u) => ({
          userId: u.userId,
          metadata: { displayName: u.displayName },
          joinedAt: u.joinedAt,
          lastSeen: u.joinedAt,
        })),
      )
    }

    socket.on('room:message', onMessage)
    socket.on('room:presence', onPresence)

    return () => {
      socket.emit('room:leave', { roomId })
      socket.off('connect', doJoin)
      socket.off('room:message', onMessage)
      socket.off('room:presence', onPresence)
      setIsConnected(false)
      setMessages([])
      setOnlineUsers([])
    }
  }, [user?.id, jobId])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !user || !roomIdRef.current) return
      const socket = getSocket()
      if (!socket) return
      socket.emit('room:message', {
        roomId: roomIdRef.current,
        text: text.trim(),
        displayName: user.displayName || 'Anonymous',
      })
    },
    [user],
  )

  return { messages, sendMessage, onlineUsers, isConnected }
}
