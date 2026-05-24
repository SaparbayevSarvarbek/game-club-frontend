import { useEffect, useState } from 'react'
import Layout from '../components/common/Layout'
import api from '../services/api'
import { formatCurrency } from '../utils/format'

const AdminDashboardPage = () => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))
  const [statistics, setStatistics] = useState<any>(null)
  const [tab, setTab] = useState<'daily' | 'monthly' | 'yearly'>('daily')
  const inputValue = tab === 'monthly' ? date.slice(0, 7) : date
  const inputType = tab === 'daily' ? 'date' : tab === 'monthly' ? 'month' : 'number'

  useEffect(() => {
    const year = Number(date.slice(0, 4))
    const month = Number(date.slice(5, 7))
    const params =
      tab === 'daily'
        ? { start_date: startDate, end_date: endDate }
        : tab === 'monthly'
        ? { year, month }
        : { year }
    api.fetchAdminStatistics(tab, params).then(setStatistics).catch(console.error)
  }, [tab, date, startDate, endDate])

  return (
    <Layout>
      <div className="space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Admin statistikasi</h2>
              <p className="mt-2 text-sm text-slate-500">Kunlik, oylik va yillik faoliyatni koʻrib chiqing.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'daily' as const, label: 'Kunlik' },
                { key: 'monthly' as const, label: 'Oylik' },
                { key: 'yearly' as const, label: 'Yillik' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`rounded-2xl px-4 py-2 text-sm font-medium ${tab === key ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tab === 'daily' ? (
              <>
                <label className="block">
                  <span className="text-sm text-slate-600">Boshlanish sanasi</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-slate-600">Tugash sanasi</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                </label>
              </>
            ) : (
              <label className="block">
                <span className="text-sm text-slate-600">Sanani tanlang</span>
                <input
                  type={inputType}
                  value={tab === 'yearly' ? date.slice(0, 4) : inputValue}
                  onChange={(e) => {
                    if (tab === 'monthly') {
                      setDate(`${e.target.value}-01`)
                    } else if (tab === 'yearly') {
                      setDate(`${e.target.value}-01-01`)
                    } else {
                      setDate(e.target.value)
                    }
                  }}
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                />
              </label>
            )}
          </div>

          <div className="mt-4">
            <div className="rounded-3xl bg-white p-6 shadow-soft">
              <p className="text-sm text-slate-500">Umumiy summa</p>
              <p className="mt-2 text-4xl font-bold text-slate-900">{formatCurrency(Number(statistics?.total_revenue ?? 0))}</p>
            </div>
          </div>
        </section>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            { key: 'total_cash', label: 'Naqd pul' },
            { key: 'total_card', label: 'Karta' },
            { key: 'total_debt', label: 'Qarz' },
            { key: 'total_revenue', label: 'Daromad' },
            { key: 'total_discount', label: 'Chegirma' },
            { key: 'total_expenses', label: 'Harajlar' },
          ].map(({ key, label }) => (
            <div key={key} className="rounded-3xl bg-white p-6 shadow-soft">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{label}</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">{formatCurrency(Number(statistics?.[key as keyof typeof statistics] ?? 0))}</p>
            </div>
          ))}
        </section>
        <section className="rounded-3xl bg-white p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-slate-900">Xulosa</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Sessiyalar</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{statistics?.sessions_count ?? 0}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Sotilgan mahsulotlar</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{statistics?.products_sold ?? 0}</p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  )
}

export default AdminDashboardPage
