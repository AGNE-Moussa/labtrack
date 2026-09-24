const API_URL = import.meta.env.VITE_API_URL

const ACCESS_KEY = 'labtrack.access'
const REFRESH_KEY = 'labtrack.refresh'

// Réponse de /api/token/ (TokenObtainPairView de SimpleJWT)
type TokenPair = {
  access: string
  refresh: string
}

// Erreur levée quand les identifiants sont refusés (401 sur /api/token/)
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Identifiant ou mot de passe incorrect')
    this.name = 'InvalidCredentialsError'
  }
}

export function hasTokens(): boolean {
  return localStorage.getItem(REFRESH_KEY) !== null
}

// Prévient AuthProvider quand apiFetch déconnecte l'utilisateur (refresh expiré),
// pour que l'interface revienne à l'écran de connexion.
let logoutListener: (() => void) | null = null

export function onForcedLogout(listener: () => void): () => void {
  logoutListener = listener
  return () => {
    logoutListener = null
  }
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export async function login(username: string, password: string): Promise<void> {
  const response = await fetch(`${API_URL}/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (response.status === 401) {
    throw new InvalidCredentialsError()
  }

  if (!response.ok) {
    throw new Error(`Erreur ${response.status} lors de la connexion`)
  }

  const tokens: TokenPair = await response.json()
  localStorage.setItem(ACCESS_KEY, tokens.access)
  localStorage.setItem(REFRESH_KEY, tokens.refresh)
}

// Plusieurs requêtes peuvent recevoir un 401 en même temps : elles partagent
// la même promesse pour ne faire qu'un seul appel à /api/token/refresh/.
let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  const refresh = localStorage.getItem(REFRESH_KEY)
  if (refresh === null) {
    return false
  }

  const response = await fetch(`${API_URL}/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  })

  if (!response.ok) {
    return false
  }

  const { access }: { access: string } = await response.json()
  localStorage.setItem(ACCESS_KEY, access)
  return true
}

function sendWithToken(path: string, init: RequestInit): Promise<Response> {
  const headers = new Headers(init.headers)
  const access = localStorage.getItem(ACCESS_KEY)
  if (access !== null) {
    headers.set('Authorization', `Bearer ${access}`)
  }
  return fetch(`${API_URL}${path}`, { ...init, headers })
}

// Remplace fetch pour les appels authentifiés : ajoute le token d'accès et,
// s'il a expiré (401), le renouvelle avec le refresh token puis rejoue la
// requête une seule fois. Si le refresh échoue, l'utilisateur est déconnecté.
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const response = await sendWithToken(path, init)
  if (response.status !== 401) {
    return response
  }

  refreshPromise ??= refreshAccessToken().finally(() => {
    refreshPromise = null
  })

  if (!(await refreshPromise)) {
    clearTokens()
    logoutListener?.()
    return response
  }

  return sendWithToken(path, init)
}
