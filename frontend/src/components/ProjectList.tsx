import { useEffect, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FolderOpenIcon,
  PencilIcon,
  PlusIcon,
  SearchXIcon,
  Trash2Icon,
} from 'lucide-react'
import { NotFoundError } from '@/api/errors'
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
import { useProjectListParams } from '@/hooks/useProjectListParams'
import { cn } from '@/lib/utils'
import type { Project } from '@/types/project'
import DeleteProjectDialog from './DeleteProjectDialog'
import ProjectFilters from './ProjectFilters'
import ProjectFormDialog from './ProjectFormDialog'
import ProjectStats from './ProjectStats'
import StatusBadge from './StatusBadge'

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString('fr-FR') : '—'
}

function ProjectList() {
  const { params, updateParams, resetFilters, hasFilters } = useProjectListParams()

  const { data, isPending, isError, error, isPlaceholderData } = useQuery({
    // Une entrée de cache par combinaison de filtres : revenir en arrière est instantané
    queryKey: ['projects', 'list', params],
    queryFn: () => fetchProjects(params),
    // Garde la page précédente affichée pendant le chargement de la suivante (pas de clignotement)
    placeholderData: keepPreviousData,
    retry: (failureCount, queryError) =>
      !(queryError instanceof NotFoundError) && failureCount < 3,
  })

  // Page devenue hors limites (ex. : dernier projet de la dernière page supprimé) :
  // on recule d'une page
  const pageOutOfRange = error instanceof NotFoundError && params.page > 1
  useEffect(() => {
    if (pageOutOfRange) {
      updateParams({ page: params.page - 1 }, { replace: true })
    }
  }, [pageOutOfRange, params.page, updateParams])

  // L'état "ouvert" est séparé du projet édité : le titre de la modale
  // ne change pas pendant l'animation de fermeture
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | undefined>()
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)

  // Change la key de ProjectFilters pour vider aussi le champ de recherche
  const [filtersVersion, setFiltersVersion] = useState(0)

  function handleResetFilters() {
    resetFilters()
    setFiltersVersion((version) => version + 1)
  }

  function openCreate() {
    setEditingProject(undefined)
    setIsFormOpen(true)
  }

  function openEdit(project: Project) {
    setEditingProject(project)
    setIsFormOpen(true)
  }

  let content
  if (isPending || pageOutOfRange) {
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
  } else if (data.count === 0 && hasFilters) {
    content = (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
        <SearchXIcon className="size-10 text-muted-foreground" />
        <div>
          <p className="font-medium">Aucun résultat pour ces filtres</p>
          <p className="text-sm text-muted-foreground">
            Essayez une autre recherche ou un autre statut.
          </p>
        </div>
        <Button variant="outline" onClick={handleResetFilters}>
          Réinitialiser les filtres
        </Button>
      </div>
    )
  } else if (data.count === 0) {
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
      <div className="grid gap-4">
        {/* Estompée pendant le chargement de la page suivante */}
        <div className={cn('rounded-xl border bg-card transition-opacity', isPlaceholderData && 'opacity-60')}>
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
              {data.results.map((project) => (
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

        {data.total_pages > 1 && (
          <nav aria-label="Pagination" className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Page {params.page} sur {data.total_pages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={data.previous === null || isPlaceholderData}
                onClick={() => updateParams({ page: params.page - 1 })}
              >
                <ChevronLeftIcon /> Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={data.next === null || isPlaceholderData}
                onClick={() => updateParams({ page: params.page + 1 })}
              >
                Suivant <ChevronRightIcon />
              </Button>
            </div>
          </nav>
        )}
      </div>
    )
  }

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projets</h1>
          <p className="text-sm text-muted-foreground">
            {data
              ? `${data.count} étude(s) ${hasFilters ? 'correspondant aux filtres' : 'de recherche'}`
              : 'Vos études de recherche'}
          </p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon /> Nouveau projet
        </Button>
      </div>

      <ProjectStats
        activeStatus={params.status}
        onSelect={(status) => updateParams({ status })}
      />

      <ProjectFilters
        key={filtersVersion}
        params={params}
        hasFilters={hasFilters}
        onChange={updateParams}
        onReset={handleResetFilters}
      />

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
