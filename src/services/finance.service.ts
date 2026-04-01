import type {
  FinancialLedgerEntry,
  FinancialOverview,
  FinanceFilters
} from '@/interfaces/IFinance'
import { FirebaseRideDAO } from '@/modules/Api/firebase/ride.dao'
import { FirebaseWalletTopupRequestDAO } from '@/modules/Api/firebase/walletTopupRequest.dao'

const rideDao = new FirebaseRideDAO()
const topupDao = new FirebaseWalletTopupRequestDAO()

export class FinanceService {
  /**
   * Obtém o extrato financeiro unificado (Corridas + Topups)
   */
  async getLedger(filters: FinanceFilters): Promise<{
    ledger: FinancialLedgerEntry[]
    overview: FinancialOverview
  }> {
    // 1. Buscar Corridas (Rides) via DAO
    const ridesRes = await rideDao.getAll(5000, 0)
    let rides = ridesRes.data

    // 2. Buscar Carregamentos de Carteira (Topups) via DAO
    const topupsRes = await topupDao.getAll(5000, 0)
    let topups = topupsRes.data

    // Pures JS Dates for safe comparisons
    const parseDateInput = (val: string | null | undefined, isEnd = false) => {
      if (!val) return null
      return new Date(`${val}T${isEnd ? '23:59:59' : '00:00:00'}`)
    }
    const filterStart = parseDateInput(filters.startDate)
    const filterEnd = parseDateInput(filters.endDate, true)

    const extractJSDate = (val: any) => {
      if (!val) return new Date(0)
      if (typeof val?.toDate === 'function') return val.toDate()
      return new Date(val)
    }

    // Filtrar localmente usando instâncias verdadeiras de Date
    rides = rides.filter(ride => {
      if (!filterStart || !filterEnd) return true
      const rideDate = extractJSDate(ride.created_at)
      return rideDate >= filterStart && rideDate <= filterEnd
    })

    topups = topups.filter(topup => {
      if (!filterStart || !filterEnd) return true
      const topupDate = extractJSDate(topup.created_at)
      return topupDate >= filterStart && topupDate <= filterEnd
    })

    const ledger: FinancialLedgerEntry[] = []
    const overview: FinancialOverview = {
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
    }

    // --- Processar Corridas ---
    for (const ride of rides) {
      if (
        filters.status &&
        filters.status !== 'all' &&
        ride.status !== filters.status
      )
        continue
      if (
        filters.source_type &&
        filters.source_type !== 'all' &&
        filters.source_type !== 'ride'
      )
        continue
      if (
        filters.accounting_category &&
        filters.accounting_category !== 'all' &&
        filters.accounting_category !== 'Receita Operacional'
      )
        continue
      if (filters.driver_id && ride.driver?.id !== filters.driver_id) continue
      if (filters.customer_id && ride.user?.id !== filters.customer_id) continue

      const paymentData =
        (ride as any).payment_method ||
        (ride as any).details?.payment_method ||
        (ride.fare as any)?.payment_method ||
        'cash'
      if (
        filters.payment_method &&
        filters.payment_method !== 'all' &&
        paymentData !== filters.payment_method
      )
        continue

      const fare = ride.fare || {}
      const gross = Number(fare.total || 0)
      const company = Number(fare.payouts?.company_earnings || 0)
      const driverEarn = Number(fare.payouts?.driver_earnings || 0)
      const pension = Number(fare.payouts?.pension_fund || 0)
      const disc = Number((fare.breakdown as any)?.discount || 0)

      // Somar aos Totais APENAS SE COMPLETADA (Para fins contabilísticos de faturação)
      if (ride.status === 'completed') {
        overview.total_gross_volume += gross
        overview.total_company_revenue += company
        overview.total_driver_payouts += driverEarn
        overview.total_pension_fund += pension
        overview.rides_completed_count += 1
      }

      // Adicionar ao Ledger
      ledger.push({
        id: ride.id || '',
        date: extractJSDate(ride.created_at), // pure Date
        direction: 'in', // O valor bruto passa pela plataforma (entrou como Venda)
        accounting_category: 'Receita Operacional',
        source_type: 'ride',
        origin: 'Corridas',
        reference: ride.id ? ride.id.slice(-6).toUpperCase() : 'N/A',
        description: `Corrida ${ride.type || 'N/A'} - Cliente: ${ride.user?.name || 'N/A'}`,
        notes: '',
        gross_value: gross,
        net_value: company, // Na perspetiva da empresa, o líquido retido é o company
        company_value: company,
        driver_value: driverEarn,
        pension_fund: pension,
        discount_value: disc,
        status: ride.status || 'unknown',
        method: paymentData,
        driver_id: ride.driver?.id || '',
        driver_name: ride.driver?.name || 'N/A',
        customer_id: ride.user?.id || '',
        customer_name: ride.user?.name || 'N/A',
        reviewed_by: 'N/A' // Corridas não têm revisão manual
      })
    }

    // --- Processar Topups ---
    for (const topup of topups) {
      if (
        filters.status &&
        filters.status !== 'all' &&
        topup.status !== filters.status
      )
        continue
      if (
        filters.source_type &&
        filters.source_type !== 'all' &&
        filters.source_type !== 'wallet_topup'
      )
        continue
      if (
        filters.accounting_category &&
        filters.accounting_category !== 'all' &&
        filters.accounting_category !== 'Aporte de Carteira'
      )
        continue

      const authorId = topup.wallet_id || (topup as any).author?.id || ''
      if (filters.driver_id && authorId !== filters.driver_id) continue
      if (filters.admin_id && topup.reviewed_by !== filters.admin_id) continue

      const amount = Number(topup.amount || 0)

      if (topup.status === 'approved') {
        overview.total_topups_approved += amount
        overview.topups_approved_count += 1
      }

      const driverNameStr =
        (topup as any).author?.name || topup.wallet_id || 'N/A'
      const reviewNameStr =
        topup.reviewed_by || (topup as any).reviewer?.name || 'N/A'
      const payMethodStr =
        topup.method || (topup as any).payment_method?.type || 'cash'

      ledger.push({
        id: topup.id || '',
        date: extractJSDate(topup.created_at),
        direction: 'in',
        accounting_category: 'Aporte de Carteira',
        source_type: 'wallet_topup',
        origin: 'Carregamento',
        reference: topup.id ? topup.id.slice(-6).toUpperCase() : 'N/A',
        description: `Topup de ${driverNameStr} (${payMethodStr})`,
        notes: topup.rejected_reason || '',
        gross_value: amount,
        net_value: amount,
        company_value: amount,
        driver_value: 0,
        pension_fund: 0,
        discount_value: 0,
        status: topup.status || 'unknown',
        method: payMethodStr,
        driver_id: authorId,
        driver_name: driverNameStr,
        customer_id: '',
        customer_name: 'N/A',
        reviewed_by: reviewNameStr
      })
    }

    // Ordenar ledger de forma decrescente (mais recente primeiro)
    ledger.sort((a, b) => {
      // as datas podem ser Timestamp do firestore, entao pegar seconds ou converter
      const timeA = a.date?.seconds
        ? a.date.seconds
        : new Date(a.date).getTime() / 1000
      const timeB = b.date?.seconds
        ? b.date.seconds
        : new Date(b.date).getTime() / 1000
      return timeB - timeA
    })

    // Calcular KPI global
    overview.total_entries =
      overview.total_gross_volume + overview.total_topups_approved
    overview.net_balance =
      overview.total_company_revenue + overview.total_topups_approved

    // Filtro de termo de busca livre (Memória)
    let finalLedger = ledger
    if (filters.searchTerm) {
      const lower = filters.searchTerm.toLowerCase()
      finalLedger = ledger.filter(
        item =>
          item.driver_name?.toLowerCase().includes(lower) ||
          item.customer_name?.toLowerCase().includes(lower) ||
          item.description.toLowerCase().includes(lower) ||
          item.reference.toLowerCase().includes(lower) ||
          item.id.toLowerCase().includes(lower)
      )
    }

    return { ledger: finalLedger, overview }
  }
}

export const financeService = new FinanceService()
