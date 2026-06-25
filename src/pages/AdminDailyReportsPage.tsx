import { useEffect, useState } from 'react'
import Layout from '../components/common/Layout'
import api from '../services/api'
import { formatCurrency, formatDate } from '../utils/format'
import IconButton from '../components/common/IconButton'

const AdminDailyReportsPage = () => {
  const [reports, setReports] = useState<any[]>([])
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null)

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await api.fetchDailyReports()
        setReports(data)
      } catch (err: any) {
        setError(err?.response?.data?.detail || 'Kunlik hisobotlarni yuklashda xatolik yuz berdi.')
      } finally {
        setLoading(false)
      }
    }

    loadReports()
  }, [])

  return (
    <Layout>
      <div className="space-y-6">
        <section className="rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-soft">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Kunlik hisobotlar</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Hisobotlar ro'yxati va har bir kun uchun jami o'lchovlar.</p>
            </div>
            <div className="rounded-3xl bg-slate-50 dark:bg-slate-700 px-4 py-3 text-sm text-slate-600 dark:text-slate-200">
              Umumiy saqlangan hisobotlar: {reports.length}
            </div>
          </div>
        </section>

        {loading ? (
          <section className="rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-soft">
            <p className="text-sm text-slate-500 dark:text-slate-400">Hisobotlar yuklanmoqda...</p>
          </section>
        ) : error ? (
          <section className="rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-soft">
            <p className="text-sm text-rose-600">{error}</p>
          </section>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.2fr_minmax(360px,1fr)]">
            <section className="rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-soft">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Hisobotlar ro'yxati</h3>
              <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">
                {reports.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Hozircha hisobotlar mavjud emas.</p>
                ) : (
                  reports.map((report) => (
                    <button
                      key={report.id}
                      type="button"
                      onClick={() => setSelectedReport(report)}
                      className={`w-full rounded-2xl border p-3 text-left transition flex items-center justify-between text-slate-900 dark:text-slate-100 ${selectedReport?.id === report.id ? 'border-sky-500 bg-sky-50 dark:bg-sky-900 dark:border-sky-400' : 'border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:border-slate-600 dark:hover:bg-slate-700'}`}
                    >
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Hisobot sanasi</p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDate(report.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Umumiy summa</p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(Number(report.total_revenue ?? 0))}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-soft">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Tanlangan kun tafsilotlari</h3>
              {selectedReport ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-3xl bg-slate-50 dark:bg-slate-700 p-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Sana</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{new Date(selectedReport.created_at).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { label: 'Umumiy tushum', value: selectedReport.total_revenue },
                      { label: 'Naqd pul', value: selectedReport.total_cash },
                      { label: 'Karta', value: selectedReport.total_card },
                      { label: 'Qarz', value: selectedReport.total_debt },
                      { label: 'Xarajat', value: selectedReport.total_expenses },
                      { label: 'Chegirma', value: selectedReport.total_discount },
                      { label: 'Kamomad', value: selectedReport.cash_difference },
                    ].map((item) => (
                      <div key={item.label} className="rounded-3xl bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(Number(item.value ?? 0))}</p>
                      </div>
                    ))}
                  </div>
                  {selectedReport.comment && (
                    <div className="rounded-3xl bg-slate-50 dark:bg-slate-700 p-4 border border-slate-200 dark:border-slate-700">
                      <p className="text-sm text-slate-500 dark:text-slate-400">Izoh</p>
                      <p className="mt-2 text-sm text-slate-900 dark:text-slate-100 whitespace-pre-line">{selectedReport.comment}</p>
                    </div>
                  )}
                  {selectedReport.image_url && (
                    <div className="rounded-3xl bg-slate-50 dark:bg-slate-700 p-4 border border-slate-200 dark:border-slate-700">
                      <p className="text-sm text-slate-500 dark:text-slate-400">Yuklangan chek rasmi</p>
                      <img
                        src={(import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '') + selectedReport.image_url}
                        alt="Hisobot rasmi"
                        onClick={() => setActiveImageUrl((import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '') + selectedReport.image_url)}
                        className="mt-3 w-full cursor-pointer rounded-3xl border border-slate-200 dark:border-slate-700 object-contain transition hover:opacity-90 max-h-80"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Ro'yxatdan bir kun tanlang, uning barcha to'lovlari va xarajatlari shu yerda ko'rinadi.</p>
              )}
            </section>
          </div>
        )}
        {activeImageUrl && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4">
            <button onClick={() => setActiveImageUrl(null)} className="absolute right-4 top-4 rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700">Yopish</button>
            <img src={activeImageUrl} alt="Katta chek rasmi" className="max-h-[90vh] max-w-[90vw] rounded-3xl border border-white dark:border-slate-700 object-contain" />
          </div>
        )}
      </div>
    </Layout>
  )
}

export default AdminDailyReportsPage
