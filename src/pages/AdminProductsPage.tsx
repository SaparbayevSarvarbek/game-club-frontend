import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/common/Layout'
import api from '../services/api'
import { formatCurrency, formatNumberInput, parseNumberInput } from '../utils/format'

const AdminProductsPage = () => {
  const [products, setProducts] = useState<any[]>([])
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('0')
  const [purchaseTotal, setPurchaseTotal] = useState('')
  const [editing, setEditing] = useState<any>(null)
  const [message, setMessage] = useState('')

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
    setMessage('')
    try {
      const numericPrice = parseNumberInput(price)
      const numericQuantity = parseNumberInput(quantity)
      const numericPurchaseTotal = parseNumberInput(purchaseTotal)
      if (!name.trim()) return setMessage('Mahsulot nomi kiritilishi kerak')
      if (numericQuantity <= 0) return setMessage('Mahsulot soni noldan katta bo\'lishi kerak')
      if (numericPurchaseTotal < 0) return setMessage('Umumiy xarid summasi noto\'g\'ri')
      if (numericPrice <= 0) return setMessage('Sotish narxi noldan katta bo\'lishi kerak')
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
      setMessage('Mahsulot muvaffaqiyatli saqlandi')
    } catch (err: any) {
      setMessage(err?.response?.data?.detail || 'Mahsulotni saqlashda xatolik')
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

  const inputClass = 'mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'

  return (
    <Layout>
      <div className="space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-soft dark:bg-slate-900">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Mahsulot boshqaruvi</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Ombor soni, umumiy xarid summasi va sotish narxini kiriting. Tan narx avtomatik hisoblanadi.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <label className="block md:col-span-2"><span className="text-sm text-slate-600 dark:text-slate-300">Mahsulot nomi</span><input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} /></label>
            <label className="block"><span className="text-sm text-slate-600 dark:text-slate-300">Umumiy soni</span><input type="text" value={formatNumberInput(quantity)} onChange={(e) => setQuantity(e.target.value)} onFocus={() => setQuantity(String(parseNumberInput(quantity) || ''))} onBlur={() => setQuantity(formatNumberInput(quantity))} className={inputClass} /></label>
            <label className="block"><span className="text-sm text-slate-600 dark:text-slate-300">Umumiy xarid summasi</span><input type="text" value={formatNumberInput(purchaseTotal)} onChange={(e) => setPurchaseTotal(e.target.value)} onFocus={() => setPurchaseTotal(String(parseNumberInput(purchaseTotal) || ''))} onBlur={() => setPurchaseTotal(formatNumberInput(purchaseTotal))} className={inputClass} /></label>
            <div className="rounded-3xl bg-blue-50 p-4 dark:bg-blue-950/40"><p className="text-sm text-blue-700 dark:text-blue-200">Tan narx</p><p className="mt-2 text-2xl font-bold text-blue-800 dark:text-blue-100">{formatCurrency(costPrice)}</p></div>
            <label className="block md:col-span-3"><span className="text-sm text-slate-600 dark:text-slate-300">Sotish narxi</span><input type="text" value={formatNumberInput(price)} onChange={(e) => setPrice(e.target.value)} onBlur={() => setPrice(formatNumberInput(price))} onFocus={() => setPrice(String(parseNumberInput(price) || ''))} placeholder="10 000" className={inputClass} /></label>
            <button onClick={handleSave} className="md:col-span-4 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500">{editing ? 'Mahsulotni yangilash' : 'Mahsulot qo\'shish'}</button>
          </div>
          {message && <p className={`mt-4 rounded-2xl p-3 text-sm font-medium ${message.includes('muvaffaq') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200'}`}>{message}</p>}
        </section>
        <section className="rounded-3xl bg-white p-6 shadow-soft dark:bg-slate-900">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Mahsulotlar ro'yxati</h3>
          <div className="mt-6 space-y-3">
            {products.map((product) => (
              <div key={product.id} className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800">
                <div>
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{product.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Qolgan: <span className="font-medium">{product.quantity ?? 0} dona</span> | Sotish: <span className="font-semibold text-blue-600 dark:text-blue-300">{formatCurrency(Number(product.price))}</span> | Tan narx: {formatCurrency(Number(product.cost_price ?? 0))}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(product)} title="Tahrirlash" className="rounded-full border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button onClick={() => remove(product.id)} title="O'chirish" className="rounded-full bg-rose-500 p-2 text-white hover:bg-rose-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H10a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  )
}

export default AdminProductsPage
