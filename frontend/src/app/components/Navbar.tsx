import { Link, useNavigate } from 'react-router-dom'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Building2, LogOut, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
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
              <span className="hidden font-semibold tracking-tight sm:inline">
                SCH
              </span>
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
              {isAdmin && (
                <Link to="/facilities/new">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Add Resource</span>
                  </Button>
                </Link>
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2"
                >
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
          {isAdmin && (
            <Link to="/facilities/new">
              <Button variant="ghost" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
