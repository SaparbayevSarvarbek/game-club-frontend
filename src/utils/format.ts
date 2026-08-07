export const formatCurrency = (value: number | string) => {
  const amount = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(amount)) {
    return '0'
  }
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatNumber = (value: number | string) => {
  const amount = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(amount)) {
    return '0'
  }
  return new Intl.NumberFormat('uz-UZ').format(amount)
}

const UZ_TIME_ZONE = 'Asia/Tashkent'

const parseUzDate = (value: string | Date) => {
  if (value instanceof Date) {
    return value
  }
  const hasTimeZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(value)
  if (hasTimeZone) {
    return new Date(value)
  }
  const normalized = value.includes('T') ? value : `${value}T00:00:00`
  return new Date(`${normalized}+05:00`)
}

export const formatDateTime = (value: string | Date) => {
  const date = parseUzDate(value)
  return new Intl.DateTimeFormat('uz-UZ', {
    timeZone: UZ_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export const formatDate = (value: string | Date) => {
  const date = parseUzDate(value)
  return new Intl.DateTimeFormat('uz-UZ', {
    timeZone: UZ_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export const formatNumberInput = (value: string | number) => {
  const raw = typeof value === 'number' ? String(value) : value
  const cleaned = raw.replace(/\s|,/g, '').trim()
  if (cleaned === '' || Number.isNaN(Number(cleaned))) {
    return ''
  }
  return new Intl.NumberFormat('uz-UZ').format(Number(cleaned))
}

export const parseNumberInput = (value: string | number) => {
  const raw = typeof value === 'number' ? String(value) : value
  const cleaned = raw.replace(/\s|,/g, '').trim()
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

// Uzbek mobile phone formatter: accepts only digits and renders as "+998 93 285 38 74".
// Handles national (9-digit), old "8" prefix, or full international ("998...") input.
// Caps at the 9-digit national number so no more digits can be added.
export const formatPhoneNumber = (value: string | number | null | undefined): string => {
  let digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) return ''
  // Normalize a full international or legacy "8" prefix to the 9-digit national part
  if (digits.startsWith('998') && digits.length > 11) {
    digits = digits.slice(3)
  } else if (digits.startsWith('8') && digits.length > 9) {
    digits = digits.slice(1)
  }
  digits = digits.slice(0, 9)
  if (!digits) return ''

  const operator = digits.slice(0, 2)
  const part1 = digits.slice(2, 5)
  const part2 = digits.slice(5, 7)
  const part3 = digits.slice(7, 9)

  let out = '+998'
  if (operator) out += ` ${operator}`
  if (part1) out += ` ${part1}`
  if (part2) out += ` ${part2}`
  if (part3) out += ` ${part3}`
  return out
}
