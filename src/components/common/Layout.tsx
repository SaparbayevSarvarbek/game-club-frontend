import { ReactNode } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />
      <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-6">
        <Sidebar />
        <main className="flex-1 rounded-3xl bg-white p-6 shadow-soft min-h-[calc(100vh-96px)] dark:bg-slate-950 dark:text-slate-100">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
