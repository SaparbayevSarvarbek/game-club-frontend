import { FormEvent, useEffect, useMemo, useState } from 'react'
import Layout from '../components/common/Layout'
import api from '../services/api'
import { FetchProduct, FetchProductSale } from '../types'
import { formatCurrency } from '../utils/format'

const today = new Date().toISOString().slice(0, 10)

const SalesPage = () => {
  const [products, setProducts] = useState<FetchProduct[]>([])
  const [sales, setSales] = useState<FetchProductSale[]>([])
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [cash, setCash] = useState<number>(0)
  const [card, setCard] = useState<number>(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    const [productData, salesData] = await Promise.all([
      api.fetchProducts(),
      api.fetchProductSales({ date: today, limit: 100 }),
    ])
    setProducts(productData)
    setSales(salesData)
  }

  useEffect(() => { load().catch(() => setError('Mahsulotlar yoki sotuvlar yuklanmadi.')) }, [])

  const product = useMemo(() => products.find((item) => item.id === selectedProduct), [products, selectedProduct])
  const totalAmount = product ? product.price * quantity : 0
  const inputClass = 'mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setError('')
    if (!product) return setError('Mahsulotni tanlang.')
    if (cash + card !== totalAmount) return setError("To'lov jami umumiy summaga teng bo'lishi kerak.")
    try {
      setLoading(true)
      await api.productSale({ product_id: selectedProduct, quantity, payment_cash: cash, payment_card: card })
      setMessage('Mahsulot savdosi saqlandi')
      setCash(0); setCard(0); setSelectedProduct(null); setQuantity(1)
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Savdoni yaratishda xatolik.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-soft dark:bg-slate-900">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Mahsulot savdosi</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">User tomonda mahsulot nomi, qolgan soni va sotish narxi ko'rinadi.</p>
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block"><span className="text-sm text-slate-600 dark:text-slate-300">Mahsulot</span><select value={selectedProduct ?? ''} onChange={(e) => setSelectedProduct(Number(e.target.value))} className={inputClass} required><option value="" disabled>Mahsulotni tanlang</option>{products.filter((p) => (p.quantity ?? 0) > 0).map((item) => <option key={item.id} value={item.id}>{item.name} | {item.quantity} dona | {formatCurrency(item.price)}</option>)}</select></label>
            <label className="block"><span className="text-sm text-slate-600 dark:text-slate-300">Miqdori</span><input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className={inputClass} /></label>
            <label className="block"><span className="text-sm text-slate-600 dark:text-slate-300">Naqd pul</span><input type="number" min={0} value={cash} onChange={(e) => setCash(Number(e.target.value))} className={inputClass} /></label>
            <label className="block"><span className="text-sm text-slate-600 dark:text-slate-300">Karta</span><input type="number" min={0} value={card} onChange={(e) => setCard(Number(e.target.value))} className={inputClass} /></label>
            <div className="rounded-3xl bg-blue-50 p-4 md:col-span-2 dark:bg-blue-950/40"><p className="text-sm text-blue-700 dark:text-blue-200">Jami</p><p className="mt-2 text-3xl font-semibold text-blue-800 dark:text-blue-100">{formatCurrency(totalAmount)}</p></div>
            <button type="submit" disabled={loading} className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500 md:col-span-2 disabled:opacity-60">Savdoni saqlash</button>
          </form>
          {error && <div className="mt-4 rounded-3xl bg-rose-50 p-4 text-sm font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">{error}</div>}
          {message && <div className="mt-4 rounded-3xl bg-emerald-50 p-4 text-sm font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">{message}</div>}
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-soft dark:bg-slate-900">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Bugungi sotuvlar</h3>
          <div className="mt-4 space-y-3">
            {sales.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">Bugun sotuvlar mavjud emas.</p> : sales.map((s) => {
              const unitPrice = Number(s.unit_price ?? s.total_amount / Math.max(1, s.quantity))
              const created = s.created_at ? new Date(s.created_at) : null
              return <div key={s.sale_key ?? s.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800"><div><p className="font-semibold text-slate-900 dark:text-slate-100">{s.product_name ?? `Mahsulot #${s.product_id}`}</p><p className="text-sm text-slate-500 dark:text-slate-400">{s.quantity} ta | {formatCurrency(unitPrice)}</p></div><div className="text-sm text-slate-500 dark:text-slate-400">{created ? created.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '-'}</div></div>
            })}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default SalesPage
