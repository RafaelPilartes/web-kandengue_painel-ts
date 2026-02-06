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
import { Package } from 'lucide-react'
import { RideListSidebar } from './components/RideListSidebar'
import { RideDetailsPanel } from './components/RideDetailsPanel'
import { useRidesViewModel } from '@/viewModels/RideViewModel'
import { useRideTrackingsViewModel } from '@/viewModels/RideTrackingViewModel'
import type { RideInterface } from '@/interfaces/IRide'
import useDirections from '@/hook/useDirections'
import { snapToRoads } from '@/utils/snapToRoads'

import {
  customCarIcon,
  customDropoffIcon,
  customPickupIcon
} from '@/data/customPickupIcon'

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
    <div className="flex h-[calc(100vh-theme(spacing.16))] w-full relative overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Sidebar Lista de Corridas */}
      <RideListSidebar
        rides={filteredRides}
        selectedRideId={selectedRide?.id}
        isLoading={isLoadingRides}
        onSelectRide={handleSelectRide}
        termForSearch={termForSearch}
        setTermForSearch={setTermForSearch}
        docsPerPage={docsPerPage}
        setDocsPerPage={handleSelectChange}
        onFilterStatusChange={handleRideStatusChange}
      />

      {/* Mapa */}
      <div className="flex-1 relative h-full">
        <MapContainer
          center={
            mapCenter
              ? [mapCenter.latitude, mapCenter.longitude]
              : [-8.838333, 13.234444]
          } // Luanda Default
          zoom={13}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
          scrollWheelZoom={true}
          zoomControl={false} // Custom control pos
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

          {selectedRide && (
            <>
              {/* Pickup */}
              <Marker
                position={[
                  selectedRide.pickup.latitude,
                  selectedRide.pickup.longitude
                ]}
                icon={customPickupIcon}
              >
                <Popup>Local de recolha: {selectedRide.pickup.name}</Popup>
              </Marker>

              {/* Dropoff */}
              <Marker
                position={[
                  selectedRide.dropoff.latitude,
                  selectedRide.dropoff.longitude
                ]}
                icon={customDropoffIcon}
              >
                <Popup>Local de entrega: {selectedRide.dropoff.name}</Popup>
              </Marker>

              <Polyline
                positions={coordsTracking.map(p => [p.latitude, p.longitude])}
                color="gray"
                dashArray="5, 10"
                opacity={0.5}
              />

              {Array.isArray(routeCoords) && routeCoords.length > 2 && (
                <Polyline
                  positions={routeCoords.map(coord => [
                    coord.latitude,
                    coord.longitude
                  ])}
                  color="#3b82f6" // Blue-500
                  weight={5}
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
            </>
          )}
        </MapContainer>

        {/* Overlay de Detalhes */}
        {selectedRide && (
          <RideDetailsPanel
            ride={selectedRide}
            onClose={handleResetView}
            onFocusMap={() => handleSelectRide(selectedRide)}
          />
        )}

        {/* Empty State Overlay */}
        {!selectedRide && (
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
