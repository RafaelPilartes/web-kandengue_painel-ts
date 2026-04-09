export type GenderEnumType = 'male' | 'female'
export type StatusEnumType = 'active' | 'inactive' | 'pending'
export type GenderType = 'male' | 'female' | 'other'
export type MonthEnumType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
export type currencyEnumType = 'AOA' | 'USD'
// =========================================================================
export type UserStatus =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'banned'
  | 'deleted'

// =========================================================================
export type ApplicationStatus = 'pending' | 'approved' | 'rejected'

export type VehicleType = 'car' | 'motorcycle' | 'bicycle' | 'truck' | 'scooter'
export type VehicleStatusEnumType = 'under_analysis' | 'validated' | 'rejected'

export type WalletStatusEnumType = 'active' | 'blocked'

// =========================================================================

export type RideStatusType =
  | 'idle' // Aguardando motorista aceitar & Novo pedido disponível para aceitar
  | 'pending' // Aceitando & aguardando motorista aceitar
  | 'driver_on_the_way' // Motorista a caminho & mostra navegação até pickup
  | 'arrived_pickup' // Motorista chegou ao local & botão para "Confirmar recolha"
  | 'picked_up' // O estafeta recolheu seu pacote & mostra navegação até dropoff
  | 'arrived_dropoff' // Motorista chegou & botão para "Confirmar entrega"
  | 'completed' // Entrega concluída 🎉 & saldo atualizado
  | 'canceled' // cancelado (por qualquer lado)

export type MissionType = 'daily' | 'weekly' | 'monthly'

export type RideType = 'car' | 'motorcycle' | 'bicycle' | 'delivery'

export type DocumentStatus = 'pending' | 'approved' | 'rejected'

export type TransactionType = 'credit' | 'debit' | 'refund'
export type TransactionCategoryType =
  | 'wallet_topup'
  | 'ride_fee'
  | 'pension'
  | 'bonus'
  | 'mission_bonus'
  | 'refund'

export type TransactionStatus = 'pending' | 'success' | 'failed' | 'reversed'
export type RequestStatus = 'pending' | 'approved' | 'rejected'

export type WalletTopupStatus =
  | 'pending' // criado localmente
  | 'processing' // enviado para Unitel
  | 'approved' // aprovado
  | 'rejected' // rejeitado
  | 'success' // confirmado
  | 'failed' // falhou
  | 'cancelled' // cancelado
  | 'timeout' // sem resposta
  | 'reversed' // estornado

export type WalletTopupMethodType = 'unitel_money' | 'bank_transfer' | 'cash'

export type NotificationType = 'ride' | 'wallet' | 'document' | 'system'
export type NotificationCategory = 'driver' | 'passenger' | 'admin' | 'all'

// =========================================================================
export type AdminRole =
  | 'direcao_geral'
  | 'operacoes_qualidade'
  | 'administracao_financas'
  | 'tecnologia_inovacao'
  | 'seguranca_qualidade_operacional'
  | 'negocios_imagem_institucional'
  | 'capital_humano'
  | 'contabilidade_financas'
  | 'tecnologia_inovacao_tecnica'

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
