import { useEffect, useState } from 'react'
import api from '../../services/api'
import { formatCurrency, formatNumberInput, parseNumberInput } from '../../utils/format'
import { FetchProduct } from '../../types'

const DebtorInlineAdd = ({ setDebtors, setDebtorId }: { setDebtors: (d: any[]) => void; setDebtorId: (id: number | null) => void }) => {
  const [show, setShow] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const create = async () => {
    setError('')
    if (!fullName.trim() || !phone.trim()) {
      setError('Ism va telefon toʻldirilishi shart')
      return
    }
    setSaving(true)
    try {
      const parts = fullName.trim().split(' ')
      const firstName = parts.shift() || ''
      const lastName = parts.join(' ') || undefined
      const debtor = await api.createDebtor({
        first_name: firstName,
        last_name: lastName,
        phone: phone.trim(),
        total_debt: 0,
      })
      const list = await api.listDebtors()
      setDebtors(list)
      setDebtorId(debtor.id)
      setFullName('')
      setPhone('')
      setError('')
      setShow(false)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Qarzdorni qoʻshishda xatolik')
    } finally {
      setSaving(false)
    }
  }

  if (!show) {
    return (
      <button onClick={() => setShow(true)} className="rounded-2xl border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-600 hover:bg-sky-100">
        + Yangi qarzdor
      </button>
    )
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 space-y-3">
      <h4 className="font-semibold text-slate-900">Yangi qarzdor qoʻshing</h4>
      <div className="grid gap-3 sm:grid-cols-2">
        <input placeholder="Ism va familiya" value={fullName} onChange={(e) => setFullName(e.target.value)} className="rounded-2xl border border-slate-300 px-3 py-2" />
        <input placeholder="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-2xl border border-slate-300 px-3 py-2" />
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="flex gap-3">
        <button onClick={create} disabled={saving} className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-60">
          {saving ? 'Saqlanamoqda...' : 'Saqlash'}
        </button>
        <button onClick={() => { setShow(false); setError('') }} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
          Bekor qilish
        </button>
      </div>
    </div>
  )
}

interface ActiveSession {
  session_id: number
  computer_id: number
  status: string
  started_at: string
  computer_price: number
  products_amount: number
  discount: number
  total_amount: string
  products?: { id: number; product_id: number; product_name?: string | null; quantity: number; price: number }[]
}

interface SessionDialogProps {
  computer: { id: number; number: number; type: string; is_active: boolean }
  products: FetchProduct[]
  close: () => void
  onStart: (payload: { computer_id: number; computer_price: number; products: any[]; discount: number }) => void
  onSave?: (sessionId: number) => void
  onComplete?: (payload: { session_id: number; payment_cash: number; payment_card: number; payment_debt: number; debtor_id: number | null; computer_price: number; discount: number }) => void
  activeSession?: ActiveSession | null
  loading?: boolean
  onProductsAdded?: () => void
}

const SessionDialog = ({ computer, products, close, onStart, onSave, onComplete, activeSession, loading = false, onProductsAdded }: SessionDialogProps) => {
  const [computerPrice, setComputerPrice] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<{ product_id: number; quantity: number; price: number }[]>([])
  const [discount, setDiscount] = useState('')
  const [paymentCash, setPaymentCash] = useState('')
  const [paymentCard, setPaymentCard] = useState('')
  const [paymentDebt, setPaymentDebt] = useState('')
  const [debtorId, setDebtorId] = useState<number | null>(null)
  const [debtors, setDebtors] = useState<any[]>([])
  const [error, setError] = useState<string>('')
  const [processing, setProcessing] = useState(false)
  const [showPayment, setShowPayment] = useState(false)

  useEffect(() => {
    setSelectedProducts([])
    setComputerPrice(activeSession ? String(activeSession.computer_price ?? '') : '')
    setDiscount(activeSession ? String(activeSession.discount ?? '') : '')
    setPaymentCash('')
    setPaymentCard('')
    setPaymentDebt('')
    setDebtorId(null)
    setError('')
    setShowPayment(false)
  }, [computer, activeSession])

  useEffect(() => {
    const loadDebtors = async () => {
      try {
        const data = await api.listDebtors()
        setDebtors(data)
      } catch {
        setDebtors([])
      }
    }
    loadDebtors()
  }, [])

  const addProduct = () => {
    if (products.length > 0) {
      setSelectedProducts((list) => [...list, { product_id: products[0].id, quantity: 1, price: Number(products[0].price) }])
    }
  }

  const changeRow = (index: number, field: 'product_id' | 'quantity', value: string | number) => {
    setSelectedProducts((list) =>
      list.map((item, idx) => {
        if (idx !== index) return item
        if (field === 'product_id') {
          const product = products.find((p) => p.id === Number(value))
          return product ? { ...item, product_id: product.id, price: Number(product.price) } : item
        }
        return { ...item, quantity: Number(value) }
      })
    )
  }

  const removeRow = (index: number) => {
    setSelectedProducts((list) => list.filter((_, idx) => idx !== index))
  }

  const computerPriceRaw = parseNumberInput(computerPrice)
  const discountRaw = parseNumberInput(discount)
  const selectedProductsTotal = selectedProducts.reduce((sum, entry) => sum + entry.price * entry.quantity, 0)
  const existingProductsTotal = activeSession ? Number(activeSession.products_amount ?? 0) : 0
  const savedProducts = activeSession?.products ?? []
  const productsTotal = existingProductsTotal + selectedProductsTotal
  const subtotal = computerPriceRaw + productsTotal
  const totalWithDiscount = Math.max(0, subtotal - discountRaw)
  const paymentTotal = parseNumberInput(paymentCash) + parseNumberInput(paymentCard) + parseNumberInput(paymentDebt)

  const handleSaveClick = async () => {
    setError('')
    setProcessing(true)
    try {
      if (computer.is_active && activeSession) {
        if (selectedProducts.length > 0) {
          await api.addProductsToSession(activeSession.session_id, selectedProducts)
          onProductsAdded?.()
        }
        await onSave?.(activeSession.session_id)
        close()
        return
      }
      if (totalWithDiscount <= 0) {
        setError('Hisob 0 dan katta bolishi kerak')
        return
      }
      await onStart({ computer_id: computer.id, computer_price: computerPriceRaw, products: selectedProducts, discount: discountRaw })
      close()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Sessiyani saqlashda xatolik')
    } finally {
      setProcessing(false)
    }
  }

  const handleConfirmPayment = async () => {
    setError('')
    setProcessing(true)
    try {
      if (totalWithDiscount <= 0) {
        setError('Hisob 0 dan katta bolishi kerak')
        return
      }
      const cashAmount = paymentTotal === 0 ? totalWithDiscount : parseNumberInput(paymentCash)
      const finalPaymentTotal = cashAmount + parseNumberInput(paymentCard) + parseNumberInput(paymentDebt)
      if (finalPaymentTotal !== totalWithDiscount) {
        setError('Naqd, karta va qarz jami toʻlovga teng boʻlishi kerak')
        return
      }
      if (parseNumberInput(paymentDebt) > 0 && !debtorId) {
        setError('Qarz toʻlovini yozayotganda qarzdorni tanlang')
        return
      }

      let sessionId = activeSession?.session_id
      if (!sessionId) {
        await onStart({ computer_id: computer.id, computer_price: computerPriceRaw, products: selectedProducts, discount: discountRaw })
        const fresh = await api.fetchActiveSession(computer.id)
        sessionId = fresh.session_id
      } else if (selectedProducts.length > 0) {
        await api.addProductsToSession(sessionId, selectedProducts)
        onProductsAdded?.()
      }

      const payload = {
        session_id: sessionId!,
        payment_cash: cashAmount,
        payment_card: parseNumberInput(paymentCard),
        payment_debt: parseNumberInput(paymentDebt),
        debtor_id: debtorId,
        computer_price: computerPriceRaw,
        discount: discountRaw,
      }

      if (onComplete) {
        await onComplete(payload)
      } else {
        await api.completeSession(sessionId!, payload)
      }
      close()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Toʻlovni amalga oshirishda xatolik')
    } finally {
      setProcessing(false)
      setShowPayment(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Sessiya: #{computer.number}</h2>
            <p className="text-sm text-slate-500">{computer.type}</p>
          </div>
          <button onClick={close} disabled={processing} className="rounded-2xl border px-4 py-2 text-sm text-slate-600">Bekor qilish</button>
        </div>

        <div className="mt-6 space-y-6">
          {computer.is_active && activeSession && (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Faol sessiya boshlangan</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{new Date(activeSession.started_at).toLocaleString('uz-UZ')}</p>
              <p className="mt-2 text-sm text-slate-500">Oldingi mahsulotlar: {formatCurrency(existingProductsTotal)}</p>
              {savedProducts.length > 0 && (
                <div className="mt-3 space-y-2">
                  {savedProducts.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 text-sm text-slate-700">
                      <span>{item.product_name || `Mahsulot #${item.product_id}`} x {item.quantity}</span>
                      <span className="font-medium">{formatCurrency(Number(item.price) * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-slate-600">Kompyuter narxi</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatNumberInput(computerPrice)}
                onChange={(e) => setComputerPrice(e.target.value)}
                onBlur={() => setComputerPrice(formatNumberInput(computerPrice))}
                onFocus={() => setComputerPrice(String(parseNumberInput(computerPrice) || ''))}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600">Chegirma miqdori</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatNumberInput(discount)}
                onChange={(e) => setDiscount(e.target.value)}
                onBlur={() => setDiscount(formatNumberInput(discount))}
                onFocus={() => setDiscount(String(parseNumberInput(discount) || ''))}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Mahsulotlar</h3>
              <button onClick={addProduct} className="rounded-full bg-sky-500 px-3 py-1 text-sm text-white hover:bg-sky-400">Mahsulot qoʻshish</button>
            </div>
            <div className="space-y-4">
              {selectedProducts.length === 0 ? (
                <p className="text-sm text-slate-500">Mahsulot qoʻshish uchun tugmani bosing.</p>
              ) : (
                selectedProducts.map((item, index) => (
                  <div key={`${item.product_id}-${index}`} className="grid gap-3 sm:grid-cols-[1fr_100px_auto]">
                    <select
                      value={item.product_id}
                      onChange={(e) => changeRow(index, 'product_id', Number(e.target.value))}
                      className="rounded-2xl border border-slate-300 px-4 py-3"
                    >
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>{product.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => changeRow(index, 'quantity', Number(e.target.value))}
                      className="rounded-2xl border border-slate-300 px-4 py-3"
                    />
                    <button onClick={() => removeRow(index)} className="rounded-2xl bg-rose-500 px-4 py-3 text-sm text-white hover:bg-rose-400">Oʻchirish</button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Mahsulotlar jami</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(productsTotal)}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Jami</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(subtotal)}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Chegirma bilan</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(totalWithDiscount)}</p>
            </div>
          </div>

          {error && <p className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button onClick={close} disabled={processing} className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">Orqaga</button>
            <button onClick={handleSaveClick} disabled={processing} className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">Saqlash</button>
            <button onClick={() => setShowPayment(true)} disabled={processing} className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500">Tolash</button>
          </div>
        </div>
      </div>

      {showPayment && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Toʻlov</h3>
                <p className="text-sm text-slate-500">Jami toʻlov: {formatCurrency(totalWithDiscount)}</p>
              </div>
              <button onClick={() => setShowPayment(false)} disabled={processing} className="rounded-2xl border px-4 py-2 text-sm text-slate-600">Bekor qilish</button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="text-sm text-slate-600">Naqd</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatNumberInput(paymentCash)}
                  onChange={(e) => setPaymentCash(e.target.value)}
                  onBlur={() => setPaymentCash(formatNumberInput(paymentCash))}
                  onFocus={() => setPaymentCash(String(parseNumberInput(paymentCash) || ''))}
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                />
              </label>
              <label className="block">
                <span className="text-sm text-slate-600">Karta</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatNumberInput(paymentCard)}
                  onChange={(e) => setPaymentCard(e.target.value)}
                  onBlur={() => setPaymentCard(formatNumberInput(paymentCard))}
                  onFocus={() => setPaymentCard(String(parseNumberInput(paymentCard) || ''))}
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                />
              </label>
              <label className="block">
                <span className="text-sm text-slate-600">Qarz</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatNumberInput(paymentDebt)}
                  onChange={(e) => setPaymentDebt(e.target.value)}
                  onBlur={() => setPaymentDebt(formatNumberInput(paymentDebt))}
                  onFocus={() => setPaymentDebt(String(parseNumberInput(paymentDebt) || ''))}
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                />
              </label>
            </div>

            {parseNumberInput(paymentDebt) > 0 && (
              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Qarzdor tanlang</p>
                <select
                  value={debtorId ?? ''}
                  onChange={(e) => setDebtorId(e.target.value ? Number(e.target.value) : null)}
                  className="mt-3 w-full rounded-2xl border border-slate-300 px-4 py-3"
                >
                  <option value="">Qarzdor tanlang</option>
                  {debtors.map((debtor) => (
                    <option key={debtor.id} value={debtor.id}>
                      {debtor.first_name} {debtor.last_name} — {formatCurrency(Number(debtor.total_debt ?? 0))}
                    </option>
                  ))}
                </select>
                <div className="mt-4">
                  <DebtorInlineAdd setDebtors={setDebtors} setDebtorId={setDebtorId} />
                </div>
              </div>
            )}

            {error && <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button onClick={() => setShowPayment(false)} disabled={processing} className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">Orqaga</button>
              <button onClick={handleConfirmPayment} disabled={processing} className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500">Toʻlovni yakunlash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SessionDialog
