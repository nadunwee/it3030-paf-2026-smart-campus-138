import type { SpringPage } from './resource'

export type TicketCategory = 'TECHNICAL' | 'FACILITY' | 'STUDENT_RELATED' | 'OTHER'
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH'
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REJECTED'
export type TicketSenderRole = 'STUDENT' | 'ADMIN' | 'STAFF'

export interface TicketAttachmentBody {
  fileName: string
  contentType: string
  dataUrl: string
}

export interface TicketAttachmentResponse extends TicketAttachmentBody {
  attachmentId: number
  uploadedAt: string
}

export interface TicketResponse {
  ticketId: number
  studentId: number
  studentName: string
  category: TicketCategory
  subject: string
  description: string
  resourceId: number | null
  resourceLabel: string | null
  location: string | null
  preferredContactDetails: string | null
  status: TicketStatus
  priority: TicketPriority
  createdAt: string
  updatedAt: string
  closedAt: string | null
  resolutionNotes: string | null
  rejectionReason: string | null
  assignedAdminId: number | null
  assignedStaffId: number | null
  assignedStaffName: string | null
  attachmentCount: number
}

export interface TicketMessageResponse {
  messageId: number
  senderId: number
  senderRole: TicketSenderRole
  senderName: string
  messageContent: string
  sentAt: string
  editedAt: string | null
}

export interface TicketDetailResponse {
  ticket: TicketResponse
  messages: TicketMessageResponse[]
  attachments: TicketAttachmentResponse[]
}

export interface TicketCreateBody {
  category: TicketCategory
  subject: string
  description: string
  resourceId?: number
  location?: string
  preferredContactDetails: string
  priority?: TicketPriority
  attachments?: TicketAttachmentBody[]
}

export interface TicketReplyBody {
  messageText: string
}

export interface TicketStatusUpdateBody {
  status: Exclude<TicketStatus, 'CLOSED'>
  resolutionNotes?: string
  reason?: string
}

export interface TicketAssignmentBody {
  assignedStaffId: number | null
}

export interface TicketOpenCountResponse {
  openCount: number
}

export type TicketPage = SpringPage<TicketResponse>

export function buildTicketAdminQuery(params: {
  page: number
  size: number
  status?: TicketStatus | 'ALL'
  category?: TicketCategory | 'ALL'
  priority?: TicketPriority | 'ALL'
}): string {
  const u = new URLSearchParams()
  u.set('page', String(params.page))
  u.set('size', String(params.size))
  if (params.status && params.status !== 'ALL') u.set('status', params.status)
  if (params.category && params.category !== 'ALL') u.set('category', params.category)
  if (params.priority && params.priority !== 'ALL') u.set('priority', params.priority)
  return u.toString()
}

export const ticketCategoryLabels: Record<TicketCategory, string> = {
  TECHNICAL: 'Technical',
  FACILITY: 'Facility',
  STUDENT_RELATED: 'Student Related',
  OTHER: 'Other',
}
