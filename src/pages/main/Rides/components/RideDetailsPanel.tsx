import { useState } from 'react'
import type { RideInterface } from '@/interfaces/IRide'
import { CopyField } from '@/components/CopyField'
import { StatusBadge } from '../components/StatusBadge'
import { formatDateTimeFromFirestore } from '@/utils/date'
import { formatMoney } from '@/utils/number'
import {
  Mail,
  Phone,
  Package,
  X,
  MapPin,
  Navigation,
  Minimize2,
  Maximize2
} from 'lucide-react'

interface RideDetailsPanelProps {
  ride: RideInterface
  onClose: () => void
  onFocusMap: () => void
}

export function RideDetailsPanel({
  ride,
  onClose,
  onFocusMap
}: RideDetailsPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false)

  return (
    <div
      className={`absolute top-4 right-4 z-10 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden transition-all duration-300 ${
        isMinimized ? 'w-80' : 'w-full max-w-md max-h-[calc(100vh-2rem)]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {isMinimized ? 'Corrida' : 'Detalhes da Corrida'}
              <span className="text-xs font-normal text-gray-500 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                #{ride.id?.slice(0, 8)}
              </span>
            </h3>
          </div>
          {isMinimized && (
            <div className="flex items-center gap-3">
              <StatusBadge status={ride.status} />
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                  AOA {formatMoney(ride.fare.total || 0)}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onFocusMap}
            className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors"
            title="Centralizar no mapa"
          >
            <Navigation size={18} />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors"
            title={isMinimized ? 'Expandir' : 'Minimizar'}
          >
            {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 rounded-lg text-gray-500 transition-colors"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="overflow-y-auto p-4 space-y-6">
          {/* Status Card */}
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
            <StatusBadge status={ride.status} />
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                AOA {formatMoney(ride.fare.total || 0)}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">
                Valor Total
              </div>
            </div>
          </div>

          {/* Locations */}
          <div className="relative space-y-6">
            {/* Linha conectora */}
            <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-gray-200 dark:bg-gray-700 border-l border-dashed border-gray-300 dark:border-gray-600" />

            {/* Pickup */}
            <div className="flex gap-4 relative">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 z-10 border-4 border-white dark:border-gray-900">
                <MapPin
                  size={18}
                  className="text-blue-600 dark:text-blue-400"
                />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase text-[10px] tracking-wider mb-1">
                  Ponto de Partida
                </h4>
                <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                  {ride.pickup.name}
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {ride.pickup.description}
                </p>
              </div>
            </div>

            {/* Dropoff */}
            <div className="flex gap-4 relative">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 z-10 border-4 border-white dark:border-gray-900">
                <MapPin
                  size={18}
                  className="text-gray-600 dark:text-gray-400"
                />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase text-[10px] tracking-wider mb-1">
                  Destino
                </h4>
                <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                  {ride.dropoff.name}
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {ride.dropoff.description}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Motorista */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-800">
                Motorista
              </h4>
              <div className="flex items-center gap-3">
                <img
                  src={ride.driver?.photo || '/default-avatar.png'}
                  alt={ride.driver?.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-800"
                />
                <div>
                  <h5 className="font-medium text-sm text-gray-900 dark:text-white">
                    {ride.driver?.name || 'Não atribuído'}
                  </h5>
                  <div className="flex items-center gap-1 text-[10px] text-gray-500">
                    <span>⭐ {ride.driver?.rating || 'N/A'}</span>
                    <span>•</span>
                    <span>{ride.driver?.entity_code}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <CopyField
                  icon={<Mail size={12} />}
                  value={ride.driver?.email || 'N/A'}
                />
                <CopyField
                  icon={<Phone size={12} />}
                  value={ride.driver?.phone || 'N/A'}
                />
              </div>
            </div>

            {/* Cliente */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-800">
                Cliente
              </h4>
              <div className="flex items-center gap-3">
                <img
                  src={ride.user?.photo || '/default-avatar.png'}
                  alt={ride.user?.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-800"
                />
                <div>
                  <h5 className="font-medium text-sm text-gray-900 dark:text-white">
                    {ride.user?.name || 'Cliente'}
                  </h5>
                  <div className="text-[10px] text-gray-500">Passageiro</div>
                </div>
              </div>
              <div className="space-y-1.5">
                <CopyField
                  icon={<Mail size={12} />}
                  value={ride.user?.email || 'N/A'}
                />
                <div className="h-6"></div>{' '}
                {/* Spacer to align with driver cards */}
              </div>
            </div>
          </div>

          {/* Timeline Chips */}
          <div className="flex flex-wrap gap-2 pt-2">
            <div className="px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex flex-col items-center min-w-[80px]">
              <span className="text-[10px] text-gray-500 uppercase">
                Solicitado
              </span>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {ride.created_at
                  ? formatDateTimeFromFirestore(ride.created_at as any).time
                  : '--:--'}
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex flex-col items-center min-w-[80px]">
              <span className="text-[10px] text-gray-500 uppercase">
                Atualizado
              </span>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {ride.updated_at
                  ? formatDateTimeFromFirestore(ride.updated_at as any).time
                  : '--:--'}
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex flex-col items-center min-w-[80px]">
              <span className="text-[10px] text-gray-500 uppercase">
                Duração
              </span>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {ride.duration || '--'} min
              </span>
            </div>
          </div>

          {/* Delivery Details */}
          {ride.type === 'delivery' && ride.details && (
            <div className="mt-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-lg p-3">
              <h4 className="text-xs font-bold text-orange-800 dark:text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Package size={14} /> Detalhes da Entrega
              </h4>
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <p>
                  <span className="font-medium">Item:</span>{' '}
                  {ride.details.item.type} ({ride.details.item.size})
                </p>
                <p>
                  <span className="font-medium">Para:</span>{' '}
                  {ride.details.receiver.name}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
