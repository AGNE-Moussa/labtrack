import type { Project, ProjectFieldErrors, ProjectInput } from '../types/project'

const API_URL = import.meta.env.VITE_API_URL

// Erreur levée sur un 400 : transporte les messages de validation DRF par champ.
export class ValidationError extends Error {
  fieldErrors: ProjectFieldErrors

  constructor(fieldErrors: ProjectFieldErrors) {
    super('Données invalides')
    this.name = 'ValidationError'
    this.fieldErrors = fieldErrors
  }
}

export async function fetchProjects(): Promise<Project[]> {
  const response = await fetch(`${API_URL}/projects/`)

  // fetch ne rejette pas sur les erreurs HTTP : on lève nous-mêmes l'erreur
  // pour que TanStack Query passe en état "error".
  if (!response.ok) {
    throw new Error(`Erreur ${response.status} lors du chargement des projets`)
  }

  return response.json()
}

export async function createProject(input: ProjectInput): Promise<Project> {
  const response = await fetch(`${API_URL}/projects/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (response.status === 400) {
    throw new ValidationError(await response.json())
  }

  if (!response.ok) {
    throw new Error(`Erreur ${response.status} lors de la création du projet`)
  }

  return response.json()
}
