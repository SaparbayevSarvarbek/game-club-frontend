export const parseError = (err: unknown): string => {
  if (!err) return 'Unknown error'
  if (typeof err === 'string') return err
  if (err instanceof Error) return err.message
  try {
    const anyErr = err as any
    return anyErr?.response?.data?.detail || anyErr?.message || JSON.stringify(anyErr)
  } catch {
    return 'Unknown error'
  }
}
