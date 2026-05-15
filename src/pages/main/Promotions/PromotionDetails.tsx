import React, { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Edit2,
  Power,
  Tag,
  Users,
  TrendingUp
} from 'lucide-react'
import { Spinner } from 'phosphor-react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js'
import { ToastContainer } from 'react-toastify'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { routsNameMain } from '@/constants/routsName'
import { formatMoney } from '@/utils/number'
import { showToast } from '@/utils/toasts'
import {
  usePromotionDetailViewModel,
  usePromotionsViewModel
} from '@/viewModels/PromotionViewModel'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title
)

export function PromotionDetailsPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { promotion, usages, allowedUsers, isLoading } =
    usePromotionDetailViewModel(code)
  const { toggleActive } = usePromotionsViewModel()

  const usageBreakdown = useMemo(() => {
    const counts = { used: 0, reserved: 0, cancelled: 0, expired: 0 }
    for (const u of usages) {
      counts[u.status as keyof typeof counts] =
        (counts[u.status as keyof typeof counts] ?? 0) + 1
    }
    return counts
  }, [usages])

  // gráfico: usos por dia (últimos 14 dias)
  const usageByDay = useMemo(() => {
    const days: { label: string; key: string }[] = []
    const now = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      days.push({
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        key
      })
    }
    const counts = days.map(({ key }) => {
      return usages.filter(u => {
        if (u.status !== 'used') return false
        const k = u.updated_at.toISOString().slice(0, 10)
        return k === key
      }).length
    })
    return {
      labels: days.map(d => d.label),
      data: counts
    }
  }, [usages])

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={48} className="animate-spin text-primary-500" />
      </div>
    )
  }

  if (!promotion) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">Promoção não encontrada.</p>
        <Link
          to={routsNameMain.promotions.index}
          className="text-primary-600"
        >
          ← Voltar
        </Link>
      </div>
    )
  }

  const total = promotion.usage_limit_total
  const used = usageBreakdown.used
  const reserved = usageBreakdown.reserved
  const remaining = total !== undefined ? total - used - reserved : '∞'

  const handleToggle = async () => {
    try {
      await toggleActive.mutateAsync({
        code: promotion.code,
        active: !promotion.active
      })
      showToast(
        'success',
        promotion.active ? 'Promoção desativada' : 'Promoção ativada'
      )
    } catch (err: any) {
      showToast('error', err.message ?? 'Erro')
    }
  }

  const items = [
    { label: 'Painel', to: routsNameMain.home },
    { label: 'Promoções', to: routsNameMain.promotions.index },
    { label: promotion.code }
  ]

  return (
    <div className="w-full flex flex-col gap-6">
      <ToastContainer />
      <Breadcrumbs items={items} />

      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-mono font-bold text-gray-800 dark:text-white">
              {promotion.code}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {promotion.type === 'percentage' && `${promotion.value}% de desconto`}
              {promotion.type === 'fixed' && `${promotion.value} AOA de desconto`}
              {promotion.type === 'free_ride' && 'Ride totalmente grátis'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleToggle}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 font-medium text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all active:scale-95 focus:ring-2 focus:ring-gray-200"
          >
            <Power
              size={16}
              className={promotion.active ? 'text-green-600' : 'text-gray-400'}
            />
            {promotion.active ? 'Desativar' : 'Ativar'}
          </button>
          <Link
            to={`${routsNameMain.promotions.editStr}${promotion.code}`}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/40 hover:-translate-y-0.5 text-white font-medium text-sm px-5 py-2 rounded-xl shadow-sm shadow-primary-500/30 transition-all duration-200 active:scale-95"
          >
            <Edit2 size={16} /> Editar
          </Link>
        </div>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Usados"
          value={used}
          icon={<Tag size={18} />}
          tone="green"
        />
        <MetricCard
          label="Reservados"
          value={reserved}
          icon={<Users size={18} />}
          tone="amber"
        />
        <MetricCard
          label="Vagas restantes"
          value={remaining}
          icon={<TrendingUp size={18} />}
          tone="blue"
        />
        <MetricCard
          label="Limite total"
          value={total ?? '∞'}
          icon={<Tag size={18} />}
          tone="gray"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Usos nos últimos 14 dias
          </h3>
          <Bar
            data={{
              labels: usageByDay.labels,
              datasets: [
                {
                  label: 'Rides com promo',
                  data: usageByDay.data,
                  backgroundColor: '#10B981'
                }
              ]
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
            }}
          />
        </div>

        {/* Breakdown */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Breakdown
          </h3>
          <div className="flex flex-col gap-2 text-sm">
            <Row label="Usados" value={usageBreakdown.used} />
            <Row label="Reservados" value={usageBreakdown.reserved} />
            <Row label="Cancelados" value={usageBreakdown.cancelled} />
            <Row label="Expirados" value={usageBreakdown.expired} />
          </div>

          {promotion.referral?.enabled && (
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs uppercase font-semibold text-gray-500">
                Referência
              </p>
              <p className="text-sm mt-1">
                Owner:{' '}
                <span className="font-mono text-xs">
                  {promotion.referral.owner_user_id}
                </span>
              </p>
              <p className="text-sm">
                Recompensa:{' '}
                {promotion.referral.reward_type === 'fixed'
                  ? `${promotion.referral.reward_value} AOA`
                  : `${promotion.referral.reward_value}%`}
              </p>
            </div>
          )}

          {promotion.rules.has_specific_users && (
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs uppercase font-semibold text-gray-500">
                Utilizadores autorizados
              </p>
              <p className="text-sm mt-1">{allowedUsers.length} utilizadores</p>
            </div>
          )}
        </div>
      </div>

      {/* Lista de usages recentes */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
        <h3 className="px-6 py-4 text-lg font-semibold text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-700">
          Usos recentes ({usages.length})
        </h3>
        {usages.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Sem usos ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr className="text-left text-gray-600 dark:text-gray-300">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Ride</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Desconto</th>
                  <th className="px-4 py-3">Atualizado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {usages.slice(0, 50).map(u => (
                  <tr
                    key={u.id}
                    className="text-gray-800 dark:text-gray-200"
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      {u.user_id.slice(0, 12)}…
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {u.ride_id?.slice(0, 12) ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-4 py-3">
                      {formatMoney(u.discount_applied)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {u.updated_at.toLocaleString('pt-PT')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon,
  tone
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  tone: 'green' | 'amber' | 'blue' | 'gray'
}) {
  const colors = {
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
    gray: 'bg-gray-100 text-gray-700'
  }
  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {label}
        </span>
        <span className={`p-1.5 rounded-lg ${colors[tone]}`}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-800 dark:text-white mt-2">
        {value}
      </p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className="font-semibold text-gray-800 dark:text-white">
        {value}
      </span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    used: 'bg-green-100 text-green-700',
    reserved: 'bg-amber-100 text-amber-700',
    cancelled: 'bg-red-100 text-red-700',
    expired: 'bg-gray-200 text-gray-700'
  }
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        map[status] ?? 'bg-gray-100 text-gray-600'
      }`}
    >
      {status}
    </span>
  )
}
