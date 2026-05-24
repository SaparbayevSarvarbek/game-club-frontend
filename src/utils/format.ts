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
  if (cleaned === '' || Number.isNaN(Number(cleaned)) || Number(cleaned) === 0) {
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
