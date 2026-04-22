const STORAGE_KEY = 'sc_basic_auth'

export type StoredRole = 'ADMIN' | 'STUDENT' | 'TEACHER'

export function getApiBase(): string {
  const v = import.meta.env.VITE_API_BASE_URL
  return (typeof v === 'string' ? v.replace(/\/$/, '') : '') || ''
}

export function getStoredAuth(): {
  userId?: number
  username: string
  token: string
  role?: StoredRole
} | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as {
      userId?: number
      username: string
      token: string
      role?: StoredRole
    }
  } catch {
    return null
  }
}

export function setStoredAuth(
  userId: number | undefined,
  username: string,
  password: string,
  role: StoredRole,
): void {
  const token = btoa(`${username}:${password}`)
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ userId, username, token, role }),
  )
}

export function clearStoredAuth(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}

export function updateStoredRole(role: StoredRole): void {
  const current = getStoredAuth()
  if (!current) return
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      userId: current.userId,
      username: current.username,
      token: current.token,
      role,
    }),
  )
}

export function authHeaderFromStored(): Record<string, string> {
  const s = getStoredAuth()
  if (!s?.token) return {}
  return { Authorization: `Basic ${s.token}` }
}

function storedRoleOrUser(): StoredRole {
  return getStoredAuth()?.role ?? 'STUDENT'
}

/** Prefer session role from /api/v1/auth/me; falls back to STUDENT if missing (legacy session). */
export function isAdminFromStored(): boolean {
  return storedRoleOrUser() === 'ADMIN'
}

async function parseError(res: Response): Promise<string> {
  const text = await res.text()
  try {
    const j = JSON.parse(text) as { message?: string; error?: string }
    return j.message || j.error || text || res.statusText
  } catch {
    return text || res.statusText
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T | null> {
  const base = getApiBase()
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...authHeaderFromStored(),
    ...(options.headers as Record<string, string> | undefined),
  }
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(url, { ...options, headers })
  if (res.status === 401) {
    clearStoredAuth()
    throw new Error('Session expired or invalid credentials.')
  }
  if (res.status === 403) {
    const msg = await parseError(res)
    const hint = 'You do not have permission to access this action.'
    throw new Error(
      msg && msg !== 'Forbidden' && !msg.toLowerCase().includes('access denied')
        ? msg
        : hint,
    )
  }
  if (!res.ok) {
    const msg = await parseError(res)
    throw new Error(msg)
  }
  if (res.status === 204) return null
  const ct = res.headers.get('content-type')
  if (ct && ct.includes('application/json')) {
    return res.json() as Promise<T>
  }
  return res.text() as unknown as T
}

export type MeResponse = { id: number; username: string; role: StoredRole }

export async function verifyCredentials(
  username: string,
  password: string,
): Promise<void> {
  const normalizedUsername = username.trim()
  const token = btoa(`${normalizedUsername}:${password}`)
  const base = getApiBase()
  const url = `${base}/api/v1/auth/me`
  const res = await fetch(url, {
    headers: { Authorization: `Basic ${token}`, Accept: 'application/json' },
  })
  if (res.status === 401) {
    throw new Error('Invalid username or password.')
  }
  if (!res.ok) {
    const msg = await parseError(res)
    throw new Error(msg)
  }
  const me = (await res.json()) as MeResponse
  const role: StoredRole = me.role
  setStoredAuth(me.id, normalizedUsername, password, role)
}

export async function registerAccount(
  username: string,
  password: string,
): Promise<void> {
  const base = getApiBase()
  const url = `${base}/api/v1/auth/register`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ username: username.trim(), password }),
  })
  if (res.status === 409) {
    throw new Error('That username is already taken.')
  }
  if (res.status === 400) {
    const msg = await parseError(res)
    throw new Error(msg || 'Invalid registration details.')
  }
  if (!res.ok) {
    const msg = await parseError(res)
    throw new Error(msg)
  }
}

export async function getCurrentSessionUser(): Promise<MeResponse | null> {
  return apiFetch<MeResponse>('/api/v1/auth/me')
}
