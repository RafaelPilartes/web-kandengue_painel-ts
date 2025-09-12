import type { RideInterface } from '@/interfaces/IRide'
import { Timestamp } from 'firebase/firestore'

const months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
]

// Helper para garantir que lidamos com Timestamp ou Date
function toDate(value: any): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (value instanceof Timestamp) return value.toDate()
  if (value.seconds) return new Date(value.seconds * 1000) // fallback
  return null
}

export const rideCalculation = {
  getRidesByMonth: (rides: RideInterface[]) => {
    const counts = new Array(12).fill(0)

    rides.forEach(ride => {
      if (ride.status === 'completed') {
        const date = toDate(ride.created_at)

        if (date) {
          const monthIndex = date.getMonth()
          counts[monthIndex] += 1
        }
      }
    })

    return {
      labels: months,
      datasets: [
        {
          label: 'Corridas por mês',
          data: counts,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.3)',
          tension: 0.4
        }
      ]
    }
  },

  getRevenueByMonth: (rides: RideInterface[]) => {
    const revenues = new Array(12).fill(0)

    rides.forEach(ride => {
      if (ride.status === 'completed') {
        const date = toDate(ride.created_at)

        if (date) {
          const monthIndex = date.getMonth()
          revenues[monthIndex] += ride.fare?.payouts?.company_earnings || 0
        }
      }
    })

    return {
      labels: months,
      datasets: [
        {
          label: 'Receita por mês (AOA)',
          data: revenues,
          backgroundColor: '#10B981'
        }
      ]
    }
  },

  getRidesByType: (rides: RideInterface[]) => {
    const types: Record<string, number> = {
      deliveries: 0,
      car: 0,
      motorcycle: 0
    }

    rides.forEach(ride => {
      if (ride.status === 'completed') {
        if (ride.type === 'car') types.car += 1
        else if (ride.type === 'motorcycle') types.motorcycle += 1
        else types.deliveries += 1
      }
    })

    return {
      labels: ['Entregas', 'Corridas de carro', 'Corridas de moto'],
      datasets: [
        {
          label: 'Tipos de Corridas',
          data: [types.deliveries, types.car, types.motorcycle],
          backgroundColor: ['#2563EB', '#F59E0B', '#EF4444']
        }
      ]
    }
  }
}
