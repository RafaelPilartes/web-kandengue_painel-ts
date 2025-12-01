// pages/rides/RidesPage.tsx
import { useEffect, useMemo, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMapEvents
} from 'react-leaflet'
import { Mail, Phone, Package, User, X } from 'lucide-react'
import { useRidesViewModel } from '@/viewModels/RideViewModel'
import { useRideTrackingsViewModel } from '@/viewModels/RideTrackingViewModel'
import type { RideInterface } from '@/interfaces/IRide'
import { getRideStatusLabel } from '@/utils/gettersLabels'
import { CopyField } from '@/components/CopyField'
import { formatDateTimeFromFirestore } from '@/utils/date'
import { InputWithButton } from '@/components/input/InputWithButton'
import { IoSearchSharp } from 'react-icons/io5'
import { SelectSearchableCustom } from '@/components/selects/SelectSearchableCustom'
import { rideStatusOptions, rowPerPageOptions } from '@/data/selectOption'
import useDirections from '@/hook/useDirections'
import { snapToRoads } from '@/utils/snapToRoads'
import { colorRideStatus } from '@/utils/colorBy'
import { SelectCustom } from '@/components/selects/SelectCustom'
import {
  customCarIcon,
  customDropoffIcon,
  customPickupIcon
} from '@/data/customPickupIcon'
import { formatMoney } from '@/utils/number'
import { RideSkeleton } from './components/RideSkeleton'
import { StatusBadge } from './components/StatusBadge'
import type { GeoLocationType } from '@/types/geoLocation'
import { MapController } from './components/MapController'

export function RealtimePage() {
  // Paginação
  const [docsPerPage, setDocsPerPage] = useState(8) // limite por página

  // Filtros
  const [termForSearch, setTermForSearch] = useState<string>('')

  const [filters, setFilters] = useState<Partial<RideInterface>>()

  const [ridesList, setRidesList] = useState<RideInterface[]>([])
  const [isLoadingRides, setIsLoadingRides] = useState(true)

  const { listenAll } = useRidesViewModel()
  const { rideTrackings } = useRideTrackingsViewModel()
  const { routeCoords, fetchRoute } = useDirections()

  const [coordsTracking, setCoordsTracking] = useState<
    { latitude: number; longitude: number }[]
  >([])

  const [selectedRide, setSelectedRide] = useState<RideInterface | null>(null)

  const [mapCenter, setMapCenter] = useState<{
    latitude: number
    longitude: number
  } | null>(null)
  const [mapBounds, setMapBounds] = useState<{
    pickup: GeoLocationType
    dropoff: GeoLocationType
  } | null>(null)

  const handleSelectRide = async (ride: RideInterface) => {
    setSelectedRide(ride)

    try {
      // Centralizar no ponto médio entre pickup e dropoff
      const centerLat = (ride.pickup.latitude + ride.dropoff.latitude) / 2
      const centerLng = (ride.pickup.longitude + ride.dropoff.longitude) / 2

      setMapCenter({
        latitude: centerLat,
        longitude: centerLng
      })

      // Definir bounds para mostrar ambos os pontos
      setMapBounds({
        pickup: ride.pickup,
        dropoff: ride.dropoff
      })

      await fetchRoute(ride.pickup, ride.dropoff)

      const tracking = rideTrackings.find(t => t.ride_id === ride.id)

      const snapped = await snapToRoads(tracking?.path || [])
      setCoordsTracking(snapped)
    } catch (error) {
      console.error('Erro ao carregar rota:', error)
    }
  }

  // Componente para interações do mapa
  const MapEvents = () => {
    const map = useMapEvents({
      zoomend: () => {
        console.log('Zoom alterado para:', map.getZoom())
      },
      moveend: () => {
        console.log('Mapa movido para:', map.getCenter())
      }
    })
    return null
  }

  // Função para resetar a visualização
  const handleResetView = () => {
    setSelectedRide(null)
    setMapCenter(null)
    setMapBounds(null)
  }

  // Handle Select
  const handleRideStatusChange = (valueSelected: string) => {
    if (valueSelected === '') {
      setFilters(prev => ({ ...prev, status: undefined })) // limpa filtro
    } else {
      setFilters(prev => ({
        ...prev,
        status: valueSelected as RideInterface['status']
      }))
    }
  }

  // Change rows per page
  const handleSelectChange = (value: number) => {
    const rowsPerPage = value === -1 ? 8 : value
    setDocsPerPage(rowsPerPage)
  }

  // Dados filtrados com useMemo
  const filteredRides = useMemo(() => {
    if (!termForSearch.trim()) return ridesList

    const searchTerm = termForSearch.toLowerCase().trim()

    return ridesList.filter(ride => {
      // Busca em múltiplos campos
      return (
        // Email do motorista
        ride.driver?.email?.toLowerCase().includes(searchTerm) ||
        // Nome do motorista
        ride.driver?.name?.toLowerCase().includes(searchTerm) ||
        // Email do cliente
        ride.user?.email?.toLowerCase().includes(searchTerm) ||
        // Nome do cliente
        ride.user?.name?.toLowerCase().includes(searchTerm) ||
        // ID da corrida
        ride.id?.toLowerCase().includes(searchTerm) ||
        // Local de pickup
        ride.pickup.name?.toLowerCase().includes(searchTerm) ||
        ride.pickup.description?.toLowerCase().includes(searchTerm) ||
        // Local de dropoff
        ride.dropoff.name?.toLowerCase().includes(searchTerm) ||
        ride.dropoff.description?.toLowerCase().includes(searchTerm)
      )
    })
  }, [ridesList, termForSearch])

  // Rides
  useEffect(() => {
    setIsLoadingRides(true)

    const unsubscribeRides = listenAll(
      rides => {
        setRidesList(rides)
        setIsLoadingRides(false)
      },
      {
        filters,
        limit: docsPerPage
      }
    )

    return unsubscribeRides
  }, [docsPerPage, filters])
  return (
    <div className="flex h-full w-full relative">
      {/* <SeedFirebaseButton /> */}
      {/* Sidebar Lista de Corridas */}
      <div className="w--full lg:w-1/2 xl:max-w-sm p-4 flex flex-col gap-3 overflow-y-auto">
        <h2 className="font-semibold text-lg mb-2">Lista de Corridas</h2>
        <div className="w-full max-w-sm">
          <InputWithButton
            onChange={e => setTermForSearch(e.target.value)}
            placeholder="Pesquisar pelo email do motorista..."
            icon={<IoSearchSharp size={20} />}
            onButtonClick={() => null} // resetar página ao buscar
          />
        </div>
        {/* Filtro por status */}
        <SelectSearchableCustom
          name="status"
          label="Filtrar por Status"
          options={rideStatusOptions}
          onOptionChange={e => handleRideStatusChange(e as string)}
        />

        {isLoadingRides &&
          Array.from({ length: 3 }).map((_, i) => <RideSkeleton key={i} />)}

        {filteredRides.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {termForSearch
                ? `Nenhuma corrida encontrada para "${termForSearch}"`
                : 'Nenhuma corrida disponível'}
            </p>
          </div>
        )}
        {filteredRides.map(ride => (
          <div
            key={ride.id}
            onClick={() => handleSelectRide(ride)}
            className={`p-3 rounded-md cursor-pointer shadow flex flex-col gap-2 border-l-4 ${
              selectedRide?.id === ride.id
                ? 'border-blue-500 bg-blue-50 dark:bg-dark'
                : 'border-transparent bg-light dark:bg-dark'
            }`}
          >
            <div className="flex justify-between items-center">
              {/* Id & Status */}
              <div className="w-full flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-gray-400" />
                  <span className="font-semibold">#{ride.id}</span>
                </div>

                <span
                  className={`px-2 py-1 text-xs rounded ${colorRideStatus(
                    ride.status
                  )}`}
                >
                  {getRideStatusLabel(ride.status)}
                </span>
              </div>
            </div>

            {/* Pickup & Dropoff */}
            <div className="relative flex flex-col gap-6 pt-3 pb-1 border-t border-gray-200 dark:border-gray-500">
              {/* Pickup */}
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-blue-200" />
                  <div className="w-px h-full bg-gray-300 dark:bg-gray-600" />
                </div>

                <div className="w-full flex flex-row justify-between items-start gap-3">
                  <div className="flex-1 flex flex-col">
                    <span className="text-sm text-gray-500 dark:text-white">
                      {ride.pickup.name ?? 'N/A'}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-300">
                      {ride.pickup.description ?? 'N/A'}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 dark:text-white">
                      {ride.created_at &&
                        formatDateTimeFromFirestore(ride.created_at as any)
                          .date}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-300">
                      {ride.created_at &&
                        formatDateTimeFromFirestore(ride.created_at as any)
                          .time}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dropoff */}
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-gray-400 border-2 border-gray-300" />
                </div>

                <div className="w-full flex flex-row justify-between items-start gap-2">
                  <div className="flex-1 flex flex-col">
                    <span className="text-sm text-gray-500 dark:text-white">
                      {ride.dropoff.name ?? 'N/A'}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-300">
                      {ride.dropoff.description ?? 'N/A'}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 dark:text-white">
                      {ride.updated_at &&
                        formatDateTimeFromFirestore(ride.updated_at as any)
                          .date}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-300">
                      {ride.updated_at &&
                        formatDateTimeFromFirestore(ride.updated_at as any)
                          .time}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cliente */}
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-500 pt-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/40">
                  <User size={18} className="text-blue-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    {ride.user?.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-300">
                    {ride.user?.email}
                  </span>
                </div>
              </div>
              <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600">
                📞
              </button>
            </div>
          </div>
        ))}

        <div className="pt-4 flex flex-col justify-between items-center gap-4 max-w-s-960:gap-3">
          <div className="flex flex-col justify-center items-center gap-4 mb-3">
            <div className="w-full flex-1 flex flex-row justify-between items-center gap-4 max-w-s-520:flex-wrap">
              <span className="">Registos por página: </span>

              <span className="max-w-24">
                <SelectCustom
                  options={rowPerPageOptions}
                  selectedValue={docsPerPage}
                  onChange={value => handleSelectChange(Number(value))}
                  padding="2"
                />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mapa + Painel lateral */}
      <div className="flex-1 flex relative">
        <div className="flex-1 fixed xl:w-[calc(100%-35rem)] lg:w-[calc(100%-28rem)] md:w-[calc(100%-28rem)] sm:w-[calc(100%-25rem)] w-[calc(100%-10rem)] h-full">
          {selectedRide && (
            <MapContainer
              center={[
                selectedRide.pickup.latitude,
                selectedRide.pickup.longitude
              ]}
              zoom={13}
              style={{ height: '100%', width: '100%', zIndex: 0 }}
              scrollWheelZoom={true}
              zoomControl={true}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {/* Controlador da centralização */}
              <MapController
                center={mapCenter || undefined}
                bounds={mapBounds || undefined}
                zoom={mapCenter ? 14 : 13}
              />

              {/* Eventos do mapa */}
              <MapEvents />

              {/* Pickup */}
              <Marker
                position={[
                  selectedRide.pickup.latitude,
                  selectedRide.pickup.longitude
                ]}
                icon={customPickupIcon}
              >
                <Popup>Local de recolha</Popup>
              </Marker>

              {/* Dropoff color green */}
              <Marker
                position={[
                  selectedRide.dropoff.latitude,
                  selectedRide.dropoff.longitude
                ]}
                icon={customDropoffIcon}
              >
                <Popup>Local de entrega</Popup>
              </Marker>

              <Polyline
                positions={coordsTracking.map(p => [p.latitude, p.longitude])}
                color="gray"
              />
              {Array.isArray(routeCoords) && routeCoords.length > 2 && (
                <Polyline
                  positions={routeCoords.map(coord => [
                    coord.latitude,
                    coord.longitude
                  ])}
                  color="#0096FF"
                />
              )}
              {/* Última posição = veículo atual */}
              {coordsTracking.length >= 2 && (
                <Marker
                  position={[
                    coordsTracking[coordsTracking.length - 1].latitude,
                    coordsTracking[coordsTracking.length - 1].longitude
                  ]}
                  icon={customCarIcon}
                >
                  <Popup>Veículo em tempo real</Popup>
                </Marker>
              )}
              {/* Path do tracking */}
              {coordsTracking && coordsTracking.length > 2 && (
                <>
                  <Polyline
                    positions={coordsTracking.map(c => [
                      c.latitude,
                      c.longitude
                    ])}
                    color="blue"
                  />
                </>
              )}
            </MapContainer>
          )}
        </div>

        {/* Painel Detalhes */}
        {selectedRide && (
          <div className="fixed z-[2] right-4 top-28 xl:right-24 xl:top-48 lg:right-8 lg:top-36 md:right-8 md:top-36 sm:right-6 sm:top-32">
            <div className="flex flex-col bg-white dark:bg-dark p-4 rounded-xl gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Detalhes da Corrida
                  </h3>
                  <span className="mt-1 text-xs">#{selectedRide.id}</span>
                </div>
                <button
                  onClick={handleResetView}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Informações do Motorista */}
              <div className="gap-2">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 text-sm">
                  Motorista
                </h4>
                <div className="flex items-center gap-3">
                  <img
                    src={selectedRide.driver?.photo || '/default-avatar.png'}
                    alt={selectedRide.driver?.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 dark:text-white text-xs">
                      {selectedRide.driver?.name || 'Não atribuído'}
                    </h5>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{selectedRide.driver?.entity_code}</span>
                      <span>•</span>
                      <span>⭐ {selectedRide.driver?.rating || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <CopyField
                    icon={<Mail size={16} />}
                    value={selectedRide.driver?.email || 'Não disponível'}
                  />
                  <CopyField
                    icon={<Phone size={16} />}
                    value={selectedRide.driver?.phone || 'Não disponível'}
                  />
                </div>
              </div>

              {/* Informações do Cliente */}
              <div className="gap-2">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 text-sm">
                  Cliente
                </h4>
                <div className="flex items-center gap-3">
                  <img
                    src={selectedRide.user?.photo || '/default-avatar.png'}
                    alt={selectedRide.user?.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedRide.user?.name || 'Cliente'}
                    </h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedRide.user?.email}
                    </p>
                  </div>
                </div>
              </div>

              {selectedRide?.type === 'delivery' && selectedRide.details && (
                <div className="border-t border-gray-700 dark:border-gray-500 pt-4">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Detalhes da Entrega
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Destinatário:
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center">
                          <User
                            size={24}
                            className="text-blue-600 dark:text-blue-400"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            {selectedRide.details.receiver.name}
                          </p>
                          <p className="text-sm">
                            {selectedRide.details.receiver.phone}
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Item */}
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Item:
                      </span>
                      <div className="flex items-center gap-2">
                        <Package size={16} />
                        <span>{selectedRide.details.item.type}</span>
                        <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {selectedRide.details.item.size}
                        </span>
                      </div>
                      {selectedRide.details.item.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {selectedRide.details.item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Status e Timeline */}
              <div className="border-t border-gray-700 dark:border-gray-500 pt-4 space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 text-sm">
                    Status da Corrida
                  </h4>
                  <div className="flex items-center justify-between">
                    <StatusBadge status={selectedRide.status} />

                    <div className="text-left">
                      <div className="text-sm font-medium">
                        AOA {formatMoney(selectedRide.fare.total || 0)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Total
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline simples */}
                <div className="pt-4 border-t border-gray-700 dark:border-gray-500">
                  <div className="mb-2">
                    <div className="font-medium">Data</div>
                    <div className="text-gray-500 dark:text-gray-400">
                      {
                        formatDateTimeFromFirestore(
                          selectedRide.created_at as any
                        ).date
                      }
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">Início</div>
                      <div className="text-gray-500 dark:text-gray-400">
                        {selectedRide.created_at &&
                          formatDateTimeFromFirestore(
                            selectedRide.created_at as any
                          ).time}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">Duração</div>
                      <div className="text-gray-500 dark:text-gray-400">
                        {selectedRide.duration || '--'} min
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">Atualização</div>
                      <div className="text-gray-500 dark:text-gray-400">
                        {selectedRide.updated_at &&
                          formatDateTimeFromFirestore(
                            selectedRide.updated_at as any
                          ).time}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!selectedRide && (
          <div className="fixed z-[2] w-96 top-3/4 left-3/4 -translate-x-3/4 -translate-y-3/4">
            <div className="flex flex-col gap-2 items-center justify-center">
              <img
                src="/illustration/no-selected.png"
                alt="No selected"
                className="w-full max-w-80 px-12"
              />
              <h4 className="text-xl text-dark dark:text-light font-semibold flex items-center gap-2">
                Nenhuma corrida selecionada
              </h4>
              <p className="text-sm text-dark dark:text-gray-400 text-center">
                Não há nenhuma corrida selecionada no momento. Clique em uma
                corrida para ver os detalhes.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
