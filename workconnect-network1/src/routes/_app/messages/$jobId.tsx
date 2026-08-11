import { useState, useRef, useEffect, useMemo } from 'react'
import { createFileRoute, useParams, Link } from '@tanstack/react-router'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'
import { useAuth } from '@/hooks/useAuth'
import { useConversation, useSendMessage, useMarkRead } from '@/hooks/useMessages'
import { useRealtimeChat, type RealtimeMessage } from '@/hooks/useRealtimeChat'
import { useCall } from '@/context/CallContext'
import { getSocket } from '@/lib/socket'
import { LiveMap } from '@/components/LiveMap'
import { Button, Input, Avatar, AvatarFallback } from '@blinkdotnew/ui'
import { ArrowLeft, Send, Loader2, MessageSquare, Circle, Phone, Video } from 'lucide-react'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/_app/messages/$jobId')({
  component: ChatPage,
})

function ChatPage() {
  const { jobId } = useParams({ from: '/_app/messages/$jobId' })

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] md:h-[calc(100dvh-3.5rem)]">
      <BlinkClientBoundary
        fallback={
          <div className="flex items-center justify-center flex-1">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        }
      >
        <ChatContent jobId={jobId} />
      </BlinkClientBoundary>
    </div>
  )
}

interface MergedMessage {
  id: string
  content: string
  senderId: string
  senderName?: string
  createdAt: string
  isRead: string
  source: 'db' | 'realtime'
}

function ChatContent({ jobId }: { jobId: string }) {
  const { user } = useAuth()
  const {
    data: dbMessages,
    isLoading: dbLoading,
  } = useConversation(jobId, user?.id)
  const sendDbMessage = useSendMessage()
  const markRead = useMarkRead()

  const {
    messages: realtimeMessages,
    sendMessage: sendRealtimeMessage,
    onlineUsers,
    isConnected,
  } = useRealtimeChat(jobId, user)

  const { startCall } = useCall()

  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Merge DB messages and realtime messages
  const mergedMessages = useMemo(() => {
    const dbMapped: MergedMessage[] = (Array.isArray(dbMessages) ? dbMessages : []).map(
      (m) => ({
        id: m.id,
        content: m.content,
        senderId: m.senderId,
        senderName: m.senderName,
        createdAt: m.createdAt,
        isRead: m.isRead,
        source: 'db' as const,
      }),
    )

    const rtMapped: MergedMessage[] = realtimeMessages.map((m: RealtimeMessage) => ({
      id: m.id,
      content: m.data?.text ?? '',
      senderId: m.userId,
      senderName: m.metadata?.displayName,
      createdAt: new Date(m.timestamp).toISOString(),
      isRead: '1',
      source: 'realtime' as const,
    }))

    // Combine and deduplicate by ID
    const seen = new Set<string>()
    const all: MergedMessage[] = []

    for (const msg of [...dbMapped, ...rtMapped]) {
      if (seen.has(msg.id)) continue
      seen.add(msg.id)
      all.push(msg)
    }

    // Sort by timestamp
    all.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )

    return all
  }, [dbMessages, realtimeMessages])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mergedMessages.length])

  // Mark unread DB messages as read
  useEffect(() => {
    if (!user) return
    const unread = mergedMessages.filter(
      (m) => m.senderId !== user.id && m.source === 'db' && Number(m.isRead) === 0,
    )
    unread.forEach((m) => {
      markRead.mutate({ id: m.id })
    })
  }, [mergedMessages, user])

  // Determine the other party for DB message sending
  const otherUserId = useMemo(() => {
    const dbList = Array.isArray(dbMessages) ? dbMessages : []
    if (dbList.length === 0 || !user) return ''
    const first = dbList[0]
    return first.senderId === user.id ? first.receiverId : first.senderId
  }, [dbMessages, user])

  // Watch the other party's live location, if they're currently sharing it
  const [otherLocation, setOtherLocation] = useState<{ lat: number; lng: number } | null>(null)
  useEffect(() => {
    const socket = getSocket()
    if (!socket || !otherUserId) return

    socket.emit('location:watch', { targetUserId: otherUserId })

    const onLocationChanged = ({ userId, lat, lng }: { userId: string; lat: number; lng: number }) => {
      if (userId === otherUserId) setOtherLocation({ lat, lng })
    }
    const onLocationOffline = ({ userId }: { userId: string }) => {
      if (userId === otherUserId) setOtherLocation(null)
    }

    socket.on('location:changed', onLocationChanged)
    socket.on('location:offline', onLocationOffline)

    return () => {
      socket.emit('location:unwatch', { targetUserId: otherUserId })
      socket.off('location:changed', onLocationChanged)
      socket.off('location:offline', onLocationOffline)
    }
  }, [otherUserId])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMsg.trim() || !user) return

    setSending(true)
    try {
      // Send via realtime for instant delivery
      await sendRealtimeMessage(newMsg.trim())

      // Also persist to DB if we know the receiver
      if (otherUserId) {
        await sendDbMessage.mutateAsync({
          jobId,
          senderId: user.id,
          receiverId: otherUserId,
          content: newMsg.trim(),
          isRead: '0',
        })
      }

      setNewMsg('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const onlineCount = onlineUsers.length

  if (dbLoading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border bg-background shrink-0">
        <Link
          to="/messages"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <p className="font-medium text-sm">Job #{jobId.slice(0, 8)}</p>
        </div>

        {/* Presence indicator */}
        <div className="flex items-center gap-1.5">
          <Circle
            className={`h-2 w-2 fill-current ${
              isConnected && onlineCount > 0
                ? 'text-emerald-500'
                : 'text-muted-foreground/40'
            }`}
          />
          <span className="text-xs text-muted-foreground">
            {isConnected
              ? onlineCount > 0
                ? `${onlineCount} online`
                : 'Offline'
              : 'Connecting...'}
          </span>
        </div>

        {/* Call buttons */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={!otherUserId}
          title={otherUserId ? 'Voice call' : 'Send a message first to start a call'}
          onClick={() => otherUserId && startCall(`job-${jobId}`, otherUserId, 'audio')}
        >
          <Phone className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={!otherUserId}
          title={otherUserId ? 'Video call' : 'Send a message first to start a call'}
          onClick={() => otherUserId && startCall(`job-${jobId}`, otherUserId, 'video')}
        >
          <Video className="h-4 w-4" />
        </Button>
      </div>

      {/* Live location, if the other party is currently sharing it */}
      {otherLocation && (
        <div className="px-4 pt-3">
          <LiveMap lat={otherLocation.lat} lng={otherLocation.lng} label="Live location" />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {mergedMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No messages yet. Start the conversation!
              </p>
            </div>
          </div>
        ) : (
          mergedMessages.map((msg) => {
            const isMe = msg.senderId === user?.id
            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                    <AvatarFallback className="text-[9px] bg-secondary text-secondary-foreground">
                      {msg.senderName
                        ? msg.senderName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)
                        : '?'}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    isMe
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-secondary text-secondary-foreground rounded-bl-md'
                  }`}
                >
                  {!isMe && msg.senderName && (
                    <p className="text-[10px] font-medium opacity-70 mb-0.5">
                      {msg.senderName}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className="text-[9px] opacity-50 mt-1 text-right">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {isMe && (
                  <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                    <AvatarFallback className="text-[9px] bg-primary/20">
                      {user?.displayName
                        ? user.displayName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)
                        : 'ME'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 px-4 py-3 border-t border-border bg-background shrink-0"
      >
        <Input
          placeholder="Type a message..."
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          className="flex-1"
          autoComplete="off"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!newMsg.trim() || sending}
          className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

    </>
  )
}
