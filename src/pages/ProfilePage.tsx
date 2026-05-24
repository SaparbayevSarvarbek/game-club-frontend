import { useEffect, useState } from 'react'
import Layout from '../components/common/Layout'
import { useAuth } from '../store/auth'
import api from '../services/api'
import { formatCurrency, formatDateTime } from '../utils/format'

const ProfilePage = () => {
  const { user } = useAuth()
  const [statistics, setStatistics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await api.fetchUserStatistics()
        setStatistics(data)
      } catch (err) {
        setError('Unable to load statistics')
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  return (
    <Layout>
      <div className="space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-900">Profil</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Foydalanuvchi nomi</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{user?.username}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Toʻli ism</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{user?.full_name ?? '-'}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Rol</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{user?.role}</p>
            </div>
          </div>
        </section>
        <section className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-900">Bugunning statistikasi</h2>
          {!statistics ? (
            <p className="mt-4 text-sm text-slate-500">Bugunning maʻlumotlari yuklanamoqda...</p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Naqd pul</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(Number(statistics.total_cash))}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Karta</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(Number(statistics.total_card))}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Qarz</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(Number(statistics.total_debt))}</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </Layout>
  )
}

export default ProfilePage
