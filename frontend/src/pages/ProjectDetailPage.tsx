import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeftIcon, FolderXIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { NotFoundError } from '@/api/errors'
import { fetchProject } from '@/api/projects'
import DeleteProjectDialog from '@/components/DeleteProjectDialog'
import ProjectFormDialog from '@/components/ProjectFormDialog'
import StatusBadge from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Project } from '@/types/project'

function formatDate(value: string | null, withTime = false): string {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  return withTime
    ? date.toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })
    : date.toLocaleDateString('fr-FR', { dateStyle: 'long' })
}

function BackLink() {
  return (
    <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
      <Link to="/projects">
        <ArrowLeftIcon /> Projets
      </Link>
    </Button>
  )
}

function ProjectDetailPage() {
  const params = useParams()
  const id = Number(params.id)
  const navigate = useNavigate()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)

  const { data: project, isPending, isError, error } = useQuery({
    // Préfixe ['projects'] : les invalidations de la liste rafraîchissent aussi cette page
    queryKey: ['projects', id],
    queryFn: () => fetchProject(id),
    // Un id non numérique (/projects/abc) ne part même pas vers l'API
    enabled: Number.isInteger(id),
    // Inutile de réessayer un 404 : le projet n'apparaîtra pas entre deux essais
    retry: (failureCount, queryError) =>
      !(queryError instanceof NotFoundError) && failureCount < 3,
  })

  if (!Number.isInteger(id) || (isError && error instanceof NotFoundError)) {
    return (
      <div className="grid gap-6">
        <BackLink />
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
          <FolderXIcon className="size-10 text-muted-foreground" />
          <p className="font-medium">Projet introuvable</p>
          <p className="text-sm text-muted-foreground">
            Il a peut-être été supprimé, ou il ne vous appartient pas.
          </p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="grid gap-6">
        <BackLink />
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
          Impossible de charger le projet : {error.message}
        </p>
      </div>
    )
  }

  if (isPending) {
    return (
      <div className="grid gap-6">
        <BackLink />
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <BackLink />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{project.title}</h1>
          <StatusBadge status={project.status} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsFormOpen(true)}>
            <PencilIcon /> Modifier
          </Button>
          <Button variant="destructive" onClick={() => setProjectToDelete(project)}>
            <Trash2Icon /> Supprimer
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            {project.description ? (
              // whitespace-pre-line conserve les retours à la ligne saisis
              <p className="whitespace-pre-line">{project.description}</p>
            ) : (
              <p className="text-muted-foreground italic">Aucune description.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Date de début</dt>
                <dd className="font-medium">{formatDate(project.start_date)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Créé le</dt>
                <dd className="font-medium">{formatDate(project.created_at, true)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Modifié le</dt>
                <dd className="font-medium">{formatDate(project.updated_at, true)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <ProjectFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} project={project} />
      <DeleteProjectDialog
        project={projectToDelete}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
        // Le projet n'existe plus : on quitte sa page
        onDeleted={() => navigate('/projects', { replace: true })}
      />
    </div>
  )
}

export default ProjectDetailPage
