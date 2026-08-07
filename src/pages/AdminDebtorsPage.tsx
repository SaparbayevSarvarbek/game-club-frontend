import { useEffect, useState } from 'react'
import Layout from '../components/common/Layout'
import IconButton from '../components/common/IconButton'
import api from '../services/api'
import { formatCurrency, formatNumberInput, formatPhoneNumber, parseNumberInput } from '../utils/format'
import { parseError } from '../utils/error'
import PhoneInput from '../components/common/PhoneInput'
import { useToast } from '../components/common/Toast'

const emptyForm = { first_name: '', last_name: '', phone: '', total_debt: '', note: '' }

const AdminDebtorsPage = () => {
  const [debtors, setDebtors] = useState<any[]>([])
  const [search, setSearch] = useState<string>('')
  const [form, setForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [selectedDebtor, setSelectedDebtor] = useState<any>(null)
  const [editingDebtor, setEditingDebtor] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<any>(null)
  const [showArchive, setShowArchive] = useState(false)
  const [archivedDebtors, setArchivedDebtors] = useState<any[]>([])
  const toast = useToast()

  const load = async () => {
    const data = await api.fetchAllDebtors(search || undefined)
    setDebtors(data)
  }

  useEffect(() => {
    load().catch(console.error)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => load().catch(console.error), 250)
    return () => clearTimeout(t)
  }, [search])

  const createDebtor = async () => {
    if (!form.first_name.trim() || !form.phone.trim()) {
      toast.error('Ism va telefon kiritish majburiy')
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
      toast.success('Qarzdor muvaffaqiyatli qo\'shildi')
      await load()
    } catch (err: any) {
      toast.error(parseError(err) || 'Qarzdorni qo\'shishda xatolik')
    }
  }

  const startEdit = (debtor: any) => {
    setEditingDebtor(debtor)
    setEditForm({
      first_name: debtor.first_name ?? '',
      last_name: debtor.last_name ?? '',
      phone: formatPhoneNumber(debtor.phone ?? ''),
      total_debt: String(debtor.total_debt ?? ''),
      note: debtor.note ?? '',
    })
  }

  const saveEdit = async () => {
    if (!editingDebtor) return

    // Validation
    const firstName = editForm.first_name.trim()
    const phone = editForm.phone.trim()

    if (!firstName) {
      toast.error('Ism kiritish majburiy')
      return
    }
    if (!phone) {
      toast.error('Telefon kiritish majburiy')
      return
    }
    // The debt balance is a calculated figure derived from the debtor's
    // transactions. Editing it directly would desync the books from statistics,
    // so changing it is blocked with a warning.
    const totalDebt = parseNumberInput(editForm.total_debt)
    if (totalDebt !== Number(editingDebtor.total_debt ?? 0)) {
      toast.error('Qarz summasini o\'zgartirib bo\'lmaydi, chunki bu statistika hisobiga ta\'sir qiladi')
      return
    }

    try {
      const payload: any = {
        first_name: firstName,
        phone: phone,
      }

      // Only include optional fields if they have values
      const lastName = editForm.last_name.trim()
      if (lastName) {
        payload.last_name = lastName
      }

      const note = editForm.note.trim()
      if (note) {
        payload.note = note
      }
      
      await api.updateAdminDebtor(editingDebtor.id, payload)
      setEditingDebtor(null)
      toast.success('Qarzdor ma\'lumotlari yangilandi')
      await load()
    } catch (err) {
      toast.error(parseError(err) || 'Qarzdorni yangilashda xatolik')
    }
  }

  const deleteDebtor = async (id: number) => {
    try {
      await api.deleteAdminDebtor(id)
      setDebtors((prev) => prev.filter((d) => d.id !== id))
      toast.success('Qarzdor arxivga o\'tkazildi')
    } catch (err: any) {
      toast.error(parseError(err) || 'Qarzdorni arxivga o\'tkazishda xatolik')
    } finally {
      setConfirmDelete(null)
    }
  }

  const openArchive = async () => {
    setShowArchive(true)
    try {
      setArchivedDebtors(await api.fetchAllDebtors(undefined, true))
    } catch {
      setArchivedDebtors([])
    }
  }

  const restoreDebtor = async (id: number) => {
    try {
      await api.restoreAdminDebtor(id)
      setArchivedDebtors((prev) => prev.filter((d) => d.id !== id))
      toast.success('Qarzdor arxivdan qaytarildi')
      await load()
    } catch (err: any) {
      toast.error(parseError(err) || 'Qaytarishda xatolik')
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
            <PhoneInput value={form.phone} onChange={(v) => setForm((p) => ({ ...p, phone: v }))} />
            <input type="text" value={formatNumberInput(form.total_debt)} onChange={(e) => setForm((p) => ({ ...p, total_debt: e.target.value }))} onBlur={() => setForm((p) => ({ ...p, total_debt: formatNumberInput(p.total_debt) }))} onFocus={() => setForm((p) => ({ ...p, total_debt: String(parseNumberInput(p.total_debt) || '') }))} placeholder="Jami qarz" className={inputClass} />
            <textarea value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} placeholder="Izoh" className={`${inputClass} md:col-span-4`} />
            <button onClick={createDebtor} className="md:col-span-4 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500">Qarzdor qo'shish</button>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-soft dark:bg-slate-900">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Qarzdorlar ro'yxati</h3>
            <button onClick={openArchive} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              Arxiv
            </button>
          </div>
          <div className="mt-6 overflow-x-auto">
            <div className="mb-4 flex items-center gap-3">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ism, telefon bo'yicha izlash" className={`${inputClass} max-w-sm`} />
            </div>
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
                    <td className="px-4 py-4">{formatPhoneNumber(debtor.phone)}</td>
                    <td className="px-4 py-4"><span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${Number(debtor.total_debt) > 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'}`}>{formatCurrency(Number(debtor.total_debt))}</span></td>
                    <td className="max-w-xs truncate px-4 py-4 text-slate-500 dark:text-slate-400">{debtor.note || '-'}</td>
                    <td className="px-4 py-4">
                        <button onClick={() => startEdit(debtor)} title="Tahrirlash" className="rounded-full border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button onClick={() => setConfirmDelete(debtor)} title="O'chirish" className="rounded-full bg-rose-500 p-2 text-white hover:bg-rose-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H10a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
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
                <PhoneInput value={editForm.phone} onChange={(v) => setEditForm((p) => ({ ...p, phone: v }))} />
                <input value={formatNumberInput(editForm.total_debt)} onChange={(e) => setEditForm((p) => ({ ...p, total_debt: e.target.value }))} onFocus={() => setEditForm((p) => ({ ...p, total_debt: String(parseNumberInput(p.total_debt) || '') }))} onBlur={() => setEditForm((p) => ({ ...p, total_debt: formatNumberInput(p.total_debt) }))} className={inputClass} placeholder="Qarz summasi" />
                <textarea value={editForm.note} onChange={(e) => setEditForm((p) => ({ ...p, note: e.target.value }))} className={`${inputClass} md:col-span-2`} placeholder="Izoh" />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <div className="flex gap-2">
                  <button onClick={() => setEditingDebtor(null)} className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Bekor qilish</button>
                  <button onClick={saveEdit} className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500">Saqlash</button>
                </div>
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
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Telefon: {formatPhoneNumber(selectedDebtor.phone)}</p>
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
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Qarzdorni o'chirish</h3>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-slate-100">{confirmDelete.full_name}</span> qarzdorni arxivga o'tkazishni tasdiqlaysizmi? Uning qarz tarixi saqlanib qoladi va istalgan vaqtda arxivdan qaytarilishi mumkin.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setConfirmDelete(null)} className="rounded-2xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                  Orqaga
                </button>
                <button onClick={() => deleteDebtor(confirmDelete.id)} className="rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-500">
                  Tasdiqlash
                </button>
              </div>
            </div>
          </div>
        )}
        {showArchive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Arxivdagi qarzdorlar</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">O'chirilgan qarzdorlar. Tarixlari saqlanadi va istalgan vaqtda qaytarilishi mumkin.</p>
                </div>
                <button onClick={() => setShowArchive(false)} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200">Yopish</button>
              </div>
              <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
                {archivedDebtors.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Arxivda qarzdorlar yo'q.</p>
                ) : (
                  <div className="space-y-3">
                    {archivedDebtors.map((debtor) => (
                      <div key={debtor.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{debtor.full_name}</p>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatPhoneNumber(debtor.phone)} | {formatCurrency(Number(debtor.total_debt))}</p>
                        </div>
                        <button onClick={() => restoreDebtor(debtor.id)} className="rounded-2xl border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-600 hover:bg-sky-100 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-300">Qaytarish</button>
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
