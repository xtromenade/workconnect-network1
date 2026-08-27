import { useState } from 'react'
import { createFileRoute, useParams, Link } from '@tanstack/react-router'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useJob, useUpdateJob } from '@/hooks/useJobs'
import { useBids, useCreateBid, useUpdateBidStatus } from '@/hooks/useBids'
import { useCall } from '@/context/CallContext'
import { useReviews, useCreateReview } from '@/hooks/useReviews'
import { useCustomerStats, useWorkerStats } from '@/hooks/useStats'
import { usePriceRequests, useCreatePriceRequest, useResolvePriceRequest } from '@/hooks/usePriceRequests'
import { useCreateNotification } from '@/hooks/useNotifications'
import { BidNegotiationChat } from '@/components/BidNegotiationChat'
import { apiTable } from '@/lib/apiTable'
import type { Wallet, Transaction, Bid, Job } from '@/types'
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
  Phone,
  Video,
  CheckCircle2,
  Clock,
  Star,
  Wallet as WalletIcon,
  Users,
  TrendingUp,
  PenLine,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react'
import toast from 'react-hot-toast'

const walletsTable = () => apiTable<Wallet>('wallets')
const transactionsTable = () => apiTable<Transaction>('transactions')

export const Route = createFileRoute('/_app/jobs/$jobId')({
  component: JobDetailPage,
})

// Moves `amount` from the customer's wallet to the worker's wallet and logs both sides
// as transactions. Deliberately non-blocking on failure — if the customer doesn't have
// enough wallet balance, the job still gets marked complete (payment presumably happens
// outside the app, e.g. cash), just with a heads-up toast instead of a hard error.
async function settleWalletPayment(
  customerId: string,
  workerId: string,
  amount: number,
  currency: string,
  jobId: string,
) {
  const [customerWallets, workerWallets] = await Promise.all([
    walletsTable().list({ where: { userId: customerId }, limit: 1 }),
    walletsTable().list({ where: { userId: workerId }, limit: 1 }),
  ])
  const customerWallet = customerWallets[0]

  if (!customerWallet || customerWallet.balance < amount) {
    toast('Customer wallet balance is too low — mark this job’s payment as settled outside the app.', { icon: '⚠️' })
    return
  }

  let workerWallet = workerWallets[0]
  if (!workerWallet) {
    workerWallet = await walletsTable().create({ userId: workerId, balance: 0, currency })
  }

  await walletsTable().update(customerWallet.id, { balance: customerWallet.balance - amount })
  await walletsTable().update(workerWallet.id, { balance: workerWallet.balance + amount })

  await Promise.all([
    transactionsTable().create({
      walletId: customerWallet.id,
      userId: customerId,
      amount,
      type: 'debit',
      reference: `job-${jobId}`,
      description: 'Payment for completed job',
      jobId,
    }),
    transactionsTable().create({
      walletId: workerWallet.id,
      userId: workerId,
      amount,
      type: 'credit',
      reference: `job-${jobId}`,
      description: 'Payment received for completed job',
      jobId,
    }),
  ])
}

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
  const { startCall } = useCall()
  const { data: jobReviews } = useReviews(job?.workerId ?? undefined)
  const createReview = useCreateReview()
  const { data: customerStats } = useCustomerStats(job?.customerId)
  const { data: priceRequests = [] } = usePriceRequests(jobId)
  const createPriceRequest = useCreatePriceRequest()
  const resolvePriceRequest = useResolvePriceRequest()
  const createNotification = useCreateNotification()

  const [bidAmount, setBidAmount] = useState('')
  const [bidMessage, setBidMessage] = useState('')
  const [submittingBid, setSubmittingBid] = useState(false)
  const [showBidForm, setShowBidForm] = useState(false)
  const [marking, setMarking] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [showPriceForm, setShowPriceForm] = useState(false)
  const [newAmount, setNewAmount] = useState('')
  const [priceReason, setPriceReason] = useState('')
  const [submittingPriceRequest, setSubmittingPriceRequest] = useState(false)
  const [resolvingPriceRequest, setResolvingPriceRequest] = useState(false)

  const bidList = Array.isArray(bids) ? bids : []
  const isCustomer = profile?.role === 'customer'
  const isWorker = profile?.role === 'worker'
  const isMyJob = isCustomer && job?.customerId === user?.id
  const myBid = isWorker ? bidList.find((b) => b.workerId === user?.id) : null
  const acceptedBid = job?.acceptedBidId
    ? bidList.find((b) => b.id === job.acceptedBidId)
    : null
  const callPeerId = isMyJob ? acceptedBid?.workerId : job?.customerId
  const myReview = Array.isArray(jobReviews)
    ? jobReviews.find((r) => r.jobId === jobId && r.reviewerId === user?.id)
    : undefined
  const pendingPriceRequest = priceRequests.find((r) => r.status === 'pending')

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
    if (!user || !job) return

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
      createNotification.mutate({
        userId: job.customerId,
        title: `New bid on "${job.title}"`,
        body: `${user.displayName || 'A worker'} bid ${job.currency} ${Number(bidAmount).toLocaleString()}`,
        link: `/jobs/${jobId}`,
      })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit bid')
    } finally {
      setSubmittingBid(false)
    }
  }

  const handleAcceptBid = async (bidId: string) => {
    if (!job) return
    try {
      const acceptedWorkerId = bidList.find((b) => b.id === bidId)?.workerId ?? null
      await updateBidStatus.mutateAsync({ id: bidId, status: 'accepted' })
      // Update job to mark it in progress
      await updateJob.mutateAsync({
        id: jobId,
        status: 'in_progress',
        acceptedBidId: bidId,
        workerId: acceptedWorkerId,
      })
      toast.success('Bid accepted!')
      if (acceptedWorkerId) {
        createNotification.mutate({
          userId: acceptedWorkerId,
          title: `Your bid was accepted!`,
          body: `"${job.title}" — you're hired.`,
          link: `/jobs/${jobId}`,
        })
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to accept bid')
    }
  }

  const handleRejectBid = async (bidId: string) => {
    if (!job) return
    try {
      const rejectedWorkerId = bidList.find((b) => b.id === bidId)?.workerId
      await updateBidStatus.mutateAsync({ id: bidId, status: 'rejected' })
      toast.success('Bid rejected')
      if (rejectedWorkerId) {
        createNotification.mutate({
          userId: rejectedWorkerId,
          title: `Bid declined`,
          body: `Your bid on "${job.title}" wasn't accepted this time.`,
          link: `/jobs/${jobId}`,
        })
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject bid')
    }
  }

  // Worker marks the work finished — job stays "in_progress" until the customer confirms.
  const handleMarkComplete = async () => {
    if (!job) return
    setMarking(true)
    try {
      await updateJob.mutateAsync({ id: jobId, workerCompletedAt: new Date().toISOString() })
      toast.success('Marked as complete — waiting for the customer to confirm.')
      createNotification.mutate({
        userId: job.customerId,
        title: `"${job.title}" marked complete`,
        body: 'The worker says this job is done — confirm to close it out.',
        link: `/jobs/${jobId}`,
      })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to mark job complete')
    } finally {
      setMarking(false)
    }
  }

  // Customer confirms — this is what actually closes the job out. If the job was set up
  // to pay via in-app wallet, settle the transfer here; cash jobs skip straight to "completed".
  const handleConfirmCompletion = async () => {
    if (!job || !job.workerId) return
    setConfirming(true)
    try {
      if (job.paymentMethod === 'wallet') {
        await settleWalletPayment(job.customerId, job.workerId, job.budget, job.currency, jobId)
      }
      await updateJob.mutateAsync({ id: jobId, status: 'completed', completedAt: new Date().toISOString() })
      toast.success('Job confirmed as complete!')
      createNotification.mutate({
        userId: job.workerId,
        title: `"${job.title}" confirmed complete`,
        body: 'The customer confirmed the job is done. Nice work!',
        link: `/jobs/${jobId}`,
      })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to confirm completion')
    } finally {
      setConfirming(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!user || !job?.workerId) return
    setSubmittingReview(true)
    try {
      await createReview.mutateAsync({
        jobId,
        reviewerId: user.id,
        reviewedUserId: job.workerId,
        rating: reviewRating,
        comment: reviewComment,
      })
      toast.success('Review submitted — thanks for the feedback!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  // Worker asks for a different amount once the job's underway — e.g. it turned out
  // to need more (or less) work than the original bid covered.
  const handleSubmitPriceRequest = async () => {
    if (!user || !job || !job.acceptedBidId) return
    const amount = Number(newAmount)
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    setSubmittingPriceRequest(true)
    try {
      await createPriceRequest.mutateAsync({
        jobId,
        bidId: job.acceptedBidId,
        requestedBy: user.id,
        previousAmount: job.budget,
        requestedAmount: amount,
        reason: priceReason,
      })
      toast.success('Price change requested — waiting for the customer to review it.')
      setShowPriceForm(false)
      setNewAmount('')
      setPriceReason('')
      createNotification.mutate({
        userId: job.customerId,
        title: `Price change requested for "${job.title}"`,
        body: `${job.currency} ${job.budget.toLocaleString()} → ${job.currency} ${amount.toLocaleString()}`,
        link: `/jobs/${jobId}`,
      })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit price request')
    } finally {
      setSubmittingPriceRequest(false)
    }
  }

  // Customer approves or declines the worker's requested amount. Approving updates the
  // job's actual budget to the new agreed price.
  const handleResolvePriceRequest = async (status: 'approved' | 'rejected') => {
    if (!pendingPriceRequest) return
    setResolvingPriceRequest(true)
    try {
      await resolvePriceRequest.mutateAsync({ id: pendingPriceRequest.id, status, jobId })
      if (status === 'approved') {
        await updateJob.mutateAsync({ id: jobId, budget: pendingPriceRequest.requestedAmount })
        toast.success(`Price updated to ${job?.currency} ${pendingPriceRequest.requestedAmount.toLocaleString()}`)
      } else {
        toast('Price change declined', { icon: '👍' })
      }
      createNotification.mutate({
        userId: pendingPriceRequest.requestedBy,
        title: status === 'approved' ? 'Price change approved' : 'Price change declined',
        body: job
          ? `"${job.title}" — ${status === 'approved' ? `now ${job.currency} ${pendingPriceRequest.requestedAmount.toLocaleString()}` : 'price stays the same'}`
          : '',
        link: `/jobs/${jobId}`,
      })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to resolve price request')
    } finally {
      setResolvingPriceRequest(false)
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
              {job.status === 'in_progress' && job.workerCompletedAt
                ? 'awaiting confirmation'
                : job.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed whitespace-pre-wrap">
            {job.description}
          </p>
          <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
            <span>Payment: {job.paymentMethod}</span>
            {job.customerName && <span>· Posted by {job.customerName}</span>}
          </div>

          {/* Customer track record — shown to workers deciding whether to bid */}
          {isWorker && customerStats && (
            <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <WalletIcon className="h-3.5 w-3.5" />
                {customerStats.amountSpent > 0
                  ? `${customerStats.currency} ${customerStats.amountSpent.toLocaleString()} spent`
                  : 'No completed jobs yet'}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {customerStats.numberOfHires} hire{customerStats.numberOfHires === 1 ? '' : 's'}
              </span>
            </div>
          )}

          {/* Communication buttons for accepted job */}
          {acceptedBid && (isMyJob || (isWorker && myBid?.status === 'accepted')) && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex flex-wrap items-center gap-2">
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
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={!callPeerId}
                  onClick={() => callPeerId && startCall(`job-${jobId}`, callPeerId, 'audio')}
                >
                  <Phone className="h-4 w-4" />
                  Voice Call
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={!callPeerId}
                  onClick={() => callPeerId && startCall(`job-${jobId}`, callPeerId, 'video')}
                >
                  <Video className="h-4 w-4" />
                  Video Call
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price change request — worker can ask for a different amount once the job's
          underway; customer approves or declines. Only relevant while in progress. */}
      {job.status === 'in_progress' && job.acceptedBidId && (
        <>
          {pendingPriceRequest ? (
            <Card className="border-amber-300 bg-amber-50/40 dark:bg-amber-950/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <PenLine className="h-3.5 w-3.5" />
                      Price change requested
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {job.currency} {pendingPriceRequest.previousAmount.toLocaleString()} →{' '}
                      <span className="font-semibold text-foreground">
                        {job.currency} {pendingPriceRequest.requestedAmount.toLocaleString()}
                      </span>
                    </p>
                    {pendingPriceRequest.reason && (
                      <p className="text-xs text-muted-foreground mt-1.5 italic">"{pendingPriceRequest.reason}"</p>
                    )}
                  </div>

                  {isMyJob ? (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        className="bg-emerald-600 text-white hover:bg-emerald-700 gap-1.5"
                        onClick={() => handleResolvePriceRequest('approved')}
                        disabled={resolvingPriceRequest}
                      >
                        {resolvingPriceRequest ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsUp className="h-3.5 w-3.5" />}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => handleResolvePriceRequest('rejected')}
                        disabled={resolvingPriceRequest}
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                        Decline
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                      <Clock className="h-3.5 w-3.5" />
                      Awaiting customer
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            isWorker && myBid?.status === 'accepted' && (
              <Card>
                <CardContent className="p-4">
                  {showPriceForm ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium">Request a different price</p>
                      <Input
                        type="number"
                        placeholder={`New amount (currently ${job.currency} ${job.budget.toLocaleString()})`}
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        className="h-9 text-sm"
                      />
                      <Textarea
                        placeholder="Why does the price need to change? (optional)"
                        value={priceReason}
                        onChange={(e) => setPriceReason(e.target.value)}
                        className="min-h-[60px] text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSubmitPriceRequest}
                          disabled={submittingPriceRequest}
                          className="bg-accent text-accent-foreground hover:bg-accent/90"
                        >
                          {submittingPriceRequest ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Send Request'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowPriceForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs text-muted-foreground">
                        Job needs more (or less) work than the original bid?
                      </p>
                      <Button size="sm" variant="outline" className="gap-1.5 flex-shrink-0" onClick={() => setShowPriceForm(true)}>
                        <PenLine className="h-3.5 w-3.5" />
                        Request Price Change
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          )}
        </>
      )}

      {/* Completion handshake — worker marks done, customer confirms */}
      {job.status === 'in_progress' && (isMyJob || (isWorker && myBid?.status === 'accepted')) && (
        <Card className={job.workerCompletedAt ? 'border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20' : ''}>
          <CardContent className="p-4">
            {isWorker && myBid?.status === 'accepted' && (
              <>
                {job.workerCompletedAt ? (
                  <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                    <Clock className="h-4 w-4" />
                    Marked complete — waiting for the customer to confirm.
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">Finished the work?</p>
                    <Button
                      size="sm"
                      className="bg-emerald-600 text-white hover:bg-emerald-700 gap-1.5"
                      onClick={handleMarkComplete}
                      disabled={marking}
                    >
                      {marking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      Mark Job Complete
                    </Button>
                  </div>
                )}
              </>
            )}

            {isMyJob && (
              <>
                {job.workerCompletedAt ? (
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">The worker marked this job complete.</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Confirm once you're happy with the work
                        {job.paymentMethod === 'wallet' ? ' — this releases payment from your wallet.' : '.'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-emerald-600 text-white hover:bg-emerald-700 gap-1.5 flex-shrink-0"
                      onClick={handleConfirmCompletion}
                      disabled={confirming}
                    >
                      {confirming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      Confirm Completed
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Waiting for the worker to mark this job complete.
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Completed — show confirmation + let the customer leave a review */}
      {job.status === 'completed' && (
        <Card className="border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Job completed{job.completedAt ? ` on ${new Date(job.completedAt).toLocaleDateString()}` : ''}
            </div>

            {isMyJob && job.workerId && (
              myReview ? (
                <p className="text-xs text-muted-foreground">You've already reviewed this worker for this job. Thanks!</p>
              ) : (
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-medium">Rate your experience</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setReviewRating(n)}
                        className="p-0.5"
                        aria-label={`${n} star${n === 1 ? '' : 's'}`}
                      >
                        <Star
                          className={`h-5 w-5 ${n <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`}
                        />
                      </button>
                    ))}
                  </div>
                  <Textarea
                    placeholder="How did it go? (optional)"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="min-h-[70px] text-sm"
                  />
                  <Button
                    size="sm"
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                  >
                    {submittingReview ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Submit Review'}
                  </Button>
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}

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
              <BidCard
                key={bid.id}
                bid={bid}
                jobId={jobId}
                customerId={job.customerId}
                jobStatus={job.status}
                isMyJob={isMyJob}
                showWorkerStats={isMyJob}
                onAccept={() => handleAcceptBid(bid.id)}
                onReject={() => handleRejectBid(bid.id)}
                actionPending={updateBidStatus.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CompletionRateBadge({ rate }: { rate: number }) {
  const color =
    rate >= 80 ? 'text-emerald-600' : rate >= 50 ? 'text-amber-600' : 'text-destructive'
  return (
    <span className={`flex items-center gap-1 ${color}`}>
      <TrendingUp className="h-3 w-3" />
      {rate}% completion
    </span>
  )
}

function BidCard({
  bid,
  jobId,
  customerId,
  jobStatus,
  isMyJob,
  showWorkerStats,
  onAccept,
  onReject,
  actionPending,
}: {
  bid: Bid
  jobId: string
  customerId: string
  jobStatus: Job['status']
  isMyJob: boolean
  showWorkerStats: boolean
  onAccept: () => void
  onReject: () => void
  actionPending: boolean
}) {
  const { user } = useAuth()
  const { data: stats } = useWorkerStats(showWorkerStats ? bid.workerId : undefined)
  const canNegotiate = isMyJob || user?.id === bid.workerId

  return (
    <Card className={bid.status === 'accepted' ? 'border-accent/50' : ''}>
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
              <p className="text-sm font-medium">{bid.workerName || 'Worker'}</p>
              {bid.workerSkills && (
                <p className="text-xs text-muted-foreground">{bid.workerSkills}</p>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-semibold text-sm">{bid.amount.toLocaleString()}</p>
            <Badge
              variant={
                bid.status === 'accepted' ? 'default' : bid.status === 'rejected' ? 'destructive' : 'secondary'
              }
              className="text-[10px] mt-1"
            >
              {bid.status}
            </Badge>
          </div>
        </div>

        {/* Worker track record — shown to the customer deciding who to hire */}
        {showWorkerStats && stats && (
          <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className={`h-3.5 w-3.5 ${stats.reviewCount > 0 ? 'fill-amber-400 text-amber-400' : ''}`} />
              {stats.reviewCount > 0 ? `${stats.avgRating.toFixed(1)} (${stats.reviewCount})` : 'No ratings yet'}
            </span>
            <span>
              {stats.jobsAccepted} accepted · {stats.jobsCompleted} completed
            </span>
            {stats.completionRate !== null && <CompletionRateBadge rate={stats.completionRate} />}
          </div>
        )}

        {bid.message && (
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{bid.message}</p>
        )}

        {/* Customer actions */}
        {isMyJob && bid.status === 'pending' && jobStatus === 'open' && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-border">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={onAccept} disabled={actionPending}>
              <Check className="h-3.5 w-3.5" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-destructive hover:text-destructive"
              onClick={onReject}
              disabled={actionPending}
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </Button>
          </div>
        )}

        {/* Private negotiation thread — only the customer and this specific bidder see it,
            even though the bid amount/message above is visible to everyone viewing the job. */}
        {canNegotiate && bid.status !== 'rejected' && (
          <BidNegotiationChat bidId={bid.id} jobId={jobId} customerId={customerId} workerId={bid.workerId} />
        )}
      </CardContent>
    </Card>
  )
}
