import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { FolderOpenIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { fetchProjects } from '@/api/projects'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Project } from '@/types/project'
import DeleteProjectDialog from './DeleteProjectDialog'
import ProjectFormDialog from './ProjectFormDialog'
import StatusBadge from './StatusBadge'

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString('fr-FR') : '—'
}

function ProjectList() {
  const { data: projects, isPending, isError, error } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  })

  // L'état "ouvert" est séparé du projet édité : le titre de la modale
  // ne change pas pendant l'animation de fermeture
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | undefined>()
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)

  function openCreate() {
    setEditingProject(undefined)
    setIsFormOpen(true)
  }

  function openEdit(project: Project) {
    setEditingProject(project)
    setIsFormOpen(true)
  }

  let content
  if (isPending) {
    content = (
      <div className="grid gap-3">
        {[1, 2, 3].map((row) => (
          <Skeleton key={row} className="h-12 w-full" />
        ))}
      </div>
    )
  } else if (isError) {
    content = (
      <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
        Impossible de charger les projets : {error.message}
      </p>
    )
  } else if (projects.length === 0) {
    content = (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
        <FolderOpenIcon className="size-10 text-muted-foreground" />
        <div>
          <p className="font-medium">Aucun projet pour le moment</p>
          <p className="text-sm text-muted-foreground">
            Créez votre première étude pour commencer.
          </p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon /> Nouveau projet
        </Button>
      </div>
    )
  } else {
    content = (
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="hidden sm:table-cell">Début</TableHead>
              <TableHead className="hidden sm:table-cell">Créé le</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">
                  <Link to={`/projects/${project.id}`} className="hover:underline">
                    {project.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusBadge status={project.status} />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {formatDate(project.start_date)}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {formatDate(project.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Modifier ${project.title}`}
                    onClick={() => openEdit(project)}
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Supprimer ${project.title}`}
                    className="text-destructive hover:text-destructive"
                    onClick={() => setProjectToDelete(project)}
                  >
                    <Trash2Icon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projets</h1>
          <p className="text-sm text-muted-foreground">
            {projects ? `${projects.length} étude(s) de recherche` : 'Vos études de recherche'}
          </p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon /> Nouveau projet
        </Button>
      </div>

      {content}

      <ProjectFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        project={editingProject}
      />
      <DeleteProjectDialog
        project={projectToDelete}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
      />
    </section>
  )
}

export default ProjectList
