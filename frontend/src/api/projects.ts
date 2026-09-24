import type { Project, ProjectFieldErrors, ProjectInput } from '../types/project'
import { apiFetch } from './auth'
import { ValidationError } from './errors'

export async function fetchProjects(): Promise<Project[]> {
  const response = await apiFetch('/projects/')

  // fetch ne rejette pas sur les erreurs HTTP : on lève nous-mêmes l'erreur
  // pour que TanStack Query passe en état "error".
  if (!response.ok) {
    throw new Error(`Erreur ${response.status} lors du chargement des projets`)
  }

  return response.json()
}

export async function createProject(input: ProjectInput): Promise<Project> {
  const response = await apiFetch('/projects/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (response.status === 400) {
    throw new ValidationError<ProjectFieldErrors>(await response.json())
  }

  if (!response.ok) {
    throw new Error(`Erreur ${response.status} lors de la création du projet`)
  }

  return response.json()
}

// PATCH = mise à jour partielle : DRF appelle partial_update() et ne valide
// que les champs envoyés (contrairement à PUT qui exige tous les champs)
export async function updateProject(
  id: number,
  input: Partial<ProjectInput>,
): Promise<Project> {
  const response = await apiFetch(`/projects/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (response.status === 400) {
    throw new ValidationError<ProjectFieldErrors>(await response.json())
  }

  if (!response.ok) {
    throw new Error(`Erreur ${response.status} lors de la modification du projet`)
  }

  return response.json()
}

export async function deleteProject(id: number): Promise<void> {
  const response = await apiFetch(`/projects/${id}/`, {
    method: 'DELETE',
  })

  // DRF répond 204 No Content : pas de corps à parser avec .json()
  if (!response.ok) {
    throw new Error(`Erreur ${response.status} lors de la suppression du projet`)
  }
}
