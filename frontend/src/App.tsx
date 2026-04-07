import { RouterProvider } from 'react-router-dom'
import { AppToaster } from './app/components/AppToaster'
import { AuthProvider } from './app/context/AuthContext'
import { router } from './app/routes'

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <AppToaster />
    </AuthProvider>
  )
}
