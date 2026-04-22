import type { SpringPage } from './resource'

export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface BookingResponse {
  bookingId: number
  facilityId: number
  facilityName: string
  bookedByUserId: number
  bookedByUserName: string
  purpose: string
  durationMinutes: number
  bookedFrom: string
  bookedTo: string
  status: BookingStatus
  createdAt: string
  approvedAt: string | null
}

export interface BookingCreateBody {
  facilityId: number
  purpose: string
  durationMinutes: number
  bookedFrom: string
  bookedTo: string
}

export interface BookingDecisionBody {
  status: Exclude<BookingStatus, 'PENDING'>
}

export interface PendingCountResponse {
  pendingCount: number
}

export type BookingPage = SpringPage<BookingResponse>

export function buildBookingListQuery(params: {
  page: number
  size: number
  status?: BookingStatus
  facilityId?: number
  from?: string
  to?: string
}): string {
  const u = new URLSearchParams()
  u.set('page', String(params.page))
  u.set('size', String(params.size))
  if (params.status) u.set('status', params.status)
  if (params.facilityId != null) u.set('facilityId', String(params.facilityId))
  if (params.from) u.set('from', params.from)
  if (params.to) u.set('to', params.to)
  return u.toString()
}
