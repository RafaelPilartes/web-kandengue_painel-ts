import type { Timestamp } from 'firebase/firestore'

/**
 * Fronteira única entre o tempo do Firestore e o tempo da aplicação.
 * Aceita Timestamp, Date, string ISO, null ou undefined.
 */
export function toDate(
  value: Timestamp | Date | string | null | undefined
): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'string') return new Date(value)
  if (typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate()
  }
  return null
}
