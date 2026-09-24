import type { ReactNode } from 'react'
import { FlaskConicalIcon } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type AuthCardProps = {
  description: string
  children: ReactNode
  // Lien vers l'autre écran (connexion <-> inscription)
  footer: ReactNode
}

// Carte centrée commune aux écrans de connexion et d'inscription
function AuthCard({ description, children, footer }: AuthCardProps) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <FlaskConicalIcon className="mx-auto size-8 text-primary" />
          <CardTitle className="text-xl">LabTrack</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          {footer}
        </CardFooter>
      </Card>
    </div>
  )
}

export default AuthCard
