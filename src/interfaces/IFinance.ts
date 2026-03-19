// src/interfaces/IFinance.ts
export type LedgerEntryType = 'ride' | 'wallet_topup'
export type LedgerDirection = 'in' | 'out'

export interface FinancialLedgerEntry {
  id: string
  date: any // Pure JS Date or equivalent
  direction: 'in' | 'out' // Explícito: entrada ou saída de caixa platforma
  accounting_category: string // e.g: 'Receita Operacional', 'Aporte de Carteira', 'Ajuste', etc.
  source_type: LedgerEntryType // 'ride' | 'wallet_topup'
  origin: string // Descrição mais amigável da origem
  reference: string
  description: string
  notes?: string // observações internas

  gross_value: number // Transacionado
  net_value: number // Líquido plataforma (após repasses do bruto)
  company_value: number // Receita empresa confirmada
  driver_value: number // Obrigação estafeta
  pension_fund: number // Retenção fundo
  discount_value: number // Promoções / descontos retidos

  status: string
  method: string

  driver_id?: string
  driver_name?: string
  customer_id?: string
  customer_name?: string
  reviewed_by?: string
}

export interface FinancialOverview {
  total_gross_volume: number // Soma de fare.total (Corridas)
  total_company_revenue: number // Soma de company_earnings (Corridas)
  total_driver_payouts: number // Soma de driver_earnings (Corridas)
  total_pension_fund: number // Soma de pension_fund (Corridas)
  total_topups_approved: number // Soma do valor dos Topups Aprovados
  total_entries: number // Fluxo de Entrada Global
  total_exits: number // Fluxo de Saída Global (reservado)
  net_balance: number // Saldo Líquido do período (Company Revenue + Topups Aprovados)
  rides_completed_count: number
  topups_approved_count: number
}

export interface FinanceFilters {
  startDate: string
  endDate: string
  status?: string // 'all', 'completed', 'canceled', etc
  source_type?: string // 'all', 'ride', 'wallet_topup'
  accounting_category?: string // 'all' etc
  driver_id?: string
  customer_id?: string
  admin_id?: string
  payment_method?: string // 'cash', 'credit_card', 'wallet', 'multicaixa'
  searchTerm?: string // free text
}
