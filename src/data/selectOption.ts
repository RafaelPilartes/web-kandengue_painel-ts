import type { OptionType } from '../types/option'
import { RIDE_TYPES, VEHICLE_TYPES } from '@rafaelpilartes/kandengue-shared/enums'
import { RIDE_TYPE_LABELS, VEHICLE_TYPE_LABELS } from '@rafaelpilartes/kandengue-shared/constants'

export const genderOptions: OptionType[] = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Feminino' },
  { value: 'other', label: 'Other' }
]
export const statusOptions: OptionType[] = [
  { value: 'inactive', label: 'Inativo' },
  { value: 'active', label: 'Ativo' },
  { value: 'pending', label: 'Pendente' }
]

export const requestStatusOptions: OptionType[] = [
  { value: 'pending', label: 'Pendente' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'rejected', label: 'Rejeitado' }
]

export const TransactionTypeOptions: OptionType[] = [
  { value: 'credit', label: 'Crédito' },
  { value: 'debit', label: 'Débito' },
  { value: 'refund', label: 'Devolução' }
]

export const walletTopupMethodOptions: OptionType[] = [
  { value: 'bank_transfer', label: 'Transferência Bancária' },
  { value: 'automated', label: 'Automático' },
  { value: 'cash', label: 'Dinheiro' }
]

export const paymentMethodOptions: OptionType[] = [
  { value: 'cash', label: 'Dinheiro' },
  { value: 'wallet', label: 'Carteira' },
  { value: 'credit_card', label: 'Cartão de Crédito' },
  { value: 'multicaixa', label: 'Multicaixa' }
]

export const userStatusOptions: OptionType[] = [
  { value: 'inactive', label: 'Inativo' },
  { value: 'active', label: 'Ativo' },
  { value: 'pending', label: 'Pendente' },
  { value: 'banned', label: 'Banido' }
]
export const applicationStatusOptions: OptionType[] = [
  { value: 'rejected', label: 'Rejeitado' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'pending', label: 'Pendente' }
]
export const booleanOptions: OptionType[] = [
  { value: 'true', label: 'Sim' },
  { value: 'false', label: 'Não' }
]

export const notificationTypeOptions: OptionType[] = [
  { value: 'ride', label: 'Corrida' },
  { value: 'wallet', label: 'Carteira' },
  { value: 'document', label: 'Documento' },
  { value: 'system', label: 'Sistema' }
]

export const notificationCategoryOptions: OptionType[] = [
  { value: 'driver', label: 'Motorista' },
  { value: 'passenger', label: 'Passageiro' },
  { value: 'admin', label: 'Administrador' },
  { value: 'all', label: 'Todos' }
]

export const documentTypeOptions: OptionType[] = [
  { value: 'driver_license', label: 'Carta de condução' },
  { value: 'id_front', label: 'BI frente' },
  { value: 'id_back', label: 'BI Verso' },
  { value: 'vehicle_ownership', label: 'Titulo de propriedade' },
  { value: 'vehicle_booklet', label: 'Livrete' },
  /*
   * Insurance entered the lib's `DocumentType` in 2.12.0 and is a Moto Táxi
   * requirement. Without this line the screen showed a raw `insurance` in the
   * type column, in the decision sheet's title and in the toast — found by the
   * independent review of phase 4.
   */
  { value: 'insurance', label: 'Seguro' },
  { value: 'other', label: 'Offline' }
]

export const documentStatusOptions: OptionType[] = [
  { value: 'pending', label: 'Pendente' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'rejected', label: 'Rejeitado' }
]

// Tipo de veículo e tipo de corrida vêm da lib: valores e etiquetas.
export const vehicleTypeOptions: OptionType[] = VEHICLE_TYPES.map(value => ({
  value,
  label: VEHICLE_TYPE_LABELS[value]
}))

export const vehicleStatusOptions: OptionType[] = [
  { value: 'under_analysis', label: 'Em análise' },
  { value: 'validated', label: 'Validado' },
  { value: 'rejected', label: 'Rejeitado' }
]

export const isOnlineOptions: OptionType[] = [
  { value: 'true', label: 'Online' },
  { value: 'false', label: 'Offline' }
]

export const rowPerPageOptions: OptionType[] = [
  { value: '8', label: '8' },
  { value: '16', label: '16' },
  { value: '32', label: '32' },
  { value: '64', label: '64' },
  { value: '128', label: '128' },
  { value: '256', label: '256' },
  { value: '512', label: '512' }
  // { value: '-1', label: 'Todos' }
]

export const numberOptions: OptionType[] = [
  { value: '1', label: '1º' },
  { value: '2', label: '2º' },
  { value: '3', label: '3º' },
  { value: '4', label: '4º' },
  { value: '5', label: '5º' },
  { value: '6', label: '6º' },
  { value: '7', label: '7º' },
  { value: '8', label: '8º' },
  { value: '9', label: '9º' },
  { value: '10', label: '10º' }
]
export const yearOptions: OptionType[] = [
  { value: '2024', label: '2024' },
  { value: '2025', label: '2025' },
  { value: '2026', label: '2026' }
]
// Definir opções de meses
export const monthOptions = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' }
]

export const weekdayOptions: OptionType[] = [
  { value: 'monday', label: 'Segunda-feira' },
  { value: 'tuesday', label: 'Terça-feira' },
  { value: 'wednesday', label: 'Quarta-feira' },
  { value: 'thursday', label: 'Quinta-feira' },
  { value: 'friday', label: 'Sexta-feira' },
  { value: 'saturday', label: 'Sabado' },
  { value: 'sunday', label: 'Domingo' }
]

export const rideStatusOptions: OptionType[] = [
  { value: 'idle', label: 'Procurando Motorista' },
  { value: 'pending', label: 'Pendente' },
  { value: 'driver_on_the_way', label: 'Motorista a Caminho' },
  { value: 'arrived_pickup', label: 'Chegou no Pick-up' },
  { value: 'picked_up', label: 'Pegou o Passageiro' },
  { value: 'arrived_dropoff', label: 'Chegou no Drop-off' },
  { value: 'completed', label: 'Completo' },
  { value: 'canceled', label: 'Cancelado' }
]
export const rideTypeOptions: OptionType[] = RIDE_TYPES.map(value => ({
  value,
  label: RIDE_TYPE_LABELS[value]
}))

export const ApplicationStatusOptions: OptionType[] = [
  { value: 'pending', label: 'Pendente' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'rejected', label: 'Rejeitado' }
]
