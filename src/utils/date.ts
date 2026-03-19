import dayjs from 'dayjs'

// formatDateTimeFromFirestore
export function formatDateTimeFromFirestore(timestamp: any) {
  if (!timestamp) return { date: '-', time: '-' }
  const date = typeof timestamp?.toDate === 'function' ? timestamp.toDate() : new Date(timestamp)

  const formattedDate = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  const formattedTime = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })

  return {
    date: formattedDate,
    time: formattedTime
  }
}

export const convertToDate = (dateString: string) => {
  const [day, month, year] = dateString.split('/')
  return new Date(`${year}-${month}-${day}`)
}

export const toDay = new Date().toISOString().split('T')[0]

// Função para converter o horário para minutos totais
export function convertTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const now = new Date()
const hours = String(now.getHours()).padStart(2, '0')
const minutes = String(now.getMinutes()).padStart(2, '0')
export const fullTime = `${hours}:${minutes}`

export const calculateAge = (birthDate: string) => {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export function calculateDuration(start: string, end: string): Duration {
  const startDate = dayjs(start)
  const endDate = dayjs(end)

  let years = endDate.diff(startDate, 'year')
  const afterYears = startDate.add(years, 'year')

  let months = endDate.diff(afterYears, 'month')
  const afterMonths = afterYears.add(months, 'month')

  const days = endDate.diff(afterMonths, 'day')

  return { years, months, days }
}

interface Duration {
  years: number
  months: number
  days: number
}

export function formatDuration(duration: Duration): string {
  const parts: string[] = []

  if (duration.years > 0) {
    parts.push(`${duration.years} ano${duration.years > 1 ? 's' : ''}`)
  }

  if (duration.months > 0) {
    parts.push(`${duration.months} mês${duration.months > 1 ? 'es' : ''}`)
  }

  if (duration.days > 0 || parts.length === 0) {
    parts.push(`${duration.days} dia${duration.days !== 1 ? 's' : ''}`)
  }

  return parts.join(', ')
}

export function isPastDate(
  targetDate: string,
  referenceDate?: string
): boolean {
  const reference = referenceDate ? dayjs(referenceDate) : dayjs()
  return dayjs(targetDate).isBefore(reference, 'day')
}
