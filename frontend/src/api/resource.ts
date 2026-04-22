export type ResourceType = 'LECTURE_HALL' | 'LAB' | 'MEETING_ROOM' | 'EQUIPMENT'
export type ResourceStatus = 'ACTIVE' | 'OUT_OF_SERVICE'

export interface AvailabilityWindowResponse {
  startDateTime: string
  endDateTime: string
}

export interface ResourceResponse {
  id: number
  type: ResourceType
  capacity: number
  location: string
  status: ResourceStatus
  availabilityWindows: AvailabilityWindowResponse[]
}

export interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface AvailabilityWindowRequest {
  startDateTime: string
  endDateTime: string
}

export interface ResourceCreateBody {
  type: ResourceType
  capacity: number
  location: string
  status: ResourceStatus
  availabilityWindows?: AvailabilityWindowRequest[]
}

export type ResourcePatchBody = Partial<ResourceCreateBody>

export const facilityTypeLabels: Record<ResourceType, string> = {
  LECTURE_HALL: 'Lecture Hall',
  LAB: 'Lab',
  MEETING_ROOM: 'Meeting Room',
  EQUIPMENT: 'Equipment',
}

export function resourceTitle(r: ResourceResponse): string {
  return `Resource #${r.id} · ${facilityTypeLabels[r.type]} · ${r.location}`
}

export function resourceShortTitle(r: ResourceResponse): string {
  return `${facilityTypeLabels[r.type]} · ${r.location}`
}

export function buildListQuery(params: {
  page: number
  size: number
  type?: string
  capacityMin?: number
  location?: string
  status?: string
  availableOn?: string
  availableFrom?: string
  availableTo?: string
}): string {
  const u = new URLSearchParams()
  u.set('page', String(params.page))
  u.set('size', String(params.size))
  if (params.type && params.type !== 'ALL') u.set('type', params.type)
  if (params.capacityMin != null && params.capacityMin > 0) {
    u.set('capacityMin', String(params.capacityMin))
  }
  const loc = params.location?.trim()
  if (loc) u.set('location', loc)
  if (params.status && params.status !== 'ALL') u.set('status', params.status)
  if (params.availableOn) u.set('availableOn', params.availableOn)
  if (params.availableFrom) u.set('availableFrom', params.availableFrom)
  if (params.availableTo) u.set('availableTo', params.availableTo)
  return u.toString()
}

export function toCreateBody(input: {
  type: ResourceType
  capacity: number
  location: string
  status: ResourceStatus
  windows: { startDateTime: string; endDateTime: string }[]
}): ResourceCreateBody {
  return {
    type: input.type,
    capacity: input.capacity,
    location: input.location.trim(),
    status: input.status,
    availabilityWindows:
      input.windows.length > 0
        ? input.windows.map((w) => ({
            startDateTime: w.startDateTime,
            endDateTime: w.endDateTime,
          }))
        : undefined,
  }
}

export function toPatchBody(input: {
  type?: ResourceType
  capacity?: number
  location?: string
  status?: ResourceStatus
  windows?: { startDateTime: string; endDateTime: string }[]
}): ResourcePatchBody {
  const body: ResourcePatchBody = {}
  if (input.type != null) body.type = input.type
  if (input.capacity != null) body.capacity = input.capacity
  if (input.location != null) body.location = input.location.trim()
  if (input.status != null) body.status = input.status
  if (input.windows != null) {
    body.availabilityWindows = input.windows.map((w) => ({
      startDateTime: w.startDateTime,
      endDateTime: w.endDateTime,
    }))
  }
  return body
}
