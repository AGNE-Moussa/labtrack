import { useQuery } from '@tanstack/react-query'
import { fetchProjects } from '../api/projects'
import { STATUS_LABELS } from '../types/project'
import ProjectForm from './ProjectForm'

function ProjectList() {
  const { data: projects, isPending, isError, error } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  })

  let content
  if (isPending) {
    content = <p>Chargement des projets…</p>
  } else if (isError) {
    content = <p role="alert">Impossible de charger les projets : {error.message}</p>
  } else if (projects.length === 0) {
    content = <p>Aucun projet pour le moment.</p>
  } else {
    content = (
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

  // Le formulaire reste visible quel que soit l'état de la liste (même vide)
  return (
    <>
      <ProjectForm />
      {content}
    </>
  )
}

export default ProjectList
