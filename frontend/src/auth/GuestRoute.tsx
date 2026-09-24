import { Navigate, Outlet, useLocation, type Location } from 'react-router'
import { useAuth } from './AuthContext'

// Pages réservées aux visiteurs (connexion, inscription) : une fois connecté,
// on repart vers la page demandée avant la redirection, sinon vers la liste.
function GuestRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (isAuthenticated) {
    const from = (location.state as { from?: Location } | null)?.from
    return <Navigate to={from ?? '/projects'} replace />
  }

  return <Outlet />
}

export default GuestRoute
