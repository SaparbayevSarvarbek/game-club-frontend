export const parseError = (err: unknown): string => {
  if (!err) return 'Unknown error'
  if (typeof err === 'string') return err
  if (err instanceof Error) return err.message
  try {
    const anyErr = err as any
    const detail = anyErr?.response?.data?.detail
    // FastAPI validation errors (422) return `detail` as an array of error objects.
    // Rendering an array directly would crash React, so flatten it into a readable string.
    if (Array.isArray(detail)) {
      const msgs = detail
        .map((item: any) => item?.msg || item?.message || JSON.stringify(item))
        .filter(Boolean)
      return msgs.length ? msgs.join('; ') : 'So\'rov xatoligi'
    }
    return detail || anyErr?.message || JSON.stringify(anyErr)
  } catch {
    return 'Unknown error'
  }
}
