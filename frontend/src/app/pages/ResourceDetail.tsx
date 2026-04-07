import { Fragment, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { Navbar } from '../components/Navbar'
import { StatusPill } from '../components/StatusPill'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Alert, AlertDescription } from '../components/ui/alert'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog'
import { ArrowLeft, Edit, Trash2, Calendar, MapPin, Users } from 'lucide-react'
import { toast } from '@/toast/store'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '@/api/client'
import {
  facilityTypeLabels,
  resourceShortTitle,
  type ResourceResponse,
} from '@/api/resource'

export default function ResourceDetail() {
  const { id } = useParams()
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [facility, setFacility] = useState<ResourceResponse | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletePending, setDeletePending] = useState(false)

  const numericId = id != null ? Number(id) : NaN

  useEffect(() => {
    if (!id || Number.isNaN(numericId)) {
      setLoading(false)
      setFacility(null)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setLoadError(null)
      try {
        const data = await apiFetch<ResourceResponse>(`/api/v1/resources/${numericId}`)
        if (!cancelled) setFacility(data)
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Failed to load resource')
          setFacility(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, numericId])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!loading && (Number.isNaN(numericId) || loadError || !facility)) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert variant="destructive">
            <AlertDescription>
              {loadError || 'Facility not found.'}
            </AlertDescription>
          </Alert>
          <Link to="/facilities">
            <Button variant="link" className="mt-4">
              Back to Catalogue
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (loading || !facility) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-muted-foreground">
          Loading…
        </div>
      </div>
    )
  }

  const confirmDelete = async () => {
    if (!facility) return
    setDeletePending(true)
    try {
      await apiFetch(`/api/v1/resources/${facility.id}`, { method: 'DELETE' })
      toast.success('Resource deleted')
      setDeleteDialogOpen(false)
      navigate('/facilities')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setDeletePending(false)
    }
  }

  return (
    <Fragment>
      <div className="min-h-screen bg-background">
        <Navbar />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/facilities"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Catalogue
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl md:text-4xl">{resourceShortTitle(facility)}</h1>
              <StatusPill status={facility.status} />
            </div>
            <p className="text-muted-foreground">
              {facilityTypeLabels[facility.type]} · ID: {facility.id}
            </p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Link to={`/facilities/${facility.id}/edit`}>
                <Button className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Core details about this resource</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#7286a0]/10">
                  <Users className="h-5 w-5 text-[#7286a0]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="font-medium">{facility.capacity} people</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#a3bfa8]/10">
                  <MapPin className="h-5 w-5 text-[#a3bfa8]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{facility.location}</p>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-medium">{facilityTypeLabels[facility.type]}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium">
                      {facility.status === 'ACTIVE' ? 'Active' : 'Out of Service'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#7286a0]" />
                <CardTitle>Availability Windows</CardTitle>
              </div>
              <CardDescription>Scheduled times when this resource is available</CardDescription>
            </CardHeader>
            <CardContent>
              {facility.availabilityWindows.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No availability windows scheduled
                </p>
              ) : (
                <div className="space-y-3">
                  {facility.availabilityWindows.map((window, idx) => (
                    <div
                      key={`${window.startDateTime}-${window.endDateTime}-${idx}`}
                      className="p-3 rounded-lg bg-[#cde7b0]/20 border-2 border-[#a3bfa8]/30"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                        <div className="flex-1">
                          <p className="font-medium">
                            {format(new Date(window.startDateTime), 'EEE, MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="text-muted-foreground">
                          {format(new Date(window.startDateTime), 'h:mm a')} -{' '}
                          {format(new Date(window.endDateTime), 'h:mm a')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {facility.status === 'OUT_OF_SERVICE' && (
          <Alert className="mt-6">
            <AlertDescription>
              This facility is currently out of service and unavailable for booking. Please
              contact the facilities management team for more information.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>

    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this resource?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove{' '}
            <span className="font-medium text-foreground">
              {resourceShortTitle(facility)}
            </span>
            . This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deletePending}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={deletePending}
            onClick={() => void confirmDelete()}
          >
            {deletePending ? 'Deleting…' : 'Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </Fragment>
  )
}
