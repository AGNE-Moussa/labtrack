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

// Réponse paginée de l'API (ProjectPagination côté Django)
export type Paginated<T> = {
  count: number
  total_pages: number
  next: string | null
  previous: string | null
  results: T[]
}

// Tris autorisés par ordering_fields côté Django ("-" = décroissant)
export type ProjectOrdering = '-created_at' | 'created_at' | 'title' | '-title' | 'start_date'

// Paramètres de GET /api/projects/ (reflet des query params de l'URL)
export type ProjectListParams = {
  page: number
  status?: ProjectStatus
  search?: string
  ordering: ProjectOrdering
}

// Réponse de GET /api/projects/stats/
export type ProjectStats = Record<ProjectStatus | 'total', number>
