// Miroir de ProjectSerializer (backend/projects/serializers.py)
export type ProjectStatus = 'draft' | 'active' | 'closed'

// Mêmes libellés que Project.Status (TextChoices) côté Django
export const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Brouillon',
  active: 'En cours',
  closed: 'Terminé',
}

export type Project = {
  id: number
  title: string
  description: string
  status: ProjectStatus
  start_date: string | null
  // id de l'utilisateur propriétaire, affecté par l'API (lecture seule)
  owner: number
  created_at: string
  updated_at: string
}

// Champs envoyés à l'API (id, owner, created_at et updated_at sont en lecture seule)
export type ProjectInput = Pick<Project, 'title' | 'description' | 'status' | 'start_date'>

// Format d'une réponse 400 de DRF : une liste de messages par champ
export type ProjectFieldErrors = Partial<
  Record<keyof ProjectInput | 'non_field_errors', string[]>
>
