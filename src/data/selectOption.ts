import type { OptionType } from '../types/option'

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
  { value: 'other', label: 'Offline' }
]

export const documentStatusOptions: OptionType[] = [
  { value: 'pending', label: 'Pendente' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'rejected', label: 'Rejeitado' }
]

export const vehicleTypeOptions: OptionType[] = [
  { value: 'car', label: 'Carro' },
  { value: 'motorcycle', label: 'Motorizada' },
  { value: 'bicycle', label: 'Bicicleta' },
  { value: 'truck', label: 'Caminhão' },
  { value: 'scooter', label: 'Scooter' }
]

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
export const rideTypeOptions: OptionType[] = [
  { value: 'car', label: 'Carro' },
  { value: 'motorcycle', label: 'Moto' },
  { value: 'bicycle', label: 'Bicicleta' },
  { value: 'delivery', label: 'Entrega' }
]

// ==============================================
export const adminRoleOptions: OptionType[] = [
  { value: 'direcao_geral', label: 'Direcção Geral' },
  {
    value: 'operacoes_qualidade',
    label: 'Departamento de Operações e Qualidade'
  },
  {
    value: 'administracao_financas',
    label: 'Departamento de Administração e Finanças'
  },
  {
    value: 'tecnologia_inovacao',
    label: 'Departamento de Tecnologia e Inovação'
  },
  {
    value: 'seguranca_qualidade_operacional',
    label: 'Departamento de Segurança e Qualidade Operacional'
  },
  {
    value: 'negocios_imagem_institucional',
    label: 'Departamento de Negócios e Imagem Institucional'
  },
  {
    value: 'capital_humano',
    label: 'Departamento de Capital Humano'
  },
  {
    value: 'contabilidade_financas',
    label: 'Departamento de Contabilidade e Finanças'
  },
  {
    value: 'tecnologia_inovacao_tecnica',
    label: 'Departamento de Tecnologia e Inovação (Técnico)'
  }
]

// Permissões baseadas nos itens da Sidebar para referência
const sidebarPermissions: OptionType[] = [
  { value: 'view_dashboard', label: 'Ver Dashboard' },
  { value: 'manage_passengers', label: 'Gerenciar Passageiros' },
  { value: 'manage_drivers', label: 'Gerenciar Motoristas' },
  { value: 'manage_admins', label: 'Gerenciar Admins & Operadores' },
  { value: 'manage_applications', label: 'Gerenciar Candidaturas' },
  { value: 'view_rides', label: 'Ver Todas as Corridas' },
  { value: 'view_realtime_map', label: 'Monitoramento em Tempo Real' },
  { value: 'manage_wallet', label: 'Carteira & Transações' },
  { value: 'manage_topup_requests', label: 'Solicitação de Recarga' },
  { value: 'manage_missions', label: 'Gerenciar Missões' },
  { value: 'manage_notifications', label: 'Gerenciar Notificações' },
  { value: 'view_metrics', label: 'Ver Métricas' },
  { value: 'manage_settings', label: 'Configurações do Sistema' }
]

export const adminRolePermissionsMap: Record<string, OptionType[]> = {
  direcao_geral: [...sidebarPermissions], // Acesso total

  operacoes_qualidade: [
    { value: 'view_dashboard', label: 'Ver Dashboard' },
    { value: 'manage_drivers', label: 'Gerenciar Motoristas' },
    { value: 'manage_applications', label: 'Gerenciar Candidaturas' },
    { value: 'view_rides', label: 'Ver Todas as Corridas' },
    { value: 'view_realtime_map', label: 'Monitoramento em Tempo Real' },
    { value: 'manage_missions', label: 'Gerenciar Missões' },
    { value: 'view_metrics', label: 'Ver Métricas' }
  ],

  administracao_financas: [
    { value: 'view_dashboard', label: 'Ver Dashboard' },
    { value: 'manage_wallet', label: 'Carteira & Transações' },
    { value: 'manage_topup_requests', label: 'Solicitação de Recarga' },
    { value: 'manage_missions', label: 'Gerenciar Missões' },
    { value: 'view_metrics', label: 'Ver Métricas' },
    { value: 'manage_settings', label: 'Configurações do Sistema' }
  ],

  tecnologia_inovacao: [
    { value: 'view_dashboard', label: 'Ver Dashboard' },
    { value: 'manage_admins', label: 'Gerenciar Admins & Operadores' },
    { value: 'manage_notifications', label: 'Gerenciar Notificações' },
    { value: 'view_metrics', label: 'Ver Métricas' },
    { value: 'manage_settings', label: 'Configurações do Sistema' }
  ],

  seguranca_qualidade_operacional: [
    { value: 'view_dashboard', label: 'Ver Dashboard' },
    { value: 'manage_drivers', label: 'Gerenciar Motoristas' },
    { value: 'manage_applications', label: 'Gerenciar Candidaturas' },
    { value: 'view_rides', label: 'Ver Todas as Corridas' },
    { value: 'view_realtime_map', label: 'Monitoramento em Tempo Real' }
  ],

  negocios_imagem_institucional: [
    { value: 'view_dashboard', label: 'Ver Dashboard' },
    { value: 'manage_notifications', label: 'Gerenciar Notificações' },
    { value: 'view_metrics', label: 'Ver Métricas' },
    { value: 'manage_settings', label: 'Configurações do Sistema' }
  ],

  capital_humano: [
    { value: 'view_dashboard', label: 'Ver Dashboard' },
    { value: 'manage_admins', label: 'Gerenciar Admins & Operadores' }
  ],

  contabilidade_financas: [
    { value: 'view_dashboard', label: 'Ver Dashboard' },
    { value: 'manage_wallet', label: 'Carteira & Transações' },
    { value: 'manage_topup_requests', label: 'Solicitação de Recarga' },
    { value: 'view_metrics', label: 'Ver Métricas' }
  ],

  tecnologia_inovacao_tecnica: [
    { value: 'view_dashboard', label: 'Ver Dashboard' },
    { value: 'manage_notifications', label: 'Gerenciar Notificações' },
    { value: 'manage_settings', label: 'Configurações do Sistema' }
  ]
}

export const ApplicationStatusOptions: OptionType[] = [
  { value: 'pending', label: 'Pendente' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'rejected', label: 'Rejeitado' }
]
