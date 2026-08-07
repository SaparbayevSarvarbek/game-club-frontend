import { ChangeEvent } from 'react'

// Groups the 9-digit national number as "XX XXX XX XX"
const groupNational = (digits: string): string => {
  const a = digits.slice(0, 2)
  const b = digits.slice(2, 5)
  const c = digits.slice(5, 7)
  const d = digits.slice(7, 9)
  let out = a
  if (b) out += ` ${b}`
  if (c) out += ` ${c}`
  if (d) out += ` ${d}`
  return out
}

interface PhoneInputProps {
  value: string | null | undefined
  onChange: (value: string) => void
  className?: string
}

/**
 * Uzbek phone input. The "+998" country code is shown as a fixed prefix label,
 * so the user only types the 9-digit national number (no forced 998 during typing,
 * backspace works, and more than 9 digits can't be entered).
 */
const PhoneInput = ({ value, onChange, className = '' }: PhoneInputProps) => {
  // Derive the 9-digit national part from any stored format ("+998 93 285 38 74", "99893...", "93285...")
  const national = String(value ?? '')
    .replace(/\D/g, '')
    .replace(/^998/, '')
    .slice(0, 9)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 9)
    onChange(digits ? `+998 ${groupNational(digits)}` : '')
  }

  return (
    <div className={`flex w-full items-center overflow-hidden rounded-2xl border border-slate-300 bg-white focus-within:border-sky-500 dark:border-slate-600 dark:bg-slate-800 ${className}`}>
      <span className="shrink-0 border-r border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300">+998</span>
      <input
        inputMode="numeric"
        value={groupNational(national)}
        onChange={handleChange}
        placeholder="00 000 00 00"
        className="w-full min-w-0 bg-transparent px-3 py-2 text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
      />
    </div>
  )
}

export default PhoneInput
