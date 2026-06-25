import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/common/Layout'
import IconButton from '../components/common/IconButton'
import api from '../services/api'
import { FetchProductSale } from '../types'
import { formatCurrency } from '../utils/format'

type Tab = 'daily' | 'monthly' | 'yearly'

const AdminDashboardPage = () => {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [statistics, setStatistics] = useState<any>(null)
  const [tab, setTab] = useState<Tab>('daily')
  const [sales, setSales] = useState<FetchProductSale[]>([])
  const [debts, setDebts] = useState<any[]>([])
  const [drawer, setDrawer] = useState<'products' | 'debts' | 'income' | null>(null)
  const inputValue = tab === 'monthly' ? date.slice(0, 7) : date
  const inputType = tab === 'daily' ? 'date' : tab === 'monthly' ? 'month' : 'number'
  const detailDate = tab === 'daily' ? startDate : today

  useEffect(() => {
    const year = Number(date.slice(0, 4))
    const month = Number(date.slice(5, 7))
    const params = tab === 'daily' ? { start_date: startDate, end_date: endDate } : tab === 'monthly' ? { year, month } : { year }
    api.fetchAdminStatistics(tab, params).then(setStatistics).catch(console.error)
  }, [tab, date, startDate, endDate])

  useEffect(() => {
    const year = Number(date.slice(0, 4))
    const month = Number(date.slice(5, 7))
    const params = tab === 'daily'
      ? { start_date: startDate, end_date: endDate, limit: 200 }
      : tab === 'monthly'
        ? { month: `${year}-${String(month).padStart(2, '0')}`, limit: 200 }
        : { year, limit: 200 }

    Promise.all([
      api.fetchProductSales(params),
      api.fetchDebtTransactions(params),
    ]).then(([saleData, debtData]) => {
      setSales(saleData)
      setDebts(debtData)
    }).catch(console.error)
  }, [tab, date, startDate, endDate])

  const productsTotal = useMemo(() => sales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0), [sales])
  const productsCost = useMemo(() => sales.reduce((sum, sale) => sum + Number(sale.cost_price || 0) * Number(sale.quantity || 0), 0), [sales])
  const productsProfit = productsTotal - productsCost
  const productsQuantity = useMemo(() => sales.reduce((sum, sale) => sum + Number(sale.quantity || 0), 0), [sales])
  const groupedSales = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; costTotal: number; soldTotal: number; unitPrice: number }>()
    sales.forEach((sale) => {
      const key = String(sale.product_id)
      const current = map.get(key) ?? {
        name: sale.product_name ?? `Mahsulot #${sale.product_id}`,
        quantity: 0,
        costTotal: 0,
        soldTotal: 0,
        unitPrice: Number(sale.unit_price ?? 0),
      }
      current.quantity += Number(sale.quantity || 0)
      current.costTotal += Number(sale.cost_price || 0) * Number(sale.quantity || 0)
      current.soldTotal += Number(sale.total_amount || 0)
      if (!current.unitPrice && sale.unit_price) current.unitPrice = Number(sale.unit_price)
      map.set(key, current)
    })
    return Array.from(map.values())
  }, [sales])
  const debtsTotal = useMemo(() => debts.reduce((sum, debt) => sum + Number(debt.amount || 0), 0), [debts])
  const borrowedDebts = debts.filter((debt) => Number(debt.amount) > 0)
  const paidDebts = debts.filter((debt) => Number(debt.amount) < 0)

  const incomeCash = (statistics?.total_cash ?? 0)
  const incomeCard = (statistics?.total_card ?? 0)
  const incomeTotal = Number(incomeCash) + Number(incomeCard)

  const cards = [
    { label: 'Daromad', value: incomeTotal, tone: 'from-amber-500 to-orange-600 dark:from-amber-950 dark:to-orange-950', onClick: () => setDrawer('income') },
    { label: 'Naqd', value: statistics?.total_cash ?? 0, tone: 'from-emerald-500 to-teal-600 dark:from-emerald-950 dark:to-teal-950' },
    { label: 'Karta', value: statistics?.total_card ?? 0, tone: 'from-sky-500 to-cyan-600 dark:from-sky-950 dark:to-cyan-950' },
    { label: 'Qarz', value: statistics?.total_debt ?? 0, tone: 'from-rose-500 to-pink-700 dark:from-rose-950 dark:to-pink-950', onClick: () => setDrawer('debts') },
    { label: 'PlayStation', value: statistics?.category_totals?.playstation ?? 0, tone: 'from-violet-500 to-indigo-600 dark:from-violet-950 dark:to-indigo-950' },
    { label: 'Sotilgan mahsulotlar', value: statistics?.products_revenue ?? 0, tone: 'from-blue-500 to-cyan-700 dark:from-blue-950 dark:to-cyan-950', onClick: () => setDrawer('products') },
    { label: "Bugungi chegirma", value: statistics?.total_discount ?? 0, tone: 'from-orange-500 to-rose-600 dark:from-orange-950 dark:to-rose-950' },
  ]

  const inputClass = 'mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'

  return (
    <Layout>
      <div className="space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-soft dark:bg-slate-900">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Admin statistikasi</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Kunlik, oylik va yillik daromad, xarajat va foydani kuzating.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'daily' as const, label: 'Kunlik' },
                { key: 'monthly' as const, label: 'Oylik' },
                { key: 'yearly' as const, label: 'Yillik' },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setTab(key)} className={`rounded-2xl px-4 py-2 text-sm font-medium ${tab === key ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'}`}>{label}</button>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tab === 'daily' ? (
              <>
                <label className="block"><span className="text-sm text-slate-600 dark:text-slate-300">Boshlanish sanasi</span><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} /></label>
                <label className="block"><span className="text-sm text-slate-600 dark:text-slate-300">Tugash sanasi</span><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} /></label>
              </>
            ) : (
              <label className="block"><span className="text-sm text-slate-600 dark:text-slate-300">Sanani tanlang</span><input type={inputType} value={tab === 'yearly' ? date.slice(0, 4) : inputValue} onChange={(e) => tab === 'monthly' ? setDate(`${e.target.value}-01`) : tab === 'yearly' ? setDate(`${e.target.value}-01-01`) : setDate(e.target.value)} className={inputClass} /></label>
            )}
          </div>
        </section>
 
        <section className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {cards.map((card) => {
            const content = (
              <>
                <p className="text-sm uppercase tracking-[0.18em] text-white/85">{card.label}</p>
                <p className="mt-4 break-words text-3xl font-bold leading-tight text-white sm:text-4xl max-h-16 overflow-hidden">{formatCurrency(Number(card.value ?? 0))}</p>
              </>
            )
            const base = `min-w-0 rounded-2xl bg-gradient-to-br ${card.tone} p-6 shadow-soft transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between h-44`
            return card.onClick ? (
              <button key={card.label} onClick={card.onClick} className={base + ' text-left'}>{content}</button>
            ) : (
              <div key={card.label} className={base}>{content}</div>
            )
          })}
        </section>
      </div>
 
      {drawer && <button className="fixed inset-0 z-40 bg-slate-950/50" onClick={() => setDrawer(null)} />}
      {drawer === 'products' && (
        <aside className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-xl flex-col bg-white shadow-2xl dark:bg-slate-950 animate-slide-in">
          <div className="shrink-0 border-b border-slate-200 p-6 dark:border-slate-800">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Sotilgan mahsulotlar</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Bir xil mahsulotlar birlashtirilgan</p>
              </div>
              <button onClick={() => setDrawer(null)} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {groupedSales.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Sotuvlar topilmadi.</p>
              ) : (
                groupedSales.map((item) => (
                  <div key={item.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-base">{item.name}</p>
                      <span className="bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 text-xs px-2.5 py-0.5 rounded-full font-medium">
                        {item.quantity} ta
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div>
                        <p className="text-slate-400 font-medium">Sotish narxi (Dona)</p>
                        <p className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">{formatCurrency(item.unitPrice)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Tan narxi (Dona)</p>
                        <p className="text-slate-500 dark:text-slate-400 font-semibold mt-0.5">{formatCurrency(item.costTotal / item.quantity)}</p>
                      </div>
                      <div className="border-t border-slate-200 dark:border-slate-800 pt-2 col-span-2 flex justify-between items-center mt-1">
                        <div>
                          <span className="text-slate-400 font-medium">Jami tushum</span>
                          <p className="text-blue-600 dark:text-blue-400 font-bold text-sm mt-0.5">{formatCurrency(item.soldTotal)}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 font-medium">Sof foyda</span>
                          <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm mt-0.5">{formatCurrency(item.soldTotal - item.costTotal)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="shrink-0 border-t border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div><p className="text-slate-500 dark:text-slate-400">Umumiy son</p><p className="font-bold text-slate-900 dark:text-slate-100">{productsQuantity} ta</p></div>
              <div><p className="text-slate-500 dark:text-slate-400">Umumiy tan narx</p><p className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(productsCost)}</p></div>
              <div><p className="text-slate-500 dark:text-slate-400">Umumiy sotilgan narx</p><p className="font-bold text-blue-700 dark:text-blue-200">{formatCurrency(productsTotal)}</p></div>
              <div><p className="text-slate-500 dark:text-slate-400">Foyda</p><p className="font-bold text-emerald-700 dark:text-emerald-200">{formatCurrency(productsProfit)}</p></div>
            </div>
          </div>
        </aside>
      )}      {drawer === 'income' && (
        <aside className="fixed right-0 top-0 z-50 h-screen w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl dark:bg-slate-950">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Daromad tafsiloti</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Naqd va karta bo'limi</p>
            </div>
            <button onClick={() => setDrawer(null)} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">Yopish</button>
          </div>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">Naqd</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(Number(incomeCash))}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">Karta</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(Number(incomeCard))}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/40">
              <p className="text-sm text-amber-600 dark:text-amber-300">Umumiy daromad</p>
              <p className="mt-2 text-2xl font-semibold text-amber-900 dark:text-amber-100">{formatCurrency(Number(incomeTotal))}</p>
            </div>
          </div>
        </aside>
      )}      {drawer === 'debts' && (
        <aside className="fixed right-0 top-0 z-50 h-screen w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl dark:bg-slate-950">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Qarzdorlik tarixi</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Qarz olingan va to'langan operatsiyalar (oxirgilar yuqorida)</p>
            </div>
            <button onClick={() => setDrawer(null)} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-5 space-y-3">
            {debts.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Operatsiyalar yo'q.</p>
            ) : (
              debts.map((debt) => {
                const created = new Date(debt.created_at);
                const isPaid = Number(debt.amount) < 0;
                return (
                  <div
                    key={debt.id}
                    className={`rounded-2xl border p-4 ${
                      isPaid
                        ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100'
                        : 'border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-base">{debt.debtor_name ?? `Qarzdor #${debt.debtor_id}`}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isPaid ? 'bg-emerald-200/60 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200' : 'bg-rose-200/60 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'}`}>
                        {isPaid ? "To'ladi" : "Oldi"}
                      </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">{formatCurrency(Math.abs(Number(debt.amount)))}</p>
                    {debt.note && <p className="mt-1 text-sm opacity-80">{debt.note}</p>}
                    <p className="mt-2 text-xs opacity-65">
                      {created.toLocaleDateString('uz-UZ')} | {created.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      )}    </Layout>
  )
}

export default AdminDashboardPage


