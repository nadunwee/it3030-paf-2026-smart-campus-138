import type { SpringPage } from './resource'

export type TicketCategory = 'TECHNICAL' | 'FACILITY' | 'STUDENT_RELATED' | 'OTHER'
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH'
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
export type TicketSenderRole = 'STUDENT' | 'ADMIN'

export interface TicketResponse {
  ticketId: number
  studentId: number
  studentName: string
  category: TicketCategory
  subject: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  createdAt: string
  updatedAt: string
  closedAt: string | null
  assignedAdminId: number | null
}

export interface TicketMessageResponse {
  messageId: number
  senderId: number
  senderRole: TicketSenderRole
  senderName: string
  messageContent: string
  sentAt: string
}

export interface TicketDetailResponse {
  ticket: TicketResponse
  messages: TicketMessageResponse[]
}

export interface TicketCreateBody {
  category: TicketCategory
  subject: string
  description: string
  priority?: TicketPriority
}

export interface TicketReplyBody {
  messageText: string
}

export interface TicketStatusUpdateBody {
  status: Exclude<TicketStatus, 'CLOSED'>
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
