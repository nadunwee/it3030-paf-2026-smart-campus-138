import type { SpringPage } from './resource'

export type NotificationType =
  | 'BOOKING_REQUEST_SUBMITTED'
  | 'BOOKING_APPROVAL_REQUIRED'
  | 'BOOKING_APPROVED'
  | 'BOOKING_REJECTED'
  | 'TICKET_CREATED'
  | 'TICKET_ADMIN_REPLY'
  | 'TICKET_STUDENT_REPLY'
  | 'TICKET_RESOLVED'
  | 'TICKET_CLOSED'
  | 'SYSTEM'

export type RelatedEntityType = 'BOOKING' | 'TICKET' | 'SYSTEM'

export interface NotificationResponse {
  notificationId: number
  title: string
  message: string
  type: NotificationType
  relatedEntityType: RelatedEntityType | null
  relatedEntityId: number | null
  isRead: boolean
  createdAt: string
  actionUrl: string | null
  senderId: number | null
  senderName: string | null
}

export interface NotificationUnreadCountResponse {
  unreadCount: number
}

export interface BulkActionCountResponse {
  count: number
}

export type NotificationPage = SpringPage<NotificationResponse>
