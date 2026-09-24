import type {
  Paginated,
  Project,
  ProjectFieldErrors,
  ProjectInput,
  ProjectListParams,
  ProjectStats,
} from '../types/project'
import { apiFetch } from './auth'
import { NotFoundError, ValidationError } from './errors'

export async function fetchProjects(params: ProjectListParams): Promise<Paginated<Project>> {
  const query = new URLSearchParams({ page: String(params.page), ordering: params.ordering })
  if (params.status) {
    query.set('status', params.status)
  }
  if (params.search) {
    query.set('search', params.search)
  }

  const response = await apiFetch(`/projects/?${query}`)

  // Page hors limites (ex. : dernier projet de la dernière page supprimé)
  if (response.status === 404) {
    throw new NotFoundError('Page introuvable')
  }

  // fetch ne rejette pas sur les erreurs HTTP : on lève nous-mêmes l'erreur
  // pour que TanStack Query passe en état "error".
  if (!response.ok) {
    throw new Error(`Erreur ${response.status} lors du chargement des projets`)
  }

  return response.json()
}

export async function fetchProjectStats(): Promise<ProjectStats> {
  const response = await apiFetch('/projects/stats/')

  if (!response.ok) {
    throw new Error(`Erreur ${response.status} lors du chargement des statistiques`)
  }

  return response.json()
}

export async function fetchProject(id: number): Promise<Project> {
  const response = await apiFetch(`/projects/${id}/`)

  // L'API renvoie aussi 404 pour le projet d'un autre utilisateur
  if (response.status === 404) {
    throw new NotFoundError('Projet introuvable')
  }

  if (!response.ok) {
    throw new Error(`Erreur ${response.status} lors du chargement du projet`)
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
