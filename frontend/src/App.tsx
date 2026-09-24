import { useAuth } from '@/auth/AuthContext'
import AppShell from '@/components/layout/AppShell'
import LoginForm from '@/components/LoginForm'
import ProjectList from '@/components/ProjectList'

function App() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <LoginForm />
  }

  return (
    <AppShell>
      <ProjectList />
    </AppShell>
  )
}

export default App
