import { useState, useMemo, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'
import { useAuth } from '@/hooks/useAuth'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import { useSwitchRole } from '@/hooks/useSubscription'
import { Button, Input, Textarea, Badge, Card, CardContent, Avatar, AvatarFallback } from '@blinkdotnew/ui'
import {
  Globe,
  MapPin,
  Phone,
  FileText,
  Wrench,
  Loader2,
  Save,
  ChevronDown,
  User,
  Repeat,
  MailWarning,
  MailCheck,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { countries, getStatesForCountry, getCitiesForState } from '@/data/locations'

export const Route = createFileRoute('/_app/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <div className="p-6 lg:p-8">
      <BlinkClientBoundary
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        }
      >
        <SettingsContent />
      </BlinkClientBoundary>
    </div>
  )
}

function SettingsContent() {
  const { user, isLoading: authLoading, resendVerificationEmail } = useAuth()
  const navigate = useNavigate()
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id)
  const updateProfile = useUpdateProfile()
  const switchRole = useSwitchRole()
  const [switchingRole, setSwitchingRole] = useState(false)
  const [resendingVerification, setResendingVerification] = useState(false)

  // Parse stored city into state + city parts
  const parseStoredCity = (city: string): { state: string; city: string } => {
    if (!city) return { state: '', city: '' }
    const commaIdx = city.indexOf(', ')
    if (commaIdx > 0) {
      return { state: city.slice(0, commaIdx), city: city.slice(commaIdx + 2) }
    }
    return { state: '', city }
  }

  const [displayName, setDisplayName] = useState('')
  const [countryCode, setCountryCode] = useState('NG')
  const [stateName, setStateName] = useState('')
  const [cityName, setCityName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState('')
  const [skillTags, setSkillTags] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  // Populate fields when profile loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? '')
      setCountryCode(profile.country || 'NG')
      const parsed = parseStoredCity(profile.city ?? '')
      setStateName(parsed.state)
      setCityName(parsed.city)
      setPhone(profile.phone ?? '')
      setBio(profile.bio ?? '')
      setSkillTags(profile.skills ? profile.skills.split(',').map((s) => s.trim()).filter(Boolean) : [])
    }
  }, [profile])

  // Cascading dropdown data
  const states = useMemo(() => getStatesForCountry(countryCode), [countryCode])
  const cities = useMemo(
    () => (stateName ? getCitiesForState(countryCode, stateName) : []),
    [countryCode, stateName],
  )

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Unable to load profile.</p>
      </div>
    )
  }

  const userName = user.displayName ?? user.email?.split('@')[0] ?? 'User'
  const userEmail = user.email ?? ''

  const addSkill = () => {
    const trimmed = skills.trim()
    if (trimmed && !skillTags.includes(trimmed)) {
      setSkillTags((prev) => [...prev, trimmed])
      setSkills('')
    }
  }

  const removeSkill = (tag: string) => {
    setSkillTags((prev) => prev.filter((t) => t !== tag))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const cityValue = stateName && cityName ? `${stateName}, ${cityName}` : cityName || stateName || ''

      await updateProfile.mutateAsync({
        id: profile.id,
        userId: user.id,
        displayName: displayName || userName,
        country: countryCode,
        city: cityValue,
        phone,
        bio,
        skills: skillTags.join(', '),
      })

      toast.success('Profile updated successfully.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const isWorker = profile.role === 'worker'

  const handleSwitchRole = async () => {
    const newRole: 'worker' | 'customer' = isWorker ? 'customer' : 'worker'
    setSwitchingRole(true)
    try {
      await switchRole.mutateAsync({ userId: user.id, country: profile.country, role: newRole })
      await updateProfile.mutateAsync({ id: profile.id, userId: user.id, role: newRole })
      toast.success(
        newRole === 'worker'
          ? "You're now set up as a worker."
          : "You're now set up as a customer.",
      )
      // Role affects nearly every page (dashboard, jobs visibility, etc.) — a full
      // navigation is the simplest way to make sure everything reflects the switch.
      navigate({ to: '/dashboard' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to switch account type'
      toast.error(message)
    } finally {
      setSwitchingRole(false)
    }
  }

  const handleResendVerification = async () => {
    setResendingVerification(true)
    try {
      const result = await resendVerificationEmail()
      if (result.alreadyVerified) {
        toast.success('Your email is already verified.')
      } else {
        toast.success('Verification email sent — check your inbox.')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resend verification email'
      toast.error(message)
    } finally {
      setResendingVerification(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* ── Header ─────────────────────────────────── */}
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your profile and account preferences.
        </p>
      </div>

      {/* ── Profile card (read-only info) ──────────── */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {userName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-base">{profile.displayName || userName}</h2>
              <p className="text-sm text-muted-foreground">{userEmail}</p>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                {profile.role} · {profile.country}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Email verification ─────────────────────── */}
      {!user.emailVerified && (
        <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <MailWarning className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Verify your email</p>
                <p className="text-xs text-muted-foreground">
                  Check {userEmail} for a verification link.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleResendVerification}
              disabled={resendingVerification}
              className="flex-shrink-0"
            >
              {resendingVerification ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Resend'}
            </Button>
          </CardContent>
        </Card>
      )}
      {user.emailVerified && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
          <MailCheck className="h-3.5 w-3.5 text-emerald-500" />
          Email verified
        </div>
      )}

      {/* ── Account type ───────────────────────────── */}
      <Card>
        <CardContent className="p-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-1">
              Account type
            </h2>
            <p className="text-sm">
              You're currently set up as a <span className="font-medium capitalize">{profile.role}</span>.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Switch anytime — your {isWorker ? 'customer' : 'worker'} profile and trial
              (if you have one) will be waiting when you switch back.
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2 flex-shrink-0"
            onClick={handleSwitchRole}
            disabled={switchingRole}
          >
            {switchingRole ? <Loader2 className="h-4 w-4 animate-spin" /> : <Repeat className="h-4 w-4" />}
            Switch to {isWorker ? 'Customer' : 'Worker'}
          </Button>
        </CardContent>
      </Card>

      {/* ── Edit form ──────────────────────────────── */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSave} className="space-y-5">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Profile Details
            </h2>

            {/* Display name */}
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                placeholder="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="pl-10"
                required
              />
            </div>

            {/* Country + State row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <select
                  value={countryCode}
                  onChange={(e) => {
                    setCountryCode(e.target.value)
                    setStateName('')
                    setCityName('')
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent pl-10 pr-8 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <select
                  value={stateName}
                  onChange={(e) => {
                    setStateName(e.target.value)
                    setCityName('')
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent pl-10 pr-8 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                  disabled={states.length === 0}
                >
                  <option value="">State / Province</option>
                  {states.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* City */}
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <select
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-transparent pl-10 pr-8 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                disabled={cities.length === 0}
              >
                <option value="">City</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>

            {/* Phone */}
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Bio */}
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Textarea
                placeholder="Short bio about yourself"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="pl-10 min-h-[80px]"
              />
            </div>

            {/* Skills (workers only) */}
            {isWorker && (
              <div>
                <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                  Skills
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a skill (e.g. Plumbing)"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addSkill()
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addSkill}>
                    Add
                  </Button>
                </div>
                {skillTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {skillTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeSkill(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Save button */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
                disabled={saving || updateProfile.isPending}
              >
                {saving || updateProfile.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
