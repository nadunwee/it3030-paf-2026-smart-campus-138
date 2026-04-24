import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Navigate } from 'react-router-dom'
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
import { toast } from '@/toast/store'
import {
  buildTicketAdminQuery,
  ticketCategoryLabels,
  type TicketCategory,
  type TicketDetailResponse,
  type TicketPage,
  type TicketPriority,
  type TicketStatus,
} from '@/api/ticket'

const PAGE_SIZE = 12

function statusColor(status: TicketStatus): string {
  if (status === 'OPEN') return 'bg-[#efece5] text-[#6e5b2f] border-[#d8caa4]'
  if (status === 'IN_PROGRESS') return 'bg-[#e7f0fb] text-[#1f4f7f] border-[#bdd4ea]'
  if (status === 'RESOLVED') return 'bg-[#e6f3e8] text-[#2c6b3f] border-[#b8dbc2]'
  return 'bg-[#f3f3f3] text-[#555] border-[#ddd]'
}

function formatDateTime(iso: string): string {
  return format(new Date(iso), 'MMM d, yyyy h:mm a')
}

export default function MaintenanceTickets() {
  const { user, isAdmin, isStudent } = useAuth()

  const [ticketsPage, setTicketsPage] = useState<TicketPage | null>(null)
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)
  const [selectedTicketDetail, setSelectedTicketDetail] = useState<TicketDetailResponse | null>(null)
  const [loadingTickets, setLoadingTickets] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [submittingCreate, setSubmittingCreate] = useState(false)
  const [submittingReply, setSubmittingReply] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const [adminStatusFilter, setAdminStatusFilter] = useState<'ALL' | TicketStatus>('ALL')
  const [adminCategoryFilter, setAdminCategoryFilter] = useState<'ALL' | TicketCategory>('ALL')
  const [adminPriorityFilter, setAdminPriorityFilter] = useState<'ALL' | TicketPriority>('ALL')

  const [newCategory, setNewCategory] = useState<TicketCategory>('TECHNICAL')
  const [newSubject, setNewSubject] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPriority, setNewPriority] = useState<TicketPriority>('MEDIUM')

  const [replyText, setReplyText] = useState('')

  const ticketRows = ticketsPage?.content ?? []
  const totalPages = ticketsPage?.totalPages ?? 0

  const fetchTickets = useCallback(async () => {
    setLoadingTickets(true)
    try {
      const endpoint = isAdmin
        ? `/api/v1/tickets?${buildTicketAdminQuery({
            page: currentPage - 1,
            size: PAGE_SIZE,
            status: adminStatusFilter,
            category: adminCategoryFilter,
            priority: adminPriorityFilter,
          })}`
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

  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (!isAdmin && !isStudent) {
    return <Navigate to="/dashboard" replace />
  }

  const selectedTicket = selectedTicketDetail?.ticket ?? null
  const isClosed = selectedTicket?.status === 'CLOSED'

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubject.trim() || !newDescription.trim()) {
      toast.error('Subject and description are required')
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
          priority: newPriority,
        }),
      })
      toast.success('Ticket created')
      setNewSubject('')
      setNewDescription('')
      setSelectedTicketId(created?.ticket.ticketId ?? null)
      await fetchTickets()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create ticket')
    } finally {
      setSubmittingCreate(false)
    }
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTicket || !replyText.trim()) {
      return
    }
    if (selectedTicket.status === 'CLOSED') {
      toast.error('Cannot reply to a closed ticket')
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
    setUpdatingStatus(true)
    try {
      await apiFetch(`/api/v1/tickets/${selectedTicket.ticketId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      toast.success(`Ticket marked as ${status}`)
      await Promise.all([fetchTickets(), fetchTicketDetail(selectedTicket.ticketId)])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update status')
    } finally {
      setUpdatingStatus(false)
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

  const renderStatusActions = () => {
    if (!selectedTicket) return null

    if (isAdmin) {
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={updatingStatus || selectedTicket.status === 'OPEN'}
            onClick={() => void updateTicketStatus('OPEN')}
          >
            Set OPEN
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={updatingStatus || selectedTicket.status === 'IN_PROGRESS'}
            onClick={() => void updateTicketStatus('IN_PROGRESS')}
          >
            Set IN_PROGRESS
          </Button>
          <Button
            size="sm"
            disabled={updatingStatus || selectedTicket.status === 'RESOLVED'}
            onClick={() => void updateTicketStatus('RESOLVED')}
          >
            Mark RESOLVED
          </Button>
        </div>
      )
    }

    return (
      <Button
        size="sm"
        disabled={updatingStatus || selectedTicket.status !== 'RESOLVED'}
        onClick={() => void closeTicket()}
      >
        Close Ticket
      </Button>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
          <h1>Maintenance & Tickets</h1>
          <p className="mt-2 text-muted-foreground">
            {isAdmin
              ? 'Review submitted tickets, reply in thread, and manage status.'
              : 'Create support tickets, communicate with admin, and close when resolved.'}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            {!isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>Create New Ticket</CardTitle>
                  <CardDescription>
                    Submit technical, facility, student-related, or other support issues.
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
                        <Label htmlFor="student-id">Student ID</Label>
                        <Input
                          id="student-id"
                          value={user.id == null ? 'Resolved by server' : String(user.id)}
                          readOnly
                          disabled
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="student-name">Student Name</Label>
                        <Input id="student-name" value={user.username} readOnly disabled />
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

                    <Button type="submit" disabled={submittingCreate} className="w-full">
                      {submittingCreate ? 'Submitting...' : 'Create Ticket'}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      `createdAt` and `updatedAt` are set automatically when the ticket is submitted.
                    </p>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>{isAdmin ? 'All Tickets' : 'My Tickets'}</CardTitle>
                <CardDescription>
                  {isAdmin
                    ? 'Filter and open tickets to view full threaded conversation.'
                    : 'Open a ticket to view and continue the conversation.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isAdmin && (
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
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Priority</TableHead>
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
                            <TableCell className="max-w-[260px] truncate">{ticket.subject}</TableCell>
                            <TableCell>{ticketCategoryLabels[ticket.category]}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={statusColor(ticket.status)}>
                                {ticket.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{ticket.priority}</TableCell>
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
                View conversation in chronological order and reply in the same thread.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedTicket ? (
                <p className="text-sm text-muted-foreground">Select a ticket to view details.</p>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border/80 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">#{selectedTicket.ticketId} · {selectedTicket.subject}</p>
                      <Badge variant="secondary" className={statusColor(selectedTicket.status)}>
                        {selectedTicket.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ticketCategoryLabels[selectedTicket.category]} · Priority {selectedTicket.priority}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Created {formatDateTime(selectedTicket.createdAt)} · Updated {formatDateTime(selectedTicket.updatedAt)}
                    </p>
                  </div>

                  <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-lg border border-border/80 p-3">
                    {loadingDetail ? (
                      <p className="text-sm text-muted-foreground">Loading thread...</p>
                    ) : selectedTicketDetail?.messages.length ? (
                      selectedTicketDetail.messages.map((message) => (
                        <div key={message.messageId} className="rounded-md border border-border/70 bg-muted/20 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">
                              {message.senderName} ({message.senderRole})
                            </p>
                            <p className="text-xs text-muted-foreground">{formatDateTime(message.sentAt)}</p>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-sm">{message.messageContent}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No messages in this thread.</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">{renderStatusActions()}</div>

                  <form className="space-y-2" onSubmit={handleReply}>
                    <Label htmlFor="reply">Reply</Label>
                    <textarea
                      id="reply"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      disabled={isClosed}
                      className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-70"
                      placeholder={isClosed ? 'Ticket is closed. Reopen to continue thread.' : 'Type your reply...'}
                    />
                    <Button type="submit" disabled={submittingReply || isClosed || !replyText.trim()}>
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
