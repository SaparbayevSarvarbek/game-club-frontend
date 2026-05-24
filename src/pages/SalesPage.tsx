import { FormEvent, useEffect, useMemo, useState } from 'react'
import Layout from '../components/common/Layout'
import api from '../services/api'
import { FetchProduct, FetchProductSale } from '../types'
import { formatCurrency } from '../utils/format'

const SalesPage = () => {
  const [products, setProducts] = useState<FetchProduct[]>([])
  const [debtors, setDebtors] = useState<any[]>([])
  const [sales, setSales] = useState<FetchProductSale[]>([])
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
  const [selectedDebtor, setSelectedDebtor] = useState<number | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [cash, setCash] = useState<number>(0)
  const [card, setCard] = useState<number>(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showNewDebtor, setShowNewDebtor] = useState(false)
  const [newDebtorFirstName, setNewDebtorFirstName] = useState('')
  const [newDebtorLastName, setNewDebtorLastName] = useState('')
  const [newDebtorPhone, setNewDebtorPhone] = useState('')
  const [newDebtorError, setNewDebtorError] = useState('')
  const [newDebtorLoading, setNewDebtorLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [productData, debtorData] = await Promise.all([api.fetchProducts(), api.listDebtors()])
        setProducts(productData)
        setDebtors(debtorData)
        const salesData = await api.fetchProductSales()
        setSales(salesData)
      } catch {
        setError('Unable to load products or debtors.')
      }
    }
    load()
  }, [])

  const product = useMemo(() => products.find((item) => item.id === selectedProduct), [products, selectedProduct])
  const selectedDebtorInfo = useMemo(() => debtors.find((item) => item.id === selectedDebtor), [debtors, selectedDebtor])
  const totalAmount = product ? product.price * quantity : 0

  const handleCreateDebtor = async () => {
    setNewDebtorError('')
    if (!newDebtorFirstName.trim()) {
      setNewDebtorError('Ism kiritish majburiy')
      return
    }
    if (!newDebtorPhone.trim()) {
      setNewDebtorError('Telefon raqam kiritish majburiy')
      return
    }
    try {
      setNewDebtorLoading(true)
      const debtor = await api.createDebtor({
        first_name: newDebtorFirstName.trim(),
        last_name: newDebtorLastName.trim(),
        phone: newDebtorPhone.trim(),
        total_debt: 0,
      })
      setDebtors((list) => [...list, debtor])
      setSelectedDebtor(debtor.id)
      setShowNewDebtor(false)
      setNewDebtorFirstName('')
      setNewDebtorLastName('')
      setNewDebtorPhone('')
    } catch (err: any) {
      setNewDebtorError(err?.response?.data?.detail || 'Qarzdorni yaratishda xatolik')
    } finally {
      setNewDebtorLoading(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setError('')
    if (!product) {
      setError('Mahsulotni tanlashdan oldin savdo qilishni boshlang.')
      return
    }
    if (cash + card !== totalAmount) {
      setError('Toʻlov jami miqdori umumiy miqdorga teng boʻlishi kerak.')
      return
    }
    try {
      setLoading(true)
      await api.productSale({
        product_id: selectedProduct,
        quantity,
        payment_cash: cash,
        payment_card: card,
      })
      setMessage('Mahsulot savdosi muvaffaqiyatli yaratildi')
      setCash(0)
      setCard(0)
      setSelectedDebtor(null)
      setSelectedProduct(null)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Savdoni yaratishda xatolik. Toʻlov jamilari va qarzdor tanlovini tekshiring.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-900">Mahsulot savdosi</h2>
          <p className="mt-2 text-sm text-slate-500">Naqd, karta va qarz orasida toʻlovni boʻlib sotish bilan savdo yarating.</p>
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm text-slate-600">Mahsulot</span>
              <select
                value={selectedProduct ?? ''}
                onChange={(e) => setSelectedProduct(Number(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                required
              >
                <option value="" disabled>Mahsulotni tanlang</option>
                {products.filter((p) => (p.quantity ?? 0) > 0).map((item) => (
                  <option key={item.id} value={item.id}>{item.name} — {item.quantity} dona</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm text-slate-600">Miqdori</span>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600">Naqd pul</span>
              <input
                type="number"
                min={0}
                value={cash}
                onChange={(e) => setCash(Number(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600">Karta</span>
              <input
                type="number"
                min={0}
                value={card}
                onChange={(e) => setCard(Number(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            {/* Debt payments are not permitted for product sales — removed from UI */}
            <div className="md:col-span-2 rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Jami</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{formatCurrency(totalAmount)}</p>
            </div>
            <button type="submit" disabled={loading} className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500 md:col-span-2 disabled:opacity-60">
              Savdoni saqlash
            </button>
          </form>
          {error && <div className="mt-4 rounded-3xl bg-rose-50 p-4 text-sm text-rose-700 font-medium">{error}</div>}
          {message && <div className="mt-4 rounded-3xl bg-emerald-50 p-4 text-sm text-emerald-700 font-medium">{message}</div>}
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-slate-900">So'ngi sotuvlar</h3>
          <div className="mt-4 space-y-3">
            {sales.length === 0 ? (
              <p className="text-sm text-slate-500">Hozircha sotuvlar mavjud emas.</p>
            ) : (
              sales.map((s) => {
                const p = products.find((pr) => pr.id === s.product_id)
                return (
                  <div key={s.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div>
                      <p className="font-semibold text-slate-900">{p ? p.name : `Mahsulot #${s.product_id}`}</p>
                      <p className="text-sm text-slate-500">{s.quantity} × {formatCurrency(Number(s.total_amount) / Math.max(1, s.quantity))} — {formatCurrency(s.total_amount)}</p>
                    </div>
                    <div className="text-sm text-slate-500">{new Date(s.created_at || '').toLocaleString('uz-UZ')}</div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default SalesPage
