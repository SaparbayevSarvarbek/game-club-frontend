import { useEffect, useState } from 'react'
import Layout from '../components/common/Layout'
import api from '../services/api'
import { formatCurrency, formatNumberInput, parseNumberInput } from '../utils/format'

const AdminProductsPage = () => {
  const [products, setProducts] = useState<any[]>([])
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('0')
  const [editing, setEditing] = useState<any>(null)
  const [message, setMessage] = useState('')

  const load = async () => {
    const data = await api.fetchProducts()
    setProducts(data)
  }

  useEffect(() => {
    load().catch(console.error)
  }, [])

  const handleSave = async () => {
    setMessage('')
    try {
      const numericPrice = parseNumberInput(price)
      const numericQuantity = parseNumberInput(quantity)
      if (numericPrice <= 0) {
        setMessage('Narx noldan katta boʻlishi kerak')
        return
      }
      if (editing) {
        await api.updateProduct(editing.id, { name, price: numericPrice, quantity: numericQuantity })
      } else {
        await api.createProduct({ name, price: numericPrice, quantity: numericQuantity })
      }
      setName('')
      setPrice('')
        setQuantity('0')
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
  }

  const remove = async (id: number) => {
    await api.deleteProduct(id)
    load()
  }

  return (
    <Layout>
      <div className="space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-900">Mahsulot boshqaruvi</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <label className="block md:col-span-2">
              <span className="text-sm text-slate-600">Nomi</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600">Narx</span>
              <input
                type="text"
                value={formatNumberInput(price)}
                onChange={(e) => setPrice(e.target.value)}
                onBlur={() => setPrice(formatNumberInput(price))}
                onFocus={() => setPrice(String(parseNumberInput(price) || ''))}
                placeholder="10 000"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600">Soni</span>
              <input
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <button onClick={handleSave} className="md:col-span-3 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500">
              {editing ? 'Mahsulotni yangilash' : 'Mahsulot qoʻshish'}
            </button>
          </div>
          {message && <p className={`mt-4 text-sm ${message.includes('muvaffaq') ? 'text-emerald-600' : 'text-rose-600'}`}>{message}</p>}
        </section>
        <section className="rounded-3xl bg-white p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-slate-900">Mahsulotlar roʻyxati</h3>
          <div className="mt-6 space-y-3">
            {products.map((product) => (
              <div key={product.id} className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-900">{product.name}</p>
                  <p className="text-sm text-slate-500">{formatCurrency(Number(product.price))} — <span className="font-medium">{product.quantity ?? 0} dona</span></p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(product)} className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700">Tahrirlash</button>
                  <button onClick={() => remove(product.id)} className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-400">Oʻchirish</button>
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
