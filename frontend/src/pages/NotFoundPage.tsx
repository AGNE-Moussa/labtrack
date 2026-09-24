import { Link } from 'react-router'
import { FlaskConicalIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-muted/40 p-4 text-center">
      <FlaskConicalIcon className="size-10 text-muted-foreground" />
      <div>
        <p className="text-4xl font-semibold">404</p>
        <p className="text-muted-foreground">Cette page n’existe pas.</p>
      </div>
      <Button asChild>
        <Link to="/projects">Retour aux projets</Link>
      </Button>
    </div>
  )
}

export default NotFoundPage
