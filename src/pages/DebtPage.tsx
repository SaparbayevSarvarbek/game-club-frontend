import { useEffect, useState } from 'react'
import Layout from '../components/common/Layout'
import api from '../services/api'
import { formatCurrency, formatNumberInput, parseNumberInput } from '../utils/format'

const DebtPage = () => {
  const [debtors, setDebtors] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [cash, setCash] = useState('')
  const [card, setCard] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const loadDebtors = async () => {
    const data = await api.listDebtors(search || undefined)
    setDebtors(data)
  }

  useEffect(() => {
    loadDebtors().catch(console.error)
  }, [])

  const handleSearch = async () => {
    await loadDebtors()
  }

  const handlePay = async () => {
    if (!selected) return
    setError('')
    setMessage('')
    const cashAmount = parseNumberInput(cash)
    const cardAmount = parseNumberInput(card)
    if (cashAmount + cardAmount <= 0) {
      setError('Toʻlov summasi 0 dan katta boʻlishi kerak')
      return
    }
    try {
      setLoading(true)
      const payload = {
        payment_cash: cashAmount,
        payment_card: cardAmount,
      }
      await api.payDebtor(selected.id, payload)
      setMessage('Qarzni tolash muvaffaqiyatli')
      setCash('')
      setCard('')
      loadDebtors()
    } catch {
      setError('Qarzni tolashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-900">Qarz toʻlovlari</h2>
          <p className="mt-2 text-sm text-slate-500">Qarzdorlarni qidiring va qarzlarni toʻlang.</p>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ism yoki telefon boʻyicha qidiring"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
            />
            <button onClick={handleSearch} className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500">
              Qidirish
            </button>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Qarzdorlar</h3>
              <div className="mt-4 space-y-3 max-h-72 overflow-y-auto">
                {debtors.map((debtor) => (
                  <button
                    key={debtor.id}
                    type="button"
                    onClick={() => setSelected(debtor)}
                    className={`w-full rounded-2xl p-4 text-left transition ${selected?.id === debtor.id ? 'bg-sky-600 text-white' : 'bg-white text-slate-900 hover:bg-slate-100'}`}
                  >
                    <div className="flex items-center justify-between gap-3"><p className="font-semibold">{debtor.first_name} {debtor.last_name}</p><span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-900/50 dark:text-rose-200">{formatCurrency(Number(debtor.total_debt))}</span></div><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{debtor.phone}</p>
                  </button>
                ))}
                {debtors.length === 0 && <p className="text-sm text-slate-500">No debtors found.</p>}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Tanlangan qarzdor</h3>
              {selected ? (
                <div className="mt-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-500">{selected.first_name} {selected.last_name}</p>
                      <p className="text-sm text-slate-500">Telefon: {selected.phone}</p>
                      <p className="text-sm text-slate-500">Qarz miqdori: {formatCurrency(Number(selected.total_debt))}</p>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={async () => {
                          setShowHistory(true)
                          setHistoryLoading(true)
                          try {
                            const data = await api.debtorHistory(selected.id)
                            setHistory(data)
                          } catch {
                            setHistory([])
                          } finally {
                            setHistoryLoading(false)
                          }
                        }}
                        className="rounded-full border border-slate-300 bg-white p-2 text-sm text-slate-700 hover:bg-slate-100"
                        aria-label="Show history"
                      >
                        Tarix
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <label className="block">
                      <span className="text-sm text-slate-600">Naqd pul</span>
                      <input
                        type="text"
                        value={formatNumberInput(cash)}
                        onChange={(e) => setCash(e.target.value)}
                        onBlur={() => setCash(formatNumberInput(cash))}
                        onFocus={() => setCash(String(parseNumberInput(cash) || ''))}
                        className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm text-slate-600">Karta</span>
                      <input
                        type="text"
                        value={formatNumberInput(card)}
                        onChange={(e) => setCard(e.target.value)}
                        onBlur={() => setCard(formatNumberInput(card))}
                        onFocus={() => setCard(String(parseNumberInput(card) || ''))}
                        className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                      />
                    </label>
                    <button onClick={handlePay} disabled={loading} className="w-full rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60">
                      {loading ? 'Toʻlanmoqda...' : 'Qarzni toʻlash'}
                    </button>
                    {error && <p className="text-sm text-rose-600">{error}</p>}
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">Toʻlov uchun qarzdorni tanlang.</p>
              )}
            </div>
          </div>
          {message && <p className="mt-4 text-sm text-emerald-600">{message}</p>}
        </section>
        {showHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="w-full max-w-3xl rounded-3xl bg-white p-6 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Qarzdor tarixi</h3>
                <button onClick={() => setShowHistory(false)} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-100">Orqaga</button>
              </div>
              <div className="mt-4">
                {historyLoading ? (
                  <p className="text-sm text-slate-500">Yuklanmoqda...</p>
                ) : history.length === 0 ? (
                  <p className="text-sm text-slate-500">Hech qanday tranzaksiya topilmadi.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {history.map((h) => (
                      <div key={h.id} className={`rounded-2xl border p-4 ${Number(h.amount) < 0 ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/40' : 'border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/40'}`}> 
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`font-semibold ${Number(h.amount) < 0 ? 'text-emerald-700 dark:text-emerald-200' : 'text-rose-700 dark:text-rose-200'}`}>{formatCurrency(Math.abs(Number(h.amount)))} | {Number(h.amount) < 0 ? 'To\'langan' : 'Qarz'}</p>
                            {h.note && <p className="text-sm text-slate-500">{h.note}</p>}
                          </div>
                          <div className="text-sm text-slate-500">{new Date(h.created_at).toLocaleString('uz-UZ')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default DebtPage

