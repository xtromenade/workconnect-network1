import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Input } from '@blinkdotnew/ui'
import { MessageCircle, Send, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useBidMessages, useSendBidMessage } from '@/hooks/useBidMessages'
import { useBidNegotiationChat, type RealtimeMessage } from '@/hooks/useRealtimeChat'

interface MergedMessage {
  id: string
  content: string
  senderId: string
  createdAt: string
}

export function BidNegotiationChat({
  bidId,
  jobId,
  customerId,
  workerId,
}: {
  bidId: string
  jobId: string
  customerId: string
  workerId: string
}) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: dbMessages = [] } = useBidMessages(open ? bidId : undefined)
  const sendDbMessage = useSendBidMessage()
  const { messages: realtimeMessages, sendMessage: sendRealtime } = useBidNegotiationChat(open ? bidId : null, user)

  const otherUserId = user?.id === customerId ? workerId : customerId

  const merged = useMemo(() => {
    const dbMapped: MergedMessage[] = dbMessages.map((m) => ({
      id: m.id,
      content: m.content,
      senderId: m.senderId,
      createdAt: m.createdAt,
    }))
    const rtMapped: MergedMessage[] = realtimeMessages.map((m: RealtimeMessage) => ({
      id: m.id,
      content: m.data?.text ?? '',
      senderId: m.userId,
      createdAt: new Date(m.timestamp).toISOString(),
    }))

    const seen = new Set<string>()
    const all: MergedMessage[] = []
    for (const msg of [...dbMapped, ...rtMapped]) {
      if (seen.has(msg.id)) continue
      seen.add(msg.id)
      all.push(msg)
    }
    all.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    return all
  }, [dbMessages, realtimeMessages])

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [open, merged.length])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !user) return
    const content = text.trim()
    setText('')
    sendRealtime(content)
    try {
      await sendDbMessage.mutateAsync({ jobId, bidId, senderId: user.id, receiverId: otherUserId, content })
    } catch {
      // Realtime delivery already went out — a failed DB write here just means the
      // history won't persist for this one message, not worth surfacing as an error.
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        Discuss this bid{merged.length > 0 && !open ? ` (${merged.length})` : ''}
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          <div className="max-h-52 overflow-y-auto space-y-1.5 bg-muted/30 rounded-md p-2">
            {merged.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">
                No messages yet — ask a question or discuss the price here.
              </p>
            ) : (
              merged.map((m) => (
                <div key={m.id} className={`flex ${m.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <span
                    className={`max-w-[80%] px-2.5 py-1.5 rounded-lg text-xs ${
                      m.senderId === user?.id
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-background border border-border'
                    }`}
                  >
                    {m.content}
                  </span>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={handleSend} className="flex gap-1.5">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Message about this bid…"
              className="h-8 text-xs"
            />
            <Button type="submit" size="sm" className="h-8 px-2.5" disabled={!text.trim()}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
