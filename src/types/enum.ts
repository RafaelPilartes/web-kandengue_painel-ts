export type ApplicationStatus = 'pending' | 'approved' | 'rejected'

export type MissionType = 'daily' | 'weekly' | 'monthly'

export type DocumentStatus = 'pending' | 'approved' | 'rejected'

export type TransactionCategoryType =
  | 'wallet_topup'
  | 'ride_fee'
  | 'pension'
  | 'bonus'
  | 'mission_bonus'
  | 'refund'

/**
 * Os tipos acima vivem agora em `@rafaelpilartes/kandengue-shared/enums`.
 *
 * Eram identicos nos tres repositorios — verificado simbolo a simbolo, com
 * os membros das unioes ordenados. Re-exportam-se daqui para os imports
 * existentes continuarem a funcionar.
 */
export type {
  AdminRole,
  GenderEnumType,
  GenderType,
  LogActionType,
  MonthEnumType,
  NotificationCategory,
  NotificationType,
  RequestStatus,
  RideStatusType,
  RideType,
  StatusEnumType,
  TransactionStatus,
  TransactionType,
  UserAvailability,
  UserStatus,
  VehicleStatusEnumType,
  VehicleType,
  WalletStatusEnumType,
  WalletTopupMethodType,
  WalletTopupStatus,
  currencyEnumType
} from '@rafaelpilartes/kandengue-shared/enums'
