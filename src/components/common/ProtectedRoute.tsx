import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../store/auth'

const ProtectedRoute = () => {
  const { user, loading } = useAuth()
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }
  return user ? <Outlet /> : <Navigate to="/login" />
}

export default ProtectedRoute
