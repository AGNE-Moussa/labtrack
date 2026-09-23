import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteProject, fetchProjects } from '../api/projects'
import type { Project, ProjectStatus } from '../types/project'

// Mêmes libellés que Project.Status (TextChoices) côté Django
const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Brouillon',
  active: 'En cours',
  closed: 'Terminé',
}

function ProjectList() {
  const { data: projects, isPending, isError, error } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  })

  const queryClient = useQueryClient()
  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    // Le cache ["projects"] est périmé : on force un nouveau GET de la liste
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
    onError: (error) => window.alert(error.message),
  })

  function handleDelete(project: Project) {
    if (window.confirm(`Supprimer le projet « ${project.title} » ?`)) {
      deleteMutation.mutate(project.id)
    }
  }

  if (isPending) {
    return <p>Chargement des projets…</p>
  }

  if (isError) {
    return <p role="alert">Impossible de charger les projets : {error.message}</p>
  }

  if (projects.length === 0) {
    return <p>Aucun projet pour le moment.</p>
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Titre</th>
          <th>Statut</th>
          <th>Date de création</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {projects.map((project) => {
          // Une seule mutation pour tout le tableau : variables indique
          // quel projet est en cours de suppression
          const isDeleting =
            deleteMutation.isPending && deleteMutation.variables === project.id

          return (
            <tr key={project.id}>
              <td>{project.title}</td>
              <td>{STATUS_LABELS[project.status]}</td>
              <td>{new Date(project.created_at).toLocaleDateString('fr-FR')}</td>
              <td>
                <button
                  type="button"
                  onClick={() => handleDelete(project)}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Suppression…' : 'Supprimer'}
                </button>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default ProjectList
