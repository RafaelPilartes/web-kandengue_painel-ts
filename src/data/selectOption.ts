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
export const userStatusOptions: OptionType[] = [
  { value: 'inactive', label: 'Inativo' },
  { value: 'active', label: 'Ativo' },
  { value: 'pending', label: 'Pendente' },
  { value: 'banned', label: 'Banido' }
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
  { value: 'pending', label: 'Pendente' },
  { value: 'accepting_pending', label: 'Aceitando/Pendente' },
  { value: 'driver_on_the_way', label: 'Motorista em Caminho' },
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
  { value: 'superadmin', label: 'Super Administrador' },
  { value: 'manager', label: 'Gerente' },
  { value: 'finance', label: 'Financeiro' },
  { value: 'content', label: 'Conteúdo' },
  { value: 'support', label: 'Suporte' }
]

export const adminRolePermissionsMap: Record<string, OptionType[]> = {
  // Acesso total
  superadmin: [{ value: 'manage_all', label: 'Gerenciar Tudo' }],

  // Gerência com acesso amplo e variado
  manager: [
    // Gestão de usuários e permissões
    { value: 'manage_users', label: 'Gerenciar Usuários' },
    {
      value: 'assign_roles_permissions',
      label: 'Atribuir Funções e Permissões'
    },

    // Gestão de dados e relatórios
    { value: 'export_data', label: 'Exportar Dados' },
    { value: 'generate_reports', label: 'Gerar Relatórios' },
    {
      value: 'generate_financial_reports',
      label: 'Gerar Relatórios Financeiros'
    },
    { value: 'view_statistics', label: 'Visualizar Estatísticas' },
    {
      value: 'view_performance_dashboard',
      label: 'Ver Painel de Desempenho'
    },

    // Sistema e logs
    { value: 'audit_logs', label: 'Ver Logs' },
    { value: 'system_settings', label: 'Configurações do Sistema' },

    // Suporte
    { value: 'view_support_tickets', label: 'Visualizar Chamados' },
    { value: 'respond_support_tickets', label: 'Responder Chamados' },
    { value: 'send_notifications', label: 'Enviar Notificações' },
    { value: 'manage_faq', label: 'Gerenciar FAQ' },

    // Pacientes
    { value: 'manage_patient', label: 'Gerenciar Paciente' },
    {
      value: 'assign_technician_to_patient',
      label: 'Atribuir Tecnico ao Paciente'
    },

    // Técnicos
    { value: 'manage_technician', label: 'Gerenciar Tecnico' },
    {
      value: 'view_technician_schedule',
      label: 'Ver Agenda do Tecnico'
    },

    // 🏥 Parceiros
    { value: 'manage_partners', label: 'Gerenciar Parceiros' },
    { value: 'view_partner_reports', label: 'Ver Relatórios de Parceiros' },
    // 🧾 Serviços
    { value: 'manage_services', label: 'Gerenciar Serviços' },
    {
      value: 'manage_service_categories',
      label: 'Gerenciar categorias de serviços'
    },
    { value: 'manage_service_prices', label: 'Gerenciar Preços de Serviços' },
    // 📋 Solicitações
    { value: 'view_service_requests', label: 'Ver Solicitações de Serviço' },
    {
      value: 'assign_service_requests',
      label: 'Assign Service Requests'
    },
    // 💊 Medicamentos e Lembretes
    { value: 'manage_medications', label: 'Gerenciar Medicamentos' },
    { value: 'manage_reminders', label: 'Gerenciar Lembretes' },

    // Atendimentos
    { value: 'manage_appointment', label: 'Gerenciar Consultas' },
    {
      value: 'assign_technician_to_appointment',
      label: 'Atribuir Tecnico ao Atendimento'
    },

    // 💼 Financeiro
    { value: 'manage_billing', label: 'Gerenciar Cobranças' },
    { label: 'Ver Pagamentos', value: 'view_payments' },
    { label: 'Gerenciar Assinaturas', value: 'manage_subscriptions' },
    { label: 'Gerenciar Pagamentos', value: 'manage_payouts' },
    { label: 'Ver Relatórios Financeiros', value: 'view_finance_reports' },
    { label: 'Gerenciar Promoções', value: 'manage_promotions' },
    {
      value: 'manage_partner_services',
      label: 'Gerenciar Serviços de Parceiros'
    },
    { value: 'manage_products', label: 'Gerenciar Produtos' },
    // 🛒 Carrinho
    { value: 'view_carts', label: 'Ver Carrinhos' },
    { value: 'manage_cart_items', label: 'Gerenciar Itens do Carrinho' }
  ],

  // Financeiro
  finance: [
    { value: 'manage_payments', label: 'Gerenciar Pagamentos' },
    { value: 'manage_subscriptions', label: 'Gerenciar assinaturas' },
    { value: 'process_payout', label: 'Processar Pagamento' },
    {
      value: 'generate_financial_reports',
      label: 'Gerar Relatórios Financeiros'
    },
    { value: 'export_data', label: 'Exportar Dados' }
  ],

  // Conteúdo e desempenho
  content: [
    { value: 'generate_reports', label: 'Gerar Relatórios' },
    {
      value: 'view_performance_dashboard',
      label: 'Ver Painel de Desempenho'
    },
    { value: 'view_statistics', label: 'Visualizar Estatísticas' },
    { value: 'manage_faq', label: 'Gerenciar FAQ' },
    { value: 'send_notifications', label: 'Enviar Notificações' }
  ],

  // Suporte
  support: [
    { value: 'view_patients', label: 'Visualizar Pacientes' },
    { value: 'view_appointments', label: 'Visualizar Atendimentos' },
    { value: 'view_support_tickets', label: 'Visualizar Chamados' },
    { value: 'respond_support_tickets', label: 'Responder Chamados' },
    { value: 'send_notifications', label: 'Enviar Notificações' }
  ]
}
