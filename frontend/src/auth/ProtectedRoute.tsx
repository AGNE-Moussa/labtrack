import { Navigate, Outlet, useLocation } from 'react-router'
import AppShell from '@/components/layout/AppShell'
import { useAuth } from './AuthContext'

// Pages réservées aux utilisateurs connectés (≈ access_control IS_AUTHENTICATED_FULLY).
// On mémorise la page demandée pour y revenir après la connexion.
function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

export default ProtectedRoute
