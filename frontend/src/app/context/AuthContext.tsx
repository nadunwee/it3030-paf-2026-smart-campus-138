import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  clearStoredAuth,
  getStoredAuth,
  loginWithGoogleIdToken,
  verifyCredentials,
  type StoredRole,
} from '@/api/client'

export type UserRole = 'USER' | 'ADMIN'

interface User {
  username: string
  role: UserRole
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<void>
  loginWithGoogle: (idToken: string) => Promise<void>
  logout: () => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function userFromStorage(): User | null {
  const s = getStoredAuth()
  if (!s?.username) return null
  const role: UserRole = s.role === 'ADMIN' ? 'ADMIN' : 'USER'
  return {
    username: s.username,
    role,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => userFromStorage())

  const login = useCallback(async (username: string, password: string) => {
    await verifyCredentials(username, password)
    const s = getStoredAuth()
    const role: StoredRole = s?.role === 'ADMIN' ? 'ADMIN' : 'USER'
    setUser({
      username,
      role,
    })
  }, [])

  const loginWithGoogle = useCallback(async (idToken: string) => {
    await loginWithGoogleIdToken(idToken)
    const s = getStoredAuth()
    if (!s?.username) {
      throw new Error('Google sign-in could not establish a session.')
    }
    setUser({
      username: s.username,
      role: s.role === 'ADMIN' ? 'ADMIN' : 'USER',
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
