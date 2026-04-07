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
import { Button, buttonVariants } from '../components/ui/button'
import { cn } from '../components/ui/utils'
import {
  Building2,
  Calendar,
  Wrench,
  Bell,
  Shield,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user, isAdmin } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const modules = [
    {
      id: 'A',
      title: 'Facilities & Assets',
      description:
        'Browse and book lecture halls, labs, meeting rooms, and equipment across campus.',
      icon: Building2,
      status: 'available' as const,
      link: '/facilities',
      color: 'from-[#7286a0] to-[#a3bfa8]',
      iconBg: 'bg-[#7286a0]/10',
      iconColor: 'text-[#7286a0]',
      features: ['Search & Filter', 'Real-time Availability', 'Instant Booking'],
    },
    {
      id: 'B',
      title: 'Booking Management',
      description:
        'Submit and track booking requests with automated approval workflows.',
      icon: Calendar,
      status: 'coming-soon' as const,
      link: '#',
      color: 'from-[#cde7b0] to-[#a3bfa8]',
      iconBg: 'bg-[#cde7b0]/20',
      iconColor: 'text-[#59594a]',
      features: ['Request Tracking', 'Approval Workflow', 'Conflict Detection'],
    },
    {
      id: 'C',
      title: 'Maintenance & Tickets',
      description: 'Report issues, track repairs, and communicate with technicians.',
      icon: Wrench,
      status: 'coming-soon' as const,
      link: '#',
      color: 'from-[#be6e46] to-[#7286a0]',
      iconBg: 'bg-[#be6e46]/10',
      iconColor: 'text-[#be6e46]',
      features: ['Issue Reporting', 'Photo Attachments', 'Status Updates'],
    },
    {
      id: 'D',
      title: 'Notifications',
      description: 'Stay updated with real-time alerts for bookings and maintenance.',
      icon: Bell,
      status: 'coming-soon' as const,
      link: '#',
      color: 'from-[#a3bfa8] to-[#cde7b0]',
      iconBg: 'bg-[#a3bfa8]/10',
      iconColor: 'text-[#a3bfa8]',
      features: ['Real-time Alerts', 'Email Digest', 'Push Notifications'],
    },
    {
      id: 'E',
      title: 'Access Control',
      description: 'Secure authentication with role-based permissions and audit logs.',
      icon: Shield,
      status: 'coming-soon' as const,
      link: '#',
      color: 'from-[#59594a] to-[#7286a0]',
      iconBg: 'bg-[#59594a]/10',
      iconColor: 'text-[#59594a]',
      features: ['OAuth 2.0', 'Role Management', 'Activity Logs'],
    },
  ]

  const stats = [
    { label: 'Active Facilities', value: '24', change: '+3 this month' },
    { label: 'Your Bookings', value: '5', change: '2 upcoming' },
    { label: 'Open Tickets', value: '2', change: '1 resolved today' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#cde7b0]/35 via-background to-[#a3bfa8]/20">
      <Navbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7286a0] to-[#a3bfa8] flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl">Welcome back, {user.username}!</h1>
              <p className="text-muted-foreground">
                {isAdmin ? 'Admin Dashboard' : 'Student Dashboard'} · SLIIT Smart Campus
                Operations Hub
              </p>
              <p className="text-sm text-foreground/90 mt-2 max-w-2xl">
                {isAdmin
                  ? 'Signed in as Administrator — you can create, edit, and delete facility resources and see all statuses.'
                  : 'Signed in as a standard user — browse and view active facilities only; resource management is restricted to administrators.'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <Card
              key={stat.label}
              className="border-2 border-border/50 hover:border-primary/50 transition-colors"
            >
              <CardContent className="pt-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-semibold tracking-tight">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl">Platform Modules</h2>
            <Badge variant="secondary" className="hidden sm:flex gap-1">
              <CheckCircle2 className="h-3 w-3" />
              1 of 5 Active
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Access all your campus operations tools in one place
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => {
            const isAvailable = module.status === 'available'
            const card = (
              <Card
                className={`group relative overflow-hidden border-2 transition-all duration-300 h-full ${
                  isAvailable
                    ? 'hover:border-primary hover:shadow-lg hover:-translate-y-1 cursor-pointer'
                    : 'opacity-75 cursor-not-allowed'
                }`}
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${module.color} opacity-5 group-hover:opacity-10 transition-opacity`}
                />

                <CardHeader className="relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`p-3 rounded-xl ${module.iconBg} group-hover:scale-110 transition-transform`}
                    >
                      <module.icon className={`h-6 w-6 ${module.iconColor}`} />
                    </div>
                    <Badge
                      variant={isAvailable ? 'default' : 'secondary'}
                      className={isAvailable ? 'bg-[#7286a0]' : ''}
                    >
                      {isAvailable ? 'Available' : 'Coming Soon'}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl mb-1">
                    Module {module.id}: {module.title}
                  </CardTitle>
                  <CardDescription className="leading-relaxed">
                    {module.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="relative z-10">
                  <div className="space-y-2 mb-4">
                    {module.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  {isAvailable ? (
                    <div
                      className={cn(
                        buttonVariants({ size: 'sm' }),
                        'w-full group-hover:bg-[#7286a0] transition-colors inline-flex pointer-events-none',
                      )}
                    >
                      Open Module
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  ) : (
                    <Button disabled variant="secondary" className="w-full" size="sm">
                      Under Development
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
                  className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {card}
                </Link>
              )
            }

            return <div key={module.id}>{card}</div>
          })}
        </div>

        <Card className="mt-8 border-2 border-dashed bg-gradient-to-r from-[#cde7b0]/10 to-[#a3bfa8]/10">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h3 className="text-lg font-semibold mb-1">Need Help Getting Started?</h3>
                <p className="text-sm text-muted-foreground">
                  Check out our user guide or contact campus support for assistance.
                </p>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <Button variant="outline" size="sm">
                  User Guide
                </Button>
                <Button variant="outline" size="sm">
                  Contact Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
