import { useState } from 'react'
import { createFileRoute, useParams, Link } from '@tanstack/react-router'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useJob, useUpdateJob } from '@/hooks/useJobs'
import { useBids, useCreateBid, useUpdateBidStatus } from '@/hooks/useBids'
import { Button, Input, Textarea, Badge, Card, CardContent, Avatar, AvatarFallback } from '@blinkdotnew/ui'
import {
  Loader2,
  MapPin,
  Briefcase,
  DollarSign,
  ArrowLeft,
  Send,
  Check,
  X,
  MessageSquare,
} from 'lucide-react'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/_app/jobs/$jobId')({
  component: JobDetailPage,
})

function JobDetailPage() {
  const { jobId } = useParams({ from: '/_app/jobs/$jobId' })

  return (
    <div className="p-6 lg:p-8">
      <BlinkClientBoundary
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        }
      >
        <JobDetailContent jobId={jobId} />
      </BlinkClientBoundary>
    </div>
  )
}

function JobDetailContent({ jobId }: { jobId: string }) {
  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id)
  const { data: job, isLoading } = useJob(jobId)
  const { data: bids, isLoading: bidsLoading } = useBids(jobId)
  const createBid = useCreateBid()
  const updateBidStatus = useUpdateBidStatus()
  const updateJob = useUpdateJob()

  const [bidAmount, setBidAmount] = useState('')
  const [bidMessage, setBidMessage] = useState('')
  const [submittingBid, setSubmittingBid] = useState(false)
  const [showBidForm, setShowBidForm] = useState(false)

  const bidList = Array.isArray(bids) ? bids : []
  const isCustomer = profile?.role === 'customer'
  const isWorker = profile?.role === 'worker'
  const isMyJob = isCustomer && job?.customerId === user?.id
  const myBid = isWorker ? bidList.find((b) => b.workerId === user?.id) : null
  const acceptedBid = job?.acceptedBidId
    ? bidList.find((b) => b.id === job.acceptedBidId)
    : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="text-center py-20">
        <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Job not found.</p>
      </div>
    )
  }

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSubmittingBid(true)
    try {
      await createBid.mutateAsync({
        jobId,
        workerId: user.id,
        amount: Number(bidAmount),
        message: bidMessage,
        status: 'pending',
      })
      toast.success('Bid submitted!')
      setShowBidForm(false)
      setBidAmount('')
      setBidMessage('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit bid')
    } finally {
      setSubmittingBid(false)
    }
  }

  const handleAcceptBid = async (bidId: string) => {
    try {
      await updateBidStatus.mutateAsync({ id: bidId, status: 'accepted' })
      // Update job to mark it in progress
      await updateJob.mutateAsync({
        id: jobId,
        status: 'in_progress',
        acceptedBidId: bidId,
        workerId: bidList.find((b) => b.id === bidId)?.workerId ?? null,
      })
      toast.success('Bid accepted!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to accept bid')
    }
  }

  const handleRejectBid = async (bidId: string) => {
    try {
      await updateBidStatus.mutateAsync({ id: bidId, status: 'rejected' })
      toast.success('Bid rejected')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject bid')
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back link */}
      <Link to="/jobs" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to jobs
      </Link>

      {/* Job header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-xl font-bold tracking-tight">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {job.category}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {job.city}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {job.currency} {job.budget.toLocaleString()}
                </span>
              </div>
            </div>
            <Badge
              variant={
                job.status === 'open'
                  ? 'default'
                  : job.status === 'in_progress'
                    ? 'secondary'
                    : 'outline'
              }
            >
              {job.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed whitespace-pre-wrap">
            {job.description}
          </p>
          <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
            <span>Payment: {job.paymentMethod}</span>
            {job.customerName && <span>· Posted by {job.customerName}</span>}
          </div>

          {/* Message button for accepted job */}
          {acceptedBid && (isMyJob || (isWorker && myBid?.status === 'accepted')) && (
            <div className="mt-4 pt-4 border-t border-border">
              <Link
                to="/messages/$jobId"
                params={{ jobId }}
                className="inline-flex"
              >
                <Button variant="outline" size="sm" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {isMyJob ? 'Message Worker' : 'Message Customer'}
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bids section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base">
            Bids ({bidList.length})
          </h2>
          {isWorker && !myBid && job.status === 'open' && !showBidForm && (
            <Button
              size="sm"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => setShowBidForm(true)}
            >
              Submit a Bid
            </Button>
          )}
        </div>

        {/* Bid form */}
        {showBidForm && (
          <Card className="mb-4 border-accent/50">
            <CardContent className="p-4">
              <form onSubmit={handleSubmitBid} className="space-y-3">
                <h3 className="font-medium text-sm">Your Bid</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    required
                    min="1"
                  />
                  <Input
                    value={job.currency}
                    disabled
                    className="text-muted-foreground"
                  />
                </div>
                <Textarea
                  placeholder="Why are you the right person for this job?"
                  value={bidMessage}
                  onChange={(e) => setBidMessage(e.target.value)}
                  className="min-h-[80px]"
                  required
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBidForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5"
                    disabled={submittingBid}
                  >
                    {submittingBid ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    Submit Bid
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Bids list */}
        {bidsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : bidList.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-sm text-muted-foreground">
                No bids yet.
                {isWorker && !myBid && job.status === 'open' && ' Be the first to bid!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {bidList.map((bid) => (
              <Card
                key={bid.id}
                className={
                  bid.status === 'accepted' ? 'border-accent/50' : ''
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-[10px] bg-muted">
                          {bid.workerName
                            ? bid.workerName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)
                            : 'W'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {bid.workerName || 'Worker'}
                        </p>
                        {bid.workerSkills && (
                          <p className="text-xs text-muted-foreground">
                            {bid.workerSkills}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-sm">
                        {bid.amount.toLocaleString()}
                      </p>
                      <Badge
                        variant={
                          bid.status === 'accepted'
                            ? 'default'
                            : bid.status === 'rejected'
                              ? 'destructive'
                              : 'secondary'
                        }
                        className="text-[10px] mt-1"
                      >
                        {bid.status}
                      </Badge>
                    </div>
                  </div>
                  {bid.message && (
                    <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                      {bid.message}
                    </p>
                  )}

                  {/* Customer actions */}
                  {isMyJob && bid.status === 'pending' && job.status === 'open' && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => handleAcceptBid(bid.id)}
                        disabled={updateBidStatus.isPending}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 text-destructive hover:text-destructive"
                        onClick={() => handleRejectBid(bid.id)}
                        disabled={updateBidStatus.isPending}
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
