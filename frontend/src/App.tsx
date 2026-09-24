import { Navigate, Route, Routes } from 'react-router'
import GuestRoute from '@/auth/GuestRoute'
import ProtectedRoute from '@/auth/ProtectedRoute'
import LoginForm from '@/components/LoginForm'
import ProjectList from '@/components/ProjectList'
import RegisterForm from '@/components/RegisterForm'
import NotFoundPage from '@/pages/NotFoundPage'
import ProjectDetailPage from '@/pages/ProjectDetailPage'

// Table de routage de l'application (≈ les #[Route] de Symfony, côté navigateur)
function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route index element={<Navigate to="/projects" replace />} />
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
