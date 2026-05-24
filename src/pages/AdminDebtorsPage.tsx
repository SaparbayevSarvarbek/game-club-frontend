import { useEffect, useState } from 'react'
import Layout from '../components/common/Layout'
import api from '../services/api'
import { formatCurrency, formatNumberInput, parseNumberInput } from '../utils/format'

const AdminDebtorsPage = () => {
  const [debtors, setDebtors] = useState<any[]>([])
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', total_debt: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [selectedDebtor, setSelectedDebtor] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const load = async () => {
    const data = await api.listDebtors()
    setDebtors(data)
  }

  useEffect(() => {
    load().catch(console.error)
  }, [])

  const createDebtor = async () => {
    setError('')
    setMessage('')
    if (!form.first_name.trim()) {
      setError('Ism kiritish majburiy')
      return
    }
    if (!form.phone.trim()) {
      setError('Telefon raqam kiritish majburiy')
      return
    }
    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        total_debt: parseNumberInput(form.total_debt),
      }
      await api.createAdminDebtor(payload)
      setForm({ first_name: '', last_name: '', phone: '', total_debt: '' })
      setMessage('Qarzdor muvaffaqiyatli qoʻshildi')
      load()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Qarzdorni qoʻshishda xatolik')
    }
  }

  const deleteDebtor = async (id: number) => {
    try {
      await api.deleteAdminDebtor(id)
      setMessage('Qarzdor muvaffaqiyatli oʻchirildi')
      setError('')
      load()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Qarzdorni oʻchirishda xatolik')
      setMessage('')
    }
  }

  const loadDebtorHistory = async (debtorId: number) => {
    setLoadingHistory(true)
    try {
      const historyData = await api.debtorHistory(debtorId)
      setHistory(historyData)
    } catch (err: any) {
      console.error('Tarixi yuklashda xatolik:', err)
      setHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  const openDebtorDetails = async (debtor: any) => {
    setSelectedDebtor(debtor)
    await loadDebtorHistory(debtor.id)
  }

  return (
    <Layout>
      <div className="space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-900">Qarzdor boshqaruvi</h2>
          <p className="mt-2 text-sm text-slate-500">Admin panelidan qarzdorlarni qoʻshing va boshqaring.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <input
              value={form.first_name}
              onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))}
              placeholder="Ism *"
              className="rounded-2xl border border-slate-300 px-4 py-3"
            />
            <input
              value={form.last_name}
              onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))}
              placeholder="Familiya"
              className="rounded-2xl border border-slate-300 px-4 py-3"
            />
            <input
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="Telefon *"
              className="rounded-2xl border border-slate-300 px-4 py-3"
            />
            <input
              type="text"
              value={formatNumberInput(form.total_debt)}
              onChange={(e) => setForm((prev) => ({ ...prev, total_debt: e.target.value }))}
              onBlur={() => setForm((prev) => ({ ...prev, total_debt: formatNumberInput(prev.total_debt) }))}
              onFocus={() => setForm((prev) => ({ ...prev, total_debt: String(parseNumberInput(prev.total_debt) || '') }))}
              placeholder="Jami qarz"
              className="rounded-2xl border border-slate-300 px-4 py-3"
            />
            <button onClick={createDebtor} className="md:col-span-4 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500">
              Qarzdor qoʻshish
            </button>
          </div>
          {error && <div className="mt-4 rounded-3xl bg-rose-50 p-3 text-sm text-rose-700 font-medium">{error}</div>}
          {message && <div className="mt-4 rounded-3xl bg-emerald-50 p-3 text-sm text-emerald-700 font-medium">{message}</div>}
        </section>
        <section className="rounded-3xl bg-white p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-slate-900">Qarzdorlar roʻyxati</h3>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-700">Ism</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Telefon</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Qarz</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Oxirgi toʻlov</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {debtors.map((debtor) => (
                  <tr key={debtor.id}>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => openDebtorDetails(debtor)}
                        className="font-semibold text-sky-600 hover:text-sky-500 hover:underline"
                      >
                        {debtor.full_name}
                      </button>
                    </td>
                    <td className="px-4 py-4">{debtor.phone}</td>
                    <td className="px-4 py-4">{formatCurrency(Number(debtor.total_debt))}</td>
                    <td className="px-4 py-4">{debtor.last_payment ?? 'Toʻlov yoʻq'}</td>
                    <td className="px-4 py-4">
                      <button onClick={() => deleteDebtor(debtor.id)} className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-400">
                        Oʻchirish
                      </button>
                    </td>
                  </tr>
                ))}
                {debtors.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                      Hali hech bir qarzdor yaratilmagan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {selectedDebtor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">{selectedDebtor.full_name}</h2>
                  <p className="mt-1 text-sm text-slate-600">Telefon: {selectedDebtor.phone}</p>
                  <p className="mt-1 text-sm text-slate-600">Jami qarz: {formatCurrency(Number(selectedDebtor.total_debt))}</p>
                </div>
                <button
                  onClick={() => setSelectedDebtor(null)}
                  className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Yopish
                </button>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="font-semibold text-slate-900 mb-4">Toʻlov tarixi</h3>
                {loadingHistory ? (
                  <p className="text-sm text-slate-500">Tarixi yuklanmoqda...</p>
                ) : history.length === 0 ? (
                  <p className="text-sm text-slate-500">Toʻlov tarixi yoʻq</p>
                ) : (
                  <div className="space-y-3">
                    {history.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {formatCurrency(Math.abs(Number(transaction.amount)))}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">
                            Naqd: {transaction.payment_cash ? formatCurrency(Number(transaction.payment_cash)) : '0'} — Karta: {transaction.payment_card ? formatCurrency(Number(transaction.payment_card)) : '0'}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(transaction.created_at).toLocaleString('uz-UZ')}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                            Number(transaction.amount) < 0
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-sky-100 text-sky-700'
                          }`}>
                            {Number(transaction.amount) < 0 ? 'Toʻlov' : 'Qarz'}
                          </span>
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

export default AdminDebtorsPage
