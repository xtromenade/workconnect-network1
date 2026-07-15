import { createFileRoute, Link } from '@tanstack/react-router'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useJobs, useMyJobs } from '@/hooks/useJobs'
import { useMyBids } from '@/hooks/useBids'
import { Button, Card, CardContent, Badge } from '@blinkdotnew/ui'
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Plus,
  Loader2,
  Clock,
  CheckCircle2,
  DollarSign,
  TrendingUp,
} from 'lucide-react'

export const Route = createFileRoute('/_app/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <div className="p-6 lg:p-8">
      <BlinkClientBoundary
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        }
      >
        <DashboardContent />
      </BlinkClientBoundary>
    </div>
  )
}

function DashboardContent() {
  const { user, isLoading: authLoading } = useAuth()
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id)
  const { data: allJobs, isLoading: jobsLoading } = useJobs({ status: 'open' })
  const { data: myJobs, isLoading: myJobsLoading } = useMyJobs(user?.id)
  const { data: myBids, isLoading: bidsLoading } = useMyBids(user?.id)

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Please complete onboarding first.</p>
      </div>
    )
  }

  const isWorker = profile.role === 'worker'
  const isCustomer = profile.role === 'customer'

  // Safe arrays
  const jobs = Array.isArray(allJobs) ? allJobs : []
  const myJobList = Array.isArray(myJobs) ? myJobs : []
  const bidList = Array.isArray(myBids) ? myBids : []

  // Worker stats
  const bidsSubmitted = bidList.length
  const activeJobs = bidList.filter((b) => b.status === 'accepted').length
  const pendingBids = bidList.filter((b) => b.status === 'pending').length

  // Customer stats
  const jobsPosted = myJobList.length
  const hiredCount = myJobList.filter((j) => j.acceptedBidId).length
  const openJobsCount = myJobList.filter((j) => j.status === 'open').length

  return (
    <div className="space-y-8">
      {/* ── Welcome ─────────────────────────────────── */}
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">
          Welcome back, {profile.displayName || user.displayName || 'User'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isWorker ? 'Find your next job opportunity.' : 'Manage your jobs and hires.'}
        </p>
      </div>

      {/* ── Stats cards ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isWorker && (
          <>
            <StatCard
              icon={<FileText className="h-4 w-4" />}
              label="Bids Submitted"
              value={bidsSubmitted}
              loading={bidsLoading}
            />
            <StatCard
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Active Jobs"
              value={activeJobs}
              loading={bidsLoading}
            />
            <StatCard
              icon={<Clock className="h-4 w-4" />}
              label="Pending Bids"
              value={pendingBids}
              loading={bidsLoading}
            />
            <StatCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Available Jobs"
              value={jobs.length}
              loading={jobsLoading}
            />
          </>
        )}
        {isCustomer && (
          <>
            <StatCard
              icon={<Briefcase className="h-4 w-4" />}
              label="Jobs Posted"
              value={jobsPosted}
              loading={myJobsLoading}
            />
            <StatCard
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Hires Made"
              value={hiredCount}
              loading={myJobsLoading}
            />
            <StatCard
              icon={<Clock className="h-4 w-4" />}
              label="Open Jobs"
              value={openJobsCount}
              loading={myJobsLoading}
            />
            <StatCard
              icon={<DollarSign className="h-4 w-4" />}
              label="Active Workers"
              value={hiredCount}
              loading={myJobsLoading}
            />
          </>
        )}
      </div>

      {/* ── Main content ────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Worker: Recent open jobs they can bid on */}
        {isWorker && (
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-base">Recent Open Jobs</h2>
              <Link to="/jobs">
                <Button variant="ghost" size="sm">
                  Browse All
                </Button>
              </Link>
            </div>
            {jobsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : jobs.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <Briefcase className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No open jobs available right now.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Check back later for new opportunities.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {jobs.slice(0, 5).map((job) => (
                  <Link
                    key={job.id}
                    to="/jobs/$jobId"
                    params={{ jobId: job.id }}
                    className="block"
                  >
                    <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-medium text-sm truncate">{job.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {job.description}
                            </p>
                          </div>
                          <Badge variant="secondary" className="shrink-0">
                            {job.currency} {job.budget.toLocaleString()}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                          <span>{job.category}</span>
                          <span>·</span>
                          <span>{job.city}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {/* Active jobs (where bid was accepted) */}
            {bidList.filter((b) => b.status === 'accepted').length > 0 && (
              <div className="mt-8 space-y-4">
                <h2 className="font-semibold text-base">Your Active Jobs</h2>
                <div className="space-y-3">
                  {bidList
                    .filter((b) => b.status === 'accepted')
                    .map((bid) => (
                      <Link
                        key={bid.id}
                        to="/jobs/$jobId"
                        params={{ jobId: bid.jobId }}
                        className="block"
                      >
                        <Card className="hover:shadow-sm transition-shadow border-l-4 border-l-accent cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium text-sm">Job #{bid.jobId.slice(0, 8)}</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Your bid: {bid.amount.toLocaleString()} — Accepted
                                </p>
                              </div>
                              <Badge className="bg-accent text-accent-foreground">Active</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Customer: Quick post + recent jobs */}
        {isCustomer && (
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-base">Your Recent Jobs</h2>
              <Link to="/jobs/post">
                <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Post a Job
                </Button>
              </Link>
            </div>
            {myJobsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : myJobList.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <Briefcase className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">You haven&apos;t posted any jobs yet.</p>
                  <Link to="/jobs/post">
                    <Button size="sm" className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5">
                      <Plus className="h-3.5 w-3.5" />
                      Post Your First Job
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {myJobList.map((job) => (
                  <Link
                    key={job.id}
                    to="/jobs/$jobId"
                    params={{ jobId: job.id }}
                    className="block"
                  >
                    <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-medium text-sm truncate">{job.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {job.description}
                            </p>
                          </div>
                          <Badge
                            variant={
                              job.status === 'open'
                                ? 'default'
                                : job.status === 'in_progress'
                                  ? 'secondary'
                                  : 'outline'
                            }
                            className="shrink-0"
                          >
                            {job.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                          <span>{job.category}</span>
                          <span>·</span>
                          <span>
                            {job.currency} {job.budget.toLocaleString()}
                          </span>
                          <span>·</span>
                          <span>{job.city}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Sidebar quick links ───────────────────── */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm">Quick Actions</h3>
              {isWorker && (
                <>
                  <Link to="/jobs" className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                      <Briefcase className="h-3.5 w-3.5" />
                      Browse All Jobs
                    </Button>
                  </Link>
                  <Link to="/messages" className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                      <FileText className="h-3.5 w-3.5" />
                      Messages
                    </Button>
                  </Link>
                </>
              )}
              {isCustomer && (
                <>
                  <Link to="/app/jobs/post" className="block">
                    <Button className="w-full justify-start gap-2 bg-accent text-accent-foreground hover:bg-accent/90" size="sm">
                      <Plus className="h-3.5 w-3.5" />
                      Post a New Job
                    </Button>
                  </Link>
                  <Link to="/jobs" className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                      <Briefcase className="h-3.5 w-3.5" />
                      Browse Workers
                    </Button>
                  </Link>
                </>
              )}
              <Link to="/wallet" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <DollarSign className="h-3.5 w-3.5" />
                  View Wallet
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode
  label: string
  value: number
  loading?: boolean
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          {icon}
          <span className="text-xs font-medium">{label}</span>
        </div>
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <p className="text-2xl font-bold tracking-tight">{value}</p>
        )}
      </CardContent>
    </Card>
  )
}
