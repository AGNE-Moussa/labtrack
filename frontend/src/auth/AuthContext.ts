import { createContext, useContext } from 'react'
import type { RegisterInput } from '@/types/user'

export type AuthContextValue = {
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  // Crée le compte puis connecte directement l'utilisateur
  register: (input: RegisterInput) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth doit être utilisé dans un <AuthProvider>')
  }
  return context
}
