import { useQuery } from '@tanstack/react-query'
import { fetchProjects } from '../api/projects'
import type { ProjectStatus } from '../types/project'

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
        </tr>
      </thead>
      <tbody>
        {projects.map((project) => (
          <tr key={project.id}>
            <td>{project.title}</td>
            <td>{STATUS_LABELS[project.status]}</td>
            <td>{new Date(project.created_at).toLocaleDateString('fr-FR')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default ProjectList
