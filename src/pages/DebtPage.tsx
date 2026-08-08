import { useEffect, useState } from 'react'
import Layout from '../components/common/Layout'
import api from '../services/api'
import { formatCurrency, formatNumberInput, formatPhoneNumber, parseNumberInput } from '../utils/format'
import { useToast } from '../components/common/Toast'
import Card from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import Field from '../components/ui/Field'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'

const DebtPage = () => {
  const [debtors, setDebtors] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [cash, setCash] = useState('')
  const [card, setCard] = useState('')
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const toast = useToast()

  const totalDebtSum = debtors.reduce((sum, d) => sum + Number(d.total_debt || 0), 0)

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
    const cashAmount = parseNumberInput(cash)
    const cardAmount = parseNumberInput(card)
    if (cashAmount + cardAmount <= 0) {
      toast.error('Toʻlov summasi 0 dan katta boʻlishi kerak')
      return
    }
    try {
      setLoading(true)
      const payload = {
        payment_cash: cashAmount,
        payment_card: cardAmount,
      }
      await api.payDebtor(selected.id, payload)
      toast.success('Qarzni tolash muvaffaqiyatli')
      setCash('')
      setCard('')
      loadDebtors()
    } catch {
      toast.error('Qarzni tolashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <Card
          title="Qarz toʻlovlari"
          subtitle="Qarzdorlarni qidiring va qarzlarni toʻlang."
          actions={
            <div className="flex w-full gap-3 sm:w-auto">
              <Field
                as="input"
                inputProps={{
                  value: search,
                  onChange: (e: any) => setSearch(e.target.value),
                  placeholder: 'Ism yoki telefon boʻyicha qidiring',
                }}
              />
              <Button onClick={handleSearch}>Qidirish</Button>
            </div>
          }
        >
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <StatCard label="Umumiy qarz" value={formatCurrency(totalDebtSum)} tone="rose" />
            <StatCard label="Qarzdorlar soni" value={debtors.length} />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="flex max-h-[70vh] flex-col rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Qarzdorlar</h3>
                <Badge tone="slate">{debtors.length}</Badge>
              </div>
              <div className="mt-4 flex-1 space-y-3 overflow-y-auto">
                {debtors.map((debtor) => (
                  <button
                    key={debtor.id}
                    type="button"
                    onClick={() => setSelected(debtor)}
                    className={`w-full rounded-2xl p-4 text-left transition ${selected?.id === debtor.id ? 'bg-emerald-600 text-white' : 'bg-white text-slate-900 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-700'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{debtor.first_name} {debtor.last_name}</p>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selected?.id === debtor.id ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200'}`}>{formatCurrency(Number(debtor.total_debt))}</span>
                    </div>
                    <p className={`mt-1 text-sm ${selected?.id === debtor.id ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>{formatPhoneNumber(debtor.phone)}</p>
                  </button>
                ))}
                {debtors.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">Qarzdorlar topilmadi.</p>}
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="sticky top-0 z-10 bg-slate-50 pb-2 font-semibold text-slate-900 dark:bg-slate-800 dark:text-slate-100">Tanlangan qarzdor</h3>
              {selected ? (
                <div className="mt-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{selected.first_name} {selected.last_name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Telefon: {formatPhoneNumber(selected.phone)}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Qarz miqdori: {formatCurrency(Number(selected.total_debt))}</p>
                    </div>
                    <div>
                      <Button
                        variant="secondary"
                        size="sm"
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
                      >
                        Tarix
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <Field
                      as="input"
                      label="Naqd pul"
                      inputProps={{
                        type: 'text',
                        value: formatNumberInput(cash),
                        onChange: (e: any) => setCash(e.target.value),
                        onBlur: () => setCash(formatNumberInput(cash)),
                        onFocus: () => setCash(String(parseNumberInput(cash) || '')),
                      }}
                    />
                    <Field
                      as="input"
                      label="Karta"
                      inputProps={{
                        type: 'text',
                        value: formatNumberInput(card),
                        onChange: (e: any) => setCard(e.target.value),
                        onBlur: () => setCard(formatNumberInput(card)),
                        onFocus: () => setCard(String(parseNumberInput(card) || '')),
                      }}
                    />
                    <Button onClick={handlePay} isLoading={loading} className="w-full">
                      {loading ? 'Toʻlanmoqda...' : 'Qarzni toʻlash'}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Toʻlov uchun qarzdorni tanlang.</p>
              )}
            </div>
          </div>
        </Card>

        <Modal open={showHistory} onClose={() => setShowHistory(false)} title="Qarzdor tarixi" maxWidth="max-w-3xl">
          {historyLoading ? (
            <Spinner />
          ) : history.length === 0 ? (
            <EmptyState message="Hech qanday tranzaksiya topilmadi." />
          ) : (
            <div className="max-h-96 space-y-3 overflow-y-auto">
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
        </Modal>
      </div>
    </Layout>
  )
}

export default DebtPage
