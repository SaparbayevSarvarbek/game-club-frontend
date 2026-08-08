import { FormEvent, useEffect, useMemo, useState } from 'react'
import Layout from '../components/common/Layout'
import api from '../services/api'
import { FetchProduct, FetchProductSale } from '../types'
import { formatCurrency, formatNumberInput, parseNumberInput, todayUz } from '../utils/format'
import { useToast } from '../components/common/Toast'
import Card from '../components/ui/Card'
import Field from '../components/ui/Field'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'

const today = todayUz()

const SalesPage = () => {
  const [products, setProducts] = useState<FetchProduct[]>([])
  const [sales, setSales] = useState<FetchProductSale[]>([])
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [cash, setCash] = useState<string>('')
  const [card, setCard] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const load = async () => {
    const [productData, salesData] = await Promise.all([
      api.fetchProducts(),
      api.fetchProductSales({ date: today, limit: 100 }),
    ])
    setProducts(productData)
    setSales(salesData)
  }

  useEffect(() => { load().catch(() => toast.error('Mahsulotlar yoki sotuvlar yuklanmadi.')) }, [])

  const product = useMemo(() => products.find((item) => item.id === selectedProduct), [products, selectedProduct])
  const totalAmount = product ? product.price * quantity : 0

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!product) return toast.error('Mahsulotni tanlang.')
    const cashAmount = parseNumberInput(cash)
    const cardAmount = parseNumberInput(card)
    if (cashAmount + cardAmount !== totalAmount) return toast.error("To'lov jami umumiy summaga teng bo'lishi kerak.")
    try {
      setLoading(true)
      await api.productSale({ product_id: selectedProduct, quantity, payment_cash: cashAmount, payment_card: cardAmount })
      toast.success('Mahsulot savdosi saqlandi')
      setCash(''); setCard(''); setSelectedProduct(null); setQuantity(1)
      await load()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Savdoni yaratishda xatolik.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <Card title="Mahsulot savdosi" subtitle="User tomonda mahsulot nomi, qolgan soni va sotish narxi ko'rinadi.">
          <form onSubmit={handleSubmit} className="mt-2 grid gap-4 md:grid-cols-2">
            <Field
              as="select"
              label="Mahsulot"
              inputProps={{ value: selectedProduct ?? '', onChange: (e: any) => setSelectedProduct(Number(e.target.value)), required: true }}
            >
              <option value="" disabled>Mahsulotni tanlang</option>
              {products.filter((p) => (p.quantity ?? 0) > 0).map((item) => (
                <option key={item.id} value={item.id}>{item.name} | {item.quantity} dona | {formatCurrency(item.price)}</option>
              ))}
            </Field>
            <Field
              as="input"
              label="Miqdori"
              inputProps={{ type: 'number', min: 1, value: quantity, onChange: (e: any) => setQuantity(Number(e.target.value)) }}
            />
            <Field
              as="input"
              label="Naqd pul"
              inputProps={{
                type: 'text',
                inputMode: 'numeric',
                pattern: '[0-9\\s,]*',
                value: cash,
                onChange: (e: any) => setCash(formatNumberInput(e.target.value)),
                placeholder: '0',
              }}
            />
            <Field
              as="input"
              label="Karta"
              inputProps={{
                type: 'text',
                inputMode: 'numeric',
                pattern: '[0-9\\s,]*',
                value: card,
                onChange: (e: any) => setCard(formatNumberInput(e.target.value)),
                placeholder: '0',
              }}
            />
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/40 md:col-span-2">
              <p className="text-sm text-emerald-600 dark:text-emerald-300">Jami</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-800 dark:text-emerald-100">{formatCurrency(totalAmount)}</p>
            </div>
            <Button type="submit" isLoading={loading} className="md:col-span-2">
              Savdoni saqlash
            </Button>
          </form>
        </Card>

        <Card title="Bugungi sotuvlar">
          {sales.length === 0 ? (
            <EmptyState message="Bugun sotuvlar mavjud emas." />
          ) : (
            <div className="mt-4 space-y-3">
              {sales.map((s) => {
                const unitPrice = Number(s.unit_price ?? s.total_amount / Math.max(1, s.quantity))
                const created = s.created_at ? new Date(s.created_at) : null
                return (
                  <div key={s.sale_key ?? s.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{s.product_name ?? `Mahsulot #${s.product_id}`}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{s.quantity} ta | {formatCurrency(unitPrice)}</p>
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{created ? created.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  )
}

export default SalesPage
