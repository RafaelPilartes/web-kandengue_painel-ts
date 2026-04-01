// pages/rides/RidesPage.tsx
import { useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMapEvents
} from 'react-leaflet'
import { Package } from 'lucide-react'
import { RideListSidebar } from './components/RideListSidebar'
import { RideDetailsPanel } from './components/RideDetailsPanel'
import { useRidesViewModel } from '@/viewModels/RideViewModel'
import { useDriversOnlineRealtime } from '@/viewModels/DriverViewModel'
import { useRideMapRoutes } from '@/hook/useRideMapRoutes'
import type { RideInterface } from '@/interfaces/IRide'

import {
  customCarIcon,
  customDropoffIcon,
  customPickupIcon
} from '@/data/customPickupIcon'

import type { GeoLocationType } from '@/types/geoLocation'
import { MapController } from './components/MapController'

export function RealtimePage() {
  // Paginação
  const [currentPage, setCurrentPage] = useState(0)
  const [docsPerPage, setDocsPerPage] = useState(8)

  // Filtros
  const [termForSearch, setTermForSearch] = useState<string>('')
  const [filters, setFilters] = useState<Partial<RideInterface>>()

  // ViewModel com paginação do servidor
  const { rides, pagination, isLoadingRides } = useRidesViewModel(
    docsPerPage,
    currentPage * docsPerPage,
    termForSearch,
    filters
  )

  const [selectedRide, setSelectedRide] = useState<RideInterface | null>(null)

  // Hook de rotas dinâmicas por status
  const { polylines, driverPosition, liveStatus, liveRide } =
    useRideMapRoutes(selectedRide)

  // Drivers online (fleet view)
  const { drivers: onlineDrivers } = useDriversOnlineRealtime()

  const [mapCenter, setMapCenter] = useState<{
    latitude: number
    longitude: number
  } | null>(null)
  const [mapBounds, setMapBounds] = useState<{
    pickup: GeoLocationType
    dropoff: GeoLocationType
  } | null>(null)

  const handleSelectRide = (ride: RideInterface) => {
    setSelectedRide(ride)

    // Centralizar no ponto médio entre pickup e dropoff
    const centerLat = (ride.pickup.latitude + ride.dropoff.latitude) / 2
    const centerLng = (ride.pickup.longitude + ride.dropoff.longitude) / 2

    setMapCenter({
      latitude: centerLat,
      longitude: centerLng
    })

    setMapBounds({
      pickup: ride.pickup,
      dropoff: ride.dropoff
    })
  }

  // Componente para interações do mapa
  const MapEvents = () => {
    useMapEvents({
      zoomend: () => {},
      moveend: () => {}
    })
    return null
  }

  const handleResetView = () => {
    setSelectedRide(null)
    setMapCenter(null)
    setMapBounds(null)
  }

  // Handle Select
  const handleRideStatusChange = (valueSelected: string) => {
    if (valueSelected === '') {
      setFilters(prev => ({ ...prev, status: undefined }))
    } else {
      setFilters(prev => ({
        ...prev,
        status: valueSelected as RideInterface['status']
      }))
    }
    setCurrentPage(0)
  }

  // Change rows per page
  const handleSelectChange = (value: number) => {
    const rowsPerPage = value === -1 ? 8 : value
    setDocsPerPage(rowsPerPage)
    setCurrentPage(0)
  }

  // Popup text baseado no status real-time
  const getDriverPopupText = () => {
    switch (liveStatus) {
      case 'driver_on_the_way':
        return `A caminho de: ${liveRide?.pickup?.name || '---'}`
      case 'arrived_pickup':
        return `Chegou ao local de recolha`
      case 'picked_up':
        return `Em viagem para: ${liveRide?.dropoff?.name || '---'}`
      case 'arrived_dropoff':
        return `Chegou ao destino`
      default:
        return 'Motorista'
    }
  }

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] w-full relative overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Sidebar Lista de Corridas */}
      <RideListSidebar
        rides={rides || []}
        selectedRideId={selectedRide?.id}
        isLoading={isLoadingRides}
        onSelectRide={handleSelectRide}
        termForSearch={termForSearch}
        setTermForSearch={setTermForSearch}
        docsPerPage={docsPerPage}
        setDocsPerPage={handleSelectChange}
        onFilterStatusChange={handleRideStatusChange}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalCount={pagination?.count || 0}
      />

      {/* Mapa */}
      <div className="flex-1 relative h-full">
        <MapContainer
          center={
            mapCenter
              ? [mapCenter.latitude, mapCenter.longitude]
              : [-8.838333, 13.234444]
          }
          zoom={13}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
          scrollWheelZoom={true}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          {/* Controlador da centralização */}
          <MapController
            center={mapCenter || undefined}
            bounds={mapBounds || undefined}
            zoom={mapCenter ? 14 : 13}
          />

          {/* Eventos do mapa */}
          <MapEvents />

          {/* Frota de Motoristas Online (quando nenhuma corrida está selecionada) */}
          {!selectedRide &&
            onlineDrivers.map(
              driver =>
                driver.current_location && (
                  <Marker
                    key={driver.id}
                    position={[
                      driver.current_location.latitude,
                      driver.current_location.longitude
                    ]}
                    icon={customCarIcon}
                  >
                    <Popup>
                      <div className="flex flex-col">
                        <p className="font-bold text-sm">{driver.name}</p>
                        <p className="text-xs text-gray-500">{driver.phone}</p>
                        <p className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full w-fit">
                          Disponível
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                )
            )}

          {selectedRide && (
            <>
              {/* Pickup Marker */}
              <Marker
                position={[
                  selectedRide.pickup.latitude,
                  selectedRide.pickup.longitude
                ]}
                icon={customPickupIcon}
              >
                <Popup>Local de recolha: {selectedRide.pickup.name}</Popup>
              </Marker>

              {/* Dropoff Marker */}
              <Marker
                position={[
                  selectedRide.dropoff.latitude,
                  selectedRide.dropoff.longitude
                ]}
                icon={customDropoffIcon}
              >
                <Popup>Local de entrega: {selectedRide.dropoff.name}</Popup>
              </Marker>

              {/* Dynamic Polylines from hook */}
              {polylines.map(p => (
                <Polyline
                  key={p.id}
                  positions={p.coords.map(c => [c.latitude, c.longitude])}
                  color={p.color}
                  weight={p.weight}
                  dashArray={p.dashArray}
                  opacity={p.opacity ?? 1}
                />
              ))}

              {/* Driver Marker (Tempo Real) */}
              {driverPosition && (
                <Marker
                  position={[
                    driverPosition.latitude,
                    driverPosition.longitude
                  ]}
                  icon={customCarIcon}
                >
                  <Popup>
                    <div className="flex flex-col gap-1">
                      <p className="font-bold text-sm">
                        Motorista: {liveRide?.driver?.name || '---'}
                      </p>
                      <p className="text-xs text-blue-600 font-medium">
                        {getDriverPopupText()}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </>
          )}
        </MapContainer>

        {/* Overlay de Detalhes */}
        {selectedRide && (
          <RideDetailsPanel
            ride={liveRide ?? selectedRide}
            onClose={handleResetView}
            onFocusMap={() => handleSelectRide(selectedRide)}
          />
        )}

        {/* Empty State Overlay */}
        {!selectedRide && onlineDrivers.length === 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[400] bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 text-center max-w-sm">
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Package size={32} className="text-blue-500" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              Nenhuma corrida selecionada
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Selecione uma corrida na lista lateral para ver os detalhes e
              monitorar em tempo real.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

