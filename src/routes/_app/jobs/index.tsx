import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useJobs } from '@/hooks/useJobs'
import { Input, Button, Badge, Card, CardContent } from '@blinkdotnew/ui'
import { Search, MapPin, Briefcase, Loader2, Filter } from 'lucide-react'

export const Route = createFileRoute('/_app/jobs/')({
  component: JobsPage,
})

function JobsPage() {
  return (
    <div className="p-6 lg:p-8">
      <BlinkClientBoundary
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        }
      >
        <JobsContent />
      </BlinkClientBoundary>
    </div>
  )
}

function JobsContent() {
  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id)
  const [cityFilter, setCityFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const filters: Record<string, string> = { status: 'open' }
  if (cityFilter) filters.city = cityFilter
  if (categoryFilter) filters.category = categoryFilter

  const { data: jobs, isLoading } = useJobs(filters)
  const jobList = Array.isArray(jobs) ? jobs : []
  const isCustomer = profile?.role === 'customer'

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">Browse Jobs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Find the perfect opportunity for your skills.
          </p>
        </div>
        {isCustomer && (
          <Link to="/jobs/post">
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5">
              <Briefcase className="h-4 w-4" />
              Post a Job
            </Button>
          </Link>
        )}
      </div>

      {/* ── Filters ────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by city..."
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="relative flex-1 sm:max-w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Category..."
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* ── Job list ───────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : jobList.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-base mb-1">No jobs found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {cityFilter || categoryFilter
                ? 'Try adjusting your filters to see more results.'
                : 'There are no open jobs right now. Check back soon!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobList.map((job) => (
            <Link
              key={job.id}
              to="/jobs/$jobId"
              params={{ jobId: job.id }}
              className="block group"
            >
              <Card className="h-full hover:shadow-md transition-all border-border hover:border-primary/30 cursor-pointer">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors">
                      {job.title}
                    </h3>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {job.currency} {job.budget.toLocaleString()}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 flex-1 mb-3">
                    {job.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground border-t border-border pt-3 mt-auto">
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {job.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {job.city}
                    </span>
                  </div>
                  {job.customerName && (
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Posted by {job.customerName}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
