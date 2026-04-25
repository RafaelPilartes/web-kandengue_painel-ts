import { X, MapPin, Clock, CreditCard, User as UserIcon } from 'lucide-react'
import type { RideInterface } from '@/interfaces/IRide'
import { formatDateTimeFromFirestore } from '@/utils/date'
import { formatMoney } from '@/utils/number'
import { getRideStatusLabel } from '@/utils/gettersLabels'
import { Avatar } from '@/components/ui/avatar'

const formatFullDate = (timestamp: any) => {
  if (!timestamp) return '-'
  const { date, time } = formatDateTimeFromFirestore(timestamp)
  return `${date} às ${time}`
}

interface RideDetailsDrawerProps {
  ride: RideInterface | null
  isOpen: boolean
  onClose: () => void
}

export function RideDetailsDrawer({ ride, isOpen, onClose }: RideDetailsDrawerProps) {
  if (!isOpen || !ride) return null

  const isCanceled = ride.status === 'canceled'
  const fareTotal = isCanceled ? 0 : (ride.fare?.total || 0)

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/40 z-40 transition-opacity" 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300 translate-x-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Detalhes da Corrida</h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* Status & Valor */}
          <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Status</span>
              <span className="font-medium">{getRideStatusLabel(ride.status)}</span>
            </div>
            <div className="text-right">
              <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Valor Total</span>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">
                AOA {formatMoney(fareTotal)}
              </span>
            </div>
          </div>

          {/* Rota */}
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
              <MapPin size={18} /> Rota da Viagem
            </h4>
            <div className="flex flex-col gap-4 relative pl-4 border-l-2 border-dashed border-gray-300 dark:border-gray-700 ml-2">
              <div className="relative">
                <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-xs text-gray-500 block">Origem</span>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{ride.pickup?.name || 'Localização não definida'}</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-gray-500 block">Destino</span>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{ride.dropoff?.name || 'Localização não definida'}</p>
              </div>
            </div>
            <div className="flex gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
              <span>Distância: <strong>{ride.distance?.toFixed(1) || 0} km</strong></span>
              <span>•</span>
              <span>Duração: <strong>{ride.duration?.toFixed(0) || 0} min</strong></span>
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-800" />

          {/* Timeline */}
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
              <Clock size={18} /> Linha de Tempo
            </h4>
            <div className="text-sm space-y-2 text-gray-600 dark:text-gray-300">
              <div className="flex justify-between">
                <span>Pedido:</span>
                <span className="font-medium">{ride.created_at ? formatFullDate(ride.created_at) : '-'}</span>
              </div>
              {ride.waiting_start_at && (
                <div className="flex justify-between">
                  <span>Chegada p/ recolha:</span>
                  <span className="font-medium">{formatFullDate(ride.waiting_start_at)}</span>
                </div>
              )}
              {ride.completed_at && (
                <div className="flex justify-between">
                  <span>Conclusão:</span>
                  <span className="font-medium">{formatFullDate(ride.completed_at)}</span>
                </div>
              )}
              {ride.canceled_at && (
                <div className="flex justify-between text-red-500">
                  <span>Cancelamento:</span>
                  <span className="font-medium">{formatFullDate(ride.canceled_at)}</span>
                </div>
              )}
              {ride.cancel_reason && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs rounded border border-red-100 dark:border-red-900/30">
                  <strong>Motivo:</strong> {ride.cancel_reason}
                </div>
              )}
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-800" />

          {/* Motorista */}
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
              <UserIcon size={18} /> Motorista
            </h4>
            {ride.driver ? (
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <Avatar src={ride.driver.photo} alt={ride.driver.name} fallback={ride.driver.name?.substring(0,2) || 'MO'} size="md" />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{ride.driver.name}</p>
                  <p className="text-xs text-gray-500">{ride.driver.phone || 'Sem telefone'}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Nenhum motorista atribuído.</p>
            )}
          </div>

          <hr className="border-gray-200 dark:border-gray-800" />

          {/* Financeiro */}
          {ride.fare && (
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                <CreditCard size={18} /> Resumo Financeiro
              </h4>
              <div className="text-sm space-y-2 text-gray-600 dark:text-gray-300">
                <div className="flex justify-between">
                  <span>Tarifa Base:</span>
                  <span>AOA {formatMoney(ride.fare.breakdown?.base_fare || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Custo Distância:</span>
                  <span>AOA {formatMoney(ride.fare.breakdown?.distance_cost || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Custo Espera:</span>
                  <span>AOA {formatMoney(ride.fare.breakdown?.wait_cost || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa Seguro:</span>
                  <span>AOA {formatMoney(ride.fare.breakdown?.insurance_fee || 0)}</span>
                </div>
                {(ride.fare.breakdown?.discount || 0) > 0 && (
                  <div className="flex justify-between text-green-500">
                    <span>Desconto:</span>
                    <span>- AOA {formatMoney(ride.fare.breakdown?.discount || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span>Total:</span>
                  <span className={isCanceled ? "text-gray-500 line-through" : ""}>
                    AOA {formatMoney(fareTotal)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Fotos */}
          {(ride.proof_pickup_photo || ride.proof_dropoff_photo) && (
            <>
              <hr className="border-gray-200 dark:border-gray-800" />
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Fotos de Prova</h4>
                <div className="flex gap-4">
                  {ride.proof_pickup_photo && (
                    <div className="flex-1">
                      <span className="text-xs text-gray-500 block mb-1">Recolha</span>
                      <a href={ride.proof_pickup_photo} target="_blank" rel="noopener noreferrer" className="block hover:opacity-80 transition-opacity">
                        <img src={ride.proof_pickup_photo} alt="Recolha" className="w-full h-24 object-cover rounded-md cursor-pointer border border-gray-200 dark:border-gray-700" />
                      </a>
                    </div>
                  )}
                  {ride.proof_dropoff_photo && (
                    <div className="flex-1">
                      <span className="text-xs text-gray-500 block mb-1">Chegada</span>
                      <a href={ride.proof_dropoff_photo} target="_blank" rel="noopener noreferrer" className="block hover:opacity-80 transition-opacity">
                        <img src={ride.proof_dropoff_photo} alt="Chegada" className="w-full h-24 object-cover rounded-md cursor-pointer border border-gray-200 dark:border-gray-700" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
