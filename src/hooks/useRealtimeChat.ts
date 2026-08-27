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

interface UseRoomChatReturn {
  messages: RealtimeMessage[]
  sendMessage: (text: string) => Promise<void>
  onlineUsers: PresenceUser[]
  isConnected: boolean
}

/**
 * Shared implementation behind a Socket.io "generic room" (room:join / room:message /
 * room:presence) — a pure ephemeral relay + presence layer, same role the old Blink
 * realtime channel played. Message *persistence* goes through a separate REST call
 * (useSendMessage / useSendBidMessage, via apiTable) — this hook only handles the
 * live/ephemeral half. `roomId` is caller-supplied so different features (job chat,
 * per-bid negotiation) can each get their own isolated room.
 */
function useRoomChat(roomId: string | null, user: AppUser | null): UseRoomChatReturn {
  const [messages, setMessages] = useState<RealtimeMessage[]>([])
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const roomIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!user?.id || !roomId) return
    const socket = getSocket()
    if (!socket) return

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
  }, [user?.id, roomId])

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

/** The main post-acceptance job chat (unchanged from before). */
export function useRealtimeChat(jobId: string, user: AppUser | null): UseRoomChatReturn {
  return useRoomChat(`job-${jobId}`, user)
}

/** A private, per-bid negotiation thread — separate room, so only that bid's two
 * participants (the customer and that specific worker) share it, even though the bid
 * amount itself is visible to everyone viewing the job. */
export function useBidNegotiationChat(bidId: string | null, user: AppUser | null): UseRoomChatReturn {
  return useRoomChat(bidId ? `bid-${bidId}` : null, user)
}
