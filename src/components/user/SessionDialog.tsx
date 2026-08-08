import { useEffect, useRef, useState } from 'react'
import { TrashIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline'
import api from '../../services/api'
import { formatCurrency, formatNumberInput, formatPhoneNumber, parseNumberInput } from '../../utils/format'
import { parseError } from '../../utils/error'
import { FetchProduct } from '../../types'
import IconButton from '../../components/common/IconButton'
import PhoneInput from '../../components/common/PhoneInput'
import { useToast } from '../common/Toast'
import Modal from '../ui/Modal'
import Field from '../ui/Field'
import Button from '../ui/Button'

const DebtorInlineAdd = ({ setDebtors, setDebtorId }: { setDebtors: (d: any[]) => void; setDebtorId: (id: number | null) => void }) => {
  const [show, setShow] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const create = async () => {
    if (!fullName.trim() || !phone.trim()) {
      toast.error('Ism va telefon toʻldirilishi shart')
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
      const list = await api.listDebtors(undefined, true)
      setDebtors(list)
      setDebtorId(debtor.id)
      setFullName('')
      setPhone('')
      setShow(false)
    } catch (err) {
      toast.error(parseError(err) || 'Qarzdorni qoʻshishda xatolik')
    } finally {
      setSaving(false)
    }
  }

  if (!show) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setShow(true)}>
        + Yangi qarzdor
      </Button>
    )
  }

  return (
    <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <h4 className="font-semibold text-slate-900 dark:text-slate-100">Yangi qarzdor qoʻshing</h4>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          as="input"
          inputProps={{ placeholder: 'Ism va familiya', value: fullName, onChange: (e: any) => setFullName(e.target.value) }}
        />
        <PhoneInput value={phone} onChange={setPhone} />
      </div>
      <div className="flex gap-3">
        <Button onClick={create} isLoading={saving}>
          {saving ? 'Saqlanamoqda...' : 'Saqlash'}
        </Button>
        <Button variant="secondary" onClick={() => setShow(false)}>
          Bekor qilish
        </Button>
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
  const [debtorSearch, setDebtorSearch] = useState('')
  const [debtorDropdownOpen, setDebtorDropdownOpen] = useState(false)
  const [debtorId, setDebtorId] = useState<number | null>(null)
  const [debtors, setDebtors] = useState<any[]>([])
  const debtorDropdownRef = useRef<HTMLDivElement | null>(null)
  const [processing, setProcessing] = useState(false)
  const toast = useToast()
  const [showPayment, setShowPayment] = useState(false)
  const [localActiveSession, setLocalActiveSession] = useState<ActiveSession | null>(activeSession ?? null)

  useEffect(() => {
    setSelectedProducts([])
    setComputerPrice(activeSession ? String(activeSession.computer_price ?? '') : '')
    setDiscount(activeSession ? String(activeSession.discount ?? '') : '')
    setPaymentCash('')
    setPaymentCard('')
    setPaymentDebt('')
    setDebtorId(null)
    setShowPayment(false)
  }, [computer, activeSession])

  useEffect(() => {
    setLocalActiveSession(activeSession ?? null)
  }, [activeSession])

  // Ensure localActiveSession.products can carry UI-only flags like `pending_remove`
  useEffect(() => {
    if (localActiveSession && localActiveSession.products) {
      setLocalActiveSession((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          products: (prev.products || []).map((p: any) => ({ ...p, pending_remove: (p as any).pending_remove ?? false })),
        }
      })
    }
  }, [/* nothing */])

  useEffect(() => {
    const loadDebtors = async () => {
      try {
        const data = await api.listDebtors(debtorSearch || undefined, true)
        setDebtors(data)
      } catch {
        setDebtors([])
      }
    }
    loadDebtors()
  }, [debtorSearch])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        debtorDropdownRef.current &&
        !debtorDropdownRef.current.contains(event.target as Node)
      ) {
        setDebtorDropdownOpen(false)
      }
    }

    if (debtorDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [debtorDropdownOpen])

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
  const existingProductsTotal = localActiveSession ? Number(localActiveSession.products_amount ?? 0) : 0
  const savedProducts = localActiveSession?.products ?? []
  const productsTotal = existingProductsTotal + selectedProductsTotal
  const subtotal = computerPriceRaw + productsTotal
  const totalWithDiscount = Math.max(0, subtotal - discountRaw)
  const handleSaveClick = async () => {
    setProcessing(true)
    try {
      if (computer.is_active && activeSession) {
        // Apply pending removals first
        const pendingRemovals = (localActiveSession?.products || []).filter((p: any) => p.pending_remove).map((p: any) => p.id)
        if (pendingRemovals.length > 0) {
          for (const id of pendingRemovals) {
            try {
              await api.deleteSessionProduct(localActiveSession!.session_id, id)
            } catch (_err) {
              // ignore individual failures, will surface on next fetch
            }
          }
        }
        if (selectedProducts.length > 0) {
          await api.addProductsToSession(activeSession.session_id, selectedProducts)
          onProductsAdded?.()
        }
        await onSave?.(activeSession.session_id)
        close()
        return
      }
      if (totalWithDiscount <= 0) {
        toast.error('Hisob 0 dan katta bolishi kerak')
        return
      }
      await onStart({ computer_id: computer.id, computer_price: computerPriceRaw, products: selectedProducts, discount: discountRaw })
      close()
    } catch (err) {
      toast.error(parseError(err) || 'Sessiyani saqlashda xatolik')
    } finally {
      setProcessing(false)
    }
  }

  const handleConfirmPayment = async () => {
    setProcessing(true)
    try {
      if (totalWithDiscount <= 0) {
        toast.error('Hisob 0 dan katta bolishi kerak')
        return
      }
      const cashAmount = parseNumberInput(paymentCash)
      const finalPaymentTotal = cashAmount + parseNumberInput(paymentCard) + parseNumberInput(paymentDebt)
      if (finalPaymentTotal !== totalWithDiscount) {
        toast.error('Naqd, karta va qarz jami toʻlovga teng boʻlishi kerak')
        return
      }
      if (parseNumberInput(paymentDebt) > 0 && !debtorId) {
        toast.error('Qarz toʻlovini yozayotganda qarzdorni tanlang')
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

      // Apply pending removals before completing
      const pendingRemovals = (localActiveSession?.products || []).filter((p: any) => p.pending_remove).map((p: any) => p.id)
      if (pendingRemovals.length > 0) {
        for (const id of pendingRemovals) {
          try {
            await api.deleteSessionProduct(sessionId!, id)
          } catch (_err) {
            // ignore; will surface on next fetch
          }
        }
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
    } catch (err) {
      toast.error(parseError(err) || 'Toʻlovni amalga oshirishda xatolik')
    } finally {
      setProcessing(false)
    }
  }

  const numInputProps = (value: string, setter: (v: string) => void) => ({
    type: 'text',
    inputMode: 'numeric' as const,
    value: formatNumberInput(value),
    onChange: (e: any) => setter(e.target.value),
    onBlur: () => setter(formatNumberInput(value)),
    onFocus: () => setter(String(parseNumberInput(value) || '')),
  })

  return (
    <Modal open onClose={close} maxWidth="max-w-2xl" title={`Sessiya: #${computer.number}`} subtitle={computer.type}>
      <div className="space-y-6">
        {computer.is_active && activeSession && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">Faol sessiya boshlangan</p>
            <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{new Date(activeSession.started_at).toLocaleString('uz-UZ')}</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Oldingi mahsulotlar: {formatCurrency(existingProductsTotal)}</p>
            {savedProducts.length > 0 && (
              <div className="mt-3 space-y-2">
                {savedProducts.map((item) => {
                  const pending = (localActiveSession?.products?.find((p: any) => p.id === item.id) as any)?.pending_remove
                  return (
                    <div key={item.id} className={`flex items-center justify-between rounded-2xl px-3 py-2 text-sm transition-all duration-200 ${pending ? 'bg-rose-50 opacity-70 line-through dark:bg-rose-900/30' : 'bg-white text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>
                      <span>{item.product_name || `Mahsulot #${item.product_id}`} x {item.quantity}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatCurrency(Number(item.price) * item.quantity)}</span>
                        {pending ? (
                          <button onClick={() => {
                            // undo pending removal
                            setLocalActiveSession((prev) => {
                              if (!prev) return prev
                              return { ...prev, products: (prev.products || []).map((p: any) => p.id === item.id ? { ...p, pending_remove: false } : p) }
                            })
                          }} disabled={processing} title="Bekor qilish" aria-label="Bekor qilish">
                            <ArrowUturnLeftIcon className="h-4 w-4" />
                          </button>
                        ) : (
                          <button onClick={() => {
                            // mark pending removal locally; actual delete happens on Save/Complete
                            setLocalActiveSession((prev) => {
                              if (!prev) return prev
                              return { ...prev, products: (prev.products || []).map((p: any) => p.id === item.id ? { ...p, pending_remove: true } : p) }
                            })
                          }} disabled={processing} title="O'chirish" aria-label="O'chirish">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            as="input"
            label={computer.type === 'playstation' ? 'PlayStation narxi' : 'Kompyuter narxi'}
            inputProps={numInputProps(computerPrice, setComputerPrice)}
          />
          <Field as="input" label="Chegirma miqdori" inputProps={numInputProps(discount, setDiscount)} />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Mahsulotlar</h3>
            <Button size="sm" onClick={addProduct}>Mahsulot qoʻshish</Button>
          </div>
          <div className="space-y-4">
            {selectedProducts.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Mahsulot qoʻshish uchun tugmani bosing.</p>
            ) : (
              selectedProducts.map((item, index) => (
                <div key={index} className="grid gap-3 sm:grid-cols-[1fr_100px_auto] transition-colors duration-200 ease-in-out">
                  <select
                    value={item.product_id}
                    onChange={(e) => changeRow(index, 'product_id', Number(e.target.value))}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 transition-colors duration-200 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  >
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>{product.name}{product.quantity != null ? `-${product.quantity}` : ''}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => changeRow(index, 'quantity', Number(e.target.value))}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 transition-shadow duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  />
                  <IconButton onClick={() => removeRow(index)} title="O'chirish" variant="danger" icon={<TrashIcon className="h-4 w-4" />} />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">Mahsulotlar jami</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(productsTotal)}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">Jami</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(subtotal)}</p>
          </div>
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/40">
            <p className="text-sm text-emerald-600 dark:text-emerald-300">Chegirma bilan</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-800 dark:text-emerald-100">{formatCurrency(totalWithDiscount)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={close} disabled={processing}>Orqaga</Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleSaveClick} disabled={processing}>Saqlash</Button>
            <Button onClick={() => setShowPayment(true)} disabled={processing}>To'lash</Button>
          </div>
        </div>

        {showPayment && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field as="input" label="Naqd" inputProps={numInputProps(paymentCash, setPaymentCash)} />
              <Field as="input" label="Karta" inputProps={numInputProps(paymentCard, setPaymentCard)} />
              <Field as="input" label="Qarz" inputProps={numInputProps(paymentDebt, setPaymentDebt)} />
            </div>

            {parseNumberInput(paymentDebt) > 0 && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-sm text-slate-500 dark:text-slate-400">Qarzdor tanlang</p>
                <div ref={debtorDropdownRef} className="relative mt-3">
                  <input
                    type="text"
                    value={debtorSearch}
                    onChange={(e) => {
                      setDebtorSearch(e.target.value)
                      setDebtorId(null)
                      setDebtorDropdownOpen(true)
                    }}
                    onFocus={() => setDebtorDropdownOpen(true)}
                    placeholder="Ism yoki telefon bo‘yicha qidiring"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  />
                  {debtorDropdownOpen && (
                    <div className="absolute left-0 right-0 z-10 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-950">
                      {debtors.length === 0 ? (
                        <div className="p-3 text-sm text-slate-500">Hech qanday qarzdor topilmadi.</div>
                      ) : (
                        debtors.map((debtor) => (
                          <button
                            key={debtor.id}
                            type="button"
                            onMouseDown={(event) => {
                              event.preventDefault()
                              setDebtorId(debtor.id)
                              setDebtorSearch(`${debtor.first_name} ${debtor.last_name ?? ''}`.trim())
                              setDebtorDropdownOpen(false)
                            }}
                            className="w-full px-4 py-3 text-left text-sm text-slate-900 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                          >
                            <div className="font-medium">{debtor.first_name} {debtor.last_name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{formatPhoneNumber(debtor.phone)} — {formatCurrency(Number(debtor.total_debt ?? 0))}</div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <DebtorInlineAdd setDebtors={setDebtors} setDebtorId={setDebtorId} />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setShowPayment(false)} disabled={processing}>Orqaga</Button>
              <Button onClick={handleConfirmPayment} disabled={processing}>Toʻlovni yakunlash</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default SessionDialog
