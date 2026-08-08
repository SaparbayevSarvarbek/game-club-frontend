import { useAuth } from '../../store/auth'
import { useEffect, useState } from 'react'
import { MoonIcon, SunIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import Button from '../ui/Button'

const Header = () => {
  const { user, logout } = useAuth()
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = window.localStorage.getItem('gameclub_theme')
    if (stored === 'dark' || stored === 'light') return stored
    return 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    window.localStorage.setItem('gameclub_theme', theme)
  }, [theme])

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">GameClub</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Computer club management in one dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
            aria-label="Tema"
          >
            {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
          </Button>
          {user && (
            <>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.full_name ?? user.username}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user.role.toUpperCase()}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={logout}>
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
