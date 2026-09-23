import type { Project } from '../types/project'

const API_URL = import.meta.env.VITE_API_URL

export async function fetchProjects(): Promise<Project[]> {
  const response = await fetch(`${API_URL}/projects/`)

  // fetch ne rejette pas sur les erreurs HTTP : on lève nous-mêmes l'erreur
  // pour que TanStack Query passe en état "error".
  if (!response.ok) {
    throw new Error(`Erreur ${response.status} lors du chargement des projets`)
  }

  return response.json()
}

export async function deleteProject(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/projects/${id}/`, {
    method: 'DELETE',
  })

  // DRF répond 204 No Content : pas de corps à parser avec .json()
  if (!response.ok) {
    throw new Error(`Erreur ${response.status} lors de la suppression du projet`)
  }
}
