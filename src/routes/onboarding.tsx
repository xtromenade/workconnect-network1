import { useState, useMemo } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'
import { useAuth } from '@/hooks/useAuth'
import { useCreateProfile } from '@/hooks/useProfile'
import { useCreateSubscription } from '@/hooks/useSubscription'
import { Button, Input, Textarea, Badge } from '@blinkdotnew/ui'
import {
  Briefcase,
  User,
  ArrowRight,
  Loader2,
  Check,
  Globe,
  MapPin,
  Phone,
  FileText,
  Wrench,
  ChevronDown,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { countries, getStatesForCountry, getCitiesForState } from '@/data/locations'

export const Route = createFileRoute('/onboarding')({
  component: OnboardingPage,
})

function OnboardingPage() {
  return (
    <main className="min-h-dvh bg-background flex flex-col">
      <div className="flex items-center gap-2 px-6 h-16 border-b border-border">
        <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary text-primary-foreground">
          <Briefcase className="h-3.5 w-3.5" />
        </div>
        <span className="font-semibold text-sm tracking-tight">WorkConnect</span>
        <span className="text-xs text-muted-foreground ml-2">· Onboarding</span>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <BlinkClientBoundary
          fallback={
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          }
        >
          <OnboardingFlow />
        </BlinkClientBoundary>
      </div>
    </main>
  )
}

function OnboardingFlow() {
  const { user, isLoading } = useAuth()
  const createProfile = useCreateProfile()
  const createSubscription = useCreateSubscription()
  const navigate = useNavigate()

  const [step, setStep] = useState<1 | 2>(1)
  const [role, setRole] = useState<'worker' | 'customer' | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Step 2 fields
  const [displayName, setDisplayName] = useState('')
  const [countryCode, setCountryCode] = useState('NG')
  const [stateName, setStateName] = useState('')
  const [cityName, setCityName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState('')
  const [skillTags, setSkillTags] = useState<string[]>([])

  // Cascading dropdown data
  const states = useMemo(() => getStatesForCountry(countryCode), [countryCode])
  const cities = useMemo(
    () => (stateName ? getCitiesForState(countryCode, stateName) : []),
    [countryCode, stateName],
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) {
    navigate({ to: '/login', replace: true })
    return null
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role || !user) return

    setSubmitting(true)
    try {
      // Build city string: "StateName, CityName" so both fit in the `city` column
      const cityValue = stateName && cityName ? `${stateName}, ${cityName}` : cityName || stateName || ''

      // Create profile
      await createProfile.mutateAsync({
        userId: user.id,
        displayName: displayName || (user.displayName ?? 'User'),
        role,
        country: countryCode,
        city: cityValue,
        latitude: null,
        longitude: null,
        phone,
        bio,
        skills: skillTags.join(', '),
        avatarUrl: '',
        isOnboarded: '1',
      })

      // Create subscription with trial
      await createSubscription.mutateAsync({
        userId: user.id,
        country: countryCode,
        role,
      })

      toast.success('Profile created! Welcome to WorkConnect.')
      navigate({ to: '/dashboard', replace: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create profile'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <span
          className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-semibold ${
            step === 1
              ? 'bg-primary text-primary-foreground'
              : 'bg-accent text-accent-foreground'
          }`}
        >
          {step > 1 ? <Check className="h-4 w-4" /> : '1'}
        </span>
        <div className={`h-px w-10 ${step > 1 ? 'bg-accent' : 'bg-border'}`} />
        <span
          className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-semibold ${
            step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          2
        </span>
      </div>

      {step === 1 && (
        <div className="text-center">
          <h1 className="font-serif text-2xl font-bold tracking-tight mb-2">Choose your role</h1>
          <p className="text-sm text-muted-foreground mb-8">
            This helps us tailor your experience on WorkConnect.
          </p>

          <div className="grid grid-cols-1 gap-4">
            <button
              type="button"
              onClick={() => { setRole('worker'); setStep(2) }}
              className={`flex items-center gap-4 rounded-xl border-2 p-5 text-left transition-all ${
                role === 'worker'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30'
              }`}
            >
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-secondary text-primary shrink-0">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">I&apos;m a Worker</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Find jobs, submit bids, and get paid for your skills.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => { setRole('customer'); setStep(2) }}
              className={`flex items-center gap-4 rounded-xl border-2 p-5 text-left transition-all ${
                role === 'customer'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30'
              }`}
            >
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-secondary text-primary shrink-0">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">I&apos;m a Customer</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Post jobs, review bids, and hire skilled workers.
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-center mb-2">
            Tell us about yourself
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-8">
            {role === 'worker' ? 'Help customers find you.' : 'Set up your profile.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="pl-10"
                required
              />
            </div>

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
                  className="flex h-10 w-full rounded-md border border-input bg-transparent pl-10 pr-8 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                  required
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
                  className="flex h-10 w-full rounded-md border border-input bg-transparent pl-10 pr-8 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                  required
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

            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <select
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-transparent pl-10 pr-8 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                required
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

            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10"
                required
              />
            </div>

            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                placeholder="Short bio about yourself"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="pl-10 min-h-[80px]"
                required
              />
            </div>

            {role === 'worker' && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Skills</label>
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

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
                disabled={submitting || createProfile.isPending}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                Finish
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
