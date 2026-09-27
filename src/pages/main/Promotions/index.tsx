import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Tag, Eye, Edit2, Power } from 'lucide-react'
import { Spinner } from 'phosphor-react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { routsNameMain } from '@/constants/routsName'
import { PromotionEntity } from '@/core/entities/Promotion'
import { usePromotionsViewModel } from '@/viewModels/PromotionViewModel'
import { showToast } from '@/utils/toasts'

type StatusFilter = 'all' | 'active' | 'inactive' | 'expired'
type TypeFilter = 'all' | 'percentage' | 'fixed' | 'free_ride'

function getStatusLabel(p: PromotionEntity): {
  label: string
  className: string
} {
  const now = Date.now()
  if (now > p.valid_until.getTime()) {
    return {
      label: 'Expirada',
      className: 'bg-gray-200 text-gray-700'
    }
  }
  if (now < p.valid_from.getTime()) {
    return {
      label: 'Agendada',
      className: 'bg-blue-100 text-blue-700'
    }
  }
  if (!p.active) {
    return {
      label: 'Inativa',
      className: 'bg-amber-100 text-amber-700'
    }
  }
  return {
    label: 'Ativa',
    className: 'bg-green-100 text-green-700'
  }
}

export function PromotionsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const { promotions, loading, toggleActive } = usePromotionsViewModel(
    100,
    0,
    undefined,
    typeFilter !== 'all' ? { type: typeFilter as any } : undefined
  )

  const filtered = useMemo(() => {
    const now = Date.now()
    return promotions.filter(p => {
      if (statusFilter === 'active') {
        if (!p.active) return false
        if (now > p.valid_until.getTime()) return false
        if (now < p.valid_from.getTime()) return false
      }
      if (statusFilter === 'inactive') {
        if (p.active && now <= p.valid_until.getTime()) return false
      }
      if (statusFilter === 'expired') {
        if (now <= p.valid_until.getTime()) return false
      }
      if (searchTerm.trim()) {
        const t = searchTerm.trim().toUpperCase()
        if (!p.code.includes(t)) return false
      }
      return true
    })
  }, [promotions, statusFilter, searchTerm])

  const items = [
    { label: 'Painel', to: routsNameMain.home },
    { label: 'Promoções' }
  ]

  const handleToggle = async (p: PromotionEntity) => {
    try {
      await toggleActive.mutateAsync({ code: p.code, active: !p.active })
      showToast(
        'success',
        p.active ? 'Promoção desativada' : 'Promoção ativada'
      )
    } catch (err: any) {
      showToast('error', err.message ?? 'Erro ao alternar status')
    }
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <Breadcrumbs items={items} />

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Promoções
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Códigos promocionais e referências
          </p>
        </div>
        <Link
          to={routsNameMain.promotions.create}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm"
        >
          <Plus size={20} /> Nova Promoção
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
        <input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar por código…"
          className="flex-1 min-w-[180px] bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as StatusFilter)}
          className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-white outline-none"
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativas</option>
          <option value="inactive">Inativas</option>
          <option value="expired">Expiradas</option>
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as TypeFilter)}
          className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-white outline-none"
        >
          <option value="all">Todos os tipos</option>
          <option value="percentage">Percentagem</option>
          <option value="fixed">Valor fixo</option>
          <option value="free_ride">Ride grátis</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size={48} className="animate-spin text-primary-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <Tag className="mx-auto text-gray-400" size={32} />
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Nenhuma promoção encontrada.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr className="text-left text-gray-600 dark:text-gray-300">
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Usos</th>
                <th className="px-4 py-3">Validade</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map(p => {
                const status = getStatusLabel(p)
                const usage = `${p.used_count_approx}${
                  p.usage_limit_total !== undefined
                    ? ` / ${p.usage_limit_total}`
                    : ''
                }`
                const valueStr =
                  p.type === 'percentage'
                    ? `${p.value}%`
                    : p.type === 'free_ride'
                      ? '100%'
                      : `${p.value} AOA`
                return (
                  <tr
                    key={p.code}
                    className="text-gray-800 dark:text-gray-200"
                  >
                    <td className="px-4 py-3 font-mono font-semibold">
                      {p.code}
                    </td>
                    <td className="px-4 py-3 capitalize">{p.type}</td>
                    <td className="px-4 py-3">{valueStr}</td>
                    <td className="px-4 py-3">{usage}</td>
                    <td className="px-4 py-3 text-xs">
                      {p.valid_from.toLocaleDateString('pt-PT')} →{' '}
                      {p.valid_until.toLocaleDateString('pt-PT')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          to={`${routsNameMain.promotions.viewStr}${p.code}`}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="Ver detalhe"
                        >
                          <Eye size={16} />
                        </Link>
                        <Link
                          to={`${routsNameMain.promotions.editStr}${p.code}`}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </Link>
                        <button
                          onClick={() => handleToggle(p)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title={p.active ? 'Desativar' : 'Ativar'}
                        >
                          <Power
                            size={16}
                            className={
                              p.active ? 'text-green-600' : 'text-gray-400'
                            }
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
