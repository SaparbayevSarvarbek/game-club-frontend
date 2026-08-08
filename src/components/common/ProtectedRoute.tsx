import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../store/auth'
import Spinner from '../ui/Spinner'

const ProtectedRoute = () => {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Yuklanmoqda..." />
      </div>
    )
  }
  return user ? <Outlet /> : <Navigate to="/login" />
}

export default ProtectedRoute
