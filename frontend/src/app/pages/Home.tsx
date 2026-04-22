import { Link, Navigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Shield,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user } = useAuth()

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const modules = [
    {
      title: 'Facilities Catalogue',
      description:
        'Search lecture halls, labs, rooms, and equipment with capacity and location filters.',
      status: 'Live',
      icon: Building2,
    },
    {
      title: 'Booking Workflow',
      description:
        'Track requests, approvals, and schedule decisions in one transparent timeline.',
      status: 'Live',
      icon: Calendar,
    },
    {
      title: 'Maintenance Tracking',
      description:
        'Record issue details, monitor progress, and improve facility service turnaround.',
      status: 'Live',
      icon: Wrench,
    },
    {
      title: 'Role Governance',
      description:
        'Protect management actions with role-based controls and clear access boundaries.',
      status: 'Live',
      icon: Shield,
    },
  ]

  const highlights = [
    'Single source of truth for campus assets',
    'Role-aware workflows for users and admins',
    'Designed for fast navigation with low cognitive load',
  ]

  return (
    <div className="min-h-screen overflow-x-clip">
      <nav className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-md">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-4 w-4 text-primary" />
            </span>
            <span className="font-semibold tracking-tight">SCH</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/facilities">
              <Button variant="ghost" size="sm">
                Facilities
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="ghost" size="sm">
                Sign Up
              </Button>
            </Link>
            <Link to="/login">
              <Button size="sm">Sign In</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container relative mx-auto px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <section className="relative mx-auto max-w-6xl">
          <div className="pointer-events-none absolute -left-14 -top-10 h-40 w-40 rounded-full bg-primary/15 blur-3xl sch-pulse-soft" />
          <div className="pointer-events-none absolute -right-8 top-20 h-36 w-36 rounded-full bg-primary/20 blur-3xl sch-float" />
          <div className="pointer-events-none absolute left-1/2 top-10 h-4 w-4 rounded-full bg-primary/60 sch-orbit" />

          <div className="grid gap-8 rounded-3xl border border-border/80 bg-card p-6 shadow-sm md:grid-cols-[1.15fr_0.85fr] md:p-10">
            <div className="space-y-5 sch-reveal">
              <Badge variant="secondary" className="w-fit">
                SCH Platform
              </Badge>
              <h1 className="max-w-xl text-balance">SCH streamlines how campuses manage spaces, assets, and access</h1>
              <p className="max-w-xl text-muted-foreground">
                SCH gives operations teams a focused workspace to discover resources, manage
                availability, and enforce role-aware actions without cluttered workflows.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link to="/signup">
                  <Button size="lg" className="gap-2">
                    Create Account
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg">
                    Sign In
                  </Button>
                </Link>
                <Link to="/facilities">
                  <Button variant="ghost" size="lg">
                    Browse Facilities
                  </Button>
                </Link>
              </div>
              <div className="grid gap-2 pt-2">
                {highlights.map((item, idx) => (
                  <div
                    key={item}
                    className="flex items-start gap-2 text-sm text-muted-foreground sch-reveal"
                    style={{ animationDelay: `${100 + idx * 100}ms` }}
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sch-reveal" style={{ animationDelay: '120ms' }}>
              <Card className="sch-float">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">App name</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">SCH</p>
                </CardContent>
              </Card>
              <Card className="sch-float-delayed">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Live module</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">Facilities</p>
                </CardContent>
              </Card>
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Why teams adopt SCH
                  </CardTitle>
                  <CardDescription>
                    One interface for discovery, access, and operational clarity.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>Reduce duplicated scheduling effort with centralized resource visibility.</p>
                  <p>Keep admin-only actions guarded without slowing down standard users.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-6xl">
          <div className="mb-4 flex items-center justify-between">
            <h2>Platform Modules</h2>
            <Badge variant="secondary">4 live</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {modules.map((module, idx) => (
              <Card
                key={module.title}
                className="sch-reveal transition-shadow hover:shadow-md"
                style={{ animationDelay: `${100 + idx * 90}ms` }}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                      <module.icon className="h-4 w-4 text-primary" />
                    </span>
                    <Badge variant={module.status === 'Live' ? 'default' : 'secondary'}>
                      {module.status}
                    </Badge>
                  </div>
                  <CardTitle>{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
