// src/viewModels/FinanceViewModel.ts
import { useQuery } from '@tanstack/react-query'
import { financeService } from '@/services/finance.service'
import type { FinanceFilters, FinancialLedgerEntry, FinancialOverview } from '@/interfaces/IFinance'
import * as XLSX from 'xlsx'
import { formatDateTimeFromFirestore } from '@/utils/date'

interface ExportParams {
  ledger: FinancialLedgerEntry[]
  overview: FinancialOverview
  filters: FinanceFilters
  filename?: string
}

export function useFinanceViewModel(filters: FinanceFilters) {
  const {
    data,
    isLoading,
    isRefetching,
    error,
    refetch
  } = useQuery({
    queryKey: ['finance_ledger', filters],
    queryFn: () => financeService.getLedger(filters),
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
    enabled: !!filters.startDate && !!filters.endDate // Somente buscar se as datas estiverem configuradas
  })

  // Exportação CSV e XLSX centralizada na ViewModel
  const exportData = (
    params: ExportParams,
    format: 'csv' | 'xlsx'
  ) => {
    const { ledger, overview, filters, filename = 'RELATORIO_FINANCEIRO_KANDENGUE' } = params

    // 1. Mapeamento dos Dados no Ledger para um Array Simples para Colunas de Excel
    const mapEntry = (entry: FinancialLedgerEntry) => {
      const dateTime = formatDateTimeFromFirestore(entry.date)
      return {
        'ID Transação': entry.id,
        'Data': dateTime.date,
        'Hora': dateTime.time,
        'Direção': entry.direction === 'in' ? 'Entrada' : 'Saída',
        'Categoria Contábil': entry.accounting_category,
        'Fonte': entry.source_type === 'ride' ? 'Corrida' : 'Topup',
        'Referência': entry.reference,
        'Descrição': entry.description,
        'Bruto (AOA)': entry.gross_value,
        'Empresa (AOA)': entry.company_value,
        'Estafeta (AOA)': entry.driver_value,
        'Fundo Retenção (AOA)': entry.pension_fund,
        'Desconto (AOA)': entry.discount_value,
        'Líquido Plataforma (AOA)': entry.net_value,
        'Status': entry.status,
        'Método': entry.method,
        'Motorista': entry.driver_name || 'N/A',
        'Cliente': entry.customer_name || 'N/A',
        'Revidado Por': entry.reviewed_by || 'N/A',
        'Notas': entry.notes || ''
      }
    }

    const allData = ledger.map(mapEntry)
    const ridesData = ledger.filter(e => e.source_type === 'ride').map(mapEntry)
    const topupsData = ledger.filter(e => e.source_type === 'wallet_topup').map(mapEntry)

    // Folha de Resumo Geral
    const overviewData = [
      { 'Métrica': 'Período', 'Valor': `${filters.startDate} a ${filters.endDate}` },
      { 'Métrica': 'Volume Bruto Transacionado', 'Valor': overview.total_gross_volume },
      { 'Métrica': 'Receita Empresa (Corridas)', 'Valor': overview.total_company_revenue },
      { 'Métrica': 'Total Topups Aprovados', 'Valor': overview.total_topups_approved },
      { 'Métrica': 'Saldo Líquido Gerado', 'Valor': overview.net_balance },
      { 'Métrica': 'Obrigação Estafetas (Pendente Repasse)', 'Valor': overview.total_driver_payouts },
      { 'Métrica': 'Fundo de Pensão Acumulado', 'Valor': overview.total_pension_fund },
      { 'Métrica': 'Qtd Corridas Concluídas', 'Valor': overview.rides_completed_count },
      { 'Métrica': 'Qtd Topups Aprovados', 'Valor': overview.topups_approved_count },
      { 'Métrica': 'Data de Geração', 'Valor': new Date().toLocaleString('pt-PT') }
    ]

    const workbook = XLSX.utils.book_new()
    
    // Adicionar folhas
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(overviewData), 'Resumo Executivo')
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(allData), 'Extrato Geral')
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(ridesData), 'Apenas Corridas')
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(topupsData), 'Apenas Topups')

    const safeFilename = `${filename}_${filters.startDate}_ate_${filters.endDate}.${format}`

    if (format === 'csv') {
      XLSX.writeFile(workbook, safeFilename, { bookType: 'csv' })
    } else {
      XLSX.writeFile(workbook, safeFilename, { bookType: 'xlsx' })
    }

  }

  return {
    ledger: data?.ledger || [],
    overview: data?.overview || {
      total_gross_volume: 0,
      total_company_revenue: 0,
      total_driver_payouts: 0,
      total_pension_fund: 0,
      total_topups_approved: 0,
      total_entries: 0,
      total_exits: 0,
      net_balance: 0,
      rides_completed_count: 0,
      topups_approved_count: 0
    },
    isLoading: isLoading || isRefetching,
    error,
    refetch,
    exportData
  }
}
