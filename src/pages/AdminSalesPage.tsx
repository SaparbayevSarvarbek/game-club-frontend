import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/common/Layout'
import api from '../services/api'
import { FetchComputer, FetchProduct, FetchProductSale } from '../types'
import { formatCurrency } from '../utils/format'

const today = new Date().toISOString().slice(0, 10)

const AdminSalesPage = () => {
  const [sales, setSales] = useState<FetchProductSale[]>([])
  const [products, setProducts] = useState<FetchProduct[]>([])
  const [computers, setComputers] = useState<FetchComputer[]>([])
  const [date, setDate] = useState(today)
  const [productId, setProductId] = useState('')
  const [computerId, setComputerId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const params: any = { limit: 300 }
      if (date) params.date = date
      if (productId) params.product_id = productId
      if (computerId) params.computer_id = computerId
      const [saleData, productData, computerData] = await Promise.all([
        api.fetchProductSales(params),
        api.fetchProducts(),
        api.fetchComputers(),
      ])
      setSales(saleData)
      setProducts(productData)
      setComputers(computerData)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Sotuvlar tarixini yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [date, productId, computerId])

  const total = useMemo(() => sales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0), [sales])
  const quantity = useMemo(() => sales.reduce((sum, sale) => sum + Number(sale.quantity || 0), 0), [sales])

  const inputClass = 'rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'

  return (
    <Layout>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-700 p-6 text-white shadow-soft dark:from-cyan-950 dark:via-sky-950 dark:to-blue-950">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-100">Sotilgan mahsulotlar</p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-cyan-100">Jami tushum</p>
              <p className="mt-2 text-4xl font-bold">{formatCurrency(total)}</p>
            </div>
            <div>
              <p className="text-sm text-cyan-100">Sotilgan soni</p>
              <p className="mt-2 text-4xl font-bold">{quantity} ta</p>
            </div>
            <div>
              <p className="text-sm text-cyan-100">Yozuvlar</p>
              <p className="mt-2 text-4xl font-bold">{sales.length}</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-soft dark:bg-slate-900">
          <div className="grid gap-4 md:grid-cols-4">
            <label className="block">
              <span className="text-sm text-slate-600 dark:text-slate-300">Sana</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputClass} mt-2`} />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600 dark:text-slate-300">Mahsulot</span>
              <select value={productId} onChange={(e) => setProductId(e.target.value)} className={`${inputClass} mt-2`}>
                <option value="">Hammasi</option>
                {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-sm text-slate-600 dark:text-slate-300">Kompyuter</span>
              <select value={computerId} onChange={(e) => setComputerId(e.target.value)} className={`${inputClass} mt-2`}>
                <option value="">Hammasi</option>
                {computers.map((computer) => <option key={computer.id} value={computer.id}>Stol #{computer.number}</option>)}
              </select>
            </label>
            <div className="flex items-end">
              <button onClick={load} className="w-full rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500">Yangilash</button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-soft dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Sotuvlar tarixi</h2>
          {error && <div className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">{error}</div>}
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  {['Mahsulot', 'Unit', 'Tan narxi', 'Soni', 'Jami', 'Foyda', 'Sana', 'Vaqt', 'Manba', 'Operator'].map((title) => (
                    <th key={title} className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">{title}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
                {loading ? (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">Yuklanmoqda...</td></tr>
                ) : sales.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">Sotuvlar topilmadi.</td></tr>
                ) : (
                  <>
                    {sales.map((sale) => {
                      const created = sale.created_at ? new Date(sale.created_at) : null
                      const unitPrice = Number(sale.unit_price ?? 0) || Number(sale.total_amount || 0) / Math.max(1, Number(sale.quantity || 1))
                      return (
                        <tr key={sale.sale_key ?? sale.id} className="text-slate-700 dark:text-slate-200">
                          <td className="px-4 py-4 font-semibold text-slate-900 dark:text-slate-100">{sale.product_name ?? `Mahsulot #${sale.product_id}`}</td>
                          <td className="px-4 py-4">{formatCurrency(unitPrice)}</td>
                          <td className="px-4 py-4">{formatCurrency(Number(sale.cost_price || 0))}</td>
                          <td className="px-4 py-4">{sale.quantity} ta</td>
                          <td className="px-4 py-4 font-semibold">{formatCurrency(Number(sale.total_amount))}</td>
                          <td className="px-4 py-4 font-semibold text-emerald-700">{formatCurrency(Number(sale.profit || 0))}</td>
                          <td className="px-4 py-4">{created ? created.toLocaleDateString('uz-UZ') : '-'}</td>
                          <td className="px-4 py-4">{created ? created.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                          <td className="px-4 py-4">{sale.computer_number ? `Stol #${sale.computer_number}` : 'Alohida sotuv'}</td>
                          <td className="px-4 py-4">{sale.operator_name ?? '-'}</td>
                        </tr>
                      )
                    })}
                    {sales.length > 0 && (
                      <tr className="font-semibold text-slate-900 dark:text-slate-100">
                        <td className="px-4 py-4">Jami</td>
                        <td className="px-4 py-4">-</td>
                        <td className="px-4 py-4">{formatCurrency(sales.reduce((s, r) => s + Number(r.cost_price || 0) * Number(r.quantity || 0), 0))}</td>
                        <td className="px-4 py-4">{quantity} ta</td>
                        <td className="px-4 py-4">{formatCurrency(total)}</td>
                        <td className="px-4 py-4">{formatCurrency(sales.reduce((s, r) => s + Number(r.profit || 0), 0))}</td>
                        <td className="px-4 py-4">-</td>
                        <td className="px-4 py-4">-</td>
                        <td className="px-4 py-4">-</td>
                        <td className="px-4 py-4">-</td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Layout>
  )
}

export default AdminSalesPage
