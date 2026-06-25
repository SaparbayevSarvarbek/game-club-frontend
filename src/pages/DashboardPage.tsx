import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/common/Layout'
import SessionDialog from '../components/user/SessionDialog'
import api from '../services/api'
import { FetchComputer, FetchProduct, FetchProductSale } from '../types'
import { formatCurrency } from '../utils/format'
import { parseError } from '../utils/error'
import { ComputerDesktopIcon, PlayIcon } from '@heroicons/react/24/outline'

const DashboardPage = () => {
  const [computers, setComputers] = useState<FetchComputer[]>([])
  const [products, setProducts] = useState<FetchProduct[]>([])
  const [sales, setSales] = useState<FetchProductSale[]>([])
  const [selected, setSelected] = useState<FetchComputer | null>(null)
  const [activeSession, setActiveSession] = useState<any | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [loadingStatsData, setLoadingStatsData] = useState(false)
  const [loadingSession, setLoadingSession] = useState(false)
  const [loadingSales, setLoadingSales] = useState(false)
  const [showSalesDrawer, setShowSalesDrawer] = useState(false)
  const [showDebtDrawer, setShowDebtDrawer] = useState(false)
  const [debtTransactions, setDebtTransactions] = useState<any[]>([])
  const [loadingDebts, setLoadingDebts] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState<string>('')
  
  const loadData = async () => {
    // 1. Fetch computers and products first (essential for UI)
    try {
      setError('')
      const [computersData, productsData] = await Promise.all([
        api.fetchComputers(),
        api.fetchProducts()
      ])
      setComputers(computersData)
      setProducts(productsData)
    } catch (err) {
      console.error("Essential data fetch error:", err)
      setError('Kassa ma\'lumotlarini yuklashda xatolik. Qayta yuklang.')
    }

    // 2. Fetch statistics, sales and debts independently (non-blocking)
    // Each is wrapped separately so one failure doesn't prevent others
    setLoadingStatsData(true)
    const today = new Date().toISOString().slice(0, 10)

    const statsPromise = api.fetchUserStatistics()
      .then(data => setStats(data))
      .catch(err => console.error("Statistics fetch error:", err))

    const salesPromise = api.fetchProductSales({ date: today, limit: 200 })
      .then(data => setSales(data))
      .catch(err => console.error("Sales fetch error:", err))

    const debtsPromise = api.fetchDebtTransactions({ date: today, limit: 200 })
      .then(data => setDebtTransactions(data))
      .catch(err => console.error("Debts fetch error:", err))

    await Promise.allSettled([statsPromise, salesPromise, debtsPromise])
    setLoadingStatsData(false)
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
      const today = new Date().toISOString().slice(0, 10)
      const salesData = await api.fetchProductSales({ date: today, limit: 200 })
      setSales(salesData)
    } catch {
      setError('Bugungi sotuvlar ma\'lumotini yuklashda xatolik.')
    } finally {
      setLoadingSales(false)
    }
  }

  const refreshDebts = async () => {
    try {
      setLoadingDebts(true)
      const today = new Date().toISOString().slice(0, 10)
      const debtsData = await api.fetchDebtTransactions({ date: today, limit: 200 })
      setDebtTransactions(debtsData)
    } catch {
      setError('Bugungi qarz ma\'lumotlarini yuklashda xatolik.')
    } finally {
      setLoadingDebts(false)
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
    } catch (err: unknown) {
      const errorMsg = parseError(err) || 'Sessiyani boshlashda xatolik'
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
      await loadData()
      if (selected) {
        try {
          const active = await api.fetchActiveSession(selected.id)
          setActiveSession(active)
        } catch {
          setActiveSession(null)
        }
      }
      setSelected(null)
    } catch (err: unknown) {
      const errorMsg = parseError(err) || 'Sessiyani saqlashda xatolik'
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
    } catch (err: unknown) {
      const errorMsg = parseError(err) || "Sessiyani yakunlashda xatolik. To'lov miqdorlarini tekshiring."
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
          </div>

          <div className="flex flex-col gap-4">
            {/* 1. Naqd pul */}
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/40 p-4 border border-emerald-200 dark:border-emerald-800 h-24 flex flex-col justify-between">
              <p className="text-xs text-emerald-600 dark:text-emerald-300 font-medium">Naqd pul</p>
              <p className="break-words text-lg font-semibold text-emerald-700 dark:text-emerald-200 leading-snug max-h-10 overflow-hidden">{formatCurrency(Number(stats?.total_cash ?? 0))}</p>
            </div>
            
            {/* 2. Karta */}
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/40 p-4 border border-amber-200 dark:border-amber-800 h-24 flex flex-col justify-between">
              <p className="text-xs text-amber-600 dark:text-amber-300 font-medium">Karta</p>
              <p className="break-words text-lg font-semibold text-amber-700 dark:text-amber-200 leading-snug max-h-10 overflow-hidden">{formatCurrency(Number(stats?.total_card ?? 0))}</p>
            </div>

            {/* 3. Qarz */}
            <button
              type="button"
              onClick={async () => {
                setShowDebtDrawer(true)
                await refreshDebts()
              }}
              className="rounded-2xl bg-rose-50 dark:bg-rose-900/40 p-4 text-left border border-rose-200 dark:border-rose-800 shadow-soft transition hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-900 dark:text-slate-100 h-24 flex flex-col justify-between w-full"
            >
              <p className="text-xs text-rose-600 dark:text-rose-300 font-medium">Qarz</p>
              <p className="break-words text-lg font-semibold text-rose-700 dark:text-rose-200 leading-snug max-h-10 overflow-hidden">{formatCurrency(Number(stats?.total_debt ?? 0))}</p>
            </button>

            {/* 4. PlayStation mahsulotlar */}
            <div className="rounded-2xl bg-violet-50 dark:bg-violet-900/40 p-4 border border-violet-200 dark:border-violet-800 h-24 flex flex-col justify-between">
              <p className="text-xs text-violet-600 dark:text-violet-300 font-medium">PlayStation mahsulotlari</p>
              <p className="break-words text-lg font-semibold text-violet-700 dark:text-violet-200 leading-snug max-h-10 overflow-hidden">{formatCurrency(Number(stats?.category_totals?.playstation ?? 0))}</p>
            </div>

            {/* 5. Sotilgan mahsulotlar */}
            <button
              type="button"
              onClick={async () => {
                setShowSalesDrawer(true)
                await refreshSales()
              }}
              className="rounded-2xl bg-blue-50 dark:bg-blue-950/40 p-4 text-left border border-blue-200 dark:border-blue-800 shadow-soft transition hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-900 dark:text-slate-100 h-24 flex flex-col justify-between w-full"
            >
              <p className="text-xs font-medium text-blue-600 dark:text-blue-300">Sotilgan mahsulotlar</p>
              <p className="break-words text-lg font-semibold text-blue-700 dark:text-blue-200">{formatCurrency(todayTotal)}</p>
            </button>
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
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Sotilgan mahsulotlar</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Nomi, soni, narxi, sana va vaqti</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSalesDrawer(false)}
                  className="rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  Yopish
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col gap-3 px-2">
                  {loadingSales ? (
                    <div className="py-10 text-center text-slate-500 dark:text-slate-400">Yuklanmoqda...</div>
                  ) : (
                    (() => {
                      const todays = (sales || []).filter((s) => !!s?.created_at && new Date(s.created_at as string).toDateString() === new Date().toDateString())
                      if (!todays.length) {
                        return <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">Bugun hali mahsulot sotilmagan</div>
                      }
                      return todays
                        .sort((a, b) => (b.created_at ? new Date(b.created_at).getTime() : 0) - (a.created_at ? new Date(a.created_at).getTime() : 0))
                        .map((s) => {
                          const prod = products.find((p) => p.id === s.product_id)
                          const name = s.product_name || productNameById.get(s.product_id) || prod?.name || '—'
                          const price = Number(s.unit_price ?? s.total_amount ?? 0)
                          const created = s.created_at ? new Date(s.created_at) : null
                          return (
                            <div
                              key={s.id ?? s.sale_key}
                              className="flex items-center justify-between h-20 w-full px-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow transition-transform duration-100"
                            >
                              <div className="min-w-0 pr-4">
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Soni: {s.quantity ?? 0} ta | Narxi: {formatCurrency(price)}</p>
                              </div>

                              <div className="ml-4 text-right flex-shrink-0">
                                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(price * Number(s.quantity ?? 0))}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{created ? `${created.toLocaleDateString('uz-UZ')} ${created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</p>
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

      {showDebtDrawer && (
        <>
          <button type="button" className="fixed inset-0 z-40 bg-slate-900/40" onClick={() => setShowDebtDrawer(false)} />
          <aside className="fixed right-0 top-0 z-50 h-screen w-full max-w-lg sm:max-w-xl overflow-hidden bg-white p-6 shadow-2xl dark:bg-slate-950">
            <div className="mx-auto max-w-lg flex h-full flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Bugungi qarz tarixi</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Qarz olgan va qarz berganlar ro'yxati</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDebtDrawer(false)}
                  className="rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  Yopish
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col gap-3 px-2">
                  {loadingDebts ? (
                    <div className="py-10 text-center text-slate-500 dark:text-slate-400">Yuklanmoqda...</div>
                  ) : (
                    (() => {
                      if (!debtTransactions.length) {
                        return <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">Bugun hali qarz operatsiyalari amalga oshirilmagan</div>
                      }
                      return debtTransactions
                        .sort((a, b) => (b.created_at ? new Date(b.created_at).getTime() : 0) - (a.created_at ? new Date(a.created_at).getTime() : 0))
                        .map((t) => {
                          const created = t.created_at ? new Date(t.created_at) : null
                          const isDebtGiven = Number(t.amount || 0) > 0
                          return (
                            <div
                              key={t.id}
                              className={`flex items-center justify-between h-20 w-full px-4 rounded-lg border shadow-sm transition-transform duration-100 ${isDebtGiven ? 'bg-rose-50/50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30' : 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30'}`}
                            >
                              <div className="min-w-0 pr-4">
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{t.debtor_name || 'Noma\'lum qarzdor'}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Telefon: {t.debtor_phone || '—'}</p>
                              </div>

                              <div className="ml-4 text-right flex-shrink-0">
                                <p className={`text-sm font-semibold ${isDebtGiven ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                  {isDebtGiven ? '+' : '-'}{formatCurrency(Math.abs(Number(t.amount || 0)))}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  {created ? `${created.toLocaleDateString('uz-UZ')} ${created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                                </p>
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

