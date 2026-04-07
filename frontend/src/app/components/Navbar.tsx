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
    <nav className="border-b bg-background/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-semibold hidden sm:inline">
                Smart Campus Operations Hub
              </span>
              <span className="font-semibold sm:hidden">SCOH</span>
            </Link>
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
                  <span className="hidden sm:inline">Add Resource</span>
                </Button>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm hidden sm:inline">{user.username}</span>
                  <Badge
                    variant={isAdmin ? 'default' : 'secondary'}
                    className="text-xs"
                    title={
                      isAdmin
                        ? 'Administrator: full access including create, edit, and delete resources'
                        : 'Standard user: browse and view facilities only'
                    }
                  >
                    {user.role}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
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
      </div>
    </nav>
  )
}
