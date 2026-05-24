import { ChangeEvent, ClipboardEvent, DragEvent, FormEvent, useEffect, useState } from 'react'
import Layout from '../components/common/Layout'
import api from '../services/api'
import { formatCurrency } from '../utils/format'

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')

const ReportsPage = () => {
  const [expenses, setExpenses] = useState(0)
  const [cashDifference, setCashDifference] = useState(0)
  const [comment, setComment] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [uploading, setUploading] = useState(false)
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
    try {
      const result = await api.uploadImage(file)
      setImageUrl(result.image_url)
      setFileName(file.name)
      setStatus('Rasm muvaffaqiyatli yuklandi.')
    } catch {
      setUploadError('Rasmni yuklashda xatolik. JPG, PNG yoki GIF formatlaridan foydalaning (maksimal 5MB).')
    } finally {
      setUploading(false)
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
        <section className="rounded-3xl bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Kunlik hisobot (Kunni yakunlash)</h2>
              <p className="mt-2 text-sm text-slate-500">Bugungi ish kunini yakunlang, hisobot rasmini yuklang, kamomad va xarajatlarni yozib saqlang.</p>
            </div>
          </div>
          <div className="mt-5">
            <h3 className="text-lg font-semibold text-slate-900">Bugungi kun statistikasi</h3>
            {loadingStats ? (
              <p className="mt-3 text-sm text-slate-500">Statistika yuklanmoqda...</p>
            ) : statsError ? (
              <p className="mt-3 text-sm text-rose-600">{statsError}</p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Bugungi umumiy tushum</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(Number(statistics?.total_revenue ?? 0))}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Naqd pul</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(Number(statistics?.total_cash ?? 0))}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Karta</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(Number(statistics?.total_card ?? 0))}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Qarz</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(Number(statistics?.total_debt ?? 0))}</p>
                </div>
              </div>
            )}
          </div>
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-slate-600">Xarajatlar (chiqimlar summasi)</span>
              <input
                type="number"
                min={0}
                value={expenses}
                onChange={(e) => setExpenses(Number(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600">Kamomad summasi (agar boʻlsa)</span>
              <input
                type="number"
                value={cashDifference}
                onChange={(e) => setCashDifference(Number(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm text-slate-600">Kun yakuniga izoh (ixtiyoriy)</span>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Kun yakuni haqida qoʻshimcha izohlar..."
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm text-slate-600">Hisobot cheki yoki kassa rasmi (majburiy)</span>
              <div
                onDrop={!imageUrl ? handleDrop : undefined}
                onDragOver={(event) => !imageUrl && event.preventDefault()}
                onPaste={!imageUrl ? handlePaste : undefined}
                className={`mt-2 rounded-3xl border-2 p-6 text-center transition ${imageUrl ? 'border-emerald-300 bg-emerald-50' : 'border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
              >
                {!imageUrl ? (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="mx-auto mb-3 block w-full text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-sky-600 file:px-4 file:py-2 file:text-white"
                    />
                    <p className="text-sm text-slate-500">
                      Rasmni bu yerga tashlang, buferdan (ctrl+v) yuklang yoki faylni tanlang. JPG, PNG, GIF ruxsat etiladi.
                    </p>
                  </>
                ) : (
                  <div className="text-center">
                    <p className="text-sm font-medium text-emerald-700">✓ Rasm yuklandi</p>
                    <p className="mt-1 text-xs text-slate-600">{fileName}</p>
                    <div className="mt-3 flex justify-center gap-2">
                      <label className="rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 cursor-pointer">
                        Almashish
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleReplaceImage}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleDeleteImage}
                        className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-400"
                      >
                        O'chirish
                      </button>
                    </div>
                  </div>
                )}
                {uploadError && <p className="mt-3 text-sm text-rose-600">{uploadError}</p>}
                {uploading && <p className="mt-3 text-sm text-slate-500">Rasm yuklanmoqda…</p>}
              </div>
            </label>
            {imageUrl && (
              <div className="sm:col-span-2">
                <p className="mb-3 text-sm text-slate-600 font-medium">Rasm koʻrinishi:</p>
                <img src={getFullImageUrl(imageUrl)} alt="Report preview" className="w-full rounded-3xl border border-slate-200 object-contain max-h-80 bg-slate-100" />
              </div>
            )}
            <button type="submit" className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500 sm:col-span-2">
              Kunlik hisobotni saqlash va Kunni yopish
            </button>
          </form>
          {status && (
            <div className={`mt-4 rounded-3xl p-4 text-sm font-medium ${status.includes("muvaffaqiyatli") ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
              {status}
            </div>
          )}
        </section>
        {report && (
          <section className="rounded-3xl bg-slate-50 p-6 shadow-soft">
            <h3 className="text-lg font-semibold text-slate-900">Saqlangan kunlik hisobot tafsilotlari</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-3xl bg-white p-4">
                <p className="text-sm text-slate-500">Kassa yopilgan sana</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{new Date(report.created_at).toLocaleDateString('uz-UZ')}</p>
              </div>
              <div className="rounded-3xl bg-white p-4">
                <p className="text-sm text-slate-500 font-medium text-emerald-600">Umumiy tushum</p>
                <p className="mt-2 text-xl font-bold text-slate-900">{formatCurrency(Number(report.total_revenue))}</p>
              </div>
              <div className="rounded-3xl bg-white p-4">
                <p className="text-sm text-slate-500">Naqd tushum</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(Number(report.total_cash))}</p>
              </div>
              <div className="rounded-3xl bg-white p-4">
                <p className="text-sm text-slate-500">Karta orqali tushum</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(Number(report.total_card))}</p>
              </div>
              <div className="rounded-3xl bg-white p-4">
                <p className="text-sm text-slate-500 font-medium text-amber-600">Qarzga berilgan</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(Number(report.total_debt))}</p>
              </div>
              <div className="rounded-3xl bg-white p-4">
                <p className="text-sm text-slate-500 font-medium text-rose-600">Kiritilgan xarajatlar</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(Number(report.total_expenses))}</p>
              </div>
              <div className="rounded-3xl bg-white p-4">
                <p className="text-sm text-slate-500 font-medium text-rose-500">Kamomad</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(Number(report.cash_difference))}</p>
              </div>
              <div className="rounded-3xl bg-white p-4">
                <p className="text-sm text-slate-500 font-medium text-teal-600">Chegirmalar jami</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(Number(report.total_discount))}</p>
              </div>
            </div>
            {report.image_url && (
              <div className="mt-6 rounded-3xl bg-white p-4">
                <p className="text-sm text-slate-500 font-medium mb-3">Yuklangan chek rasmi:</p>
                <img src={getFullImageUrl(report.image_url)} alt="Saved report" className="w-full rounded-3xl border border-slate-200 object-contain max-h-96 bg-slate-50" />
              </div>
            )}
          </section>
        )}
      </div>
    </Layout>
  )
}

export default ReportsPage
