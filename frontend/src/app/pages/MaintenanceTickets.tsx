import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { format } from 'date-fns'
import { Navigate } from 'react-router-dom'
import { Edit3, ImagePlus, Save, Trash2, X } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '@/api/client'
import { facilityTypeLabels, type ResourceResponse, type SpringPage } from '@/api/resource'
import { toast } from '@/toast/store'
import type { UserPage, UserSummaryResponse } from '@/api/users'
import {
  buildTicketAdminQuery,
  ticketCategoryLabels,
  type TicketAttachmentBody,
  type TicketCategory,
  type TicketDetailResponse,
  type TicketMessageResponse,
  type TicketPage,
  type TicketPriority,
  type TicketStatus,
} from '@/api/ticket'

const PAGE_SIZE = 12
const MANUAL_RESOURCE_VALUE = 'manual'
const UNASSIGNED_VALUE = 'unassigned'
const MAX_ATTACHMENTS = 3
const MAX_IMAGE_BYTES = 1_500_000

type TeacherTicketView = 'ASSIGNED' | 'MINE'

function statusColor(status: TicketStatus): string {
  if (status === 'OPEN') return 'bg-[#efece5] text-[#6e5b2f] border-[#d8caa4]'
  if (status === 'IN_PROGRESS') return 'bg-[#e7f0fb] text-[#1f4f7f] border-[#bdd4ea]'
  if (status === 'RESOLVED') return 'bg-[#e6f3e8] text-[#2c6b3f] border-[#b8dbc2]'
  if (status === 'REJECTED') return 'bg-[#f8ebe8] text-[#9f4336] border-[#e7c1ba]'
  return 'bg-[#f3f3f3] text-[#555] border-[#ddd]'
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return 'Not set'
  return format(new Date(iso), 'MMM d, yyyy h:mm a')
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Unable to read image attachment'))
      }
    }
    reader.onerror = () => reject(new Error('Unable to read image attachment'))
    reader.readAsDataURL(file)
  })
}

async function toAttachmentBodies(files: File[], availableSlots: number): Promise<TicketAttachmentBody[]> {
  if (files.length > availableSlots) {
    throw new Error(`You can attach ${availableSlots} more image${availableSlots === 1 ? '' : 's'}`)
  }

  return Promise.all(
    files.map(async (file) => {
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image attachments are allowed')
      }
      if (file.size > MAX_IMAGE_BYTES) {
        throw new Error('Each image must be 1.5MB or smaller')
      }

      return {
        fileName: file.name,
        contentType: file.type,
        dataUrl: await readFileAsDataUrl(file),
      }
    }),
  )
}

export default function MaintenanceTickets() {
  const { user, isAdmin, isStudent, isTeacher } = useAuth()
  const isStaff = isAdmin || isTeacher
  const canCreateTickets = isStudent || isTeacher

  const [ticketsPage, setTicketsPage] = useState<TicketPage | null>(null)
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)
  const [selectedTicketDetail, setSelectedTicketDetail] = useState<TicketDetailResponse | null>(null)
  const [loadingTickets, setLoadingTickets] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [submittingCreate, setSubmittingCreate] = useState(false)
  const [submittingReply, setSubmittingReply] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [savingAssignment, setSavingAssignment] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const [adminStatusFilter, setAdminStatusFilter] = useState<'ALL' | TicketStatus>('ALL')
  const [adminCategoryFilter, setAdminCategoryFilter] = useState<'ALL' | TicketCategory>('ALL')
  const [adminPriorityFilter, setAdminPriorityFilter] = useState<'ALL' | TicketPriority>('ALL')
  const [teacherTicketView, setTeacherTicketView] = useState<TeacherTicketView>('ASSIGNED')

  const [resources, setResources] = useState<ResourceResponse[]>([])
  const [staffUsers, setStaffUsers] = useState<UserSummaryResponse[]>([])
  const [newCategory, setNewCategory] = useState<TicketCategory>('TECHNICAL')
  const [newSubject, setNewSubject] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPriority, setNewPriority] = useState<TicketPriority>('MEDIUM')
  const [newResourceId, setNewResourceId] = useState(MANUAL_RESOURCE_VALUE)
  const [newLocation, setNewLocation] = useState('')
  const [newContactDetails, setNewContactDetails] = useState('')
  const [newAttachments, setNewAttachments] = useState<TicketAttachmentBody[]>([])

  const [replyText, setReplyText] = useState('')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [selectedAssignedStaffId, setSelectedAssignedStaffId] = useState(UNASSIGNED_VALUE)
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null)
  const [editingMessageText, setEditingMessageText] = useState('')
  const [workingMessageId, setWorkingMessageId] = useState<number | null>(null)

  const ticketRows = ticketsPage?.content ?? []
  const totalPages = ticketsPage?.totalPages ?? 0
  const selectedTicket = selectedTicketDetail?.ticket ?? null
  const isTerminal = selectedTicket?.status === 'CLOSED' || selectedTicket?.status === 'REJECTED'
  const canHandleSelected =
    !!selectedTicket && !!user && (isAdmin || selectedTicket.assignedStaffId === user.id)
  const canCloseSelected =
    !!selectedTicket && !!user && selectedTicket.studentId === user.id && selectedTicket.status === 'RESOLVED'

  const selectedResource = useMemo(
    () => resources.find((resource) => String(resource.id) === newResourceId) ?? null,
    [resources, newResourceId],
  )

  const fetchTickets = useCallback(async () => {
    setLoadingTickets(true)
    try {
      const staffQuery = buildTicketAdminQuery({
        page: currentPage - 1,
        size: PAGE_SIZE,
        status: adminStatusFilter,
        category: adminCategoryFilter,
        priority: adminPriorityFilter,
      })
      const endpoint =
        isAdmin || (isTeacher && teacherTicketView === 'ASSIGNED')
          ? `/api/v1/tickets?${staffQuery}`
          : `/api/v1/tickets/my?page=${currentPage - 1}&size=${PAGE_SIZE}`

      const page = await apiFetch<TicketPage>(endpoint)
      setTicketsPage(page)

      const rows = page?.content ?? []
      if (rows.length === 0) {
        setSelectedTicketId(null)
        setSelectedTicketDetail(null)
      } else if (!selectedTicketId || !rows.some((r) => r.ticketId === selectedTicketId)) {
        setSelectedTicketId(rows[0].ticketId)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load tickets')
      setTicketsPage(null)
    } finally {
      setLoadingTickets(false)
    }
  }, [
    isAdmin,
    isTeacher,
    teacherTicketView,
    currentPage,
    adminStatusFilter,
    adminCategoryFilter,
    adminPriorityFilter,
    selectedTicketId,
  ])

  const fetchTicketDetail = useCallback(async (ticketId: number) => {
    setLoadingDetail(true)
    try {
      const detail = await apiFetch<TicketDetailResponse>(`/api/v1/tickets/${ticketId}`)
      setSelectedTicketDetail(detail)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load ticket thread')
      setSelectedTicketDetail(null)
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  useEffect(() => {
    void fetchTickets()
  }, [fetchTickets])

  useEffect(() => {
    if (selectedTicketId != null) {
      void fetchTicketDetail(selectedTicketId)
    }
  }, [selectedTicketId, fetchTicketDetail])

  useEffect(() => {
    if (!canCreateTickets) return
    let cancelled = false
    ;(async () => {
      try {
        const page = await apiFetch<SpringPage<ResourceResponse>>('/api/v1/resources?page=0&size=100')
        if (!cancelled) {
          setResources(page?.content ?? [])
        }
      } catch {
        if (!cancelled) setResources([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [canCreateTickets])

  useEffect(() => {
    if (!isAdmin) return
    let cancelled = false
    ;(async () => {
      try {
        const page = await apiFetch<UserPage>('/api/v1/admin/users?page=0&size=100')
        if (!cancelled) {
          setStaffUsers((page?.content ?? []).filter((staff) => staff.role === 'ADMIN' || staff.role === 'TEACHER'))
        }
      } catch {
        if (!cancelled) setStaffUsers([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isAdmin])

  useEffect(() => {
    setSelectedAssignedStaffId(
      selectedTicket?.assignedStaffId == null ? UNASSIGNED_VALUE : String(selectedTicket.assignedStaffId),
    )
    setResolutionNotes(selectedTicket?.resolutionNotes ?? '')
    setRejectionReason(selectedTicket?.rejectionReason ?? '')
  }, [selectedTicket?.assignedStaffId, selectedTicket?.resolutionNotes, selectedTicket?.rejectionReason])

  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (!isAdmin && !isStudent && !isTeacher) {
    return <Navigate to="/dashboard" replace />
  }

  const handleResourceChange = (value: string) => {
    setNewResourceId(value)
    const resource = resources.find((item) => String(item.id) === value)
    if (resource && !newLocation.trim()) {
      setNewLocation(resource.location)
    }
  }

  const handleAttachmentChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return
    const availableSlots = MAX_ATTACHMENTS - newAttachments.length
    if (availableSlots <= 0) {
      toast.error('You can attach up to 3 images')
      event.target.value = ''
      return
    }
    try {
      const attachments = await toAttachmentBodies(files, availableSlots)
      setNewAttachments((prev) => [...prev, ...attachments])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to attach images')
    } finally {
      event.target.value = ''
    }
  }

  const handleCreateTicket = async (e: FormEvent) => {
    e.preventDefault()
    const resolvedLocation = newLocation.trim() || selectedResource?.location || ''
    if (!newSubject.trim() || !newDescription.trim()) {
      toast.error('Subject and description are required')
      return
    }
    if (!resolvedLocation) {
      toast.error('Resource or location is required')
      return
    }
    if (!newContactDetails.trim()) {
      toast.error('Preferred contact details are required')
      return
    }

    setSubmittingCreate(true)
    try {
      const created = await apiFetch<TicketDetailResponse>('/api/v1/tickets', {
        method: 'POST',
        body: JSON.stringify({
          category: newCategory,
          subject: newSubject.trim(),
          description: newDescription.trim(),
          resourceId: selectedResource?.id,
          location: resolvedLocation,
          preferredContactDetails: newContactDetails.trim(),
          priority: newPriority,
          attachments: newAttachments,
        }),
      })
      toast.success('Ticket created')
      setNewSubject('')
      setNewDescription('')
      setNewLocation('')
      setNewContactDetails('')
      setNewAttachments([])
      setNewResourceId(MANUAL_RESOURCE_VALUE)
      if (isTeacher) setTeacherTicketView('MINE')
      setCurrentPage(1)
      setSelectedTicketDetail(created)
      setSelectedTicketId(created?.ticket.ticketId ?? null)
      await fetchTickets()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create ticket')
    } finally {
      setSubmittingCreate(false)
    }
  }

  const handleReply = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedTicket || !replyText.trim()) {
      return
    }
    if (isTerminal) {
      toast.error('Cannot reply to a closed or rejected ticket')
      return
    }

    setSubmittingReply(true)
    try {
      const updated = await apiFetch<TicketDetailResponse>(`/api/v1/tickets/${selectedTicket.ticketId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ messageText: replyText.trim() }),
      })
      setReplyText('')
      setSelectedTicketDetail(updated)
      await fetchTickets()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send reply')
    } finally {
      setSubmittingReply(false)
    }
  }

  const updateTicketStatus = async (status: Exclude<TicketStatus, 'CLOSED'>) => {
    if (!selectedTicket) return
    if (status === 'REJECTED' && !rejectionReason.trim()) {
      toast.error('Rejection reason is required')
      return
    }
    setUpdatingStatus(true)
    try {
      await apiFetch(`/api/v1/tickets/${selectedTicket.ticketId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          resolutionNotes: resolutionNotes.trim() || undefined,
          reason: status === 'REJECTED' ? rejectionReason.trim() : undefined,
        }),
      })
      toast.success(`Ticket marked as ${status}`)
      await Promise.all([fetchTickets(), fetchTicketDetail(selectedTicket.ticketId)])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const assignTicket = async () => {
    if (!selectedTicket) return
    setSavingAssignment(true)
    try {
      await apiFetch(`/api/v1/tickets/${selectedTicket.ticketId}/assignment`, {
        method: 'PATCH',
        body: JSON.stringify({
          assignedStaffId:
            selectedAssignedStaffId === UNASSIGNED_VALUE ? null : Number(selectedAssignedStaffId),
        }),
      })
      toast.success('Assignment updated')
      await Promise.all([fetchTickets(), fetchTicketDetail(selectedTicket.ticketId)])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to assign ticket')
    } finally {
      setSavingAssignment(false)
    }
  }

  const closeTicket = async () => {
    if (!selectedTicket) return
    setUpdatingStatus(true)
    try {
      await apiFetch(`/api/v1/tickets/${selectedTicket.ticketId}/close`, {
        method: 'POST',
      })
      toast.success('Ticket closed')
      await Promise.all([fetchTickets(), fetchTicketDetail(selectedTicket.ticketId)])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to close ticket')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const startEditMessage = (message: TicketMessageResponse) => {
    setEditingMessageId(message.messageId)
    setEditingMessageText(message.messageContent)
  }

  const updateMessage = async (messageId: number) => {
    if (!selectedTicket || !editingMessageText.trim()) return
    setWorkingMessageId(messageId)
    try {
      const updated = await apiFetch<TicketDetailResponse>(
        `/api/v1/tickets/${selectedTicket.ticketId}/messages/${messageId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ messageText: editingMessageText.trim() }),
        },
      )
      setSelectedTicketDetail(updated)
      setEditingMessageId(null)
      setEditingMessageText('')
      await fetchTickets()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update comment')
    } finally {
      setWorkingMessageId(null)
    }
  }

  const deleteMessage = async (messageId: number) => {
    if (!selectedTicket) return
    const confirmed = window.confirm('Delete this comment?')
    if (!confirmed) return
    setWorkingMessageId(messageId)
    try {
      const updated = await apiFetch<TicketDetailResponse>(
        `/api/v1/tickets/${selectedTicket.ticketId}/messages/${messageId}`,
        { method: 'DELETE' },
      )
      setSelectedTicketDetail(updated)
      await fetchTickets()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete comment')
    } finally {
      setWorkingMessageId(null)
    }
  }

  const renderStatusActions = () => {
    if (!selectedTicket) return null

    if (canHandleSelected) {
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <Button
                size="sm"
                variant="outline"
                disabled={updatingStatus || selectedTicket.status === 'OPEN'}
                onClick={() => void updateTicketStatus('OPEN')}
              >
                Set OPEN
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              disabled={updatingStatus || selectedTicket.status === 'IN_PROGRESS' || isTerminal}
              onClick={() => void updateTicketStatus('IN_PROGRESS')}
            >
              Set IN_PROGRESS
            </Button>
            <Button
              size="sm"
              disabled={updatingStatus || selectedTicket.status === 'RESOLVED' || isTerminal}
              onClick={() => void updateTicketStatus('RESOLVED')}
            >
              Mark RESOLVED
            </Button>
            {isAdmin && (
              <Button
                size="sm"
                variant="destructive"
                disabled={updatingStatus || selectedTicket.status === 'REJECTED'}
                onClick={() => void updateTicketStatus('REJECTED')}
              >
                Reject
              </Button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="resolution-notes">Resolution Notes</Label>
              <textarea
                id="resolution-notes"
                value={resolutionNotes}
                onChange={(event) => setResolutionNotes(event.target.value)}
                maxLength={4000}
                className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            {isAdmin && (
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                <textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  maxLength={1000}
                  className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>
        </div>
      )
    }

    if (canCloseSelected) {
      return (
        <Button size="sm" disabled={updatingStatus} onClick={() => void closeTicket()}>
          Close Ticket
        </Button>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
          <h1>Maintenance & Tickets</h1>
          <p className="mt-2 text-muted-foreground">
            {isAdmin
              ? 'Review tickets, assign staff, manage workflow, and record outcomes.'
              : isTeacher
                ? 'Handle assigned tickets or review tickets you submitted.'
                : 'Create incident tickets, add evidence, and close them when resolved.'}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            {canCreateTickets && (
              <Card>
                <CardHeader>
                  <CardTitle>Create Incident Ticket</CardTitle>
                  <CardDescription>
                    Submit a resource or location issue with contact details and optional image evidence.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={handleCreateTicket}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="ticket-id">Ticket ID</Label>
                        <Input id="ticket-id" value="Auto-generated" readOnly disabled />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ticket-status">Initial Status</Label>
                        <Input id="ticket-status" value="OPEN" readOnly disabled />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="requester-id">Requester ID</Label>
                        <Input
                          id="requester-id"
                          value={user.id == null ? 'Resolved by server' : String(user.id)}
                          readOnly
                          disabled
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="requester-name">Requester Name</Label>
                        <Input id="requester-name" value={user.username} readOnly disabled />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="resource">Resource</Label>
                        <Select value={newResourceId} onValueChange={handleResourceChange}>
                          <SelectTrigger id="resource">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={MANUAL_RESOURCE_VALUE}>Manual location</SelectItem>
                            {resources.map((resource) => (
                              <SelectItem key={resource.id} value={String(resource.id)}>
                                #{resource.id} - {facilityTypeLabels[resource.type]} - {resource.location}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={newLocation}
                          onChange={(e) => setNewLocation(e.target.value)}
                          placeholder={selectedResource ? selectedResource.location : 'Building, room, or area'}
                          maxLength={255}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={newCategory} onValueChange={(v) => setNewCategory(v as TicketCategory)}>
                          <SelectTrigger id="category">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TECHNICAL">Technical</SelectItem>
                            <SelectItem value="FACILITY">Facility</SelectItem>
                            <SelectItem value="STUDENT_RELATED">Student Related</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={newPriority} onValueChange={(v) => setNewPriority(v as TicketPriority)}>
                          <SelectTrigger id="priority">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact-details">Preferred Contact Details</Label>
                      <Input
                        id="contact-details"
                        value={newContactDetails}
                        onChange={(e) => setNewContactDetails(e.target.value)}
                        maxLength={255}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        maxLength={255}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <textarea
                        id="description"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        maxLength={2000}
                        className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="attachments">Image Attachments</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="attachments"
                          type="file"
                          accept="image/*"
                          multiple
                          disabled={newAttachments.length >= MAX_ATTACHMENTS}
                          onChange={handleAttachmentChange}
                        />
                        <ImagePlus className="h-5 w-5 text-muted-foreground" aria-hidden />
                      </div>
                      {newAttachments.length > 0 && (
                        <div className="grid gap-2 sm:grid-cols-3">
                          {newAttachments.map((attachment, index) => (
                            <div key={`${attachment.fileName}-${index}`} className="rounded-md border border-border/80 p-2">
                              <img
                                src={attachment.dataUrl}
                                alt={attachment.fileName}
                                className="h-24 w-full rounded object-cover"
                              />
                              <div className="mt-2 flex items-center justify-between gap-2">
                                <p className="truncate text-xs text-muted-foreground">{attachment.fileName}</p>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  aria-label="Remove attachment"
                                  onClick={() =>
                                    setNewAttachments((prev) =>
                                      prev.filter((_, attachmentIndex) => attachmentIndex !== index),
                                    )
                                  }
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button type="submit" disabled={submittingCreate} className="w-full">
                      {submittingCreate ? 'Submitting...' : 'Create Ticket'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>
                  {isAdmin ? 'All Tickets' : isTeacher && teacherTicketView === 'ASSIGNED' ? 'Assigned Tickets' : 'My Tickets'}
                </CardTitle>
                <CardDescription>
                  {isStaff
                    ? 'Filter tickets and open one to view details, comments, and workflow actions.'
                    : 'Open a ticket to view and continue the conversation.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isTeacher && (
                  <Select
                    value={teacherTicketView}
                    onValueChange={(value) => {
                      setTeacherTicketView(value as TeacherTicketView)
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ASSIGNED">Assigned to me</SelectItem>
                      <SelectItem value="MINE">Submitted by me</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {(isAdmin || (isTeacher && teacherTicketView === 'ASSIGNED')) && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Select
                      value={adminStatusFilter}
                      onValueChange={(v) => {
                        setAdminStatusFilter(v as typeof adminStatusFilter)
                        setCurrentPage(1)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Statuses</SelectItem>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={adminCategoryFilter}
                      onValueChange={(v) => {
                        setAdminCategoryFilter(v as typeof adminCategoryFilter)
                        setCurrentPage(1)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Categories</SelectItem>
                        <SelectItem value="TECHNICAL">Technical</SelectItem>
                        <SelectItem value="FACILITY">Facility</SelectItem>
                        <SelectItem value="STUDENT_RELATED">Student Related</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={adminPriorityFilter}
                      onValueChange={(v) => {
                        setAdminPriorityFilter(v as typeof adminPriorityFilter)
                        setCurrentPage(1)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Priorities</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {loadingTickets ? (
                  <p className="text-sm text-muted-foreground">Loading tickets...</p>
                ) : ticketRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tickets found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Evidence</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ticketRows.map((ticket) => (
                          <TableRow
                            key={ticket.ticketId}
                            className={selectedTicketId === ticket.ticketId ? 'bg-muted/40' : ''}
                            onClick={() => setSelectedTicketId(ticket.ticketId)}
                          >
                            <TableCell className="font-mono text-xs">{ticket.ticketId}</TableCell>
                            <TableCell className="max-w-[240px] truncate">{ticket.subject}</TableCell>
                            <TableCell className="max-w-[180px] truncate">{ticket.location ?? 'Unspecified'}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={statusColor(ticket.status)}>
                                {ticket.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{ticket.priority}</TableCell>
                            <TableCell>
                              {ticket.attachmentCount > 0 ? (
                                <Badge variant="secondary">{ticket.attachmentCount} image{ticket.attachmentCount === 1 ? '' : 's'}</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">None</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPage <= 1 || loadingTickets}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <span className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPage >= totalPages || loadingTickets}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ticket Thread</CardTitle>
              <CardDescription>
                View ticket context, evidence, comments, and workflow controls.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedTicket ? (
                <p className="text-sm text-muted-foreground">Select a ticket to view details.</p>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border/80 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">#{selectedTicket.ticketId} - {selectedTicket.subject}</p>
                      <Badge variant="secondary" className={statusColor(selectedTicket.status)}>
                        {selectedTicket.status}
                      </Badge>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <p>
                        <span className="text-muted-foreground">Category:</span>{' '}
                        {ticketCategoryLabels[selectedTicket.category]}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Priority:</span> {selectedTicket.priority}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Resource:</span>{' '}
                        {selectedTicket.resourceLabel ?? 'Not linked'}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Location:</span>{' '}
                        {selectedTicket.location ?? 'Unspecified'}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Contact:</span>{' '}
                        {selectedTicket.preferredContactDetails ?? 'Not provided'}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Assigned:</span>{' '}
                        {selectedTicket.assignedStaffName ?? 'Unassigned'}
                      </p>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Created {formatDateTime(selectedTicket.createdAt)} - Updated {formatDateTime(selectedTicket.updatedAt)}
                    </p>
                    {selectedTicket.resolutionNotes && (
                      <p className="mt-3 whitespace-pre-wrap rounded-md bg-muted/40 p-2 text-sm">
                        <span className="font-medium">Resolution:</span> {selectedTicket.resolutionNotes}
                      </p>
                    )}
                    {selectedTicket.rejectionReason && (
                      <p className="mt-3 whitespace-pre-wrap rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                        <span className="font-medium">Rejected:</span> {selectedTicket.rejectionReason}
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg border border-border/80 p-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">Evidence Images</p>
                      <Badge variant="secondary">
                        {selectedTicketDetail?.attachments?.length ?? 0} / {MAX_ATTACHMENTS}
                      </Badge>
                    </div>
                    {selectedTicketDetail?.attachments?.length ? (
                      <div className="grid gap-3 sm:grid-cols-3">
                        {selectedTicketDetail.attachments.map((attachment) => (
                          <a
                            key={attachment.attachmentId}
                            href={attachment.dataUrl}
                            target="_blank"
                            rel="noreferrer"
                            download={attachment.fileName}
                            className="rounded-md border border-border/80 p-2 transition hover:bg-muted/30"
                          >
                            <img
                              src={attachment.dataUrl}
                              alt={attachment.fileName}
                              className="h-32 w-full rounded object-cover"
                            />
                            <p className="mt-2 truncate text-xs text-muted-foreground">{attachment.fileName}</p>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No images attached.</p>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="rounded-lg border border-border/80 p-3">
                      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                        <div className="space-y-2">
                          <Label htmlFor="assigned-staff">Assigned Staff</Label>
                          <Select value={selectedAssignedStaffId} onValueChange={setSelectedAssignedStaffId}>
                            <SelectTrigger id="assigned-staff">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
                              {staffUsers.map((staff) => (
                                <SelectItem key={staff.id} value={String(staff.id)}>
                                  {staff.username} - {staff.role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            disabled={savingAssignment}
                            onClick={() => void assignTicket()}
                          >
                            {savingAssignment ? 'Saving...' : 'Assign'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-lg border border-border/80 p-3">
                    {loadingDetail ? (
                      <p className="text-sm text-muted-foreground">Loading thread...</p>
                    ) : (
                      <>
                        {selectedTicketDetail?.attachments?.length ? (
                          <div className="rounded-md border border-border/70 bg-muted/20 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium">
                                Evidence Images ({selectedTicketDetail.attachments.length})
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Added with ticket #{selectedTicket.ticketId}
                              </p>
                            </div>
                            <div className="mt-3 grid gap-3 sm:grid-cols-3">
                              {selectedTicketDetail.attachments.map((attachment) => (
                                <a
                                  key={attachment.attachmentId}
                                  href={attachment.dataUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  download={attachment.fileName}
                                  className="rounded-md border border-border/80 bg-background p-2 transition hover:bg-muted/30"
                                >
                                  <img
                                    src={attachment.dataUrl}
                                    alt={attachment.fileName}
                                    className="h-28 w-full rounded object-cover"
                                  />
                                  <p className="mt-2 truncate text-xs text-muted-foreground">{attachment.fileName}</p>
                                </a>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {selectedTicketDetail?.messages.length ? (
                          selectedTicketDetail.messages.map((message) => {
                            const canEdit = message.senderId === user.id && !isTerminal
                            const canDelete = (message.senderId === user.id || isAdmin) && (!isTerminal || isAdmin)
                            const isEditing = editingMessageId === message.messageId

                            return (
                              <div key={message.messageId} className="rounded-md border border-border/70 bg-muted/20 p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-medium">
                                      {message.senderName} ({message.senderRole})
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDateTime(message.sentAt)}
                                      {message.editedAt ? ` - edited ${formatDateTime(message.editedAt)}` : ''}
                                    </p>
                                  </div>
                                  {(canEdit || canDelete) && (
                                    <div className="flex items-center gap-1">
                                      {canEdit && !isEditing && (
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-7 w-7"
                                          aria-label="Edit comment"
                                          onClick={() => startEditMessage(message)}
                                        >
                                          <Edit3 className="h-3.5 w-3.5" />
                                        </Button>
                                      )}
                                      {canDelete && (
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-7 w-7"
                                          aria-label="Delete comment"
                                          disabled={workingMessageId === message.messageId}
                                          onClick={() => void deleteMessage(message.messageId)}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {isEditing ? (
                                  <div className="mt-3 space-y-2">
                                    <textarea
                                      value={editingMessageText}
                                      onChange={(event) => setEditingMessageText(event.target.value)}
                                      className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        type="button"
                                        disabled={workingMessageId === message.messageId || !editingMessageText.trim()}
                                        onClick={() => void updateMessage(message.messageId)}
                                      >
                                        <Save className="h-3.5 w-3.5" />
                                        Save
                                      </Button>
                                      <Button
                                        size="sm"
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                          setEditingMessageId(null)
                                          setEditingMessageText('')
                                        }}
                                      >
                                        <X className="h-3.5 w-3.5" />
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="mt-2 whitespace-pre-wrap text-sm">{message.messageContent}</p>
                                )}
                              </div>
                            )
                          })
                        ) : (
                          <p className="text-sm text-muted-foreground">No messages in this thread.</p>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">{renderStatusActions()}</div>

                  <form className="space-y-2" onSubmit={handleReply}>
                    <Label htmlFor="reply">Reply</Label>
                    <textarea
                      id="reply"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      disabled={isTerminal}
                      className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-70"
                      placeholder={isTerminal ? 'This ticket no longer accepts replies.' : 'Type your reply...'}
                    />
                    <Button type="submit" disabled={submittingReply || isTerminal || !replyText.trim()}>
                      {submittingReply ? 'Sending...' : 'Send Reply'}
                    </Button>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
