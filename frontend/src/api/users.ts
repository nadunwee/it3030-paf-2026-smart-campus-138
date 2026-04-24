import type { SpringPage } from './resource'
import type { UserRole } from '@/app/context/AuthContext'

export interface UserSummaryResponse {
  id: number
  username: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface UserRoleUpdateBody {
  role: Exclude<UserRole, 'ADMIN'>
}

export interface AdminUserCreateBody {
  username: string
  password: string
  role: Exclude<UserRole, 'ADMIN'>
}

export type UserPage = SpringPage<UserSummaryResponse>
