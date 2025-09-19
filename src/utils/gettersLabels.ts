import { rideRatesLabels } from '@/data/label'
import type { RideRatesInterface } from '@/interfaces/IRideRates'
import type { RateType, PayoutsType } from '@/types/ride'
import {
  booleanOptions,
  documentStatusOptions,
  documentTypeOptions,
  genderOptions,
  notificationCategoryOptions,
  notificationTypeOptions,
  requestStatusOptions,
  rideStatusOptions,
  rideTypeOptions,
  statusOptions,
  TransactionTypeOptions,
  userStatusOptions,
  vehicleStatusOptions,
  vehicleTypeOptions,
  walletTopupMethodOptions
} from '../data/selectOption'
import type {
  AdminRole,
  DocumentStatus,
  GenderType,
  NotificationCategory,
  NotificationType,
  RequestStatus,
  RideStatusType,
  RideType,
  StatusEnumType,
  TransactionType,
  UserStatus,
  VehicleStatusEnumType,
  VehicleType,
  WalletTopupMethodType
} from '../types/enum'
import type { DocumentType } from '@/types/document'

export const getStatusLabel = (value: StatusEnumType): string => {
  const found = statusOptions.find(option => option.value === value)
  return found ? found.label : value
}
export const getRequestStatusLabel = (value: RequestStatus): string => {
  const found = requestStatusOptions.find(option => option.value === value)
  return found ? found.label : value
}

export const getWalletTopupMethodTypeLabel = (
  value: WalletTopupMethodType
): string => {
  const found = walletTopupMethodOptions.find(option => option.value === value)
  return found ? found.label : value
}

export const getTransactionTypeLabel = (value: TransactionType): string => {
  const found = TransactionTypeOptions.find(option => option.value === value)
  return found ? found.label : value
}

export const getUserStatusLabel = (value: UserStatus): string => {
  const found = userStatusOptions.find(option => option.value === value)
  return found ? found.label : value
}

export const getBooleanLabel = (value: string): string => {
  const found = booleanOptions.find(option => option.value === value)
  return found ? found.label : value
}

export function getGenderLabel(gender: GenderType): string {
  const found = genderOptions.find(option => option.value === gender)
  return found ? found.label : gender
}
export function getRideStatusLabel(status: RideStatusType): string {
  const found = rideStatusOptions.find(option => option.value === status)
  return found ? found.label : status
}
export function getRideTypeLabel(type: RideType): string {
  const found = rideTypeOptions.find(option => option.value === type)
  return found ? found.label : type
}

export const getDocumentTypeLabel = (value: DocumentType): string => {
  const found = documentTypeOptions.find(option => option.value === value)
  return found ? found.label : value
}

export const getDocumentStatusLabel = (value: DocumentStatus): string => {
  const found = documentStatusOptions.find(option => option.value === value)
  return found ? found.label : value
}

export function getVehicleTypeLabel(type: VehicleType): string {
  const found = vehicleTypeOptions.find(option => option.value === type)
  return found ? found.label : type
}

export function getVehicleStatusLabel(type: VehicleStatusEnumType): string {
  const found = vehicleStatusOptions.find(option => option.value === type)
  return found ? found.label : type
}

export function getNotificationTypeLabel(type: NotificationType): string {
  const found = notificationTypeOptions.find(option => option.value === type)
  return found ? found.label : type
}

export function getNotificationCategoryLabel(
  type: NotificationCategory
): string {
  const found = notificationCategoryOptions.find(
    option => option.value === type
  )
  return found ? found.label : type
}

export function getAdminRoleLabel(role: AdminRole): string {
  const labels: Record<AdminRole, string> = {
    superadmin: 'Superadmin',
    manager: 'Gestor',
    finance: 'Financeiro',
    content: 'Conteúdo',
    support: 'Suporte'
  }
  return labels[role]
}

export const getRideRateLabel = (
  field: keyof RateType | keyof PayoutsType | keyof RideRatesInterface
): string => {
  return rideRatesLabels[field as string] || (field as string)
}
