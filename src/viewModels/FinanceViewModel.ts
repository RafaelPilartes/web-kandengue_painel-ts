import { useQuery } from '@tanstack/react-query'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { financeUseCase } from '@/domain/usecases/financeUseCase'
import type {
  FinanceFilters,
  FinancialLedgerEntry,
  FinancialOverview
} from '@/interfaces/IFinance'
import { formatDateTimeFromFirestore } from '@/utils/date'

interface ExportParams {
  ledger: FinancialLedgerEntry[]
  overview: FinancialOverview
  filters: FinanceFilters
  filename?: string
}

export function useFinanceViewModel(filters: FinanceFilters) {
  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ['finance_ledger', filters],
    queryFn: () => financeUseCase.executeGetLedger(filters),
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
    enabled: !!filters.startDate && !!filters.endDate // Somente buscar se as datas estiverem configuradas
  })

  // Exportação Premium com ExcelJS
  const exportData = async (params: ExportParams, format: 'csv' | 'xlsx') => {
    const {
      ledger,
      overview,
      filters,
      filename = 'RELATORIO_FINANCEIRO_KANDENGUE'
    } = params

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Kandengue Admin'
    workbook.lastModifiedBy = 'Kandengue Admin'
    workbook.created = new Date()

    // --- CORES PADRÃO KANDENGUE ---
    const BRAND_ORANGE = 'FFEA580C' // orange-600
    const BRAND_BLUE = 'FF2563EB' // blue-600
    const TEXT_LIGHT = 'FFFFFFFF'
    const ZEBRA_LIGHT = 'FFF9FAFB'

    // --- HELPER: ESTILIZAR TABELA ---
    const setupSheetHeader = (sheet: ExcelJS.Worksheet, columns: any[]) => {
      sheet.columns = columns
      const headerRow = sheet.getRow(1)
      headerRow.height = 30
      headerRow.font = { bold: true, color: { argb: TEXT_LIGHT }, size: 11 }
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: BRAND_ORANGE }
      }
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

      // Congelar primeira linha
      sheet.views = [{ state: 'frozen', ySplit: 1 }]
    }

    const applyZebraAndBorders = (sheet: ExcelJS.Worksheet) => {
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return

        // Zebra stripes
        if (rowNumber % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: ZEBRA_LIGHT }
          }
        }

        // Borders
        row.eachCell({ includeEmpty: true }, cell => {
          cell.border = {
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }
          }
          cell.alignment = { vertical: 'middle', horizontal: 'left' }
        })
      })
    }

    const autoSizeColumns = (sheet: ExcelJS.Worksheet) => {
      sheet.columns.forEach(column => {
        let maxColumnLength = 0
        column.eachCell?.({ includeEmpty: true }, cell => {
          const cellValue = cell.value ? cell.value.toString() : ''
          maxColumnLength = Math.max(maxColumnLength, cellValue.length)
        })
        column.width = maxColumnLength < 10 ? 10 : maxColumnLength + 2
      })
    }

    // --- 1. FOLHA: RESUMO EXECUTIVO ---
    const summarySheet = workbook.addWorksheet('Resumo Executivo')
    summarySheet.getColumn(1).width = 40
    summarySheet.getColumn(2).width = 30

    // Título do Report
    summarySheet.mergeCells('A1:B1')
    const titleCell = summarySheet.getCell('A1')
    titleCell.value = 'RELATÓRIO FINANCEIRO KANDENGUE'
    titleCell.font = { size: 16, bold: true, color: { argb: BRAND_ORANGE } }
    titleCell.alignment = { horizontal: 'center' }

    summarySheet.addRow([
      'Período',
      `${filters.startDate} a ${filters.endDate}`
    ])
    summarySheet.addRow(['Data de Geração', new Date().toLocaleString('pt-PT')])
    summarySheet.addRow([]) // Spacer

    summarySheet.addRow(['INDICADORES DE PERFORMANCE', 'VALORES (AOA)'])
    const subTitleRow = summarySheet.getRow(summarySheet.lastRow!.number)
    subTitleRow.font = { bold: true, color: { argb: TEXT_LIGHT } }
    subTitleRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: BRAND_BLUE }
    }

    const overviewMetrics = [
      ['Volume Bruto Transacionado', overview.total_gross_volume],
      ['Receita Empresa (Corridas)', overview.total_company_revenue],
      ['Total Topups Aprovados', overview.total_topups_approved],
      ['Obrigação Estafetas', overview.total_driver_payouts],
      ['Fundo de Pensão Acumulado', overview.total_pension_fund],
      ['---', '---'],
      ['QUANTIDADES', 'VOLUME'],
      ['Corridas Concluídas', overview.rides_completed_count],
      ['Topups Efetuados', overview.topups_approved_count]
    ]

    overviewMetrics.forEach(m => {
      const row = summarySheet.addRow(m)
      if (m[0] === 'QUANTIDADES') {
        row.font = { bold: true }
        row.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF3F4F6' }
        }
      }
      if (
        typeof m[1] === 'number' &&
        m[0] !== 'Corridas Concluídas' &&
        m[0] !== 'Topups Efetuados'
      ) {
        row.getCell(2).numFmt = '#,##0.00 "AOA"'
      }
    })

    // --- 2. FOLHA: EXTRATO GERAL ---
    const ledgerSheet = workbook.addWorksheet('Extrato Geral')
    const ledgerCols = [
      { header: 'Data', key: 'data' },
      { header: 'Hora', key: 'hora' },
      { header: 'Tipo', key: 'fonte' },
      { header: 'Referência', key: 'ref' },
      { header: 'Descrição', key: 'desc' },
      { header: 'Bruto', key: 'bruto' },
      { header: 'Empresa', key: 'empresa' },
      { header: 'Estafeta', key: 'driver' },
      { header: 'Líquido', key: 'liquido' },
      { header: 'Status', key: 'status' },
      { header: 'Motorista', key: 'driver_name' }
    ]
    setupSheetHeader(ledgerSheet, ledgerCols)

    ledger.forEach(entry => {
      const dt = formatDateTimeFromFirestore(entry.date)
      ledgerSheet.addRow({
        data: dt.date,
        hora: dt.time,
        fonte: entry.source_type === 'ride' ? 'Corrida' : 'Topup',
        ref: entry.reference,
        desc: entry.description,
        bruto: entry.gross_value,
        empresa: entry.company_value,
        driver: entry.driver_value,
        liquido: entry.net_value,
        status: entry.status,
        driver_name: entry.driver_name || 'N/A'
      })
    })

    // Formatar moedas
    const moneyCols = [6, 7, 8, 9]
    ledgerSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return
      moneyCols.forEach(col => (row.getCell(col).numFmt = '#,##0.00 "AOA"'))
    })

    applyZebraAndBorders(ledgerSheet)
    autoSizeColumns(ledgerSheet)

    // --- FINALIZAÇÃO E DOWNLOAD ---
    const safeFilename = `${filename}_${filters.startDate}_ate_${filters.endDate}`

    if (format === 'csv') {
      // CSV simplificado via ExcelJS
      const buffer = await workbook.csv.writeBuffer()
      const blob = new Blob([buffer], { type: 'text/csv;charset=utf-8' })
      saveAs(blob, `${safeFilename}.csv`)
    } else {
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      saveAs(blob, `${safeFilename}.xlsx`)
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
