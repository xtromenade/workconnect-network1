import { useState, useRef, useEffect } from 'react'
import { createFileRoute, useParams, Link } from '@tanstack/react-router'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'
import { useAuth } from '@/hooks/useAuth'
import { useConversation, useSendMessage, useMarkRead } from '@/hooks/useMessages'
import { Button, Input, Avatar, AvatarFallback } from '@blinkdotnew/ui'
import { ArrowLeft, Send, Loader2, MessageSquare } from 'lucide-react'
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

function ChatContent({ jobId }: { jobId: string }) {
  const { user } = useAuth()
  const { data: messages, isLoading } = useConversation(jobId, user?.id)
  const sendMessage = useSendMessage()
  const markRead = useMarkRead()

  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const msgList = Array.isArray(messages) ? messages : []

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgList.length])

  // Mark unread as read
  useEffect(() => {
    if (!user) return
    const unread = msgList.filter(
      (m) => m.senderId !== user.id && Number(m.isRead) === 0,
    )
    unread.forEach((m) => {
      markRead.mutate({ id: m.id })
    })
  }, [msgList, user])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMsg.trim() || !user) return

    setSending(true)
    try {
      // Determine receiver: the other person in the first message
      const otherId =
        msgList.length > 0
          ? msgList[0].senderId === user.id
            ? msgList[0].receiverId
            : msgList[0].senderId
          : ''

      await sendMessage.mutateAsync({
        jobId,
        senderId: user.id,
        receiverId: otherId,
        content: newMsg.trim(),
        isRead: '0',
      })
      setNewMsg('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (isLoading) {
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
          to="/app/messages"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="font-medium text-sm">Job #{jobId.slice(0, 8)}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {msgList.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          msgList.map((msg) => {
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
