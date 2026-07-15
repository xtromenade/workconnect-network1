import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'
import { useAuth } from '@/hooks/useAuth'
import { blink } from '@/blink/client'
import { useQuery } from '@tanstack/react-query'
import type { Profile, Review } from '@/types'
import {
  Input,
  Avatar,
  AvatarFallback,
  Badge,
  Card,
  CardContent,
} from '@blinkdotnew/ui'
import { Search, MapPin, Star, Loader2, Users } from 'lucide-react'

export const Route = createFileRoute('/_app/workers/')({
  component: WorkersPage,
})

const profilesTable = () => blink.db.table<Profile>('profiles')
const reviewsTable = () => blink.db.table<Review>('reviews')

function useWorkers(filters?: { skill?: string; city?: string }) {
  return useQuery({
    queryKey: ['workers', filters],
    queryFn: async () => {
      const where: Record<string, string> = { role: 'worker' }
      if (filters?.city) where.city = filters.city

      const profiles = await profilesTable().list({
        where,
        orderBy: { createdAt: 'desc' },
      })

      // Enrich with average rating
      const enriched = await Promise.all(
        profiles.map(async (p) => {
          const revs = await reviewsTable().list({
            where: { reviewedUserId: p.userId },
          })
          const avgRating =
            revs.length > 0
              ? revs.reduce((sum, r) => sum + r.rating, 0) / revs.length
              : 0
          return { ...p, avgRating, reviewCount: revs.length }
        }),
      )

      // Filter by skill client-side (since skills is a comma-separated string)
      if (filters?.skill) {
        const skillLower = filters.skill.toLowerCase()
        return enriched.filter((p) =>
          p.skills.toLowerCase().includes(skillLower),
        )
      }

      return enriched
    },
  })
}

function WorkersPage() {
  return (
    <div className="p-6 lg:p-8">
      <BlinkClientBoundary
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        }
      >
        <WorkersContent />
      </BlinkClientBoundary>
    </div>
  )
}

function WorkersContent() {
  const { user } = useAuth()
  const [skillFilter, setSkillFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')

  const filters: Record<string, string> = {}
  if (skillFilter) filters.skill = skillFilter
  if (cityFilter) filters.city = cityFilter

  const { data: workers, isLoading } = useWorkers(
    Object.keys(filters).length > 0 ? filters : undefined,
  )
  const workerList = Array.isArray(workers) ? workers : []

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────── */}
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">
          Browse Workers
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Find skilled artisans for your next project.
        </p>
      </div>

      {/* ── Filters ────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by skill (e.g. plumbing)..."
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="relative flex-1 sm:max-w-[200px]">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by city..."
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* ── Worker grid ────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : workerList.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-base mb-1">No workers found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {skillFilter || cityFilter
                ? 'Try adjusting your filters to see more results.'
                : 'There are no workers registered yet. Check back soon!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workerList.map((worker) => {
            const initials = worker.displayName
              ? worker.displayName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : '??'

            const skills = worker.skills
              ? worker.skills.split(',').map((s) => s.trim()).filter(Boolean)
              : []

            return (
              <Link
                key={worker.id}
                to="/profiles/$userId"
                params={{ userId: worker.userId }}
                className="block group"
              >
                <Card className="h-full hover:shadow-md transition-all border-border hover:border-primary/30 cursor-pointer">
                  <CardContent className="p-5 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="text-sm bg-primary/10 text-primary font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm leading-snug truncate group-hover:text-primary transition-colors">
                          {worker.displayName || 'Unnamed Worker'}
                        </h3>
                        {(worker as Profile & { avgRating: number; reviewCount: number }).avgRating > 0 && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-medium">
                              {Math.round(
                                (worker as Profile & { avgRating: number; reviewCount: number }).avgRating * 10,
                              ) / 10}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              ({(worker as Profile & { avgRating: number; reviewCount: number }).reviewCount})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* City */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {[worker.city, worker.country]
                          .filter(Boolean)
                          .join(', ') || 'Unknown location'}
                      </span>
                    </div>

                    {/* Skills */}
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-auto pt-3 border-t border-border">
                        {skills.slice(0, 3).map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="text-[10px] px-2 py-0"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {skills.length > 3 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-2 py-0"
                          >
                            +{skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
