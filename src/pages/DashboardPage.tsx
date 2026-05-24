import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/common/Layout'
import SessionDialog from '../components/user/SessionDialog'
import api from '../services/api'
import { FetchComputer, FetchProduct } from '../types'
import { formatCurrency } from '../utils/format'

const DashboardPage = () => {
  const [computers, setComputers] = useState<FetchComputer[]>([])
  const [products, setProducts] = useState<FetchProduct[]>([])
  const [selected, setSelected] = useState<FetchComputer | null>(null)
  const [activeSession, setActiveSession] = useState<any | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [loadingSession, setLoadingSession] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState<string>('')

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      const [computersData, productsData, statsData] = await Promise.all([
        api.fetchComputers(),
        api.fetchProducts(),
        api.fetchUserStatistics(),
      ])
      setComputers(computersData)
      setProducts(productsData)
      setStats(statsData)
    } catch {
      setError('Dashboard maʻlumotlarini yuklashda xatolik. Qayta yuklang.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const counts = useMemo(() => {
    const active = computers.filter((computer) => computer.is_active).length
    return { total: computers.length, active, free: computers.length - active }
  }, [computers])

  const handleStart = async (payload: any) => {
    try {
      setError('')
      setMessage('')
      await api.startSession(payload)
      setMessage('Sessiya muvaffaqiyatli boshlanayapti...')
      setSelected(null)
      setActiveSession(null)
      setTimeout(() => {
        loadData()
      }, 500)
    } catch (err: any) {
      const errorMsg = err?.response?.data?.detail || 'Sessiyani boshlashda xatolik'
      setError(errorMsg)
      setMessage('')
    }
  }

  const handleComputerSelect = async (computer: FetchComputer) => {
    setSelected(computer);
    setMessage('');
    setError('');
    setActiveSession(null);
    if (computer.is_active) {
      try {
        setLoadingSession(true);
        const active = await api.fetchActiveSession(computer.id);
        setActiveSession(active);
      } catch {
        setError('Bu kompyuterning faol sessiyasini yuklashda xatolik');
        setActiveSession(null);
      } finally {
        setLoadingSession(false);
      }
    } else {
      setActiveSession(null);
    }
  }

  const handleSave = async (sessionId: number) => {
    try {
      setError('')
      setMessage('')
      await api.saveSession(sessionId)
      setMessage('Sessiya muvaffaqiyatli saqlandi')
      setSelected(null)
      setActiveSession(null)
      await loadData()
    } catch (err: any) {
      const errorMsg = err?.response?.data?.detail || 'Sessiyani saqlashda xatolik'
      setError(errorMsg)
      setMessage('')
    }
  }

  const handleComplete = async (payload: any) => {
    try {
      setError('')
      setMessage('')
      await api.completeSession(payload.session_id, payload)
      setMessage('Sessiya muvaffaqiyatli yakunlandi')
      setSelected(null)
      setActiveSession(null)
      await loadData()
    } catch (err: any) {
      const errorMsg = err?.response?.data?.detail || 'Sessiyani yakunlashda xatolik. Toʻlov miqdorlarini tekshiring.'
      setError(errorMsg)
      setMessage('')
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-sky-600 p-6 text-white shadow-soft">
            <p className="text-sm uppercase tracking-[0.24em] text-sky-100/80">Kompyuterlar</p>
            <p className="mt-4 text-4xl font-semibold">{counts.total}</p>
            <p className="mt-2 text-sm text-sky-100/80">Mavjud stansiyalar</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-soft">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Band</p>
            <p className="mt-4 text-4xl font-semibold text-slate-900">{counts.active}</p>
            <p className="mt-2 text-sm text-slate-500">Hozir band</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-soft">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Boʻsh</p>
            <p className="mt-4 text-4xl font-semibold text-slate-900">{counts.free}</p>
            <p className="mt-2 text-sm text-slate-500">Bronlash uchun tayyor</p>
          </div>
        </section>
        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Kompyuter tarmoqi</h2>
                <p className="mt-2 text-sm text-slate-500">Sessiyani boshlash yoki boshqarish uchun kartani bosing.</p>
              </div>
            </div>
            {loading ? (
              <div className="mt-6 text-center text-slate-500">Loading computers...</div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {computers.map((computer) => (
                  <button
                    type="button"
                    key={computer.id}
                    onClick={() => handleComputerSelect(computer)}
                    className={`group rounded-3xl border bg-slate-50 p-5 text-left transition hover:-translate-y-1 ${computer.type === 'playstation' ? 'border-amber-300/70 bg-amber-50' : 'border-slate-200'} `}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-500">{computer.type === 'playstation' ? 'PlayStation' : 'Computer'}</p>
                        <p className="mt-2 text-3xl font-semibold text-slate-900">#{computer.number}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${computer.is_active ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {computer.is_active ? 'Band' : 'Boʻsh'}
                      </span>
                    </div>
                    <p className="mt-4 text-sm text-slate-500">{computer.is_active ? 'Faol sessiyani boshqarish' : 'Yangi sessiya boshlash'}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-slate-900">Kunlik jami</h2>
            <p className="mt-2 text-sm text-slate-500">Joriy session kunining tizimlash</p>
            {loading ? (
              <div className="mt-6 text-slate-500">Yuklanamoqda...</div>
            ) : (
              <div className="mt-6 grid gap-4">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Naqd pul</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{formatCurrency(Number(stats?.total_cash ?? 0))}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Karta</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{formatCurrency(Number(stats?.total_card ?? 0))}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Qarz</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{formatCurrency(Number(stats?.total_debt ?? 0))}</p>
                </div>
              </div>
            )}
          </div>
        </section>
        <section className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-900">Mahsulotlar</h2>
          <p className="mt-2 text-sm text-slate-500">Savdo va sessiyalar uchun mahsulotlar.</p>
          <div className="mt-4 max-h-80 overflow-auto">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <div key={product.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-base font-semibold text-slate-900">{product.name}</p>
                  <p className="mt-2 text-sm text-slate-500">{formatCurrency(product.price)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        {message && <div className="rounded-3xl bg-emerald-50 p-4 text-sm text-emerald-700 font-medium">{message}</div>}
        {error && <div className="rounded-3xl bg-rose-50 p-4 text-sm text-rose-700 font-medium">{error}</div>}
      </div>
      {selected && (
        <SessionDialog
          computer={selected}
          products={products}
          activeSession={activeSession}
          close={() => {
            setSelected(null)
            setActiveSession(null)
          }}
          onProductsAdded={async () => { await loadData(); }}
          onStart={handleStart}
          onSave={handleSave}
          onComplete={handleComplete}
          loading={loadingSession}
        />
      )}
    </Layout>
  )
}

export default DashboardPage
