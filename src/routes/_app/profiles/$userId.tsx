import { createFileRoute, useParams } from '@tanstack/react-router'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'
import { useProfile } from '@/hooks/useProfile'
import { useReviews } from '@/hooks/useReviews'
import { Card, CardContent, Avatar, AvatarFallback, Badge, Button } from '@blinkdotnew/ui'
import {
  MapPin,
  Star,
  Loader2,
  User,
  MessageSquare,
  Briefcase,
  Clock,
} from 'lucide-react'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/_app/profiles/$userId')({
  component: ProfilePage,
})

function ProfilePage() {
  return (
    <div className="p-6 lg:p-8">
      <BlinkClientBoundary
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        }
      >
        <ProfileContent />
      </BlinkClientBoundary>
    </div>
  )
}

function ProfileContent() {
  const { userId } = useParams({ from: '/_app/profiles/$userId' })
  const { data: profile, isLoading: profileLoading } = useProfile(userId)
  const { data: reviews, isLoading: reviewsLoading } = useReviews(userId)

  const reviewList = Array.isArray(reviews) ? reviews : []

  const isLoading = profileLoading || reviewsLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <div className="flex items-center justify-center h-14 w-14 rounded-full bg-muted mx-auto mb-4">
            <User className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="font-semibold text-lg mb-2">Profile not found</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            This profile does not exist or has been removed.
          </p>
        </CardContent>
      </Card>
    )
  }

  const initials = profile.displayName
    ? profile.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??'

  const skills = profile.skills
    ? profile.skills.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  const averageRating =
    reviewList.length > 0
      ? reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length
      : 0

  const displayRating = Math.round(averageRating * 10) / 10

  const handleContact = () => {
    toast.success(`Message feature coming soon — you'll be able to contact ${profile.displayName || 'this worker'} directly.`)
  }

  return (
    <div className="max-w-3xl space-y-8">
      {/* ── Profile header ──────────────────────── */}
      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 shrink-0">
              <AvatarFallback className="text-2xl sm:text-3xl bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="font-serif text-2xl font-bold tracking-tight">
                  {profile.displayName || 'Unnamed Worker'}
                </h1>
                <Badge variant={profile.role === 'worker' ? 'default' : 'secondary'}>
                  {profile.role === 'worker' ? 'Worker' : 'Customer'}
                </Badge>
              </div>

              {/* Location */}
              {(profile.city || profile.country) && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>
                    {[profile.city, profile.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}

              {/* Rating */}
              {reviewList.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.round(averageRating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-muted-foreground/30'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{displayRating}</span>
                  <span className="text-xs text-muted-foreground">
                    ({reviewList.length} {reviewList.length === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}

              {/* Contact button */}
              <Button
                onClick={handleContact}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Contact
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Bio ─────────────────────────────────── */}
      {profile.bio && (
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              About
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {profile.bio}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Skills ──────────────────────────────── */}
      {skills.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Reviews ─────────────────────────────── */}
      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Star className="h-4 w-4 text-muted-foreground" />
            Reviews {reviewList.length > 0 && `(${reviewList.length})`}
          </h2>

          {reviewList.length === 0 ? (
            <div className="text-center py-8">
              <Star className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No reviews yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviewList.map((review) => (
                <div
                  key={review.id}
                  className="border-b border-border pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3.5 w-3.5 ${
                            star <= review.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
