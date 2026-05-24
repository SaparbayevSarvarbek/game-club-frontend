import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/common/ProtectedRoute'
import AdminRoute from './components/common/AdminRoute'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import SalesPage from './pages/SalesPage'
import DebtPage from './pages/DebtPage'
import ReportsPage from './pages/ReportsPage'
import ProfilePage from './pages/ProfilePage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminDailyReportsPage from './pages/AdminDailyReportsPage'
import AdminProductsPage from './pages/AdminProductsPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminDebtorsPage from './pages/AdminDebtorsPage'
import AdminExpensesPage from './pages/AdminExpensesPage'
import AdminProfilePage from './pages/AdminProfilePage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <Routes>
      {/* Kirish Sahifasi */}
      <Route path="/login" element={<LoginPage />} />

      {/* Staff (Xodimlar) Marshrutlari */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/debt" element={<DebtPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Admin Marshrutlari */}
      <Route element={<AdminRoute />}>
        <Route path="/admin/statistics" element={<AdminDashboardPage />} />
        <Route path="/admin/daily-reports" element={<AdminDailyReportsPage />} />
        <Route path="/admin/products" element={<AdminProductsPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/debtors" element={<AdminDebtorsPage />} />
        <Route path="/admin/expenses" element={<AdminExpensesPage />} />
        <Route path="/admin/profile" element={<AdminProfilePage />} />
      </Route>

      {/* Standart yo'naltirishlar */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
