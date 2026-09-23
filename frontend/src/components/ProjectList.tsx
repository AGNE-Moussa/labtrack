import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteProject, fetchProjects } from '../api/projects'
import { STATUS_LABELS, type Project } from '../types/project'
import ProjectForm from './ProjectForm'

function ProjectList() {
  const { data: projects, isPending, isError, error } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  })

  // Projet dont le formulaire d'édition est ouvert ; null = mode création
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const queryClient = useQueryClient()
  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    // Le cache ["projects"] est périmé : on force un nouveau GET de la liste
    onSuccess: (_data, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      // On ne peut plus modifier un projet qui n'existe plus
      setEditingProject((current) => (current?.id === deletedId ? null : current))
    },
    onError: (error) => window.alert(error.message),
  })

  function handleDelete(project: Project) {
    if (window.confirm(`Supprimer le projet « ${project.title} » ?`)) {
      deleteMutation.mutate(project.id)
    }
  }

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
                  <button type="button" onClick={() => setEditingProject(project)}>
                    Modifier
                  </button>
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

  // Le formulaire reste visible quel que soit l'état de la liste (même vide).
  // La key force React à recréer le formulaire quand on change de projet,
  // sinon useState garderait les valeurs du projet précédent.
  return (
    <>
      <ProjectForm
        key={editingProject?.id ?? 'new'}
        project={editingProject ?? undefined}
        onDone={() => setEditingProject(null)}
      />
      {content}
    </>
  )
}

export default ProjectList
