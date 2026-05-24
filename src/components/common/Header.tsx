import { useAuth } from '../../store/auth'

const Header = () => {
  const { user, logout } = useAuth()
  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">GameClub</h1>
          <p className="text-sm text-slate-500">Computer club management in one dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{user.full_name ?? user.username}</p>
                <p className="text-xs text-slate-500">{user.role.toUpperCase()}</p>
              </div>
              <button
                onClick={logout}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
