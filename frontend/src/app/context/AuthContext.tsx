import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  clearStoredAuth,
  getCurrentSessionUser,
  getStoredAuth,
  loginWithGoogleIdToken,
  updateStoredRole,
  verifyCredentials,
  type StoredRole,
} from '@/api/client'

export type UserRole = 'ADMIN' | 'STUDENT' | 'TEACHER'

interface User {
  id?: number
  username: string
  role: UserRole
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<void>
  loginWithGoogle: (idToken: string) => Promise<void>
  logout: () => void
  isAdmin: boolean
  isStudent: boolean
  isTeacher: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function userFromStorage(): User | null {
  const s = getStoredAuth()
  if (!s?.username) return null
  const role: UserRole = s.role ?? 'STUDENT'
  return {
    id: s.userId,
    username: s.username,
    role,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => userFromStorage())
  const username = user?.username

  useEffect(() => {
    if (!username) return
    let cancelled = false
    ;(async () => {
      try {
        const me = await getCurrentSessionUser()
        if (!me || cancelled) return
        updateStoredRole(me.role)
        setUser((current) => {
          if (!current) return current
          if (
            current.id === me.id &&
            current.username === me.username &&
            current.role === me.role
          ) {
            return current
          }
          return {
            id: me.id,
            username: me.username,
            role: me.role,
          }
        })
      } catch {
        // Keep local session state; API layer handles 401 cleanup.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [username])

  const login = useCallback(async (username: string, password: string) => {
    const normalizedUsername = username.trim()
    await verifyCredentials(normalizedUsername, password)
    const s = getStoredAuth()
    const role: StoredRole = s?.role ?? 'STUDENT'
    setUser({
      id: s?.userId,
      username: normalizedUsername,
      role,
    })
  }, [])

  const loginWithGoogle = useCallback(async (idToken: string) => {
    await loginWithGoogleIdToken(idToken)
    const s = getStoredAuth()
    if (!s?.username || !s.role) {
      throw new Error('Google login failed. Please try again.')
    }
    setUser({
      id: s.userId,
      username: s.username,
      role: s.role,
    })
  }, [])

  const logout = useCallback(() => {
    clearStoredAuth()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      login,
      loginWithGoogle,
      logout,
      isAdmin: user?.role === 'ADMIN',
      isStudent: user?.role === 'STUDENT',
      isTeacher: user?.role === 'TEACHER',
    }),
    [user, login, loginWithGoogle, logout],
  )

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
