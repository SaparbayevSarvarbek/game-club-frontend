import { Link } from 'react-router-dom'

const NotFoundPage = () => (
  <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
    <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-emerald-600/20 blur-3xl" />
    <div className="relative w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900/95 p-8 text-center shadow-soft">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400">GameClub</p>
      <h1 className="mt-4 text-5xl font-semibold text-white">404</h1>
      <p className="mt-4 text-lg text-slate-300">Page not found.</p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
      >
        Go back home
      </Link>
    </div>
  </div>
)

export default NotFoundPage
