import { NavLink } from 'react-router-dom'
import { useAuth } from '../../store/auth'

const Sidebar = () => {
  const { user } = useAuth()
  const items = user?.role === 'admin'
    ? [
        { label: 'Statistics', to: '/admin/statistics' },
        { label: 'Daily Reports', to: '/admin/daily-reports' },
        { label: 'Products', to: '/admin/products' },
        { label: 'Users', to: '/admin/users' },
        { label: 'Debtors', to: '/admin/debtors' },
        { label: 'Expenses', to: '/admin/expenses' },
        { label: 'Settings', to: '/admin/profile' },
      ]
    : [
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Product Sales', to: '/sales' },
        { label: 'Debt Payment', to: '/debt' },
        { label: 'Daily Reports', to: '/reports' },
        { label: 'Profile', to: '/profile' },
      ]

  return (
    <aside className="w-full lg:w-72 rounded-3xl bg-slate-950/95 p-5 text-slate-100 shadow-soft lg:sticky lg:top-4 h-fit">
      <div className="mb-6 border-b border-slate-800 pb-4">
        <p className="text-sm uppercase tracking-[0.2em] text-sky-300">Menu</p>
      </div>
      <nav className="space-y-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-sky-500 text-white shadow-soft' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
