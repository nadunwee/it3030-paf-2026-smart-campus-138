import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { toast } from '@/toast/store'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '@/api/client'
import {
  facilityTypeLabels,
  toCreateBody,
  toPatchBody,
  type ResourceCreateBody,
  type ResourceResponse,
  type ResourceStatus,
  type ResourceType,
} from '@/api/resource'

type WindowRow = { key: string; start: string; end: string }

function toLocalDatetimeValue(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalDatetimeValue(local: string): string {
  if (!local) return ''
  const d = new Date(local)
  return d.toISOString()
}

export default function ResourceForm() {
  const { id } = useParams()
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const isEditMode = Boolean(id)
  const numericId = id != null ? Number(id) : NaN

  const [formData, setFormData] = useState({
    type: 'LECTURE_HALL' as ResourceType,
    capacity: '',
    location: '',
    status: 'ACTIVE' as ResourceStatus,
  })
  const [availabilityWindows, setAvailabilityWindows] = useState<WindowRow[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loadingResource, setLoadingResource] = useState(isEditMode)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isEditMode || Number.isNaN(numericId)) {
      setLoadingResource(false)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoadingResource(true)
      setLoadError(null)
      try {
        const data = await apiFetch<ResourceResponse>(`/api/v1/resources/${numericId}`)
        if (cancelled) return
        if (!data) {
          throw new Error('Resource not found')
        }
        setFormData({
          type: data.type,
          capacity: String(data.capacity),
          location: data.location,
          status: data.status,
        })
        setAvailabilityWindows(
          (data.availabilityWindows ?? []).map((w, i) => ({
            key: `w-${i}-${w.startDateTime}`,
            start: toLocalDatetimeValue(w.startDateTime),
            end: toLocalDatetimeValue(w.endDateTime),
          })),
        )
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Failed to load resource')
        }
      } finally {
        if (!cancelled) setLoadingResource(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isEditMode, numericId])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/facilities" replace />
  }

  if (isEditMode && loadError) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p className="text-destructive">{loadError}</p>
          <Link to="/facilities">
            <Button variant="link" className="mt-4">
              Back to Catalogue
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (isEditMode && loadingResource) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-muted-foreground">Loading…</div>
      </div>
    )
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.capacity || parseInt(formData.capacity, 10) < 1) {
      newErrors.capacity = 'Capacity must be at least 1'
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    if (!isAdmin) {
      toast.error(
        'Only an administrator can create or edit resources. Contact your campus administrator if you need access.',
      )
      return
    }

    const capacity = parseInt(formData.capacity, 10)
    const windows = availabilityWindows
      .filter((w) => w.start && w.end)
      .map((w) => ({
        startDateTime: fromLocalDatetimeValue(w.start),
        endDateTime: fromLocalDatetimeValue(w.end),
      }))

    setSaving(true)
    try {
      if (isEditMode) {
        const patch = toPatchBody({
          type: formData.type,
          capacity,
          location: formData.location,
          status: formData.status,
          windows,
        })
        await apiFetch(`/api/v1/resources/${numericId}`, {
          method: 'PATCH',
          body: JSON.stringify(patch),
        })
      } else {
        const body: ResourceCreateBody = toCreateBody({
          type: formData.type,
          capacity,
          location: formData.location,
          status: formData.status,
          windows,
        })
        await apiFetch('/api/v1/resources', {
          method: 'POST',
          body: JSON.stringify(body),
        })
      }
      navigate('/facilities')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const addAvailabilityWindow = () => {
    setAvailabilityWindows((prev) => [
      ...prev,
      { key: crypto.randomUUID(), start: '', end: '' },
    ])
  }

  const removeAvailabilityWindow = (key: string) => {
    setAvailabilityWindows((prev) => prev.filter((w) => w.key !== key))
  }

  const updateAvailabilityWindow = (
    key: string,
    field: 'start' | 'end',
    value: string,
  ) => {
    setAvailabilityWindows((prev) =>
      prev.map((w) => (w.key === key ? { ...w, [field]: value } : w)),
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-3xl">
        <Link
          to={isEditMode ? `/facilities/${id}` : '/facilities'}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          {isEditMode ? 'Back to Resource' : 'Back to Catalogue'}
        </Link>

        <div className="mb-6 rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
          <h1>
            {isEditMode ? 'Edit Resource' : 'Add New Resource'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isEditMode
              ? 'Update the details of this facility or asset'
              : 'Create a new bookable facility or asset'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Core details about the resource</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">
                    Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value as ResourceType })
                    }
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(facilityTypeLabels) as ResourceType[]).map((t) => (
                        <SelectItem key={t} value={t}>
                          {facilityTypeLabels[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">
                    Capacity <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="capacity"
                    type="number"
                    min={1}
                    placeholder="e.g., 50"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  />
                  {errors.capacity && (
                    <p className="text-sm text-destructive">{errors.capacity}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">
                  Location <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="location"
                  placeholder="e.g., Building A - Ground Floor"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
                {errors.location && (
                  <p className="text-sm text-destructive">{errors.location}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">
                  Status <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as ResourceStatus })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Availability Windows</CardTitle>
                  <CardDescription>
                    Define when this resource is available for booking
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAvailabilityWindow}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Window
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {availabilityWindows.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No availability windows added yet. Click &quot;Add Window&quot; to create one.
                </p>
              ) : (
                availabilityWindows.map((window, index) => (
                  <div key={window.key} className="space-y-3 rounded-lg border border-border/80 bg-muted/30 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Window {index + 1}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAvailabilityWindow(window.key)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`start-${window.key}`}>Start Date & Time</Label>
                        <Input
                          id={`start-${window.key}`}
                          type="datetime-local"
                          value={window.start}
                          onChange={(e) =>
                            updateAvailabilityWindow(window.key, 'start', e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`end-${window.key}`}>End Date & Time</Label>
                        <Input
                          id={`end-${window.key}`}
                          type="datetime-local"
                          value={window.end}
                          onChange={(e) =>
                            updateAvailabilityWindow(window.key, 'end', e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Link
              to={isEditMode ? `/facilities/${id}` : '/facilities'}
              className="flex-1 sm:flex-initial"
            >
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                Cancel
              </Button>
            </Link>
            <Button type="submit" className="flex-1 sm:flex-initial" disabled={saving}>
              {saving ? 'Saving…' : isEditMode ? 'Save Changes' : 'Create Resource'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
