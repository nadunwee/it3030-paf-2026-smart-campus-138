import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { format } from 'date-fns'
import { Navbar } from '../components/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '@/api/client'
import { toast } from '@/toast/store'
import {
  type BookingPage,
  type BookingResponse,
  type BookingStatus,
  type PendingCountResponse,
} from '@/api/booking'
import {
  buildListQuery,
  facilityTypeLabels,
  type ResourceResponse,
  type SpringPage,
} from '@/api/resource'

function toIsoFromLocal(local: string): string {
  if (!local) return ''
  return new Date(local).toISOString()
}

function formatPeriod(iso: string): string {
  return format(new Date(iso), 'MMM d, yyyy h:mm a')
}

function statusClass(status: BookingStatus): string {
  if (status === 'APPROVED') return 'bg-[#e7f0fb] text-[#1f4f7f] border-[#bdd4ea]'
  if (status === 'REJECTED') return 'bg-[#f8ebe8] text-[#9f4336] border-[#e7c1ba]'
  if (status === 'CANCELLED') return 'bg-[#f1f1f1] text-[#5f6368] border-[#d7d9dd]'
  return 'bg-[#efece5] text-[#6e5b2f] border-[#d8caa4]'
}

export default function BookingManagement() {
  const { user, isAdmin } = useAuth()
  const [facilityId, setFacilityId] = useState<string>('')
  const [purpose, setPurpose] = useState('')
  const [bookedFrom, setBookedFrom] = useState('')
  const [bookedTo, setBookedTo] = useState('')
  const [availableResources, setAvailableResources] = useState<ResourceResponse[]>([])
  const [myBookings, setMyBookings] = useState<BookingResponse[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<BookingResponse[]>([])
  const [loadingResources, setLoadingResources] = useState(false)
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [decisionBookingId, setDecisionBookingId] = useState<number | null>(null)
  const [cancelBookingId, setCancelBookingId] = useState<number | null>(null)
  const [pendingCount, setPendingCount] = useState<number>(0)

  const durationMinutes = useMemo(() => {
    if (!bookedFrom || !bookedTo) return 0
    const diff = Math.floor((new Date(bookedTo).getTime() - new Date(bookedFrom).getTime()) / 60000)
    return diff > 0 ? diff : 0
  }, [bookedFrom, bookedTo])

  const selectedFacility = useMemo(
    () => availableResources.find((r) => String(r.id) === facilityId),
    [availableResources, facilityId],
  )
  const facilityName = selectedFacility
    ? `${facilityTypeLabels[selectedFacility.type]} - ${selectedFacility.location}`
    : ''

  const loadMyBookings = useCallback(async () => {
    const my = await apiFetch<BookingPage>('/api/v1/bookings/my?page=0&size=20')
    setMyBookings(my?.content ?? [])
  }, [])

  const loadAdminPending = useCallback(async () => {
    if (!isAdmin) return
    const pending = await apiFetch<BookingPage>('/api/v1/bookings?status=PENDING&page=0&size=20')
    setPendingApprovals(pending?.content ?? [])
    const countRes = await apiFetch<PendingCountResponse>('/api/v1/bookings/pending/count')
    setPendingCount(countRes?.pendingCount ?? 0)
  }, [isAdmin])

  const loadResources = useCallback(async () => {
    setLoadingResources(true)
    try {
      const fromIso = toIsoFromLocal(bookedFrom)
      const toIso = toIsoFromLocal(bookedTo)
      const hasCompleteRange = Boolean(fromIso && toIso)

      const query = buildListQuery({
        page: 0,
        size: 50,
        availableFrom: hasCompleteRange ? fromIso : undefined,
        availableTo: hasCompleteRange ? toIso : undefined,
      })

      const res = await apiFetch<SpringPage<ResourceResponse>>(`/api/v1/resources?${query}`)
      setAvailableResources(res?.content ?? [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load resources')
      setAvailableResources([])
    } finally {
      setLoadingResources(false)
    }
  }, [bookedFrom, bookedTo])

  const refreshData = useCallback(async () => {
    setLoadingBookings(true)
    try {
      await Promise.all([loadMyBookings(), loadAdminPending()])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load bookings')
    } finally {
      setLoadingBookings(false)
    }
  }, [loadAdminPending, loadMyBookings])

  useEffect(() => {
    void loadResources()
  }, [loadResources])

  useEffect(() => {
    void refreshData()
  }, [refreshData])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!facilityId) {
      toast.error('Please select a facility')
      return
    }
    if (!bookedFrom || !bookedTo || durationMinutes < 1) {
      toast.error('Please choose a valid booking time range')
      return
    }
    if (!purpose.trim()) {
      toast.error('Purpose is required')
      return
    }

    setSubmitting(true)
    try {
      await apiFetch('/api/v1/bookings', {
        method: 'POST',
        body: JSON.stringify({
          facilityId: Number(facilityId),
          purpose: purpose.trim(),
          durationMinutes,
          bookedFrom: toIsoFromLocal(bookedFrom),
          bookedTo: toIsoFromLocal(bookedTo),
        }),
      })
      toast.success('Booking request submitted for admin approval')
      setPurpose('')
      await Promise.all([loadResources(), refreshData()])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to submit booking')
    } finally {
      setSubmitting(false)
    }
  }

  const decideBooking = async (bookingId: number, status: 'APPROVED' | 'REJECTED') => {
    setDecisionBookingId(bookingId)
    try {
      await apiFetch(`/api/v1/bookings/${bookingId}/decision`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      toast.success(status === 'APPROVED' ? 'Booking approved' : 'Booking rejected')
      await Promise.all([loadResources(), refreshData()])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update booking')
    } finally {
      setDecisionBookingId(null)
    }
  }

  const cancelBooking = async (bookingId: number) => {
    setCancelBookingId(bookingId)
    try {
      await apiFetch(`/api/v1/bookings/${bookingId}/cancel`, {
        method: 'POST',
      })
      toast.success('Booking cancelled')
      await Promise.all([loadResources(), refreshData()])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to cancel booking')
    } finally {
      setCancelBookingId(null)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
          <h1>Booking Management</h1>
          <p className="mt-2 text-muted-foreground">
            Book facilities, track request status, and handle admin approvals.
          </p>
          {isAdmin && (
            <p className="mt-2 text-sm text-muted-foreground">
              Pending approvals: <span className="font-medium text-foreground">{pendingCount}</span>
            </p>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>New Booking Request</CardTitle>
              <CardDescription>
                Enter facility id, facility name, duration, purpose, and booking window.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitBooking} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="booked-from">Booked From</Label>
                  <Input
                    id="booked-from"
                    type="datetime-local"
                    value={bookedFrom}
                    onChange={(e) => setBookedFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="booked-to">Booked To</Label>
                  <Input
                    id="booked-to"
                    type="datetime-local"
                    value={bookedTo}
                    onChange={(e) => setBookedTo(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facility-id">Facility ID</Label>
                  <Select value={facilityId} onValueChange={setFacilityId}>
                    <SelectTrigger id="facility-id">
                      <SelectValue placeholder={loadingResources ? 'Loading facilities...' : 'Select facility'} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableResources.map((resource) => (
                        <SelectItem key={resource.id} value={String(resource.id)}>
                          #{resource.id} - {facilityTypeLabels[resource.type]} - {resource.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facility-name">Facility Name</Label>
                  <Input id="facility-name" value={facilityName} readOnly />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input id="duration" value={durationMinutes > 0 ? String(durationMinutes) : ''} readOnly />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose</Label>
                  <Input
                    id="purpose"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Purpose of this booking"
                    maxLength={500}
                  />
                </div>

                <Button type="submit" disabled={submitting || loadingResources} className="w-full">
                  {submitting ? 'Submitting...' : 'Submit Booking Request'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Bookings</CardTitle>
              <CardDescription>Track your booking requests and approval status.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {loadingBookings ? (
                <p className="text-sm text-muted-foreground">Loading bookings...</p>
              ) : myBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bookings found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myBookings.map((booking) => (
                      <TableRow key={booking.bookingId}>
                        <TableCell className="font-mono text-sm">{booking.facilityId}</TableCell>
                        <TableCell className="max-w-[240px] truncate">{booking.facilityName}</TableCell>
                        <TableCell>{booking.durationMinutes} min</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={statusClass(booking.status)}>
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {booking.status === 'APPROVED' ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => void cancelBooking(booking.bookingId)}
                              disabled={cancelBookingId === booking.bookingId}
                            >
                              {cancelBookingId === booking.bookingId ? 'Cancelling...' : 'Cancel'}
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {isAdmin && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Review booking requests and approve or reject them.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {pendingApprovals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending approvals.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Facility</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Window</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingApprovals.map((booking) => (
                      <TableRow key={booking.bookingId}>
                        <TableCell className="font-mono text-sm">{booking.bookingId}</TableCell>
                        <TableCell>{booking.bookedByUserName}</TableCell>
                        <TableCell>{booking.facilityName}</TableCell>
                        <TableCell className="max-w-[220px] truncate">{booking.purpose}</TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground">
                            <div>{formatPeriod(booking.bookedFrom)}</div>
                            <div>to {formatPeriod(booking.bookedTo)}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => void decideBooking(booking.bookingId, 'APPROVED')}
                              disabled={decisionBookingId === booking.bookingId}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void decideBooking(booking.bookingId, 'REJECTED')}
                              disabled={decisionBookingId === booking.bookingId}
                            >
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
