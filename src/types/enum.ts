export type GenderEnumType = 'male' | 'female'
export type StatusEnumType = 'active' | 'inactive' | 'pending'
export type GenderType = 'male' | 'female' | 'other'
export type MonthEnumType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

// =========================================================================
export type UserStatus = 'active' | 'inactive' | 'pending' | 'banned'

// =========================================================================

export type VehicleType = 'car' | 'motorcycle' | 'bicycle' | 'truck' | 'scooter'

// =========================================================================

export type RideStatusType =
  | 'pending' // Aguardando motorista aceitar & Novo pedido disponível para aceitar
  | 'accepting_pending' // Aceitando & aguardando motorista aceitar
  | 'driver_on_the_way' // Motorista a caminho & mostra navegação até pickup
  | 'arrived_pickup' // Motorista chegou ao local & botão para "Confirmar recolha"
  | 'picked_up' // O estafeta recolheu seu pacote & mostra navegação até dropoff
  | 'arrived_dropoff' // Motorista chegou & botão para "Confirmar entrega"
  | 'completed' // Entrega concluída 🎉 & saldo atualizado
  | 'canceled' // cancelado (por qualquer lado)

export type RideType = 'car' | 'motorcycle' | 'bicycle' | 'delivery'

export type DocumentStatus = 'pending' | 'approved' | 'rejected'

export type TransactionType = 'credit' | 'debit' | 'refund'
export type TransactionCategoryType = 'loading_wallet' | 'service_fee' | 'bonus'

export type NotificationType = 'ride' | 'wallet' | 'document' | 'system'
export type NotificationCategory = 'driver' | 'passenger' | 'admin' | 'all'

// =========================================================================
export type AdminRole =
  | 'superadmin'
  | 'manager'
  | 'finance'
  | 'content'
  | 'support'

export type LogActionType =
  // Sessão e autenticação
  | 'login'
  | 'logout'

  // Ações CRUD
  | 'create'
  | 'read'
  | 'update'
  | 'delete'

  // Outros
  | 'access'
  | 'error'
  | 'custom'
