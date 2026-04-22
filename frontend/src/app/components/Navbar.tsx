import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Building2, CalendarClock, ClipboardList, LogOut, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '@/api/client'
import type { PendingCountResponse } from '@/api/booking'
import type { TicketOpenCountResponse } from '@/api/ticket'

export function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [pendingApprovals, setPendingApprovals] = useState(0)
  const [openTickets, setOpenTickets] = useState(0)

  useEffect(() => {
    if (!isAdmin || !user) {
      return
    }

    let cancelled = false

    const loadPendingCount = async () => {
      try {
        const [bookingRes, ticketRes] = await Promise.all([
          apiFetch<PendingCountResponse>('/api/v1/bookings/pending/count'),
          apiFetch<TicketOpenCountResponse>('/api/v1/tickets/open/count'),
        ])
        if (!cancelled) {
          setPendingApprovals(bookingRes?.pendingCount ?? 0)
          setOpenTickets(ticketRes?.openCount ?? 0)
        }
      } catch {
        if (!cancelled) {
          setPendingApprovals(0)
          setOpenTickets(0)
        }
      }
    }

    void loadPendingCount()
    const timer = window.setInterval(() => {
      void loadPendingCount()
    }, 30000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [isAdmin, user])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <Link to="/dashboard" className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </span>
              <span className="hidden font-semibold tracking-tight sm:inline">
                SCH
              </span>
              <span className="font-semibold tracking-tight sm:hidden">SCH</span>
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  Home
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Link to="/facilities">
                <Button variant="ghost" size="sm">
                  Facilities
                </Button>
              </Link>
              <Link to="/bookings">
                <Button variant="ghost" size="sm" className="gap-2">
                  <CalendarClock className="h-4 w-4" />
                  Bookings
                  {isAdmin && pendingApprovals > 0 && (
                    <Badge variant="secondary" className="ml-1 text-[10px]">
                      {pendingApprovals}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Link to="/tickets">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Tickets
                  {isAdmin && openTickets > 0 && (
                    <Badge variant="secondary" className="ml-1 text-[10px]">
                      {openTickets}
                    </Badge>
                  )}
                </Button>
              </Link>
              {isAdmin && (
                <Link to="/facilities/new">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Add Resource</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user && (
              <>
                <div className="hidden items-center gap-2 sm:flex">
                  <span className="text-sm text-muted-foreground">{user.username}</span>
                  <Badge
                    variant={isAdmin ? 'default' : 'secondary'}
                    className="text-[11px] uppercase tracking-wide"
                  >
                    {user.role}
                  </Badge>
                  {isAdmin && pendingApprovals > 0 && (
                    <Badge variant="secondary" className="text-[11px] uppercase tracking-wide">
                      {pendingApprovals} pending
                    </Badge>
                  )}
                  {isAdmin && openTickets > 0 && (
                    <Badge variant="secondary" className="text-[11px] uppercase tracking-wide">
                      {openTickets} open tickets
                    </Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 pb-2 md:hidden">
          <Link to="/">
            <Button variant="ghost" size="sm">
              Home
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              Dashboard
            </Button>
          </Link>
          <Link to="/facilities">
            <Button variant="ghost" size="sm">
              Facilities
            </Button>
          </Link>
          <Link to="/bookings">
            <Button variant="ghost" size="sm" className="gap-1">
              Bookings
              {isAdmin && pendingApprovals > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  {pendingApprovals}
                </Badge>
              )}
            </Button>
          </Link>
          <Link to="/tickets">
            <Button variant="ghost" size="sm" className="gap-1">
              Tickets
              {isAdmin && openTickets > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  {openTickets}
                </Badge>
              )}
            </Button>
          </Link>
          {isAdmin && (
            <Link to="/facilities/new">
              <Button variant="ghost" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
