import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import {
  Building2,
  Calendar,
  Wrench,
  Shield,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '@/api/client'
import type { DashboardSummaryResponse } from '@/api/dashboard'

export default function Dashboard() {
  const { user, isAdmin, isStudent, isTeacher } = useAuth()
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const data = await apiFetch<DashboardSummaryResponse>('/api/v1/dashboard/summary')
        if (!cancelled) {
          setSummary(data)
          setSummaryError(null)
        }
      } catch (e) {
        if (!cancelled) {
          setSummaryError(e instanceof Error ? e.message : 'Failed to load dashboard summary')
          setSummary(null)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user])

  type ModuleStatus = 'available' | 'coming-soon'

  const modules = [
    {
      id: 'A',
      title: 'Facilities & Assets',
      description: 'Browse and manage campus resources with filters and detailed status.',
      icon: Building2,
      status: 'available' as ModuleStatus,
      link: '/facilities',
    },
    {
      id: 'B',
      title: 'Booking Management',
      description: 'Submit and track booking requests with approval workflows.',
      icon: Calendar,
      status: 'available' as ModuleStatus,
      link: '/bookings',
    },
    {
      id: 'C',
      title: 'Maintenance & Tickets',
      description: 'Report issues and monitor progress for maintenance tasks.',
      icon: Wrench,
      status: (isAdmin || isStudent || isTeacher ? 'available' : 'coming-soon') as ModuleStatus,
      link: '/tickets',
    },
    ...(isAdmin
      ? [
          {
            id: 'D',
            title: 'Access Control',
            description: 'Centralize authentication and role governance across modules.',
            icon: Shield,
            status: 'available' as ModuleStatus,
            link: '/admin/users',
          },
        ]
      : []),
  ]

  const stats = useMemo(
    () => [
      {
        label: 'Active facilities',
        value: summary ? String(summary.activeFacilitiesCount) : '--',
        note: summary ? `Current month: ${summary.currentMonthLabel}` : 'Loading month...',
      },
      {
        label: 'Your bookings',
        value: summary ? String(summary.myBookingsCount) : '--',
        note: 'Total bookings you have submitted',
      },
      {
        label: 'Open tickets',
        value: summary ? String(summary.openTicketsCount) : '--',
        note: 'Total tickets linked to your account',
      },
    ],
    [summary],
  )

  const liveModules = modules.filter((m) => m.status === 'available').length

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <h1>Welcome, {user.username}</h1>
              <p className="text-muted-foreground">
                {isAdmin
                  ? 'Administrator access enabled.'
                  : isTeacher
                    ? 'Teacher access enabled.'
                    : 'Student access enabled.'}
              </p>
              <p className="max-w-2xl text-sm text-muted-foreground">
                {isAdmin
                  ? 'You can create, edit, and remove resources, review all statuses, and approve bookings.'
                  : isTeacher
                    ? 'You can browse resources, submit booking requests, and handle assigned tickets.'
                    : 'You can browse resources, submit booking requests, and manage your tickets.'}
              </p>
            </div>
            <Badge variant={isAdmin ? 'default' : 'secondary'} className="w-fit">
              {isAdmin ? 'Admin session' : isTeacher ? 'Teacher session' : 'Student session'}
            </Badge>
          </div>
          {summaryError && (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {summaryError}
            </p>
          )}
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.note}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2>Platform Modules</h2>
            <Badge variant="secondary">
              {liveModules} of {modules.length} live
            </Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => {
              const isAvailable = module.status === 'available'
              const card = (
                <Card
                  className={
                    isAvailable
                      ? 'transition-shadow hover:shadow-md'
                      : 'opacity-80'
                  }
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                        <module.icon className="h-4 w-4 text-primary" />
                      </span>
                      <Badge variant={isAvailable ? 'default' : 'secondary'}>
                        {isAvailable ? 'Available' : 'Coming soon'}
                      </Badge>
                    </div>
                    <CardTitle>
                      {module.title}
                    </CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isAvailable ? (
                      <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                        Open module
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    ) : (
                      <Button disabled variant="outline" size="sm" className="w-full">
                        Under development
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )

              if (isAvailable) {
                return (
                  <Link
                    key={module.id}
                    to={module.link}
                    className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {card}
                  </Link>
                )
              }
              return <div key={module.id}>{card}</div>
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
