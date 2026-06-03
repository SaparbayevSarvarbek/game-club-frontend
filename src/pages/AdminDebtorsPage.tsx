import { useEffect, useState } from 'react'
import Layout from '../components/common/Layout'
import api from '../services/api'
import { formatCurrency, formatNumberInput, parseNumberInput } from '../utils/format'

const emptyForm = { first_name: '', last_name: '', phone: '', total_debt: '', note: '' }

const AdminDebtorsPage = () => {
  const [debtors, setDebtors] = useState<any[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [selectedDebtor, setSelectedDebtor] = useState<any>(null)
  const [editingDebtor, setEditingDebtor] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const load = async () => {
    const data = await api.fetchAllDebtors()
    setDebtors(data)
  }

  useEffect(() => {
    load().catch(console.error)
  }, [])

  const createDebtor = async () => {
    setError('')
    setMessage('')
    if (!form.first_name.trim() || !form.phone.trim()) {
      setError('Ism va telefon kiritish majburiy')
      return
    }
    try {
      await api.createAdminDebtor({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        total_debt: parseNumberInput(form.total_debt),
        note: form.note.trim() || null,
      })
      setForm(emptyForm)
      setMessage('Qarzdor muvaffaqiyatli qo\'shildi')
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Qarzdorni qo\'shishda xatolik')
    }
  }

  const startEdit = (debtor: any) => {
    setEditingDebtor(debtor)
    setEditForm({
      first_name: debtor.first_name ?? '',
      last_name: debtor.last_name ?? '',
      phone: debtor.phone ?? '',
      total_debt: String(debtor.total_debt ?? ''),
      note: debtor.note ?? '',
    })
  }

  const saveEdit = async () => {
    if (!editingDebtor) return
    setError('')
    setMessage('')
    try {
      await api.updateAdminDebtor(editingDebtor.id, {
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        phone: editForm.phone.trim(),
        total_debt: parseNumberInput(editForm.total_debt),
        note: editForm.note.trim() || null,
      })
      setEditingDebtor(null)
      setMessage('Qarzdor ma\'lumotlari yangilandi')
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Qarzdorni yangilashda xatolik')
    }
  }

  const deleteDebtor = async (id: number) => {
    try {
      await api.deleteAdminDebtor(id)
      setMessage('Qarzdor arxivga olindi')
      setError('')
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Qarzdorni o\'chirishda xatolik')
      setMessage('')
    }
  }

  const openDebtorDetails = async (debtor: any) => {
    setSelectedDebtor(debtor)
    setLoadingHistory(true)
    try {
      setHistory(await api.debtorHistory(debtor.id))
    } catch {
      setHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  const inputClass = 'rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'

  return (
    <Layout>
      <div className="space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-soft dark:bg-slate-900">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Qarzdor boshqaruvi</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Admin panelidan qarzdorlarni qo'shing, tahrirlang va tarixini ko'ring.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <input value={form.first_name} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} placeholder="Ism *" className={inputClass} />
            <input value={form.last_name} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))} placeholder="Familiya" className={inputClass} />
            <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Telefon *" className={inputClass} />
            <input type="text" value={formatNumberInput(form.total_debt)} onChange={(e) => setForm((p) => ({ ...p, total_debt: e.target.value }))} onBlur={() => setForm((p) => ({ ...p, total_debt: formatNumberInput(p.total_debt) }))} onFocus={() => setForm((p) => ({ ...p, total_debt: String(parseNumberInput(p.total_debt) || '') }))} placeholder="Jami qarz" className={inputClass} />
            <textarea value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} placeholder="Izoh" className={`${inputClass} md:col-span-4`} />
            <button onClick={createDebtor} className="md:col-span-4 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500">Qarzdor qo'shish</button>
          </div>
          {error && <div className="mt-4 rounded-3xl bg-rose-50 p-3 text-sm font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">{error}</div>}
          {message && <div className="mt-4 rounded-3xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">{message}</div>}
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-soft dark:bg-slate-900">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Qarzdorlar ro'yxati</h3>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Ism</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Telefon</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Qarz</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Izoh</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
                {debtors.map((debtor) => (
                  <tr key={debtor.id} className="text-slate-700 dark:text-slate-200">
                    <td className="px-4 py-4"><button onClick={() => openDebtorDetails(debtor)} className="font-semibold text-sky-600 hover:text-sky-500 hover:underline dark:text-sky-300">{debtor.full_name}</button></td>
                    <td className="px-4 py-4">{debtor.phone}</td>
                    <td className="px-4 py-4">{formatCurrency(Number(debtor.total_debt))}</td>
                    <td className="max-w-xs truncate px-4 py-4 text-slate-500 dark:text-slate-400">{debtor.note || '-'}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(debtor)} className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800">Tahrirlash</button>
                        <button onClick={() => deleteDebtor(debtor.id)} className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-400">Arxiv</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {editingDebtor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Qarzdorni tahrirlash</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <input value={editForm.first_name} onChange={(e) => setEditForm((p) => ({ ...p, first_name: e.target.value }))} className={inputClass} placeholder="Ism" />
                <input value={editForm.last_name} onChange={(e) => setEditForm((p) => ({ ...p, last_name: e.target.value }))} className={inputClass} placeholder="Familiya" />
                <input value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} className={inputClass} placeholder="Telefon" />
                <input value={formatNumberInput(editForm.total_debt)} onChange={(e) => setEditForm((p) => ({ ...p, total_debt: e.target.value }))} onFocus={() => setEditForm((p) => ({ ...p, total_debt: String(parseNumberInput(p.total_debt) || '') }))} onBlur={() => setEditForm((p) => ({ ...p, total_debt: formatNumberInput(p.total_debt) }))} className={inputClass} placeholder="Qarz summasi" />
                <textarea value={editForm.note} onChange={(e) => setEditForm((p) => ({ ...p, note: e.target.value }))} className={`${inputClass} md:col-span-2`} placeholder="Izoh" />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setEditingDebtor(null)} className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Bekor qilish</button>
                <button onClick={saveEdit} className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500">Saqlash</button>
              </div>
            </div>
          </div>
        )}

        {selectedDebtor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{selectedDebtor.full_name}</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Telefon: {selectedDebtor.phone}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Jami qarz: {formatCurrency(Number(selectedDebtor.total_debt))}</p>
                  {selectedDebtor.note && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{selectedDebtor.note}</p>}
                </div>
                <button onClick={() => setSelectedDebtor(null)} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200">Yopish</button>
              </div>
              <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
                <h3 className="mb-4 font-semibold text-slate-900 dark:text-slate-100">To'lov tarixi</h3>
                {loadingHistory ? <p className="text-sm text-slate-500 dark:text-slate-400">Tarix yuklanmoqda...</p> : history.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">To'lov tarixi yo'q</p> : (
                  <div className="space-y-3">
                    {history.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(Math.abs(Number(transaction.amount)))}</p>
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Naqd: {transaction.payment_cash ? formatCurrency(Number(transaction.payment_cash)) : '0'} | Karta: {transaction.payment_card ? formatCurrency(Number(transaction.payment_card)) : '0'}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{new Date(transaction.created_at).toLocaleString('uz-UZ')}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${Number(transaction.amount) < 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200' : 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200'}`}>{Number(transaction.amount) < 0 ? "To'lov" : 'Qarz'}</span>
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
