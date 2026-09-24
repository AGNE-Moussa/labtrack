import { useState } from 'react'
import { useAuth } from '@/auth/AuthContext'
import AppShell from '@/components/layout/AppShell'
import LoginForm from '@/components/LoginForm'
import ProjectList from '@/components/ProjectList'
import RegisterForm from '@/components/RegisterForm'

function App() {
  const { isAuthenticated } = useAuth()
  // Écran affiché aux visiteurs (deviendra /login et /register avec React Router)
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login')

  if (!isAuthenticated) {
    return authScreen === 'login' ? (
      <LoginForm onSwitchToRegister={() => setAuthScreen('register')} />
    ) : (
      <RegisterForm onSwitchToLogin={() => setAuthScreen('login')} />
    )
  }

  return (
    <AppShell>
      <ProjectList />
    </AppShell>
  )
}

export default App
