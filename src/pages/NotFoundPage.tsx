import { Link } from 'react-router-dom'

const NotFoundPage = () => (
  <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
    <div className="w-full max-w-xl rounded-3xl bg-slate-900/95 p-8 text-center shadow-soft">
      <h1 className="text-5xl font-semibold">404</h1>
      <p className="mt-4 text-lg text-slate-300">Page not found.</p>
      <Link to="/" className="mt-6 inline-flex rounded-2xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-500">Go back home</Link>
    </div>
  </div>
)

export default NotFoundPage
