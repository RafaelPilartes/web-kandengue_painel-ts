import type { RideStatusType } from '@/types/enum'
import { getRideStatusLabel } from '@/utils/gettersLabels'

// Criar um componente StatusBadge
export const StatusBadge = ({ status }: { status: RideStatusType }) => {
  const variants = {
    idle: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    driver_on_the_way: 'bg-blue-100 text-blue-800',
    arrived_pickup: 'bg-purple-100 text-purple-800',
    picked_up: 'bg-indigo-100 text-indigo-800',
    arrived_dropoff: 'bg-teal-100 text-teal-800',
    completed: 'bg-green-100 text-green-800',
    canceled: 'bg-red-100 text-red-800'
  }

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${variants[status]}`}
    >
      {getRideStatusLabel(status)}
    </span>
  )
}
