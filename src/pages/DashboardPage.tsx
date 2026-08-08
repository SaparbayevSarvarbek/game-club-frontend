import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/common/Layout'
import SessionDialog from '../components/user/SessionDialog'
import api from '../services/api'
import { FetchComputer, FetchProduct, FetchProductSale } from '../types'
import { formatCurrency, formatPhoneNumber, todayUz } from '../utils/format'
import { parseError } from '../utils/error'
import { useToast } from '../components/common/Toast'
import { ComputerDesktopIcon, PlayIcon } from '@heroicons/react/24/outline'
import Card from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Drawer from '../components/ui/Drawer'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'

const DashboardPage = () => {
  const toast = useToast()
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

  const loadData = async () => {
    // 1. Fetch computers and products first (essential for UI)
    try {
      const [computersData, productsData] = await Promise.all([
        api.fetchComputers(),
        api.fetchProducts()
      ])
      setComputers(computersData)
      setProducts(productsData)
    } catch (err) {
      console.error("Essential data fetch error:", err)
      toast.error('Kassa ma\'lumotlarini yuklashda xatolik. Qayta yuklang.')
    }

    // 2. Fetch statistics, sales and debts independently (non-blocking)
    // Each is wrapped separately so one failure doesn't prevent others
    setLoadingStatsData(true)
    const today = todayUz()

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
      const today = todayUz()
      const salesData = await api.fetchProductSales({ date: today, limit: 200 })
      setSales(salesData)
    } catch {
      toast.error('Bugungi sotuvlar ma\'lumotini yuklashda xatolik.')
    } finally {
      setLoadingSales(false)
    }
  }

  const refreshDebts = async () => {
    try {
      setLoadingDebts(true)
      const today = todayUz()
      const debtsData = await api.fetchDebtTransactions({ date: today, limit: 200 })
      setDebtTransactions(debtsData)
    } catch {
      toast.error('Bugungi qarz ma\'lumotlarini yuklashda xatolik.')
    } finally {
      setLoadingDebts(false)
    }
  }

  const handleStart = async (payload: any) => {
    try {
      await api.startSession(payload)
      toast.success('Sessiya muvaffaqiyatli boshlanayapti...')
      setSelected(null)
      setActiveSession(null)
      setTimeout(() => {
        loadData()
      }, 500)
    } catch (err: unknown) {
      const errorMsg = parseError(err) || 'Sessiyani boshlashda xatolik'
      toast.error(errorMsg)
    }
  }

  const handleComputerSelect = async (computer: FetchComputer) => {
    setSelected(computer)
    setActiveSession(null)

    if (computer.is_active) {
      try {
        setLoadingSession(true)
        const active = await api.fetchActiveSession(computer.id)
        setActiveSession(active)
      } catch {
        toast.error('Bu kompyuterning faol sessiyasini yuklashda xatolik')
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
      await api.saveSession(sessionId)
      toast.success('Sessiya muvaffaqiyatli saqlandi')
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
      toast.error(errorMsg)
    }
  }

  const handleComplete = async (payload: any) => {
    try {
      await api.completeSession(payload.session_id, payload)
      toast.success('Sessiya muvaffaqiyatli yakunlandi')
      setSelected(null)
      setActiveSession(null)
      await loadData()
      if (showSalesDrawer) {
        await refreshSales()
      }
    } catch (err: unknown) {
      const errorMsg = parseError(err) || "Sessiyani yakunlashda xatolik. To'lov miqdorlarini tekshiring."
      toast.error(errorMsg)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-4">
          <StatCard
            label="Kompyuterlar"
            value={counts.total}
            subtitle="Mavjud stansiyalar"
            tone="emerald"
            gradient
            icon={<ComputerDesktopIcon className="h-8 w-8" />}
          />
          <StatCard
            label="Band"
            value={counts.active}
            subtitle="Hozir band"
            tone="rose"
            icon={<PlayIcon className="h-8 w-8" />}
          />
          <StatCard
            label="Bo'sh"
            value={counts.free}
            subtitle="Bronlash uchun tayyor"
            tone="emerald"
            icon={<ComputerDesktopIcon className="h-8 w-8" />}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.5fr_0.5fr]">
          <Card
            title="Kompyuter tarmog'i"
            subtitle="Sessiyani boshlash yoki boshqarish uchun kartani bosing."
          >
            <div className="mt-2 grid gap-5 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-4">
              {computers.map((computer) => (
                <button
                  type="button"
                  key={computer.id}
                  onClick={() => handleComputerSelect(computer)}
                  className={`group rounded-3xl border bg-slate-50 p-8 text-left transition hover:-translate-y-1 hover:shadow-md dark:bg-slate-800 ${computer.type === 'playstation' ? 'border-amber-300/70 bg-amber-50 dark:bg-amber-900/20' : 'border-slate-200 dark:border-slate-700'} `}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-slate-200 text-lg dark:bg-slate-700">
                      {computer.type === 'playstation' ? <PlayIcon className="h-10 w-10 text-rose-700 dark:text-rose-300" /> : <ComputerDesktopIcon className="h-10 w-10 text-slate-500 dark:text-slate-300" />}
                    </span>
                    <Badge tone={computer.is_active ? 'rose' : 'emerald'}>{computer.is_active ? 'Band' : "Bo'sh"}</Badge>
                  </div>
                  <div className="mt-5">
                    <p className="text-xs text-slate-500 dark:text-slate-400">{computer.type === 'playstation' ? 'PlayStation' : 'Computer'}</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">Stol #{computer.number}</p>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{computer.is_active ? 'Faol sessiyani boshqarish' : 'Yangi sessiya boshlash'}</p>
                </button>
              ))}
            </div>
          </Card>

          <div className="flex flex-col gap-4">
            <StatCard label="Naqd pul" value={formatCurrency(Number(stats?.total_cash ?? 0))} tone="sky" valueClassName="text-2xl" />
            <StatCard label="Karta" value={formatCurrency(Number(stats?.total_card ?? 0))} tone="amber" valueClassName="text-2xl" />
            <StatCard
              label="Qarz"
              value={formatCurrency(Number(stats?.total_debt ?? 0))}
              tone="rose"
              valueClassName="text-2xl"
              onClick={async () => {
                setShowDebtDrawer(true)
                await refreshDebts()
              }}
            />
            <StatCard label="PlayStation mahsulotlari" value={formatCurrency(Number(stats?.category_totals?.playstation ?? 0))} tone="violet" valueClassName="text-2xl" />
            <StatCard
              label="Sotilgan mahsulotlar"
              value={formatCurrency(todayTotal)}
              tone="teal"
              valueClassName="text-2xl"
              onClick={async () => {
                setShowSalesDrawer(true)
                await refreshSales()
              }}
            />
          </div>
        </section>

        <Card title="Mahsulotlar" subtitle="Savdo va sessiyalar uchun mahsulotlar.">
          <div className="mt-2 max-h-80 overflow-auto">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <div key={product.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{product.name}</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Qolgan: {product.quantity ?? 0} dona</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-300">{formatCurrency(product.price)}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
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

      <Drawer
        open={showSalesDrawer}
        onClose={() => setShowSalesDrawer(false)}
        title="Sotilgan mahsulotlar"
        subtitle="Nomi, soni, narxi, sana va vaqti"
      >
        {loadingSales ? (
          <Spinner />
        ) : (
          (() => {
            const todays = (sales || []).filter((s) => !!s?.created_at && new Date(s.created_at as string).toDateString() === new Date().toDateString())
            if (!todays.length) {
              return <EmptyState message="Bugun hali mahsulot sotilmagan" />
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
                    className="flex h-20 w-full items-center justify-between rounded-lg border border-slate-100 bg-white px-4 shadow-sm transition-transform duration-100 hover:shadow dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="min-w-0 pr-4">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{name}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Soni: {s.quantity ?? 0} ta | Narxi: {formatCurrency(price)}</p>
                    </div>

                    <div className="ml-4 flex-shrink-0 text-right">
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(price * Number(s.quantity ?? 0))}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{created ? `${created.toLocaleDateString('uz-UZ')} ${created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</p>
                    </div>
                  </div>
                )
              })
          })()
        )}
      </Drawer>

      <Drawer
        open={showDebtDrawer}
        onClose={() => setShowDebtDrawer(false)}
        title="Bugungi qarz tarixi"
        subtitle="Qarz olgan va qarz berganlar ro'yxati"
      >
        {loadingDebts ? (
          <Spinner />
        ) : (
          (() => {
            if (!debtTransactions.length) {
              return <EmptyState message="Bugun hali qarz operatsiyalari amalga oshirilmagan" />
            }
            return debtTransactions
              .sort((a, b) => (b.created_at ? new Date(b.created_at).getTime() : 0) - (a.created_at ? new Date(a.created_at).getTime() : 0))
              .map((t) => {
                const created = t.created_at ? new Date(t.created_at) : null
                const isDebtGiven = Number(t.amount || 0) > 0
                return (
                  <div
                    key={t.id}
                    className={`flex h-20 w-full items-center justify-between rounded-lg border px-4 shadow-sm transition-transform duration-100 ${isDebtGiven ? 'border-rose-100 bg-rose-50/50 dark:border-rose-900/30 dark:bg-rose-950/20' : 'border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-950/20'}`}
                  >
                    <div className="min-w-0 pr-4">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{t.debtor_name || 'Noma\'lum qarzdor'}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Telefon: {t.debtor_phone ? formatPhoneNumber(t.debtor_phone) : '—'}</p>
                    </div>

                    <div className="ml-4 flex-shrink-0 text-right">
                      <p className={`text-sm font-semibold ${isDebtGiven ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {isDebtGiven ? '+' : '-'}{formatCurrency(Math.abs(Number(t.amount || 0)))}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {created ? `${created.toLocaleDateString('uz-UZ')} ${created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                      </p>
                    </div>
                  </div>
                )
              })
          })()
        )}
      </Drawer>
    </Layout>
  )
}

export default DashboardPage
