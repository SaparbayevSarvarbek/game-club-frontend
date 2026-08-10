import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/common/Layout'
import api from '../services/api'
import { FetchProductSale } from '../types'
import { formatCurrency, todayUz } from '../utils/format'
import Card from '../components/ui/Card'
import Field from '../components/ui/Field'
import Button from '../components/ui/Button'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Drawer from '../components/ui/Drawer'
import EmptyState from '../components/ui/EmptyState'

type Tab = 'daily' | 'monthly' | 'yearly'
type Tone = 'amber' | 'emerald' | 'sky' | 'rose' | 'slate' | 'indigo' | 'violet' | 'teal'

const AdminDashboardPage = () => {
  const today = todayUz()
  const [date, setDate] = useState(today)
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [statistics, setStatistics] = useState<any>(null)
  const [tab, setTab] = useState<Tab>('daily')
  const [sales, setSales] = useState<FetchProductSale[]>([])
  const [debts, setDebts] = useState<any[]>([])
  const [drawer, setDrawer] = useState<'products' | 'debts' | 'income' | null>(null)
  const [debtFilter, setDebtFilter] = useState<'all' | 'borrowed' | 'paid'>('all')
  const inputValue = tab === 'monthly' ? date.slice(0, 7) : date
  const inputType = tab === 'daily' ? 'date' : tab === 'monthly' ? 'month' : 'number'
  const detailDate = tab === 'daily' ? startDate : today

  useEffect(() => {
    let ignore = false
    const year = Number(date.slice(0, 4))
    const month = Number(date.slice(5, 7))
    const params = tab === 'daily' ? { start_date: startDate, end_date: endDate } : tab === 'monthly' ? { year, month } : { year }
    api.fetchAdminStatistics(tab, params).then((data) => {
      if (!ignore) setStatistics(data)
    }).catch(console.error)
    return () => { ignore = true }
  }, [tab, date, startDate, endDate])

  useEffect(() => {
    let ignore = false
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
      if (!ignore) {
        setSales(saleData)
        setDebts(debtData)
      }
    }).catch(console.error)
    return () => { ignore = true }
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
  const borrowedTotal = useMemo(() => borrowedDebts.reduce((sum, debt) => sum + Number(debt.amount || 0), 0), [borrowedDebts])
  const paidTotal = useMemo(() => Math.abs(paidDebts.reduce((sum, debt) => sum + Number(debt.amount || 0), 0)), [paidDebts])
  const debtorCount = useMemo(() => new Set(debts.map((d) => d.debtor_id)).size, [debts])
  const visibleDebts = debtFilter === 'all' ? debts : debtFilter === 'borrowed' ? borrowedDebts : paidDebts

  const incomeCash = (statistics?.total_cash ?? 0)
  const incomeCard = (statistics?.total_card ?? 0)
  const incomeTotal = Number(incomeCash) + Number(incomeCard)

  const cards: { label: string; value: any; tone: Tone; onClick?: () => void }[] = [
    { label: 'Daromad', value: incomeTotal, tone: 'emerald', onClick: () => setDrawer('income') },
    { label: 'Naqd', value: statistics?.total_cash ?? 0, tone: 'sky' },
    { label: 'Karta', value: statistics?.total_card ?? 0, tone: 'amber' },
    { label: 'Qarz', value: statistics?.total_debt ?? 0, tone: 'rose', onClick: () => { setDebtFilter('all'); setDrawer('debts') } },
    { label: 'PlayStation', value: statistics?.category_totals?.playstation ?? 0, tone: 'violet' },
    { label: 'Sotilgan mahsulotlar', value: statistics?.products_revenue ?? 0, tone: 'teal', onClick: () => setDrawer('products') },
    { label: "Bugungi chegirma", value: statistics?.total_discount ?? 0, tone: 'slate' },
  ]

  return (
    <Layout>
      <div className="space-y-6">
        <Card
          title="Admin statistikasi"
          subtitle="Kunlik, oylik va yillik daromad, xarajat va foydani kuzating."
          actions={
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'daily' as const, label: 'Kunlik' },
                { key: 'monthly' as const, label: 'Oylik' },
                { key: 'yearly' as const, label: 'Yillik' },
              ].map(({ key, label }) => (
                <Button key={key} size="sm" variant={tab === key ? 'primary' : 'secondary'} onClick={() => setTab(key)}>
                  {label}
                </Button>
              ))}
            </div>
          }
        >
          <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tab === 'daily' ? (
              <>
                <Field as="input" label="Boshlanish sanasi" inputProps={{ type: 'date', value: startDate, onChange: (e: any) => setStartDate(e.target.value) }} />
                <Field as="input" label="Tugash sanasi" inputProps={{ type: 'date', value: endDate, onChange: (e: any) => setEndDate(e.target.value) }} />
              </>
            ) : (
              <Field
                as="input"
                label="Sanani tanlang"
                inputProps={{
                  type: inputType,
                  value: tab === 'yearly' ? date.slice(0, 4) : inputValue,
                  onChange: (e: any) => tab === 'monthly' ? setDate(`${e.target.value}-01`) : tab === 'yearly' ? setDate(`${e.target.value}-01-01`) : setDate(e.target.value),
                }}
              />
            )}
          </div>
        </Card>

        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {cards.map((card) => (
            <StatCard
              key={card.label}
              gradient
              tone={card.tone}
              label={card.label}
              value={formatCurrency(Number(card.value ?? 0))}
              onClick={card.onClick}
              valueClassName="text-2xl sm:text-3xl"
            />
          ))}
        </section>
      </div>

      <Drawer
        open={drawer === 'products'}
        onClose={() => setDrawer(null)}
        title="Sotilgan mahsulotlar"
        subtitle="Bir xil mahsulotlar birlashtirilgan"
        footer={
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div><p className="text-slate-500 dark:text-slate-400">Umumiy son</p><p className="font-bold text-slate-900 dark:text-slate-100">{productsQuantity} ta</p></div>
            <div><p className="text-slate-500 dark:text-slate-400">Umumiy tan narx</p><p className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(productsCost)}</p></div>
            <div><p className="text-slate-500 dark:text-slate-400">Umumiy sotilgan narx</p><p className="font-bold text-emerald-700 dark:text-emerald-200">{formatCurrency(productsTotal)}</p></div>
            <div><p className="text-slate-500 dark:text-slate-400">Foyda</p><p className="font-bold text-emerald-700 dark:text-emerald-200">{formatCurrency(productsProfit)}</p></div>
          </div>
        }
      >
        <div className="space-y-4">
          {groupedSales.length === 0 ? (
            <EmptyState message="Sotuvlar topilmadi." />
          ) : (
            groupedSales.map((item) => (
              <div key={item.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-start justify-between">
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                  <Badge tone="sky">{item.quantity} ta</Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <p className="font-medium text-slate-400">Sotish narxi (Dona)</p>
                    <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(item.unitPrice)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-400">Tan narxi (Dona)</p>
                    <p className="mt-0.5 font-semibold text-slate-500 dark:text-slate-400">{formatCurrency(item.costTotal / item.quantity)}</p>
                  </div>
                  <div className="col-span-2 mt-1 flex items-center justify-between border-t border-slate-200 pt-2 dark:border-slate-800">
                    <div>
                      <span className="font-medium text-slate-400">Jami tushum</span>
                      <p className="mt-0.5 text-sm font-bold text-blue-600 dark:text-blue-400">{formatCurrency(item.soldTotal)}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-slate-400">Sof foyda</span>
                      <p className="mt-0.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(item.soldTotal - item.costTotal)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Drawer>

      <Drawer
        open={drawer === 'income'}
        onClose={() => setDrawer(null)}
        title="Daromad tafsiloti"
        subtitle="Naqd va karta bo'limi"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
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
      </Drawer>

      <Drawer
        open={drawer === 'debts'}
        onClose={() => setDrawer(null)}
        title="Qarz tafsiloti"
        subtitle="Tanlangan davr bo'yicha qarz olingan va to'langan summalar"
        maxWidth="max-w-md"
      >
        <div className="mb-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDebtFilter((prev) => (prev === 'borrowed' ? 'all' : 'borrowed'))}
            className={`rounded-2xl border p-4 text-left transition-colors duration-150 ${debtFilter === 'borrowed' ? 'border-rose-400 bg-rose-100 ring-2 ring-rose-300 dark:border-rose-500 dark:bg-rose-900/60' : 'border-rose-200 bg-rose-50 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40'}`}
          >
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-rose-600 dark:text-rose-300">Qarz olingan</p>
            <p className="mt-2 break-words text-2xl font-bold leading-tight text-rose-800 dark:text-rose-100">{formatCurrency(borrowedTotal)}</p>
            <p className="mt-1 text-xs text-rose-500 dark:text-rose-400">{borrowedDebts.length} ta operatsiya</p>
          </button>
          <button
            type="button"
            onClick={() => setDebtFilter((prev) => (prev === 'paid' ? 'all' : 'paid'))}
            className={`rounded-2xl border p-4 text-left transition-colors duration-150 ${debtFilter === 'paid' ? 'border-emerald-400 bg-emerald-100 ring-2 ring-emerald-300 dark:border-emerald-500 dark:bg-emerald-900/60' : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40'}`}
          >
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-300">Qarz to'langan</p>
            <p className="mt-2 break-words text-2xl font-bold leading-tight text-emerald-800 dark:text-emerald-100">{formatCurrency(paidTotal)}</p>
            <p className="mt-1 text-xs text-emerald-500 dark:text-emerald-400">{paidDebts.length} ta operatsiya</p>
          </button>
        </div>

        <div className="mb-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {debtFilter === 'all' ? 'Barcha operatsiyalar' : debtFilter === 'borrowed' ? 'Faqat qarz olinganlar' : "Faqat qarz to'langanlar"}
          </p>
          {debtFilter !== 'all' && (
            <Button variant="ghost" size="sm" onClick={() => setDebtFilter('all')}>Hammasi</Button>
          )}
        </div>

        <div className="mb-3 grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">Sof qarz</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{formatCurrency(debtsTotal)}</p>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">Qarzdorlar</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{debtorCount} kishi</p>
          </div>
        </div>

        <div className="space-y-3">
          {visibleDebts.length === 0 ? (
            <EmptyState message="Bu davrda operatsiyalar yo'q." />
          ) : (
            visibleDebts.map((debt) => {
              const created = new Date(debt.created_at);
              const isPaid = Number(debt.amount) < 0;
              return (
                <div
                  key={debt.id}
                  className={`rounded-2xl border p-4 ${
                    isPaid
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100'
                      : 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <p className="text-base font-semibold">{debt.debtor_name ?? `Qarzdor #${debt.debtor_id}`}</p>
                    <Badge tone={isPaid ? 'emerald' : 'rose'}>{isPaid ? "To'ladi" : "Oldi"}</Badge>
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
      </Drawer>
    </Layout>
  )
}

export default AdminDashboardPage
