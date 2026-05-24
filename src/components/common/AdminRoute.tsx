import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../store/auth'

const AdminRoute = () => {
  const { user, loading } = useAuth()
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }
  if (!user) {
    return <Navigate to="/login" />
  }
  return user.role === 'admin' ? <Outlet /> : <Navigate to="/dashboard" />
}

export default AdminRoute
