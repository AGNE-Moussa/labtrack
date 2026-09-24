import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { register as createAccount } from '../api/accounts'
import { clearTokens, hasTokens, login as requestTokens, onForcedLogout } from '../api/auth'
import type { RegisterInput } from '../types/user'
import { AuthContext, type AuthContextValue } from './AuthContext'

function AuthProvider({ children }: { children: ReactNode }) {
  // Si des tokens sont déjà en localStorage (page rechargée), on reste connecté
  const [isAuthenticated, setIsAuthenticated] = useState(hasTokens)
  const queryClient = useQueryClient()

  const logout = useCallback(() => {
    clearTokens()
    // Vide le cache TanStack Query : le prochain utilisateur ne doit pas
    // apercevoir les projets du précédent
    queryClient.clear()
    setIsAuthenticated(false)
  }, [queryClient])

  const login = useCallback(async (username: string, password: string) => {
    await requestTokens(username, password)
    setIsAuthenticated(true)
  }, [])

  const register = useCallback(
    async (input: RegisterInput) => {
      await createAccount(input)
      await login(input.username, input.password)
    },
    [login],
  )

  // apiFetch nous prévient quand le refresh token a expiré
  useEffect(() => onForcedLogout(logout), [logout])

  const value = useMemo<AuthContextValue>(
    () => ({ isAuthenticated, login, register, logout }),
    [isAuthenticated, login, register, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

export default AuthProvider
