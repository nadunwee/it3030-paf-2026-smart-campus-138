import { useCallback, useEffect, useRef, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Building2, CalendarClock, ClipboardList, LogOut, Plus, Trash2, Users } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '@/api/client'
import type {
  NotificationPage,
  NotificationResponse,
  NotificationUnreadCountResponse,
} from '@/api/notification'

const NOTIFICATION_PAGE_SIZE = 8

function formatNotificationTime(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true })
}

export function Navbar() {
  const { user, logout, isAdmin, isStudent, isTeacher } = useAuth()
  const navigate = useNavigate()
  const panelRef = useRef<HTMLDivElement | null>(null)

  const [notifications, setNotifications] = useState<NotificationResponse[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [panelOpen, setPanelOpen] = useState(false)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [working, setWorking] = useState(false)

  const loadNotifications = useCallback(async () => {
    if (!user) return
    setLoadingNotifications(true)
    try {
      const [page, unread] = await Promise.all([
        apiFetch<NotificationPage>(`/api/v1/notifications?page=0&size=${NOTIFICATION_PAGE_SIZE}`),
        apiFetch<NotificationUnreadCountResponse>('/api/v1/notifications/unread/count'),
      ])
      setNotifications(page?.content ?? [])
      setUnreadCount(unread?.unreadCount ?? 0)
    } catch {
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoadingNotifications(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    void loadNotifications()

    const timer = window.setInterval(() => {
      void loadNotifications()
    }, 30000)

    return () => {
      window.clearInterval(timer)
    }
  }, [user, loadNotifications])

  useEffect(() => {
    if (!panelOpen) return
    const onClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setPanelOpen(false)
      }
    }
    window.addEventListener('mousedown', onClickOutside)
    return () => {
      window.removeEventListener('mousedown', onClickOutside)
    }
  }, [panelOpen])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const markNotificationRead = async (notificationId: number) => {
    try {
      const updated = await apiFetch<NotificationResponse>(`/api/v1/notifications/${notificationId}/read`, {
        method: 'PATCH',
      })
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.notificationId === notificationId
            ? { ...notification, isRead: updated?.isRead ?? true }
            : notification,
        ),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      // Keep the UX non-blocking for read updates.
    }
  }

  const openNotification = async (notification: NotificationResponse) => {
    if (!notification.isRead) {
      await markNotificationRead(notification.notificationId)
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl)
    }
    setPanelOpen(false)
  }

  const removeNotification = async (notification: NotificationResponse) => {
    setWorking(true)
    try {
      await apiFetch(`/api/v1/notifications/${notification.notificationId}`, { method: 'DELETE' })
      setNotifications((prev) =>
        prev.filter((item) => item.notificationId !== notification.notificationId),
      )
      if (!notification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } finally {
      setWorking(false)
    }
  }

  const clearAllNotifications = async () => {
    setWorking(true)
    try {
      await apiFetch('/api/v1/notifications', { method: 'DELETE' })
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setWorking(false)
    }
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <Link to="/dashboard" className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </span>
              <span className="hidden font-semibold tracking-tight sm:inline">SCH</span>
              <span className="font-semibold tracking-tight sm:hidden">SCH</span>
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  Home
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Link to="/facilities">
                <Button variant="ghost" size="sm">
                  Facilities
                </Button>
              </Link>
              <Link to="/bookings">
                <Button variant="ghost" size="sm" className="gap-2">
                  <CalendarClock className="h-4 w-4" />
                  Bookings
                </Button>
              </Link>
              {(isAdmin || isStudent || isTeacher) && (
                <Link to="/tickets">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Tickets
                  </Button>
                </Link>
              )}
              {isAdmin && (
                <>
                  <Link to="/admin/users">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Users className="h-4 w-4" />
                      <span>Users</span>
                    </Button>
                  </Link>
                  <Link to="/facilities/new">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      <span>Add Resource</span>
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user && (
              <>
                <div className="hidden items-center gap-2 sm:flex">
                  <span className="text-sm text-muted-foreground">{user.username}</span>
                  <Badge
                    variant={isAdmin ? 'default' : 'secondary'}
                    className="text-[11px] uppercase tracking-wide"
                  >
                    {user.role}
                  </Badge>
                </div>

                <div className="relative" ref={panelRef}>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Open notifications"
                    onClick={() => {
                      const nextOpen = !panelOpen
                      setPanelOpen(nextOpen)
                      if (nextOpen) {
                        void loadNotifications()
                      }
                    }}
                    className="relative"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Button>

                  {panelOpen && (
                    <div className="absolute right-0 top-12 z-50 w-[22rem] rounded-xl border border-border/80 bg-card p-2 shadow-xl">
                      <div className="mb-1 flex items-center justify-between px-2 py-1">
                        <p className="text-sm font-semibold">Notifications</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={working || notifications.length === 0}
                          onClick={() => {
                            void clearAllNotifications()
                          }}
                        >
                          Clear all
                        </Button>
                      </div>

                      <div className="max-h-[24rem] space-y-1 overflow-y-auto">
                        {loadingNotifications ? (
                          <p className="px-2 py-3 text-sm text-muted-foreground">Loading notifications...</p>
                        ) : notifications.length === 0 ? (
                          <p className="px-2 py-3 text-sm text-muted-foreground">No notifications</p>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.notificationId}
                              className={`group flex items-start gap-2 rounded-lg border p-2 ${
                                notification.isRead
                                  ? 'border-border/60 bg-background'
                                  : 'border-primary/25 bg-primary/5'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  void openNotification(notification)
                                }}
                                className="flex-1 text-left"
                              >
                                <p className="line-clamp-1 text-sm font-medium">{notification.title}</p>
                                <p className="line-clamp-2 text-xs text-muted-foreground">
                                  {notification.message}
                                </p>
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                  {formatNotificationTime(notification.createdAt)}
                                </p>
                              </button>
                              <div className="flex items-center gap-1">
                                {!notification.isRead && (
                                  <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
                                )}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 opacity-60 group-hover:opacity-100"
                                  disabled={working}
                                  aria-label="Remove notification"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    event.preventDefault()
                                    void removeNotification(notification)
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 pb-2 md:hidden">
          <Link to="/">
            <Button variant="ghost" size="sm">
              Home
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              Dashboard
            </Button>
          </Link>
          <Link to="/facilities">
            <Button variant="ghost" size="sm">
              Facilities
            </Button>
          </Link>
          <Link to="/bookings">
            <Button variant="ghost" size="sm" className="gap-1">
              Bookings
            </Button>
          </Link>
          {(isAdmin || isStudent || isTeacher) && (
            <Link to="/tickets">
              <Button variant="ghost" size="sm" className="gap-1">
                Tickets
              </Button>
            </Link>
          )}
          {isAdmin && (
            <>
              <Link to="/admin/users">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Users className="h-4 w-4" />
                  Users
                </Button>
              </Link>
              <Link to="/facilities/new">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
