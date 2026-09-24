import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FlaskConicalIcon, LogOutIcon, UserIcon } from 'lucide-react'
import { fetchCurrentUser } from '@/api/accounts'
import { useAuth } from '@/auth/AuthContext'
import { Button } from '@/components/ui/button'

function AppShell({ children }: { children: ReactNode }) {
  const { logout } = useAuth()
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: fetchCurrentUser })

  return (
    <div className="min-h-svh bg-muted/40">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold">
            <FlaskConicalIcon className="size-5 text-primary" />
            LabTrack
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
                <UserIcon className="size-4" />
                {user.username}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={logout}>
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
