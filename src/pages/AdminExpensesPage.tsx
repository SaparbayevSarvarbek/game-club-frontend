import { useEffect, useState } from 'react'
import Layout from '../components/common/Layout'
import api from '../services/api'
import { formatCurrency, formatNumberInput, parseNumberInput, formatDateTime } from '../utils/format'

const AdminExpensesPage = () => {
  const [expenses, setExpenses] = useState<any[]>([])
  const [payload, setPayload] = useState({ title: '', amount: '', comment: '' })
  const [message, setMessage] = useState('')

  const load = async () => {
    const data = await api.fetchExpenses()
    setExpenses(data)
  }

  useEffect(() => {
    load().catch(console.error)
  }, [])

  const add = async () => {
    try {
      const amount = parseNumberInput(payload.amount)
      if (!payload.title.trim()) {
        setMessage('Xarajat nomini kiritish shart')
        return
      }
      if (amount <= 0) {
        setMessage('Xarajat summasi 0 dan katta boʻlishi kerak')
        return
      }
      await api.createExpense({
        title: payload.title.trim(),
        amount,
        comment: payload.comment.trim() || null,
      })
      setPayload({ title: '', amount: '', comment: '' })
      setMessage('Xarajat muvaffaqiyatli qayd qilindi')
      load()
    } catch (err: any) {
      setMessage(err?.response?.data?.detail || 'Xarajatni qayd qilishda xatolik')
    }
  }

  const remove = async (id: number) => {
    try {
      await api.deleteExpense(id)
      setMessage('Xarajat muvaffaqiyatli oʻchirildi')
      load()
    } catch (err: any) {
      setMessage(err?.response?.data?.detail || 'Xarajatni oʻchirishda xatolik')
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-900">Xarajatlar (Chiqimlar)</h2>
          <p className="mt-2 text-sm text-slate-500">Yangi xarajat kiritish (nomini yozing, jami pulini kiriting) va admin dashboardida kuzating.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <label className="block col-span-2">
              <span className="text-sm text-slate-600">Xarajat nomi</span>
              <input
                value={payload.title}
                onChange={(e) => setPayload((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Masalan: Suv sotib olish, Arenda..."
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600">Jami puli</span>
              <input
                type="text"
                value={formatNumberInput(payload.amount)}
                onChange={(e) => setPayload((prev) => ({ ...prev, amount: e.target.value }))}
                onBlur={() => setPayload((prev) => ({ ...prev, amount: formatNumberInput(prev.amount) }))}
                onFocus={() => setPayload((prev) => ({ ...prev, amount: String(parseNumberInput(prev.amount)) }))}
                placeholder="Narxi (masalan: 50 000)"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="block col-span-3">
              <span className="text-sm text-slate-600">Qoʻshimcha izoh (ixtiyoriy)</span>
              <textarea
                value={payload.comment}
                onChange={(e) => setPayload((prev) => ({ ...prev, comment: e.target.value }))}
                placeholder="Xarajat haqida qoʻshimcha maʻlumot..."
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
          </div>
          <button onClick={add} className="mt-4 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500">
            Xarajat qoʻshish
          </button>
          {message && <p className={`mt-4 text-sm ${message.includes('muvaffaq') ? 'text-emerald-600' : 'text-rose-600'}`}>{message}</p>}
        </section>
        <section className="rounded-3xl bg-white p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-slate-900">Xarajatlar roʻyxati</h3>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-700">Sana</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Xarajat nomi</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Jami summa</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Izoh</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="px-4 py-4">{formatDateTime(expense.created_at)}</td>
                    <td className="px-4 py-4 font-medium text-slate-900">{expense.title}</td>
                    <td className="px-4 py-4 font-semibold text-rose-600">{formatCurrency(Number(expense.amount))}</td>
                    <td className="px-4 py-4 text-slate-500">{expense.comment || '—'}</td>
                    <td className="px-4 py-4">
                      <button onClick={() => remove(expense.id)} title="O'chirish" className="rounded-full bg-rose-500 p-2 text-white hover:bg-rose-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H10a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                      Hali xarajatlar qayd qilinmagan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Layout>
  )
}

export default AdminExpensesPage
