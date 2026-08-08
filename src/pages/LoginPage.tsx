import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { useToast } from '../components/common/Toast'

const inputClass =
  'mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40'

const LoginPage = () => {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    try {
      const user = await login(username, password)
      navigate(user.role === 'admin' ? '/admin/statistics' : '/dashboard')
    } catch (err) {
      toast.error('Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-emerald-600/20 blur-3xl" />

      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-soft">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400">GameClub</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Sign in</h1>
        <p className="mt-2 text-slate-400">Enter your username and password to access the dashboard.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm text-slate-300">Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClass}
              placeholder="admin"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm text-slate-300">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
              required
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
