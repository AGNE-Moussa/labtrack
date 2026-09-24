import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router'
import { FlaskConicalIcon, LogOutIcon, UserIcon } from 'lucide-react'
import { fetchCurrentUser } from '@/api/accounts'
import { useAuth } from '@/auth/AuthContext'
import { Button } from '@/components/ui/button'

function AppShell({ children }: { children: ReactNode }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: fetchCurrentUser })

  // Déconnexion volontaire : retour à /login sans mémoriser la page courante
  // (le prochain utilisateur ne doit pas atterrir sur un projet de celui-ci)
  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-svh bg-muted/40">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to="/projects" className="flex items-center gap-2 font-semibold">
            <FlaskConicalIcon className="size-5 text-primary" />
            LabTrack
          </Link>
          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
                <UserIcon className="size-4" />
                {user.username}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOutIcon /> Se déconnecter
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}

export default AppShell
