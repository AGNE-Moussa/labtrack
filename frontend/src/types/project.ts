// Miroir de ProjectSerializer (backend/projects/serializers.py)
export type ProjectStatus = 'draft' | 'active' | 'closed'

export type Project = {
  id: number
  title: string
  description: string
  status: ProjectStatus
  start_date: string | null
  created_at: string
  updated_at: string
}
