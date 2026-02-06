import { InputWithButton } from '@/components/input/InputWithButton'
import { SelectCustom } from '@/components/selects/SelectCustom'
import { SelectSearchableCustom } from '@/components/selects/SelectSearchableCustom'
import { rideStatusOptions, rowPerPageOptions } from '@/data/selectOption'
import type { RideInterface } from '@/interfaces/IRide'
import { colorRideStatus } from '@/utils/colorBy'
import { formatDateTimeFromFirestore } from '@/utils/date'
import { getRideStatusLabel } from '@/utils/gettersLabels'
import { Package, User } from 'lucide-react'
import { IoSearchSharp } from 'react-icons/io5'
import { RideSkeleton } from '../components/RideSkeleton'

interface RideListSidebarProps {
  rides: RideInterface[]
  selectedRideId?: string | null
  isLoading: boolean
  onSelectRide: (ride: RideInterface) => void
  termForSearch: string
  setTermForSearch: (value: string) => void
  docsPerPage: number
  setDocsPerPage: (value: number) => void
  onFilterStatusChange: (status: string) => void
}

export function RideListSidebar({
  rides,
  selectedRideId,
  isLoading,
  onSelectRide,
  termForSearch,
  setTermForSearch,
  docsPerPage,
  setDocsPerPage,
  onFilterStatusChange
}: RideListSidebarProps) {
  const handleSelectChange = (value: number) => {
    const rowsPerPage = value === -1 ? 8 : value
    setDocsPerPage(rowsPerPage)
  }

  return (
    <div className="w-full lg:w-96 p-4 flex flex-col gap-3 overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full">
      <h2 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-100">
        Lista de Corridas
      </h2>
      <div className="w-full">
        <InputWithButton
          onChange={e => setTermForSearch(e.target.value)}
          placeholder="Pesquisar..."
          icon={<IoSearchSharp size={20} />}
          onButtonClick={() => null}
        />
      </div>

      {/* Filtro por status */}
      <SelectSearchableCustom
        name="status"
        label="Filtrar por Status"
        options={rideStatusOptions}
        onOptionChange={e => onFilterStatusChange(e as string)}
      />

      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => <RideSkeleton key={i} />)}

        {rides.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {termForSearch
                ? `Nenhuma corrida encontrada para "${termForSearch}"`
                : 'Nenhuma corrida disponível'}
            </p>
          </div>
        )}

        {rides.map(ride => (
          <div
            key={ride.id}
            onClick={() => onSelectRide(ride)}
            className={`p-3 rounded-lg cursor-pointer transition-all duration-200 flex flex-col gap-2 border shadow-sm ${
              selectedRideId === ride.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500/20'
                : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-200 dark:hover:border-blue-800'
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-full ${
                    selectedRideId === ride.id
                      ? 'bg-blue-100 dark:bg-blue-800'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  <Package
                    size={14}
                    className={
                      selectedRideId === ride.id
                        ? 'text-blue-600 dark:text-blue-300'
                        : 'text-gray-500 dark:text-gray-400'
                    }
                  />
                </div>
                <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">
                  #{ride.id?.slice(0, 8)}
                </span>
              </div>

              <span
                className={`px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded-full ${colorRideStatus(ride.status)}`}
              >
                {getRideStatusLabel(ride.status)}
              </span>
            </div>

            {/* Trajeto Simplificado */}
            <div className="relative flex flex-col gap-4 py-2 pl-2">
              {/* Linha conectora */}
              <div className="absolute left-[15px] top-[18px] bottom-[18px] w-0.5 bg-gray-200 dark:bg-gray-700" />

              {/* Pickup */}
              <div className="flex items-start gap-3 relative z-10">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 ring-2 ring-white dark:ring-gray-800" />
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-100 truncate">
                    {ride.pickup.name ?? 'Origem desconhecida'}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                    {ride.pickup.description}
                  </p>
                </div>
              </div>

              {/* Dropoff */}
              <div className="flex items-start gap-3 relative z-10">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-gray-900 dark:bg-gray-400 ring-2 ring-white dark:ring-gray-800" />
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-100 truncate">
                    {ride.dropoff.name ?? 'Destino desconhecido'}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                    {ride.dropoff.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Rodapé do Card */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/50 mt-1">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <User
                    size={12}
                    className="text-gray-500 dark:text-gray-400"
                  />
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                    {ride.user?.name}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  {ride.created_at &&
                    formatDateTimeFromFirestore(ride.created_at as any).time}
                </span>
              </div>
            </div>
          </div>
        ))}

        <div className="pt-2 pb-6 flex flex-col justify-center items-center gap-4">
          <div className="w-full flex-1 flex flex-row justify-between items-center gap-2">
            <span className="text-xs text-gray-500">Registos por página: </span>
            <span className="w-20">
              <SelectCustom
                options={rowPerPageOptions}
                selectedValue={docsPerPage}
                onChange={value => handleSelectChange(Number(value))}
                padding="1"
              />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
