import { useEffect, useState } from 'react'
import Layout from '../components/common/Layout'
import api from '../services/api'
import { formatCurrency, formatDate } from '../utils/format'
import { useToast } from '../components/common/Toast'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import StatCard from '../components/ui/StatCard'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')

const AdminDailyReportsPage = () => {
  const [reports, setReports] = useState<any[]>([])
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null)
  const toast = useToast()

  const getFullImageUrl = (path: string) => {
    if (!path) return ''
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`
  }

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true)
      try {
        const data = await api.fetchDailyReports()
        setReports(data)
      } catch (err: any) {
        toast.error(err?.response?.data?.detail || 'Kunlik hisobotlarni yuklashda xatolik yuz berdi.')
      } finally {
        setLoading(false)
      }
    }

    loadReports()
  }, [])

  const detailItems = [
    { label: 'Umumiy tushum', value: selectedReport?.total_revenue, tone: 'emerald' },
    { label: 'Naqd pul', value: selectedReport?.total_cash, tone: 'sky' },
    { label: 'Karta', value: selectedReport?.total_card, tone: 'amber' },
    { label: 'Qarz', value: selectedReport?.total_debt, tone: 'rose' },
    { label: 'Xarajat', value: selectedReport?.total_expenses, tone: 'indigo' },
    { label: 'Chegirma', value: selectedReport?.total_discount, tone: 'slate' },
    { label: 'Kamomad', value: selectedReport?.cash_difference, tone: 'teal' },
  ] as { label: string; value: any; tone: any }[]

  return (
    <Layout>
      <div className="space-y-6">
        <Card
          title="Kunlik hisobotlar"
          subtitle="Hisobotlar ro'yxati va har bir kun uchun jami o'lchovlar."
          actions={<Badge tone="slate" size="md">Umumiy hisobotlar: {reports.length}</Badge>}
        />

        {loading ? (
          <Card><Spinner label="Hisobotlar yuklanmoqda..." /></Card>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.2fr_minmax(360px,1fr)]">
            <Card title="Hisobotlar ro'yxati">
              <div className="mt-2 max-h-96 space-y-2 overflow-y-auto">
                {reports.length === 0 ? (
                  <EmptyState message="Hozircha hisobotlar mavjud emas." />
                ) : (
                  reports.map((report) => (
                    <button
                      key={report.id}
                      type="button"
                      onClick={() => setSelectedReport(report)}
                      className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left transition ${
                        selectedReport?.id === report.id
                          ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-900/30'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600 dark:hover:bg-slate-700'
                      }`}
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
            </Card>

            <Card title="Tanlangan kun tafsilotlari">
              {selectedReport ? (
                <div className="mt-2 space-y-4">
                  <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-800">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Sana</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{new Date(selectedReport.created_at).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {detailItems.map((item) => (
                      <StatCard key={item.label} label={item.label} value={formatCurrency(Number(item.value ?? 0))} tone={item.tone} valueClassName="text-xl" />
                    ))}
                  </div>
                  {selectedReport.comment && (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                      <p className="text-sm text-slate-500 dark:text-slate-400">Izoh</p>
                      <p className="mt-2 whitespace-pre-line text-sm text-slate-900 dark:text-slate-100">{selectedReport.comment}</p>
                    </div>
                  )}
                  {selectedReport.image_url && (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                      <p className="text-sm text-slate-500 dark:text-slate-400">Yuklangan chek rasmi</p>
                      <img
                        src={getFullImageUrl(selectedReport.image_url)}
                        alt="Hisobot rasmi"
                        onClick={() => setActiveImageUrl(getFullImageUrl(selectedReport.image_url))}
                        className="mt-3 max-h-80 w-full cursor-pointer rounded-3xl border border-slate-200 object-contain transition hover:opacity-90 dark:border-slate-700"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Ro'yxatdan bir kun tanlang, uning barcha to'lovlari va xarajatlari shu yerda ko'rinadi.</p>
              )}
            </Card>
          </div>
        )}

        <Modal
          open={!!activeImageUrl}
          onClose={() => setActiveImageUrl(null)}
          title="Chek rasmi"
          maxWidth="max-w-4xl"
        >
          {activeImageUrl && (
            <img src={activeImageUrl} alt="Katta chek rasmi" className="max-h-[80vh] w-full rounded-3xl border border-slate-200 object-contain dark:border-slate-700" />
          )}
        </Modal>
      </div>
    </Layout>
  )
}

export default AdminDailyReportsPage
