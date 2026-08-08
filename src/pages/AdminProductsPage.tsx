import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/common/Layout'
import { useToast } from '../components/common/Toast'
import api from '../services/api'
import { formatCurrency, formatNumberInput, parseNumberInput } from '../utils/format'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import Card from '../components/ui/Card'
import Field from '../components/ui/Field'
import Button from '../components/ui/Button'
import IconButton from '../components/common/IconButton'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'

const AdminProductsPage = () => {
  const [products, setProducts] = useState<any[]>([])
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('0')
  const [purchaseTotal, setPurchaseTotal] = useState('')
  const [editing, setEditing] = useState<any>(null)
  const toast = useToast()

  const load = async () => setProducts(await api.fetchProducts())

  useEffect(() => {
    load().catch(console.error)
  }, [])

  const costPrice = useMemo(() => {
    const qty = parseNumberInput(quantity)
    const total = parseNumberInput(purchaseTotal)
    return qty > 0 ? total / qty : 0
  }, [quantity, purchaseTotal])

  const handleSave = async () => {
    try {
      const numericPrice = parseNumberInput(price)
      const numericQuantity = parseNumberInput(quantity)
      const numericPurchaseTotal = parseNumberInput(purchaseTotal)
      if (!name.trim()) return toast.error('Mahsulot nomi kiritilishi kerak')
      if (numericQuantity <= 0) return toast.error('Mahsulot soni noldan katta bo\'lishi kerak')
      if (numericPurchaseTotal < 0) return toast.error('Umumiy xarid summasi noto\'g\'ri')
      if (numericPrice <= 0) return toast.error('Sotish narxi noldan katta bo\'lishi kerak')
      const payload = {
        name: name.trim(),
        quantity: numericQuantity,
        purchase_total: numericPurchaseTotal,
        cost_price: costPrice,
        price: numericPrice,
      }
      if (editing) await api.updateProduct(editing.id, payload)
      else await api.createProduct(payload)
      setName('')
      setPrice('')
      setQuantity('0')
      setPurchaseTotal('')
      setEditing(null)
      await load()
      toast.success('Mahsulot muvaffaqiyatli saqlandi')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Mahsulotni saqlashda xatolik')
    }
  }

  const startEdit = (product: any) => {
    setEditing(product)
    setName(product.name)
    setPrice(String(product.price))
    setQuantity(String(product.quantity ?? 0))
    setPurchaseTotal(String(product.purchase_total ?? 0))
  }

  const remove = async (id: number) => {
    await api.deleteProduct(id)
    await load()
  }

  const numberProps = (value: string, setter: (v: string) => void) => ({
    type: 'text',
    value: formatNumberInput(value),
    onChange: (e: any) => setter(e.target.value),
    onFocus: () => setter(String(parseNumberInput(value) || '')),
    onBlur: () => setter(formatNumberInput(value)),
  })

  return (
    <Layout>
      <div className="space-y-6">
        <Card
          title="Mahsulot boshqaruvi"
          subtitle="Ombor soni, umumiy xarid summasi va sotish narxini kiriting. Tan narx avtomatik hisoblanadi."
        >
          <div className="mt-2 grid gap-4 md:grid-cols-4">
            <Field as="input" label="Mahsulot nomi" className="md:col-span-2" inputProps={{ value: name, onChange: (e: any) => setName(e.target.value) }} />
            <Field as="input" label="Umumiy soni" inputProps={numberProps(quantity, setQuantity)} />
            <Field as="input" label="Umumiy xarid summasi" inputProps={numberProps(purchaseTotal, setPurchaseTotal)} />
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/40">
              <p className="text-sm text-emerald-700 dark:text-emerald-300">Tan narx</p>
              <p className="mt-2 text-2xl font-bold text-emerald-800 dark:text-emerald-100">{formatCurrency(costPrice)}</p>
            </div>
            <Field as="input" label="Sotish narxi" className="md:col-span-3" inputProps={{ ...numberProps(price, setPrice), placeholder: '10 000' }} />
            <Button onClick={handleSave} className="md:col-span-4">{editing ? 'Mahsulotni yangilash' : "Mahsulot qo'shish"}</Button>
          </div>
        </Card>

        <Card title="Mahsulotlar ro'yxati">
          {products.length === 0 ? (
            <EmptyState message="Hozircha mahsulotlar yo'q." />
          ) : (
            <div className="mt-2 space-y-3">
              {products.map((product) => (
                <div key={product.id} className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{product.name}</p>
                      <Badge tone="slate">{product.quantity ?? 0} dona</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Sotish: <span className="font-semibold text-emerald-600 dark:text-emerald-300">{formatCurrency(Number(product.price))}</span> | Tan narx: {formatCurrency(Number(product.cost_price ?? 0))}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <IconButton onClick={() => startEdit(product)} title="Tahrirlash" variant="ghost" icon={<PencilIcon className="h-4 w-4" />} />
                    <IconButton onClick={() => remove(product.id)} title="O'chirish" variant="danger" icon={<TrashIcon className="h-4 w-4" />} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  )
}

export default AdminProductsPage
