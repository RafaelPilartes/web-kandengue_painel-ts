import React from 'react'
import { MissionEntity } from '@/core/entities/Mission'
import { Bike, Target, Trophy, CheckCircle2, Trash2 } from 'lucide-react'
import { Spinner } from 'phosphor-react'
import { formatMoney } from '@/utils/number'
import { missionServicesSummary } from '@/helpers/missionRideTypes'

interface MissionCardProps {
  mission: MissionEntity
  progress?: number
  isCompleted?: boolean
  isAdmin?: boolean
  isPaid?: boolean
  isPaying?: boolean
  typePaid?: 'cash' | 'wallet'
  onEdit?: (mission: MissionEntity) => void
  onToggle?: (mission: MissionEntity) => void
  onDelete?: (id: string) => void
  onPay?: (type: 'cash' | 'wallet') => void
}

export const MissionCard: React.FC<MissionCardProps> = ({
  mission,
  progress = 0,
  isCompleted = false,
  isAdmin = false,
  isPaid = false,
  isPaying = false,
  typePaid,
  onEdit,
  onToggle,
  onDelete,
  onPay
}) => {
  const percentage = Math.min(
    Math.round((progress / mission.target) * 100),
    100
  )

  const typeLabels = {
    daily: 'Diária',
    weekly: 'Semanal',
    monthly: 'Mensal'
  }

  const typeColors = {
    daily: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    weekly:
      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    monthly:
      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex flex-col gap-4 relative overflow-hidden">
      {isCompleted && (
        <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg flex items-center gap-1">
          <CheckCircle2 size={12} /> CONCLUÍDA
        </div>
      )}

      <div className="flex justify-between items-start mt-2">
        <div className="flex flex-col gap-1">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full w-fit ${typeColors[mission.type]}`}
          >
            {typeLabels[mission.type]}
          </span>
          <h4 className="text-lg font-bold text-gray-800 dark:text-white mt-1 flex items-center gap-2">
            <Target size={18} className="text-primary-500" />
            Meta: {mission.target} Entregas
          </h4>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg text-yellow-600 dark:text-yellow-400">
          <Trophy size={24} />
        </div>
      </div>

      <div className="flex items-center gap-2 text-2xl font-black text-primary-600 dark:text-primary-400">
        {formatMoney(mission.reward)}{' '}
        <span className="text-xs font-medium text-gray-500 uppercase">
          Kz de Bônus
        </span>
      </div>

      {/*
        Always shown, including "Todos os serviços": a mission that restricts
        the services looks exactly like one that does not, and a driver asking
        why a ride did not count has nowhere to read the answer. The absence of
        a line would be the restriction's only sign.
      */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
        <Bike size={14} className="shrink-0" />
        <span>{missionServicesSummary(mission)}</span>
      </div>

      {!isAdmin && (
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
            <span>
              Progresso: {progress} / {mission.target}
            </span>
            <span>{percentage}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-primary-500'}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* No `onPay`: the admin's department cannot pay bonuses, so no buttons. */}
      {isCompleted && !isPaid && onPay && (
        <div className="flex flex-col gap-2 mt-2 p-3 bg-primary-50 dark:bg-primary-900/10 rounded-lg border border-primary-100 dark:border-primary-900/30">
          <p className="text-xs font-semibold text-primary-700 dark:text-primary-300 flex items-center gap-1">
            <Trophy size={14} /> Missão Atingida! Escolha o pagamento:
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPay?.('cash')}
              disabled={isPaying}
              className="flex-1 flex items-center justify-center gap-2 text-[11px] font-bold py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {isPaying ? <Spinner size={14} className="animate-spin" /> : 'Pagar em Cash'}
            </button>
            <button
              onClick={() => onPay?.('wallet')}
              disabled={isPaying}
              className="flex-1 flex items-center justify-center gap-2 text-[11px] font-bold py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {isPaying ? <Spinner size={14} className="animate-spin" /> : 'Saldo na Carteira'}
            </button>
          </div>
        </div>
      )}

      {isPaid && (
        <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/30 text-green-700 dark:text-green-400">
          <CheckCircle2 size={16} />
          <span className="text-xs font-bold uppercase tracking-tight">
            Pago via {typePaid === 'wallet' ? 'Carteira' : 'Cash'}
          </span>
        </div>
      )}

      {isAdmin && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${mission.is_active ? 'bg-green-500' : 'bg-gray-400'}`}
            />
            <span className="text-xs text-gray-500">
              {mission.is_active ? 'Ativa' : 'Inativa'}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => mission.id && onDelete?.(mission.id)}
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Excluir"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={() => onToggle?.(mission)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              {mission.is_active ? 'Desativar' : 'Ativar'}
            </button>
            <button
              onClick={() => onEdit?.(mission)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400 transition-colors"
            >
              Editar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
