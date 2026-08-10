import { ChangeEvent, ClipboardEvent, DragEvent, FormEvent, useEffect, useState } from 'react'
import { ArrowUpTrayIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import Layout from '../components/common/Layout'
import api from '../services/api'
import { formatCurrency } from '../utils/format'
import Card from '../components/ui/Card'
import Field from '../components/ui/Field'
import Button from '../components/ui/Button'
import StatCard from '../components/ui/StatCard'
import Spinner from '../components/ui/Spinner'

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')

const ReportsPage = () => {
  const [expenses, setExpenses] = useState(0)
  const [cashDifference, setCashDifference] = useState(0)
  const [comment, setComment] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [report, setReport] = useState<any>(null)
  const [statistics, setStatistics] = useState<any>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [statsError, setStatsError] = useState('')

  useEffect(() => {
    if (!report) return
    setStatus('')
  }, [report])

  useEffect(() => {
    const loadStatistics = async () => {
      setLoadingStats(true)
      setStatsError('')
      try {
        const stats = await api.fetchUserStatistics()
        setStatistics(stats)
      } catch (err: any) {
        setStatsError(err?.response?.data?.detail || 'Statistikani yuklashda xatolik yuz berdi.')
      } finally {
        setLoadingStats(false)
      }
    }

    loadStatistics()
  }, [])

  const uploadReportImage = async (file: File) => {
    setUploadError('')
    setUploading(true)
    setUploadProgress(0)
    try {
      const result = await api.uploadImage(file, (e) => {
        if (e.total) setUploadProgress(Math.min(100, Math.round((e.loaded / e.total) * 100)))
      })
      setImageUrl(result.image_url)
      setFileName(file.name)
      setStatus('Rasm muvaffaqiyatli yuklandi.')
    } catch {
      setUploadError('Rasmni yuklashda xatolik. JPG, PNG yoki GIF formatlaridan foydalaning (maksimal 5MB).')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await uploadReportImage(file)
    }
  }

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer?.files?.[0]
    if (file) {
      await uploadReportImage(file)
    }
  }

  const handlePaste = async (event: ClipboardEvent<HTMLDivElement>) => {
    const item = Array.from(event.clipboardData.items).find((item) => item.type.startsWith('image/'))
    if (!item) return
    const file = item.getAsFile()
    if (file) {
      await uploadReportImage(file)
    }
  }

  const handleReplaceImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await uploadReportImage(file)
    }
  }

  const handleDeleteImage = () => {
    setImageUrl('')
    setFileName('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('')
    if (!imageUrl) {
      setStatus('Rasm majburiy. Iltimos, rasm yuklang.')
      return
    }
    try {
      const result = await api.createDailyReport({
        expenses,
        cash_difference: cashDifference,
        comment: comment.trim() || null,
        image_url: imageUrl
      })
      setReport(result)
      setStatistics(null)
      setExpenses(0)
      setCashDifference(0)
      setComment('')
      setImageUrl('')
      setFileName('')
      setStatus('Kunlik hisobot muvaffaqiyatli saqlandi.')
    } catch (err: any) {
      setStatus(err?.response?.data?.detail || 'Kunlik hisobotni saqlashda xatolik yuz berdi.')
    }
  }

  const getFullImageUrl = (path: string) => {
    if (!path) return ''
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`
  }

  return (
    <Layout>
      <div className="space-y-6">
        <Card title="Kunlik hisobot (Kunni yakunlash)" subtitle="Bugungi ish kunini yakunlang, hisobot rasmini yuklang, kamomad va xarajatlarni yozib saqlang.">
          <div className="mt-2">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Bugungi kun statistikasi</h3>
            {loadingStats ? (
              <Spinner label="Statistika yuklanmoqda..." />
            ) : statsError ? (
              <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{statsError}</p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Bugungi umumiy tushum" value={formatCurrency(Number(statistics?.total_revenue ?? 0))} tone="emerald" />
                <StatCard label="Naqd pul" value={formatCurrency(Number(statistics?.total_cash ?? 0))} />
                <StatCard label="Karta" value={formatCurrency(Number(statistics?.total_card ?? 0))} tone="amber" />
                <StatCard label="Qarz" value={formatCurrency(Number(statistics?.total_debt ?? 0))} tone="rose" />
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field
              as="input"
              label="Xarajatlar (chiqimlar summasi)"
              inputProps={{ type: 'number', min: 0, value: expenses, onChange: (e: any) => setExpenses(Number(e.target.value)) }}
            />
            <Field
              as="input"
              label="Kamomad summasi (agar boʻlsa)"
              inputProps={{ type: 'number', value: cashDifference, onChange: (e: any) => setCashDifference(Number(e.target.value)) }}
            />
            <Field
              as="textarea"
              label="Kun yakuniga izoh (ixtiyoriy)"
              className="sm:col-span-2"
              inputProps={{ value: comment, onChange: (e: any) => setComment(e.target.value), placeholder: 'Kun yakuni haqida qoʻshimcha izohlar...' }}
            />

            <div className="sm:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Hisobot cheki yoki kassa rasmi (majburiy)</span>
              <div
                onDrop={!imageUrl ? handleDrop : undefined}
                onDragOver={(event) => !imageUrl && event.preventDefault()}
                onPaste={!imageUrl ? handlePaste : undefined}
                className={`mt-2 rounded-3xl border-2 p-6 text-center transition ${
                  imageUrl
                    ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40'
                    : 'border-dashed border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/50 dark:border-slate-600 dark:bg-slate-800/60 dark:hover:border-emerald-500/60 dark:hover:bg-slate-800'
                }`}
              >
                {!imageUrl ? (
                  <>
                    <input id="daily-report-image" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm dark:bg-emerald-900/50 dark:text-emerald-300">
                      <ArrowUpTrayIcon className="h-8 w-8" />
                    </span>
                    <p className="text-base font-semibold text-slate-800 dark:text-slate-100">Rasmni bu yerga tashlang</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      yoki buferdan <span className="font-medium text-slate-600 dark:text-slate-300">Ctrl+V</span> bosing — JPG, PNG, GIF ruxsat etiladi
                    </p>
                    <label
                      htmlFor="daily-report-image"
                      className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
                    >
                      <PhotoIcon className="h-4 w-4" />
                      Fayl tanlash
                    </label>
                  </>
                ) : (
                  <div className="space-y-3">
                    <img
                      src={getFullImageUrl(imageUrl)}
                      alt="Yuklangan rasm"
                      className="mx-auto max-h-44 w-full rounded-2xl border border-slate-200 bg-white object-contain dark:border-slate-700 dark:bg-slate-900"
                    />
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircleIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Rasm yuklandi</p>
                    </div>
                    <p className="mx-auto max-w-full truncate text-xs text-slate-500 dark:text-slate-400">{fileName}</p>
                    <div className="flex flex-wrap justify-center gap-2 pt-1">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500">
                        <ArrowUpTrayIcon className="h-4 w-4" />
                        Almashish
                        <input type="file" accept="image/*" onChange={handleReplaceImage} className="hidden" />
                      </label>
                      <Button variant="danger" size="sm" onClick={handleDeleteImage}>
                        <XMarkIcon className="h-4 w-4" />
                        O'chirish
                      </Button>
                    </div>
                  </div>
                )}
                {uploadError && <p className="mt-4 text-sm text-rose-600 dark:text-rose-400">{uploadError}</p>}
                {uploading && (
                  <div className="mt-4 flex flex-col items-center gap-2">
                    <div className="relative h-16 w-16">
                      <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="28" fill="none" strokeWidth="6" className="stroke-slate-200 dark:stroke-slate-700" />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          fill="none"
                          strokeWidth="6"
                          strokeLinecap="round"
                          className="stroke-emerald-600 dark:stroke-emerald-400 transition-[stroke-dashoffset] duration-200"
                          strokeDasharray="175.93"
                          strokeDashoffset={175.93 * (1 - uploadProgress / 100)}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {uploadProgress}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Rasm yuklanmoqda…</p>
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" className="sm:col-span-2">
              Kunlik hisobotni saqlash va Kunni yopish
            </Button>
          </form>

          {status && (
            <div className={`mt-4 rounded-3xl p-4 text-sm font-medium ${status.includes("muvaffaqiyatli") ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200" : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200"}`}>
              {status}
            </div>
          )}
        </Card>

        {report && (
          <Card title="Saqlangan kunlik hisobot tafsilotlari" className="bg-slate-50 dark:bg-slate-900">
            <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard label="Kassa yopilgan sana" value={new Date(report.created_at).toLocaleDateString('uz-UZ')} />
              <StatCard label="Umumiy tushum" value={formatCurrency(Number(report.total_revenue))} tone="emerald" />
              <StatCard label="Naqd tushum" value={formatCurrency(Number(report.total_cash))} tone="sky" />
              <StatCard label="Karta orqali tushum" value={formatCurrency(Number(report.total_card))} tone="amber" />
              <StatCard label="Qarzga berilgan" value={formatCurrency(Number(report.total_debt))} tone="rose" />
              <StatCard label="Kiritilgan xarajatlar" value={formatCurrency(Number(report.total_expenses ?? 0))} tone="indigo" />
              <StatCard label="Kamomad" value={formatCurrency(Number(report.cash_difference))} tone="teal" />
              <StatCard label="Chegirmalar jami" value={formatCurrency(Number(report.total_discount))} tone="slate" />
            </div>
            {report.image_url && (
              <div className="mt-6 rounded-3xl bg-white p-4 dark:bg-slate-950">
                <p className="mb-3 text-sm font-medium text-slate-600 dark:text-slate-300">Yuklangan chek rasmi:</p>
                <img src={getFullImageUrl(report.image_url)} alt="Saved report" className="max-h-96 w-full rounded-3xl border border-slate-200 bg-slate-50 object-contain dark:border-slate-700 dark:bg-slate-800" />
              </div>
            )}
          </Card>
        )}
      </div>
    </Layout>
  )
}

export default ReportsPage
