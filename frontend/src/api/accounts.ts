import type { CurrentUser } from '@/types/user'
import { apiFetch } from './auth'

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const response = await apiFetch('/me/')

  if (!response.ok) {
    throw new Error(`Erreur ${response.status} lors du chargement de l'utilisateur`)
  }

  return response.json()
}
