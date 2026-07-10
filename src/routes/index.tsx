import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@blinkdotnew/ui'
import {
  Briefcase,
  ShieldCheck,
  MessageCircle,
  CreditCard,
  ArrowRight,
  CheckCircle,
} from 'lucide-react'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'WorkConnect Network — Find Work, Hire Talent' },
      {
        name: 'description',
        content:
          'WorkConnect connects skilled workers with customers across Nigeria. Find jobs, hire talent, and get work done.',
      },
    ],
  }),
  component: Home,
})

function Home() {
  return (
    <main className="min-h-dvh bg-background">
      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 lg:px-12 h-16 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary text-primary-foreground">
            <Briefcase className="h-4 w-4" />
          </div>
          <span className="font-semibold text-lg tracking-tight">WorkConnect</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link to="/login">
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      <BlinkClientBoundary
        fallback={
          <div className="flex items-center justify-center min-h-[calc(100dvh-4rem)]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        }
      >
        <HomeContent />
      </BlinkClientBoundary>
    </main>
  )
}

function HomeContent() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (user) {
    navigate({ to: '/app/dashboard', replace: true })
    return null
  }

  return (
    <>
      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 lg:px-12 py-20 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(151_55%_25%/0.08),transparent_50%),radial-gradient(ellipse_at_bottom_left,hsl(24_95%_53%/0.06),transparent_50%)]" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Now available across Nigeria
          </div>
          <h1 className="font-serif text-4xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
            Find Work.
            <br />
            <span className="text-primary">Hire Talent.</span>
            <br />
            Build Together.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            WorkConnect connects skilled Nigerian workers with customers who need jobs done.
            Post a job or find your next opportunity — all in one place.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/login">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 px-8">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="gap-2">
                I&apos;m a Worker
                <Briefcase className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────── */}
      <section className="px-6 lg:px-12 py-16 lg:py-24 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center font-serif text-3xl lg:text-4xl font-bold tracking-tight mb-4">
            Everything you need to work and hire
          </h2>
          <p className="text-center text-muted-foreground max-w-lg mx-auto mb-12">
            A complete platform to connect, communicate, and transact securely.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Briefcase className="h-5 w-5" />,
                title: 'Post & Find Jobs',
                desc: 'Customers post jobs; workers browse and bid. Simple and transparent.',
              },
              {
                icon: <MessageCircle className="h-5 w-5" />,
                title: 'In-App Messaging',
                desc: 'Chat directly with workers or customers within each job. No need for WhatsApp.',
              },
              {
                icon: <CreditCard className="h-5 w-5" />,
                title: 'Secure Payments',
                desc: 'Wallet system with NGN and USD support. Pay or get paid safely.',
              },
              {
                icon: <ShieldCheck className="h-5 w-5" />,
                title: 'Verified Profiles',
                desc: 'Every profile is reviewed. Reviews and ratings build trust in the community.',
              },
            ].map((feat) => (
              <div
                key={feat.title}
                className="rounded-xl border border-border bg-card p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-secondary text-primary mb-4">
                  {feat.icon}
                </div>
                <h3 className="font-semibold text-sm mb-1">{feat.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────── */}
      <section className="px-6 lg:px-12 py-16 lg:py-24 bg-secondary/50 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center font-serif text-3xl lg:text-4xl font-bold tracking-tight mb-12">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create your profile',
                desc: 'Sign up, choose your role, and tell us about yourself. Free trial included.',
              },
              {
                step: '02',
                title: 'Post or find jobs',
                desc: 'Customers post jobs with budgets. Workers browse, bid, and get hired.',
              },
              {
                step: '03',
                title: 'Work & get paid',
                desc: 'Chat in-app, complete the job, leave a review, and get paid through our wallet.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground text-lg font-bold mb-4">
                  {item.step}
                </span>
                <h3 className="font-semibold text-base mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="px-6 lg:px-12 py-16 lg:py-24 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold tracking-tight mb-4">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of workers and customers already on WorkConnect.
          </p>
          <Link to="/login">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 px-8">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="border-t border-border px-6 lg:px-12 py-8 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} WorkConnect Network. All rights reserved.
      </footer>
    </>
  )
}
