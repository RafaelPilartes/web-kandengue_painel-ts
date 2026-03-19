import { useMemo, useState } from 'react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { SelectSearchableCustom } from '@/components/selects/SelectSearchableCustom'
import { DatePickerCustom } from '@/components/selects/DatePickerCustom'
import { formatMoney } from '@/utils/number'
import { useFinanceViewModel } from '@/viewModels/FinanceViewModel'
import type { FinanceFilters, FinancialLedgerEntry } from '@/interfaces/IFinance'
import { formatDateTimeFromFirestore } from '@/utils/date'
import { 
  FileText, Download, Wallet, CreditCard, 
  TrendingUp, Activity, CheckCircle, Car, ArrowRightLeft 
} from 'lucide-react'
import { Spinner } from 'phosphor-react'
import { rideStatusOptions, paymentMethodOptions } from '@/data/selectOption'

// helper local
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export function FinancePage() {
  const dateStartMonth = () => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().slice(0, 10)
  }
  const dateEndMonth = () => new Date().toISOString().slice(0, 10)

  const [filters, setFilters] = useState<FinanceFilters>({
    startDate: dateStartMonth(),
    endDate: dateEndMonth(),
    status: 'all',
    source_type: 'all',
    accounting_category: 'all',
    payment_method: 'all',
    searchTerm: ''
  })

  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'rides' | 'topups' | 'consolidation'>('overview')

  const { ledger, overview, isLoading, exportData } = useFinanceViewModel(filters)

  // Local Pagination for large lists
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  const handleFilterChange = (key: keyof FinanceFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // reset pagination
  }

  // Abas
  const tabs = [
    { id: 'overview', name: 'Visão Geral', icon: Activity },
    { id: 'ledger', name: 'Extrato Geral', icon: FileText },
    { id: 'rides', name: 'Corridas', icon: Car },
    { id: 'topups', name: 'Topups', icon: Wallet },
    { id: 'consolidation', name: 'Consolidação', icon: TrendingUp }
  ] as const

  // Render logic for Tables
  const renderTable = (entries: FinancialLedgerEntry[], sourceFilter?: 'ride' | 'wallet_topup') => {
    const filtered = sourceFilter ? entries.filter(e => e.source_type === sourceFilter) : entries
    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    const totalPages = Math.ceil(filtered.length / itemsPerPage)

    // Totais da tabela (baseado no filtro total da aba)
    const tableTotals = filtered.reduce((acc, curr) => ({
      gross: acc.gross + curr.gross_value,
      net: acc.net + curr.net_value,
      company: acc.company + curr.company_value,
      driver: acc.driver + curr.driver_value,
      pension: acc.pension + curr.pension_fund
    }), { gross: 0, net: 0, company: 0, driver: 0, pension: 0 })

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-500 font-semibold border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Dir.</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Ref.</th>
                <th className="px-4 py-3">Descrição / Envolvido</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3 text-right text-gray-900 dark:text-gray-100 italic">Bruto</th>
                <th className="px-4 py-3 text-right text-blue-600">Empresa</th>
                <th className="px-4 py-3 text-right text-emerald-600">Estafeta</th>
                <th className="px-4 py-3 text-right text-purple-600">Fundo</th>
                <th className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white underline">Líquido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paginated.length > 0 ? (
                paginated.map(item => {
                  const dt = formatDateTimeFromFirestore(item.date)
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {dt.date} <br/> {dt.time}
                      </td>
                      <td className="px-4 py-3">
                         <span className={item.direction === 'in' ? 'text-green-500' : 'text-red-500'}>
                           {item.direction === 'in' ? <Activity size={12}/> : <ArrowRightLeft size={12}/>}
                         </span>
                      </td>
                      <td className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">{item.accounting_category}</td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {item.reference}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-gray-900 dark:text-white font-medium truncate max-w-xs">{item.description}</span>
                          <div className="flex gap-2 text-[10px] text-gray-500 mt-0.5">
                             {item.driver_name && <span>M: {item.driver_name}</span>}
                             {item.customer_name && item.customer_name !== 'N/A' && <span>C: {item.customer_name}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                          item.status === 'completed' || item.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 
                          item.status === 'canceled' || item.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : 
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{item.method}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-400 italic">{formatMoney(item.gross_value)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-blue-600 dark:text-blue-400">{formatMoney(item.company_value)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">{formatMoney(item.driver_value)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-purple-600 dark:text-purple-400">{formatMoney(item.pension_fund)}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">{formatMoney(item.net_value)}</td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={14} className="px-4 py-8 text-center text-gray-500">
                    Nenhum registo financeiro encontrado no período.
                  </td>
                </tr>
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot className="bg-gray-50 dark:bg-gray-900/80 font-bold text-sm border-t-2 border-gray-200 dark:border-gray-700">
                <tr>
                  <td colSpan={7} className="px-4 py-3 text-right uppercase tracking-wider text-gray-500 text-xs">Totais da Seleção (AOA):</td>
                  <td className="px-4 py-3 text-right text-gray-400 italic">{formatMoney(tableTotals.gross)}</td>
                  <td className="px-4 py-3 text-right text-blue-600">{formatMoney(tableTotals.company)}</td>
                  <td className="px-4 py-3 text-right text-emerald-600">{formatMoney(tableTotals.driver)}</td>
                  <td className="px-4 py-3 text-right text-purple-600">{formatMoney(tableTotals.pension)}</td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white underline">{formatMoney(tableTotals.net)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        
        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-sm">
            <span className="text-gray-500">Mostrando {paginated.length} de {filtered.length} registos</span>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded disabled:opacity-50">Ant.</button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded disabled:opacity-50">Próx.</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Consolidation Logic
  const consolidation = useMemo(() => {
    const byMethod: Record<string, { total: number, company: number, count: number }> = {}
    const bySource: Record<string, { total: number, company: number, count: number }> = {}
    const byCategory: Record<string, { total: number, net: number, count: number }> = {}

    ledger.forEach(r => {
      // Ignorar topups e rides rejeitadas para fins de receita líquida
      if (r.source_type === 'wallet_topup' && r.status !== 'approved') return
      if (r.source_type === 'ride' && r.status !== 'completed') return
      
      const m = r.method || 'unknown'
      if (!byMethod[m]) byMethod[m] = { total: 0, company: 0, count: 0 }
      byMethod[m].total += r.gross_value
      byMethod[m].company += r.company_value
      byMethod[m].count += 1

      const s = r.source_type
      if (!bySource[s]) bySource[s] = { total: 0, company: 0, count: 0 }
      bySource[s].total += r.gross_value
      bySource[s].company += r.company_value
      bySource[s].count += 1

      const cat = r.accounting_category
      if (!byCategory[cat]) byCategory[cat] = { total: 0, net: 0, count: 0 }
      byCategory[cat].total += r.gross_value
      byCategory[cat].net += r.net_value
      byCategory[cat].count += 1
    })
    return { byMethod, bySource, byCategory }
  }, [ledger])

  return (
    <div className="w-full h-full flex flex-col gap-6 pb-6">
      <Breadcrumbs items={[
        { label: 'Início', to: '/' },
        { label: 'Relatórios' },
        { label: 'Financeiro e Contabilidade' }
      ]} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Centro Financeiro</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Consolidação e exportação oficial</p>
        </div>
        <div className="flex gap-2">
          <button 
            disabled={isLoading || ledger.length === 0}
            onClick={() => exportData({ ledger, overview, filters }, 'csv')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-sm disabled:opacity-50"
          >
            <Download size={16} /> Exportar CSV
          </button>
          <button 
            disabled={isLoading || ledger.length === 0}
            onClick={() => exportData({ ledger, overview, filters }, 'xlsx')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 font-medium rounded-lg transition-colors text-sm shadow-sm opacity-90 hover:opacity-100 disabled:opacity-50"
          >
            <Download size={16} /> Exportar XLSX
          </button>
        </div>
      </div>

      {/* FILTROS MASTER */}
      <div className="p-4 bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <DatePickerCustom htmlFor="date-start" label="Data Início" selectedValue={filters.startDate} onChange={v => handleFilterChange('startDate', v as string)} />
        <DatePickerCustom htmlFor="date-end" label="Data Fim" selectedValue={filters.endDate} onChange={v => handleFilterChange('endDate', v as string)} />
        <SelectSearchableCustom name="status" label="Status" options={[{value:'all', label:'Todos Status'}, ...rideStatusOptions]} onOptionChange={v => handleFilterChange('status', v as string)} />
        <SelectSearchableCustom name="source" label="Origem" options={[{value:'all', label:'Todas as Origens'}, {value:'ride', label:'Corridas'}, {value:'wallet_topup', label:'Carregamentos'}]} onOptionChange={v => handleFilterChange('source_type', v as string)} />
        <SelectSearchableCustom name="method" label="Método Pagt" options={[{value:'all', label:'Todos os Métodos'}, ...paymentMethodOptions]} onOptionChange={v => handleFilterChange('payment_method', v as string)} />
        <SelectSearchableCustom name="category" label="Categoria" options={[{value:'all', label:'Todas Categorias'}, {value:'Receita Operacional', label:'Operacional'}, {value:'Aporte de Carteira', label:'Aportes'}]} onOptionChange={v => handleFilterChange('accounting_category', v as string)} />
        
        <div className="flex flex-col w-full lg:col-span-2">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Busca Rápida (Referência, Nome...)</label>
          <input 
            type="text" 
            placeholder="Ex: RIDE-123, João Silva..."
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filters.searchTerm}
            onChange={e => handleFilterChange('searchTerm', e.target.value)}
          />
        </div>
      </div>

      {/* NAVEGAÇÃO / TABS */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setCurrentPage(1); }}
            className={classNames(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              activeTab === tab.id 
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 border border-primary-100 dark:border-primary-800/50' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            )}
          >
            <tab.icon size={16} /> {tab.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-20 flex-col gap-4 text-gray-400">
          <Spinner size={32} className="animate-spin text-primary-500" />
          <span>Consultando base descentralizada e cruzando ledgers...</span>
        </div>
      ) : (
        <>
          {/* TAB: VISÃO GERAL */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatBox label="Volume Bruto (Transacionado)" value={overview.total_gross_volume} icon={CreditCard} />
                <StatBox label="Receita Empresa (Corridas)" value={overview.total_company_revenue} icon={TrendingUp} color="blue" />
                <StatBox label="Topups Aprovados (Carteira)" value={overview.total_topups_approved} icon={Wallet} color="blue" />
                <StatBox label="Saldo Gerado (Empresa + Topups)" value={overview.net_balance} icon={CheckCircle} color="green" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatBox label="Corridas Concluídas" value={overview.rides_completed_count} raw />
                <StatBox label="Devido aos Estafetas" value={overview.total_driver_payouts} color="orange" />
                <StatBox label="Fundo de Pensão Acumulado" value={overview.total_pension_fund} color="purple" />
                <StatBox label="Total Ledgers (Extrato)" value={ledger.length} raw />
              </div>
            </div>
          )}

          {/* TAB: LEDGER GERAL */}
          {activeTab === 'ledger' && renderTable(ledger)}

          {/* TAB: CORRIDAS */}
          {activeTab === 'rides' && renderTable(ledger, 'ride')}

          {/* TAB: TOPUPS */}
          {activeTab === 'topups' && renderTable(ledger, 'wallet_topup')}

          {/* TAB: CONSOLIDAÇÃO */}
          {activeTab === 'consolidation' && (
            <div className="flex flex-col gap-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                    <ArrowRightLeft className="text-gray-400" /> Conciliação por Método de Pagamento
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(consolidation.byMethod).map(([method, data]) => (
                      <div key={method} className="flex flex-col border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0">
                        <div className="flex justify-between items-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                          <span className="uppercase">{method}</span>
                          <span className="text-gray-900 dark:text-white">AOA {formatMoney(data.total)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{data.count} Transações confirmadas</span>
                          <span>Receita real: <strong className="text-blue-500">AOA {formatMoney(data.company)}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                    <Activity className="text-gray-400" /> Conciliação por Categoria Contábil
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(consolidation.byCategory).map(([cat, data]) => (
                      <div key={cat} className="flex flex-col border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0">
                        <div className="flex justify-between items-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                          <span className="uppercase">{cat}</span>
                          <div className="flex flex-col items-end">
                            <span className="text-gray-400 text-[10px] italic">Movimentado: AOA {formatMoney(data.total)}</span>
                            <span className="text-green-600 font-bold underline">Líquido: AOA {formatMoney(data.net)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-center items-center text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center mb-4">
                  <FileText size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Relatório Fecho do Período</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 px-8 mb-6">
                  Para uma visão mais aprofundada agrupada por condutor e cliente, utilize o botão de exportação local XLSX. A consolidação é feita pela folha Excel com as colunas dedicadas.
                </p>
                <button 
                  onClick={() => exportData({ ledger, overview, filters, filename: "RELATORIO_FECHO_MENSAL" }, 'xlsx')}
                  className="px-6 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg text-sm font-semibold hover:bg-gray-800 dark:hover:bg-white transition-all shadow"
                >
                  Gerar Folha XLSX Consolidada
                </button>
              </div>
            </div>
          )}

        </>
      )}
    </div>
  )
}

interface StatBoxProps {
  label: string
  value: number | string
  icon?: React.ElementType
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'gray'
  raw?: boolean
}

function StatBox({ label, value, icon: Icon, color = 'gray', raw = false }: StatBoxProps) {
  const getColors = () => {
    switch(color) {
      case 'blue': return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
      case 'green': return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
      case 'orange': return 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
      case 'purple': return 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
      default: return 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 max-w-[75%]">{label}</h4>
        {Icon && (
          <div className={`p-2 rounded-xl ${getColors()}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className={`text-2xl font-black tracking-tight ${color === 'gray' ? 'text-gray-900 dark:text-white' : getColors().split(' ')[1]}`}>
        {raw ? value : `AOA ${formatMoney(Number(value))}`}
      </div>
    </div>
  )
}
