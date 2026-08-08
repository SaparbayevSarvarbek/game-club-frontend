import { useEffect, useState } from 'react'
import Layout from '../components/common/Layout'
import { useToast } from '../components/common/Toast'
import api from '../services/api'
import { formatCurrency, formatNumberInput, parseNumberInput, formatDateTime } from '../utils/format'
import { TrashIcon } from '@heroicons/react/24/outline'
import Card from '../components/ui/Card'
import Field from '../components/ui/Field'
import Button from '../components/ui/Button'
import IconButton from '../components/common/IconButton'
import EmptyState from '../components/ui/EmptyState'

const AdminExpensesPage = () => {
  const [expenses, setExpenses] = useState<any[]>([])
  const [payload, setPayload] = useState({ title: '', amount: '', comment: '' })
  const toast = useToast()

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
        toast.success('Xarajat nomini kiritish shart')
        return
      }
      if (amount <= 0) {
        toast.success('Xarajat summasi 0 dan katta boʻlishi kerak')
        return
      }
      await api.createExpense({
        title: payload.title.trim(),
        amount,
        comment: payload.comment.trim() || null,
      })
      setPayload({ title: '', amount: '', comment: '' })
      toast.success('Xarajat muvaffaqiyatli qayd qilindi')
      load()
    } catch (err: any) {
      toast.success(err?.response?.data?.detail || 'Xarajatni qayd qilishda xatolik')
    }
  }

  const remove = async (id: number) => {
    try {
      await api.deleteExpense(id)
      toast.success('Xarajat muvaffaqiyatli oʻchirildi')
      load()
    } catch (err: any) {
      toast.success(err?.response?.data?.detail || 'Xarajatni oʻchirishda xatolik')
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <Card
          title="Xarajatlar (Chiqimlar)"
          subtitle="Yangi xarajat kiritish (nomini yozing, jami pulini kiriting) va admin dashboardida kuzating."
        >
          <div className="mt-2 grid gap-4 md:grid-cols-3">
            <Field
              as="input"
              label="Xarajat nomi"
              className="md:col-span-2"
              inputProps={{
                value: payload.title,
                onChange: (e: any) => setPayload((prev) => ({ ...prev, title: e.target.value })),
                placeholder: 'Masalan: Suv sotib olish, Arenda...',
              }}
            />
            <Field
              as="input"
              label="Jami puli"
              inputProps={{
                type: 'text',
                value: formatNumberInput(payload.amount),
                onChange: (e: any) => setPayload((prev) => ({ ...prev, amount: e.target.value })),
                onBlur: () => setPayload((prev) => ({ ...prev, amount: formatNumberInput(prev.amount) })),
                onFocus: () => setPayload((prev) => ({ ...prev, amount: String(parseNumberInput(prev.amount)) })),
                placeholder: 'Narxi (masalan: 50 000)',
              }}
            />
            <Field
              as="textarea"
              label="Qoʻshimcha izoh (ixtiyoriy)"
              className="md:col-span-3"
              inputProps={{
                value: payload.comment,
                onChange: (e: any) => setPayload((prev) => ({ ...prev, comment: e.target.value })),
                placeholder: 'Xarajat haqida qoʻshimcha maʻlumot...',
              }}
            />
          </div>
          <Button onClick={add} className="mt-4">Xarajat qoʻshish</Button>
        </Card>

        <Card title="Xarajatlar roʻyxati">
          {expenses.length === 0 ? (
            <EmptyState message="Hali xarajatlar qayd qilinmagan." />
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Sana</th>
                    <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Xarajat nomi</th>
                    <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Jami summa</th>
                    <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Izoh</th>
                    <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
                  {expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{formatDateTime(expense.created_at)}</td>
                      <td className="px-4 py-4 font-medium text-slate-900 dark:text-slate-100">{expense.title}</td>
                      <td className="px-4 py-4 font-semibold text-rose-600 dark:text-rose-400">{formatCurrency(Number(expense.amount))}</td>
                      <td className="px-4 py-4 text-slate-500 dark:text-slate-400">{expense.comment || '—'}</td>
                      <td className="px-4 py-4">
                        <IconButton onClick={() => remove(expense.id)} title="O'chirish" variant="danger" icon={<TrashIcon className="h-4 w-4" />} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  )
}

export default AdminExpensesPage
