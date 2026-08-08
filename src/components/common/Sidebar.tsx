import { NavLink } from 'react-router-dom'
import {
  HomeIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  DocumentTextIcon,
  UserIcon,
  ChartBarIcon,
  CubeIcon,
  UserGroupIcon,
  UsersIcon,
  BanknotesIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../../store/auth'

const adminItems = [
  { label: 'Statistics', to: '/admin/statistics', icon: ChartBarIcon },
  { label: 'Daily Reports', to: '/admin/daily-reports', icon: DocumentTextIcon },
  { label: 'Products', to: '/admin/products', icon: CubeIcon },
  { label: 'Users', to: '/admin/users', icon: UserGroupIcon },
  { label: 'Debtors', to: '/admin/debtors', icon: UsersIcon },
  { label: 'Expenses', to: '/admin/expenses', icon: BanknotesIcon },
  { label: 'Settings', to: '/admin/profile', icon: Cog6ToothIcon },
]

const userItems = [
  { label: 'Dashboard', to: '/dashboard', icon: HomeIcon },
  { label: 'Product Sales', to: '/sales', icon: ShoppingCartIcon },
  { label: 'Debt Payment', to: '/debt', icon: CreditCardIcon },
  { label: 'Daily Reports', to: '/reports', icon: DocumentTextIcon },
  { label: 'Profile', to: '/profile', icon: UserIcon },
]

const Sidebar = () => {
  const { user } = useAuth()
  const items = user?.role === 'admin' ? adminItems : userItems

  return (
    <aside className="w-full rounded-3xl bg-slate-950/95 p-5 text-slate-100 shadow-soft lg:sticky lg:top-4 lg:h-fit lg:w-72">
      <div className="mb-6 border-b border-slate-800 pb-4">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">Menu</p>
      </div>
      <nav className="space-y-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? 'bg-emerald-500 text-white shadow-soft'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
