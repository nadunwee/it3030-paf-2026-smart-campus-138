import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { format } from 'date-fns'
import { Navbar } from '../components/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '@/api/client'
import { toast } from '@/toast/store'
import type { UserPage, UserSummaryResponse } from '@/api/users'
import type { UserRole } from '../context/AuthContext'

function formatTimestamp(iso: string): string {
  return format(new Date(iso), 'MMM d, yyyy h:mm a')
}

export default function UserManagement() {
  const { user, isAdmin } = useAuth()
  const [users, setUsers] = useState<UserSummaryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRoles, setSelectedRoles] = useState<Record<number, UserRole>>({})
  const [savingUserId, setSavingUserId] = useState<number | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null)
  const [creatingUser, setCreatingUser] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<Exclude<UserRole, 'ADMIN'>>('STUDENT')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const response = await apiFetch<UserPage>('/api/v1/admin/users?page=0&size=100')
      const rows = response?.content ?? []
      setUsers(rows)
      setSelectedRoles(
        rows.reduce<Record<number, UserRole>>((acc, row) => {
          acc[row.id] = row.role
          return acc
        }, {}),
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load users')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    void loadUsers()
  }, [isAdmin, loadUsers])

  const rowCountLabel = useMemo(() => {
    if (loading) return 'Loading users...'
    return `${users.length} user${users.length === 1 ? '' : 's'}`
  }, [loading, users.length])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUsername.trim()) {
      toast.error('Username is required')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setCreatingUser(true)
    try {
      await apiFetch<UserSummaryResponse>('/api/v1/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword,
          role: newRole,
        }),
      })
      toast.success('User added successfully')
      setNewUsername('')
      setNewPassword('')
      setNewRole('STUDENT')
      await loadUsers()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create user')
    } finally {
      setCreatingUser(false)
    }
  }

  const saveRoleChange = async (target: UserSummaryResponse) => {
    const selectedRole = selectedRoles[target.id]
    if (!selectedRole || selectedRole === target.role || selectedRole === 'ADMIN') {
      return
    }

    setSavingUserId(target.id)
    try {
      const updated = await apiFetch<UserSummaryResponse>(`/api/v1/admin/users/${target.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: selectedRole }),
      })
      setUsers((prev) =>
        prev.map((item) => (item.id === target.id && updated ? updated : item)),
      )
      toast.success(`Updated ${target.username} to ${selectedRole}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update role')
      setSelectedRoles((prev) => ({ ...prev, [target.id]: target.role }))
    } finally {
      setSavingUserId(null)
    }
  }

  const deleteUser = async (target: UserSummaryResponse) => {
    if (target.role === 'ADMIN') {
      toast.error('Admin users cannot be deleted')
      return
    }
    const confirmed = window.confirm(`Delete user "${target.username}"? This action cannot be undone.`)
    if (!confirmed) {
      return
    }

    setDeletingUserId(target.id)
    try {
      await apiFetch(`/api/v1/admin/users/${target.id}`, { method: 'DELETE' })
      setUsers((prev) => prev.filter((userItem) => userItem.id !== target.id))
      setSelectedRoles((prev) => {
        const next = { ...prev }
        delete next[target.id]
        return next
      })
      toast.success(`Deleted ${target.username}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete user')
    } finally {
      setDeletingUserId(null)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
          <h1>Access Control</h1>
          <p className="mt-2 text-muted-foreground">
            Add users, update user roles, and remove user accounts as needed.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{rowCountLabel}</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add User</CardTitle>
            <CardDescription>Create a new STUDENT or TEACHER account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-4" onSubmit={createUser}>
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="new-username">Username</Label>
                <Input
                  id="new-username"
                  value={newUsername}
                  onChange={(event) => setNewUsername(event.target.value)}
                  maxLength={64}
                />
              </div>
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="new-password">Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  maxLength={128}
                />
              </div>
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="new-role">Role</Label>
                <Select value={newRole} onValueChange={(value) => setNewRole(value as Exclude<UserRole, 'ADMIN'>)}>
                  <SelectTrigger id="new-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">STUDENT</SelectItem>
                    <SelectItem value="TEACHER">TEACHER</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full" disabled={creatingUser}>
                  {creatingUser ? 'Creating...' : 'Add User'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              Admin can update or remove non-admin user accounts.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Change Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((account) => {
                    const selectedRole = selectedRoles[account.id] ?? account.role
                    const isRoleEditable = account.role !== 'ADMIN'
                    const hasPendingChange = selectedRole !== account.role
                    const isSaving = savingUserId === account.id

                    return (
                      <TableRow key={account.id}>
                        <TableCell className="font-mono text-sm">{account.id}</TableCell>
                        <TableCell>{account.username}</TableCell>
                        <TableCell>
                          <Badge variant={account.role === 'ADMIN' ? 'default' : 'secondary'}>
                            {account.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-45">
                          <Select
                            value={selectedRole}
                            disabled={!isRoleEditable || isSaving}
                            onValueChange={(value) =>
                              setSelectedRoles((prev) => ({
                                ...prev,
                                [account.id]: value as UserRole,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="STUDENT">STUDENT</SelectItem>
                              <SelectItem value="TEACHER">TEACHER</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{formatTimestamp(account.createdAt)}</TableCell>
                        <TableCell>{formatTimestamp(account.updatedAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              disabled={!isRoleEditable || !hasPendingChange || isSaving}
                              onClick={() => {
                                void saveRoleChange(account)
                              }}
                            >
                              {isSaving ? 'Saving...' : 'Save'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!isRoleEditable || deletingUserId === account.id}
                              onClick={() => {
                                void deleteUser(account)
                              }}
                            >
                              {deletingUserId === account.id ? 'Deleting...' : 'Delete'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
