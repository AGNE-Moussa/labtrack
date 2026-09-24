import type { CurrentUser, RegisterFieldErrors, RegisterInput } from '@/types/user'
import { apiFetch } from './auth'
import { ValidationError } from './errors'

const API_URL = import.meta.env.VITE_API_URL

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const response = await apiFetch('/me/')

  if (!response.ok) {
    throw new Error(`Erreur ${response.status} lors du chargement de l'utilisateur`)
  }

  return response.json()
}

// Route publique : fetch direct, sans token (pas apiFetch)
export async function register(input: RegisterInput): Promise<CurrentUser> {
  const response = await fetch(`${API_URL}/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (response.status === 400) {
    throw new ValidationError<RegisterFieldErrors>(await response.json())
  }

  // ScopedRateThrottle côté Django : trop d'inscriptions depuis cette adresse
  if (response.status === 429) {
    throw new Error('Trop de tentatives d’inscription. Réessayez plus tard.')
  }

  if (!response.ok) {
    throw new Error(`Erreur ${response.status} lors de la création du compte`)
  }

  return response.json()
}
