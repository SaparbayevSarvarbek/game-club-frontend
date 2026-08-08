import { useEffect, useState } from 'react'
import Layout from '../components/common/Layout'
import { useToast } from '../components/common/Toast'
import { useAuth } from '../store/auth'
import api from '../services/api'
import { formatCurrency } from '../utils/format'
import Card from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import Spinner from '../components/ui/Spinner'

const ProfilePage = () => {
  const { user } = useAuth()
  const toast = useToast()
  const [statistics, setStatistics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await api.fetchUserStatistics()
        setStatistics(data)
      } catch (err) {
        toast.error('Unable to load statistics')
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  return (
    <Layout>
      <div className="space-y-6">
        <Card title="Profil">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Foydalanuvchi nomi" value={user?.username ?? '-'} />
            <StatCard label="To'liq ism" value={user?.full_name ?? '-'} />
            <StatCard label="Rol" value={user?.role} />
          </div>
        </Card>

        <Card title="Bugunning statistikasi">
          {!statistics ? (
            <Spinner label="Bugunning ma'lumotlari yuklanmoqda..." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Naqd pul" value={formatCurrency(Number(statistics.total_cash))} />
              <StatCard label="Karta" value={formatCurrency(Number(statistics.total_card))} />
              <StatCard label="Qarz" value={formatCurrency(Number(statistics.total_debt))} tone="rose" />
            </div>
          )}
        </Card>
      </div>
    </Layout>
  )
}

export default ProfilePage
