import { useState, useEffect, useRef, useCallback } from 'react'
import { blink } from '@/blink/client'
import type { BlinkUser } from '@blinkdotnew/sdk'

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

export function useRealtimeChat(
  jobId: string,
  user: BlinkUser | null,
): UseRealtimeChatReturn {
  const [messages, setMessages] = useState<RealtimeMessage[]>([])
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])
  const [isConnected, setIsConnected] = useState(false)

  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (!user?.id) return

    let channel: any = null
    let mounted = true

    const connect = async () => {
      try {
        channel = blink.realtime.channel(`job-${jobId}`)
        channelRef.current = channel

        await channel.subscribe({
          userId: user.id,
          metadata: {
            displayName: user.displayName || 'Anonymous',
          },
        })

        if (!mounted) return
        setIsConnected(true)

        // Load message history from realtime channel
        const history = await channel.getMessages({ limit: 100 })
        if (mounted) {
          setMessages(
            history.map((msg: any) => ({
              id: msg.id,
              type: msg.type || 'chat',
              data: msg.data,
              timestamp: msg.timestamp,
              userId: msg.userId,
              metadata: msg.metadata,
            })),
          )
        }

        // Listen for incoming messages
        channel.onMessage((msg: any) => {
          if (!mounted) return
          if (msg.type === 'chat') {
            setMessages((prev) => {
              // Deduplicate
              if (prev.some((m) => m.id === msg.id)) return prev
              return [
                ...prev,
                {
                  id: msg.id,
                  type: msg.type,
                  data: msg.data,
                  timestamp: msg.timestamp,
                  userId: msg.userId,
                  metadata: msg.metadata,
                },
              ]
            })
          }
        })

        // Listen for presence changes
        channel.onPresence((users: PresenceUser[]) => {
          if (!mounted) return
          setOnlineUsers(users)
        })
      } catch (err) {
        console.error('Failed to connect to realtime chat:', err)
      }
    }

    connect()

    return () => {
      mounted = false
      channel?.unsubscribe()
      channelRef.current = null
      setIsConnected(false)
    }
  }, [user?.id, jobId])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !channelRef.current || !user) return

      await channelRef.current.publish(
        'chat',
        { text: text.trim() },
        {
          userId: user.id,
          metadata: { displayName: user.displayName || 'Anonymous' },
        },
      )
    },
    [user],
  )

  return { messages, sendMessage, onlineUsers, isConnected }
}
