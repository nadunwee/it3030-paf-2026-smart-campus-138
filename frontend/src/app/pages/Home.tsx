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
import { Building2, Calendar, Wrench, Bell, KeyRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user } = useAuth()

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const modules = [
    {
      id: 'A',
      title: 'Facilities & Assets',
      description:
        'Browse bookable resources: lecture halls, labs, meeting rooms, and equipment. Search and filter by type, capacity, and location.',
      icon: Building2,
      status: 'Available',
      color: 'bg-[#7286a0]/10 text-[#7286a0]',
    },
    {
      id: 'B',
      title: 'Bookings',
      description:
        'Request and manage bookings with approval workflows. Coming in a future release.',
      icon: Calendar,
      status: 'Planned',
      color: 'bg-[#cde7b0]/30 text-[#59594a]',
    },
    {
      id: 'C',
      title: 'Maintenance & tickets',
      description:
        'Report facility issues and track resolution. Coming in a future release.',
      icon: Wrench,
      status: 'Planned',
      color: 'bg-[#be6e46]/10 text-[#be6e46]',
    },
    {
      id: 'D',
      title: 'Notifications',
      description:
        'In-app updates for bookings and maintenance. Coming in a future release.',
      icon: Bell,
      status: 'Planned',
      color: 'bg-[#a3bfa8]/20 text-[#59594a]',
    },
    {
      id: 'E',
      title: 'Sign-in & roles',
      description:
        'Username/password and Google sign-in are supported for standard users; administrators manage campus resources.',
      icon: KeyRound,
      status: 'Available',
      color: 'bg-[#59594a]/10 text-[#59594a]',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#cde7b0]/30 via-background to-background">
      <nav className="border-b bg-background/85 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-semibold">Smart Campus Hub</span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/facilities">
                <Button variant="ghost" size="sm">
                  Browse facilities
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="ghost" size="sm">
                  Sign up
                </Button>
              </Link>
              <Link to="/login">
                <Button size="sm">Sign in</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl tracking-tight">
            Smart Campus Operations Hub
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Find and view campus facilities and equipment. Sign in with username/password or
            Google to access your personalized dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link to="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Create an account
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Sign in
              </Button>
            </Link>
            <Link to="/facilities">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Browse catalogue
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl">What you can use</h2>
            <p className="text-muted-foreground">
              Facilities catalogue is live; other areas will roll out over time.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <Card
                key={module.id}
                className={
                  module.status === 'Available'
                    ? 'border-2 border-[#7286a0]/50 bg-[#7286a0]/5'
                    : 'border-2'
                }
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-lg ${module.color}`}>
                      <module.icon className="h-5 w-5" />
                    </div>
                    <Badge variant={module.status === 'Available' ? 'default' : 'secondary'}>
                      {module.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {module.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t bg-muted/30 mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col gap-6 md:flex-row md:justify-between md:items-start text-sm text-muted-foreground">
            <div className="space-y-1">
              <p className="font-medium text-foreground">Smart Campus Operations Hub</p>
              <p>© {new Date().getFullYear()} Campus operations. All rights reserved.</p>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <Link to="/login" className="hover:text-foreground transition-colors">
                Sign in
              </Link>
              <Link to="/signup" className="hover:text-foreground transition-colors">
                Sign up
              </Link>
              <Link to="/facilities" className="hover:text-foreground transition-colors">
                Facilities catalogue
              </Link>
            </div>
            <div className="md:text-right max-w-sm">
              <p>
                For access problems or administrator requests, contact your campus IT or
                facilities office.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
