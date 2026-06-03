import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/common/Layout'
import SessionDialog from '../components/user/SessionDialog'
import api from '../services/api'
import { FetchComputer, FetchProduct, FetchProductSale } from '../types'
import { formatCurrency } from '../utils/format'
import { ComputerDesktopIcon, PlayIcon } from '@heroicons/react/24/outline'

const DashboardPage = () => {
  const [computers, setComputers] = useState<FetchComputer[]>([])
  const [products, setProducts] = useState<FetchProduct[]>([])
  const [sales, setSales] = useState<FetchProductSale[]>([])
  const [selected, setSelected] = useState<FetchComputer | null>(null)
  const [activeSession, setActiveSession] = useState<any | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [loadingSession, setLoadingSession] = useState(false)
  const [loadingSales, setLoadingSales] = useState(false)
  const [showSalesDrawer, setShowSalesDrawer] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState<string>('')
  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      const today = new Date().toISOString().slice(0, 10)
      const [computersData, productsData, statsData, salesData] = await Promise.all([
        api.fetchComputers(),
        api.fetchProducts(),
        api.fetchUserStatistics(),
        api.fetchProductSales({ date: today, limit: 200 }),
      ])
      setComputers(computersData)
      setProducts(productsData)
      setStats(statsData)
      setSales(salesData)
    } catch {
      setError('Dashboard ma\'lumotlarini yuklashda xatolik. Qayta yuklang.')
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

  const todaySales = useMemo(() => {
    const today = new Date().toDateString()
    return sales.filter((sale) => {
      if (!sale.created_at) return false
      return new Date(sale.created_at).toDateString() === today
    })
  }, [sales])

  const todayTotal = useMemo(() => {
    return todaySales.reduce((sum, sale) => {
      const price = products.find(p => p.id === sale.product_id)?.price || 0;
      return sum + price * Number(sale.quantity || 0);
    }, 0);
  }, [todaySales, products]);

  const todaySoldProductsCount = useMemo(
    () => todaySales.reduce((total, sale) => total + Number(sale.quantity || 0), 0),
    [todaySales]
  )

  const productNameById = useMemo(() => {
    const map = new Map<number, string>()
    products.forEach((product) => map.set(product.id, product.name))
    return map
  }, [products])

  const refreshSales = async () => {
    try {
      setLoadingSales(true)
      const salesData = await api.fetchProductSales({ date: new Date().toISOString().slice(0, 10), limit: 200 })
      setSales(salesData)
    } catch {
      setError('Bugungi sotuvlar ma\'lumotini yuklashda xatolik.')
    } finally {
      setLoadingSales(false)
    }
  }

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
    setSelected(computer)
    setMessage('')
    setError('')
    setActiveSession(null)

    if (computer.is_active) {
      try {
        setLoadingSession(true)
        const active = await api.fetchActiveSession(computer.id)
        setActiveSession(active)
      } catch {
        setError('Bu kompyuterning faol sessiyasini yuklashda xatolik')
        setActiveSession(null)
      } finally {
        setLoadingSession(false)
      }
    } else {
      setActiveSession(null)
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
      if (showSalesDrawer) {
        await refreshSales()
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.detail || 'Sessiyani yakunlashda xatolik. To\'lov miqdorlarini tekshiring.'
      setError(errorMsg)
      setMessage('')
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl bg-sky-600 p-6 text-white shadow-soft dark:bg-sky-700">
            <p className="text-sm uppercase tracking-[0.24em] text-sky-100/80">Kompyuterlar</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl">
                <ComputerDesktopIcon className="h-8 w-8 text-white" />
              </span>
              <p className="text-4xl font-semibold">{counts.total}</p>
            </div>
            <p className="mt-2 text-sm text-sky-100/80">Mavjud stansiyalar</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-soft dark:bg-slate-900">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Band</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-2xl dark:bg-rose-900/40">
                <PlayIcon className="h-8 w-8 text-rose-700 dark:text-rose-300" />
              </span>
              <p className="text-4xl font-semibold text-slate-900 dark:text-slate-100">{counts.active}</p>
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Hozir band</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-soft dark:bg-slate-900">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Bo'sh</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl dark:bg-emerald-900/40"><ComputerDesktopIcon className="h-8 w-8 text-emerald-700 dark:text-emerald-300" /></span>
              <p className="text-4xl font-semibold text-slate-900 dark:text-slate-100">{counts.free}</p>
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Bronlash uchun tayyor</p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.5fr_0.5fr]">
          <div className="rounded-3xl bg-white p-8 shadow-soft dark:bg-slate-900">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-700">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Kompyuter tarmog'i</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Sessiyani boshlash yoki boshqarish uchun kartani bosing.</p>
              </div>
            </div>
            {loading ? (
              <div className="mt-6 text-center text-slate-500 dark:text-slate-400">Loading computers...</div>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-4">
                {computers.map((computer) => (
                    <button
                      type="button"
                      key={computer.id}
                      onClick={() => handleComputerSelect(computer)}
                       className={`group rounded-3xl border bg-slate-50 p-8 text-left transition hover:-translate-y-1 dark:bg-slate-800 ${computer.type === 'playstation' ? 'border-amber-300/70 bg-amber-50 dark:bg-amber-900/20' : 'border-slate-200 dark:border-slate-700'} `}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-slate-200 text-lg dark:bg-slate-700">
                          {computer.type === 'playstation' ? <PlayIcon className="h-10 w-10 text-rose-700 dark:text-rose-300" /> : <ComputerDesktopIcon className="h-10 w-10 text-slate-500 dark:text-slate-300" />}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${computer.is_active ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200'}`}>{computer.is_active ? 'Band' : "Bo'sh"}</span>
                      </div>
                      <div className="mt-5">
                        <p className="text-xs text-slate-500 dark:text-slate-400">{computer.type === 'playstation' ? 'PlayStation' : 'Computer'}</p>
                        <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">Stol #{computer.number}</p>
                      </div>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{computer.is_active ? 'Faol sessiyani boshqarish' : 'Yangi sessiya boshlash'}</p>
                    </button>
                ))}
              </div>
            )}
          </div>

            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={async () => {
                  setShowSalesDrawer(true)
                  await refreshSales()
                }}
                className="rounded-2xl bg-blue-50 dark:bg-blue-950/40 p-4 text-left shadow-soft transition hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-900 dark:text-slate-100 hover:text-blue-900 dark:hover:text-blue-100 h-24 flex flex-col justify-between"
              >
                <p className="text-xs font-medium text-blue-600 dark:text-blue-300">Sotilgan mahsulotlar</p>
                <p className="break-words text-lg font-semibold text-blue-700 dark:text-blue-200">{formatCurrency(todayTotal)}</p>
              </button>
            {loading ? (
              <div className="text-slate-500 dark:text-slate-400">Yuklanmoqda...</div>
            ) : (
              <div className="flex flex-col gap-4">
                    <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/40 p-4 border border-emerald-200 dark:border-emerald-800 h-24 flex flex-col justify-between">
                      <p className="text-xs text-emerald-600 dark:text-emerald-300 font-medium">Naqd pul</p>
                      <p className="break-words text-lg font-semibold text-emerald-700 dark:text-emerald-200 leading-snug max-h-10 overflow-hidden">{formatCurrency(Number(stats?.total_cash ?? 0))}</p>
                    </div>
                    <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/40 p-4 border border-amber-200 dark:border-amber-800 h-24 flex flex-col justify-between">
                      <p className="text-xs text-amber-600 dark:text-amber-300 font-medium">Karta</p>
                      <p className="break-words text-lg font-semibold text-amber-700 dark:text-amber-200 leading-snug max-h-10 overflow-hidden">{formatCurrency(Number(stats?.total_card ?? 0))}</p>
                    </div>
                    <div className="rounded-2xl bg-rose-50 dark:bg-rose-900/40 p-4 border border-rose-200 dark:border-rose-800 h-24 flex flex-col justify-between">
                      <p className="text-xs text-rose-600 dark:text-rose-300 font-medium">Qarz</p>
                      <p className="break-words text-lg font-semibold text-rose-700 dark:text-rose-200 leading-snug max-h-10 overflow-hidden">{formatCurrency(Number(stats?.total_debt ?? 0))}</p>
                    </div>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-soft dark:bg-slate-900">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Mahsulotlar</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Savdo va sessiyalar uchun mahsulotlar.</p>
          <div className="mt-4 max-h-80 overflow-auto">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <div key={product.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{product.name}</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Qolgan: {product.quantity ?? 0} dona</p><p className="mt-1 text-sm font-semibold text-blue-600 dark:text-blue-300">{formatCurrency(product.price)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {message && <div className="rounded-3xl bg-emerald-50 dark:bg-emerald-900/30 p-4 text-sm font-medium text-emerald-700 dark:text-emerald-300">{message}</div>}
        {error && <div className="rounded-3xl bg-rose-50 dark:bg-rose-900/30 p-4 text-sm font-medium text-rose-700 dark:text-rose-300">{error}</div>}
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
          onProductsAdded={async () => {
            await loadData()
          }}
          onStart={handleStart}
          onSave={handleSave}
          onComplete={handleComplete}
          loading={loadingSession}
        />
      )}

      {showSalesDrawer && (
        <>
          <button type="button" className="fixed inset-0 z-40 bg-slate-900/40" onClick={() => setShowSalesDrawer(false)} />
          <aside className="fixed right-0 top-0 z-50 h-screen w-full max-w-lg sm:max-w-xl overflow-hidden bg-white p-6 shadow-2xl dark:bg-slate-950">
            <div className="mx-auto max-w-lg flex h-full flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Bugun sotilgan mahsulotlar</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Mahsulotlar tarixi</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Bugungi umumiy</p>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(todayTotal)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Jami: {todaySoldProductsCount} ta</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col gap-3 px-2">
                  {loadingSales ? (
                    <div className="py-10 text-center text-slate-500 dark:text-slate-400">Yuklanmoqda...</div>
                  ) : (
                    (() => {
                      const todays = (sales || []).filter((s) => s && s.created_at && new Date(s.created_at).toDateString() === new Date().toDateString())
                      if (!todays.length) {
                        return <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">Bugun hali mahsulot sotilmagan</div>
                      }
                      return todays
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map((s) => {
                          const prod = products.find((p) => p.id === s.product_id)
                          const name = s.product_name || productNameById.get(s.product_id) || prod?.name || '—'
                          return (
                            <div
                              key={s.id ?? s.sale_key}
                              className="flex items-center justify-between h-20 w-full px-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow transition-transform duration-100"
                            >
                              <div className="min-w-0 pr-4">
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Son: {s.quantity ?? 0}</p>
                              </div>

                              <div className="ml-4 text-right w-36 flex-shrink-0">
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(Number(s.unit_price ?? s.total_amount ?? 0))}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            </div>
                          )
                        })
                    })()
                  )}
                </div>
              </div>
            </div>
          </aside>
        </>
      )}
    </Layout>
  )
}

export default DashboardPage

