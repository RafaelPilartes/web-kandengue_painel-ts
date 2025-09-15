import type {
  NotificationCategory,
  NotificationType,
  RideStatusType
} from '@/types/enum'

export const colorRideStatus = (status: RideStatusType): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-600'
    case 'accepting_pending':
      return 'bg-yellow-100 text-yellow-600'
    case 'driver_on_the_way':
      return 'bg-purple-100 text-purple-600'
    case 'arrived_pickup':
      return 'bg-gray-100 text-gray-600'
    case 'picked_up':
      return 'bg-orange-100 text-orange-600'
    case 'arrived_dropoff':
      return 'bg-blue-100 text-blue-600'
    case 'completed':
      return 'bg-green-100 text-green-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}
export const colorRideStatusSimple = (status: RideStatusType): any => {
  switch (status) {
    case 'pending':
      return 'yellow'
    case 'accepting_pending':
      return 'yellow'
    case 'driver_on_the_way':
      return 'purple'
    case 'arrived_pickup':
      return 'gray'
    case 'picked_up':
      return 'orange'
    case 'arrived_dropoff':
      return 'blue'
    case 'completed':
      return 'green'
    default:
      return 'gray'
  }
}
export const colorNotificationTypeSimple = (status: NotificationType): any => {
  switch (status) {
    case 'document':
      return 'purple'
    case 'ride':
      return 'green'
    case 'wallet':
      return 'blue'
    default:
      return 'gray'
  }
}
export const colorNotificationCategorySimple = (
  status: NotificationCategory
): any => {
  switch (status) {
    case 'admin':
      return 'purple'
    case 'driver':
      return 'blue'
    case 'passenger':
      return 'green'
    default:
      return 'gray'
  }
}
