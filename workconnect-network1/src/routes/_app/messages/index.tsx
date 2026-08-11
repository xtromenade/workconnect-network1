import { createFileRoute, Link } from '@tanstack/react-router'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useMyJobs } from '@/hooks/useJobs'
import { useMyBids } from '@/hooks/useBids'
import { useConversation } from '@/hooks/useMessages'
import { Card, CardContent, Avatar, AvatarFallback, Badge } from '@blinkdotnew/ui'
import { MessageSquare, Loader2 } from 'lucide-react'
import { useMemo } from 'react'

export const Route = createFileRoute('/_app/messages/')({
  component: MessagesPage,
})

function MessagesPage() {
  return (
    <div className="p-6 lg:p-8">
      <BlinkClientBoundary
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        }
      >
        <MessagesContent />
      </BlinkClientBoundary>
    </div>
  )
}

function MessagesContent() {
  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id)
  const { data: myJobs } = useMyJobs(profile?.role === 'customer' ? user?.id : undefined)

  // For workers: get jobs where their bid was accepted
  const { data: myBids } = useMyBids(profile?.role === 'worker' ? user?.id : undefined)

  const jobList = Array.isArray(myJobs) ? myJobs : []
  const bidList = Array.isArray(myBids) ? myBids : []

  // All active conversation job IDs
  const conversationJobs = useMemo(() => {
    const jobIds = new Set<string>()

    // Customer side: their jobs that are in_progress (have accepted bids)
    if (profile?.role === 'customer') {
      jobList
        .filter((j) => j.acceptedBidId && j.status === 'in_progress')
        .forEach((j) => jobIds.add(j.id))
    }

    // Worker side: jobs where their bid was accepted
    if (profile?.role === 'worker') {
      bidList
        .filter((b) => b.status === 'accepted')
        .forEach((b) => jobIds.add(b.jobId))
    }

    return [...jobIds]
  }, [jobList, bidList, profile?.role])

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">Messages</h1>
        <p className="text-sm text-muted-foreground mt-1">Your active conversations.</p>
      </div>

      {conversationJobs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-base mb-1">No conversations yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {profile.role === 'customer'
                ? 'Accept a bid on one of your jobs to start messaging.'
                : 'Get a bid accepted to start messaging with the customer.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {conversationJobs.map((convJobId) => (
            <ConversationRow
              key={convJobId}
              jobId={convJobId}
              userId={user.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ConversationRow({ jobId, userId }: { jobId: string; userId: string }) {
  const { data: messages } = useConversation(jobId, userId)
  const msgList = Array.isArray(messages) ? messages : []
  const lastMsg = msgList[msgList.length - 1]
  const unreadCount = msgList.filter(
    (m) => m.senderId !== userId && Number(m.isRead) === 0,
  ).length

  return (
    <Link
      to="/messages/$jobId"
      params={{ jobId }}
      className="block group"
    >
      <Card className="hover:shadow-sm transition-all cursor-pointer">
        <CardContent className="p-4 flex items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="text-[10px] bg-secondary text-secondary-foreground">
              {lastMsg?.senderName
                ? lastMsg.senderName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : 'J'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-sm truncate">
                Job #{jobId.slice(0, 8)}
              </p>
              {lastMsg && (
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(lastMsg.createdAt).toLocaleDateString()}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {lastMsg ? lastMsg.content : 'No messages yet'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Badge className="shrink-0 bg-accent text-accent-foreground text-[10px] h-5 min-w-5 flex items-center justify-center">
              {unreadCount}
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
