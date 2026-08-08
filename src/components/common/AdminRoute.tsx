import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../store/auth'
import Spinner from '../ui/Spinner'

const AdminRoute = () => {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Yuklanmoqda..." />
      </div>
    )
  }
  if (!user) {
    return <Navigate to="/login" />
  }
  return user.role === 'admin' ? <Outlet /> : <Navigate to="/dashboard" />
}

export default AdminRoute
