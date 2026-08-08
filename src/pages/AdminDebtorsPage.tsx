import { useEffect, useState } from 'react'
import Layout from '../components/common/Layout'
import IconButton from '../components/common/IconButton'
import api from '../services/api'
import { formatCurrency, formatNumberInput, formatPhoneNumber, parseNumberInput } from '../utils/format'
import { parseError } from '../utils/error'
import PhoneInput from '../components/common/PhoneInput'
import { useToast } from '../components/common/Toast'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import Card from '../components/ui/Card'
import Field from '../components/ui/Field'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'

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

  const numberProps = (value: string, setter: (v: string) => void) => ({
    value: formatNumberInput(value),
    onChange: (e: any) => setter(e.target.value),
    onFocus: () => setter(String(parseNumberInput(value) || '')),
    onBlur: () => setter(formatNumberInput(value)),
  })

  return (
    <Layout>
      <div className="space-y-6">
        <Card
          title="Qarzdor boshqaruvi"
          subtitle="Admin panelidan qarzdorlarni qo'shing, tahrirlang va tarixini ko'ring."
        >
          <div className="mt-2 grid gap-4 md:grid-cols-4">
            <Field as="input" inputProps={{ value: form.first_name, onChange: (e: any) => setForm((p) => ({ ...p, first_name: e.target.value })), placeholder: 'Ism *' }} />
            <Field as="input" inputProps={{ value: form.last_name, onChange: (e: any) => setForm((p) => ({ ...p, last_name: e.target.value })), placeholder: 'Familiya' }} />
            <div>
              <PhoneInput value={form.phone} onChange={(v) => setForm((p) => ({ ...p, phone: v }))} />
            </div>
            <Field as="input" inputProps={{ type: 'text', ...numberProps(form.total_debt, (v) => setForm((p) => ({ ...p, total_debt: v }))), placeholder: 'Jami qarz' }} />
            <Field as="textarea" className="md:col-span-4" inputProps={{ value: form.note, onChange: (e: any) => setForm((p) => ({ ...p, note: e.target.value })), placeholder: 'Izoh' }} />
            <Button onClick={createDebtor} className="md:col-span-4">Qarzdor qo'shish</Button>
          </div>
        </Card>

        <Card
          title="Qarzdorlar ro'yxati"
          actions={<Button variant="secondary" onClick={openArchive}>Arxiv</Button>}
        >
          <div className="mt-2 overflow-x-auto">
            <div className="mb-4 flex items-center gap-3">
              <Field as="input" className="max-w-sm" inputProps={{ value: search, onChange: (e: any) => setSearch(e.target.value), placeholder: "Ism, telefon bo'yicha izlash" }} />
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
                {debtors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10">
                      <EmptyState message="Qarzdorlar topilmadi." />
                    </td>
                  </tr>
                ) : (
                  debtors.map((debtor) => (
                    <tr key={debtor.id} className="text-slate-700 dark:text-slate-200">
                      <td className="px-4 py-4"><button onClick={() => openDebtorDetails(debtor)} className="font-semibold text-emerald-600 hover:text-emerald-500 hover:underline dark:text-emerald-300">{debtor.full_name}</button></td>
                      <td className="px-4 py-4">{formatPhoneNumber(debtor.phone)}</td>
                      <td className="px-4 py-4"><Badge tone={Number(debtor.total_debt) > 0 ? 'rose' : 'emerald'}>{formatCurrency(Number(debtor.total_debt))}</Badge></td>
                      <td className="max-w-xs truncate px-4 py-4 text-slate-500 dark:text-slate-400">{debtor.note || '-'}</td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <IconButton onClick={() => startEdit(debtor)} title="Tahrirlash" variant="ghost" icon={<PencilIcon className="h-4 w-4" />} />
                          <IconButton onClick={() => setConfirmDelete(debtor)} title="O'chirish" variant="danger" icon={<TrashIcon className="h-4 w-4" />} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Modal
          open={!!editingDebtor}
          onClose={() => setEditingDebtor(null)}
          title="Qarzdorni tahrirlash"
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setEditingDebtor(null)}>Bekor qilish</Button>
              <Button onClick={saveEdit}>Saqlash</Button>
            </div>
          }
        >
          <div className="mt-2 grid gap-4 md:grid-cols-2">
            <Field as="input" inputProps={{ value: editForm.first_name, onChange: (e: any) => setEditForm((p) => ({ ...p, first_name: e.target.value })), placeholder: 'Ism' }} />
            <Field as="input" inputProps={{ value: editForm.last_name, onChange: (e: any) => setEditForm((p) => ({ ...p, last_name: e.target.value })), placeholder: 'Familiya' }} />
            <div>
              <PhoneInput value={editForm.phone} onChange={(v) => setEditForm((p) => ({ ...p, phone: v }))} />
            </div>
            <Field as="input" inputProps={{ value: formatNumberInput(editForm.total_debt), onChange: (e: any) => setEditForm((p) => ({ ...p, total_debt: e.target.value })), onFocus: () => setEditForm((p) => ({ ...p, total_debt: String(parseNumberInput(p.total_debt) || '') })), onBlur: () => setEditForm((p) => ({ ...p, total_debt: formatNumberInput(p.total_debt) })), placeholder: 'Qarz summasi' }} />
            <Field as="textarea" className="md:col-span-2" inputProps={{ value: editForm.note, onChange: (e: any) => setEditForm((p) => ({ ...p, note: e.target.value })), placeholder: 'Izoh' }} />
          </div>
        </Modal>

        <Modal
          open={!!selectedDebtor}
          onClose={() => setSelectedDebtor(null)}
          title={selectedDebtor?.full_name ?? 'Qarzdor'}
          subtitle={`Telefon: ${formatPhoneNumber(selectedDebtor?.phone ?? '')} | Jami qarz: ${formatCurrency(Number(selectedDebtor?.total_debt ?? 0))}`}
        >
          <div className="mt-2">
            {selectedDebtor?.note && <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">{selectedDebtor.note}</p>}
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
                      <Badge tone={Number(transaction.amount) < 0 ? 'emerald' : 'rose'}>{Number(transaction.amount) < 0 ? "To'lov" : 'Qarz'}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>

        <Modal
          open={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          title="Qarzdorni o'chirish"
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Orqaga</Button>
              <Button variant="danger" onClick={() => deleteDebtor(confirmDelete.id)}>Tasdiqlash</Button>
            </div>
          }
        >
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-slate-100">{confirmDelete?.full_name}</span> qarzdorni arxivga o'tkazishni tasdiqlaysizmi? Uning qarz tarixi saqlanib qoladi va istalgan vaqtda arxivdan qaytarilishi mumkin.
          </p>
        </Modal>

        <Modal
          open={showArchive}
          onClose={() => setShowArchive(false)}
          title="Arxivdagi qarzdorlar"
          subtitle="O'chirilgan qarzdorlar. Tarixlari saqlanadi va istalgan vaqtda qaytarilishi mumkin."
        >
          <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
            {archivedDebtors.length === 0 ? (
              <EmptyState message="Arxivda qarzdorlar yo'q." />
            ) : (
              <div className="space-y-3">
                {archivedDebtors.map((debtor) => (
                  <div key={debtor.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{debtor.full_name}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatPhoneNumber(debtor.phone)} | {formatCurrency(Number(debtor.total_debt))}</p>
                    </div>
                    <Button variant="secondary" onClick={() => restoreDebtor(debtor.id)}>Qaytarish</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      </div>
    </Layout>
  )
}

export default AdminDebtorsPage
