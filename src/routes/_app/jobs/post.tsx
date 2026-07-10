import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useCreateJob } from '@/hooks/useJobs'
import { Button, Input, Textarea } from '@blinkdotnew/ui'
import { Briefcase, Loader2, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting',
  'Cleaning',
  'Tutoring',
  'Delivery',
  'Gardening',
  'IT Support',
  'Other',
]

export const Route = createFileRoute('/_app/jobs/post')({
  component: PostJobPage,
})

function PostJobPage() {
  return (
    <div className="p-6 lg:p-8">
      <BlinkClientBoundary
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        }
      >
        <PostJobContent />
      </BlinkClientBoundary>
    </div>
  )
}

function PostJobContent() {
  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id)
  const createJob = useCreateJob()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [city, setCity] = useState('')
  const [budget, setBudget] = useState('')
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wallet'>('cash')
  const [submitting, setSubmitting] = useState(false)

  if (profile && profile.role !== 'customer') {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <h2 className="font-semibold text-lg mb-2">Workers cannot post jobs</h2>
        <p className="text-sm text-muted-foreground">
          Only customer accounts can post jobs. Switch to a customer account to post.
        </p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSubmitting(true)
    try {
      const job = await createJob.mutateAsync({
        customerId: user.id,
        title,
        description,
        category: category || 'Other',
        city,
        latitude: null,
        longitude: null,
        budget: Number(budget),
        currency,
        status: 'open',
        acceptedBidId: null,
        workerId: null,
        paymentMethod,
      })
      toast.success('Job posted successfully!')
      navigate({ to: '/app/jobs/$jobId', params: { jobId: job.id } })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to post job'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <button
        type="button"
        onClick={() => navigate({ to: '/app/jobs' })}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to jobs
      </button>

      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">Post a Job</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Describe what you need done and skilled workers will bid.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Job title (e.g. Fix leaking pipe)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Textarea
          placeholder="Describe the job in detail — requirements, timeline, etc."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[120px]"
          required
        />

        <div>
          <label className="text-sm font-medium mb-1.5 block">Category</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`text-xs rounded-md border px-3 py-2 text-center transition-colors ${
                  category === cat
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border hover:border-primary/30 text-muted-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <Input
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Budget</label>
            <Input
              type="number"
              placeholder="Amount"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              required
              min="1"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Currency</label>
            <div className="flex rounded-md border border-input overflow-hidden">
              <button
                type="button"
                onClick={() => setCurrency('NGN')}
                className={`flex-1 text-xs py-2 transition-colors ${
                  currency === 'NGN' ? 'bg-primary text-primary-foreground' : 'bg-background'
                }`}
              >
                NGN
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`flex-1 text-xs py-2 transition-colors ${
                  currency === 'USD' ? 'bg-primary text-primary-foreground' : 'bg-background'
                }`}
              >
                USD
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Payment Method</label>
          <div className="flex rounded-md border border-input overflow-hidden">
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`flex-1 text-xs py-2 transition-colors ${
                paymentMethod === 'cash' ? 'bg-primary text-primary-foreground' : 'bg-background'
              }`}
            >
              Cash
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('wallet')}
              className={`flex-1 text-xs py-2 transition-colors ${
                paymentMethod === 'wallet' ? 'bg-primary text-primary-foreground' : 'bg-background'
              }`}
            >
              Wallet
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
          disabled={submitting || createJob.isPending}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Briefcase className="h-4 w-4" />}
          Post Job
        </Button>
      </form>
    </div>
  )
}
