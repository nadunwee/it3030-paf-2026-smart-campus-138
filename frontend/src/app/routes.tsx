import { createBrowserRouter } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import FacilitiesCatalogue from './pages/FacilitiesCatalogue'
import ResourceDetail from './pages/ResourceDetail'
import ResourceForm from './pages/ResourceForm'
import BookingManagement from './pages/BookingManagement'
import MaintenanceTickets from './pages/MaintenanceTickets'
import UserManagement from './pages/UserManagement'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/signup',
    element: <Signup />,
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
  },
  {
    path: '/facilities',
    element: <FacilitiesCatalogue />,
  },
  {
    path: '/bookings',
    element: <BookingManagement />,
  },
  {
    path: '/tickets',
    element: <MaintenanceTickets />,
  },
  {
    path: '/admin/users',
    element: <UserManagement />,
  },
  {
    path: '/facilities/new',
    element: <ResourceForm />,
  },
  {
    path: '/facilities/:id',
    element: <ResourceDetail />,
  },
  {
    path: '/facilities/:id/edit',
    element: <ResourceForm />,
  },
  {
    path: '*',
    element: (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-4xl">404 - Page Not Found</h1>
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist.
          </p>
          <a href="/" className="text-primary hover:underline">
            Go back home
          </a>
        </div>
      </div>
    ),
  },
])
