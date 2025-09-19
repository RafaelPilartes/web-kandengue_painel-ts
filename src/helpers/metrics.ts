export function toDate(d?: string | Date): Date {
  if (!d) return new Date()
  if (d instanceof Date) return d
  const parsed = new Date(d)
  if (!isNaN(parsed.getTime())) return parsed
  return new Date()
}
export function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function rangeMonths(start: Date, end: Date) {
  const s = new Date(start.getFullYear(), start.getMonth(), 1)
  const e = new Date(end.getFullYear(), end.getMonth(), 1)
  const keys: string[] = []
  let cur = new Date(s)
  while (cur <= e) {
    keys.push(monthKey(cur))
    cur.setMonth(cur.getMonth() + 1)
  }
  return keys
}
export function monthLabel(key: string) {
  const [y, m] = key.split('-')
  const date = new Date(Number(y), Number(m) - 1, 1)
  return date.toLocaleString(undefined, { month: 'short', year: 'numeric' })
}
