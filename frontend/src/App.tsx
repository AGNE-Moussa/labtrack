import { useAuth } from './auth/AuthContext'
import LoginForm from './components/LoginForm'
import ProjectList from './components/ProjectList'

function App() {
  const { isAuthenticated, logout } = useAuth()

  if (!isAuthenticated) {
    return (
      <main>
        <h1>LabTrack</h1>
        <LoginForm />
      </main>
    )
  }

  return (
    <main>
      <h1>Projets</h1>
      <button type="button" onClick={logout}>
        Se déconnecter
      </button>
      <ProjectList />
    </main>
  )
}

export default App
