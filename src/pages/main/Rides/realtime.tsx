// pages/rides/RidesPage.tsx
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet'
import L from 'leaflet'
import polyline from '@mapbox/polyline'
import { Mail, Phone, Package, User } from 'lucide-react'
import { useRidesViewModel } from '@/viewModels/RideViewModel'
import type { RideStatusType } from '@/types/enum'
import { useRideTrackingsViewModel } from '@/viewModels/RideTrackingViewModel'
import type { RideInterface } from '@/interfaces/IRide'
import type { RideTrackingsInterface } from '@/interfaces/IRideTracking'
import { getRideStatusLabel } from '@/utils/gettersLabels'
import { CopyField } from '@/components/CopyField'
import { formatDateTimeFromFirestore } from '@/utils/date'
import SeedFirebaseButton from '@/components/buttons/seedFirebase'
import { InputWithButton } from '@/components/input/InputWithButton'
import { IoSearchSharp } from 'react-icons/io5'
import { SelectSearchableCustom } from '@/components/selects/SelectSearchableCustom'
import { rideStatusOptions, rowPerPageOptions } from '@/data/selectOption'
import axios from 'axios'
import type { GeoLocationType } from '@/types/geoLocation'
import type { LatLngType } from '@/types/latLng'
import useDirections from '@/hook/useDirections'
import { snapToRoads } from '@/utils/snapToRoads'
import { Spinner } from 'phosphor-react'
import { colorRideStatus } from '@/utils/colorBy'
import { Pagination } from '@/components/Pagination'
import { SelectCustom } from '@/components/selects/SelectCustom'

const customCarIcon = new L.Icon({
  iconUrl: '/illustration/moto-marker.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32]
})
const customPickupIcon = new L.Icon({
  iconUrl: '/illustration/pickup-marker.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32]
})
const customDropoffIcon = new L.Icon({
  iconUrl: '/illustration/dropoff-marker.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32]
})

export function RealtimePage() {
  // Paginação
  const [currentPage, setCurrentPage] = useState(0) // página atual (0-based)
  const [docsPerPage, setDocsPerPage] = useState(8) // limite por página

  // Filtros
  const [termForSearch, setTermForSearch] = useState<string>('')

  const [filters, setFilters] = useState<Partial<RideInterface>>()

  const { rides, pagination, isLoadingRides } = useRidesViewModel(
    docsPerPage,
    currentPage * docsPerPage,
    termForSearch,
    filters
  )
  const { rideTrackings } = useRideTrackingsViewModel()
  const { routeCoords, fetchRoute } = useDirections()

  const [coords, setCoords] = useState<
    { latitude: number; longitude: number }[]
  >([])

  const [selectedRide, setSelectedRide] = useState<RideInterface | null>(null)
  const [selectedRideTracking, setSelectedRideTracking] =
    useState<RideTrackingsInterface | null>(null)

  const namePageLowercase = 'corridas'

  const handleSelectRide = async (ride: RideInterface) => {
    setSelectedRide(ride)

    fetchRoute(ride.pickup, ride.dropoff)

    const tracking = rideTrackings.find(t => t.ride_id === ride.id)
    setSelectedRideTracking(tracking || null)

    const snapped = await snapToRoads(tracking?.path || [])
    setCoords(snapped)
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

  return (
    <div className="flex h-full w-full relative">
      {/* <SeedFirebaseButton /> */}
      {/* Sidebar Lista de Corridas */}
      <div className="w-1/2 max-w-sm p-4 flex flex-col gap-3 overflow-y-auto">
        <h2 className="font-semibold text-lg mb-2">Lista de Corridas</h2>
        <div className="w-full max-w-sm">
          <InputWithButton
            onChange={e => setTermForSearch(e.target.value)}
            placeholder="Pesquisar pelo id..."
            icon={<IoSearchSharp size={20} />}
            onButtonClick={() => null} // resetar página ao buscar
          />
        </div>
        {/* Filtro por status */}
        <SelectSearchableCustom
          name="status"
          label="Status"
          options={rideStatusOptions}
          onOptionChange={e => handleRideStatusChange(e as string)}
        />

        {isLoadingRides && (
          <div className="flex flex-row items-center justify-center w-full h-full">
            <span className="text-gray-700 dark:text-gray-200 mr-4">
              Carregando corridas...
            </span>
            <Spinner size={20} className="animate-spin text-primary-200" />
          </div>
        )}

        {rides.map(ride => (
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
                      {ride.pickup.name}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-300">
                      {ride.pickup.description}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 dark:text-white">
                      {formatDateTimeFromFirestore(ride.created_at as any).date}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-300">
                      {formatDateTimeFromFirestore(ride.created_at as any).time}
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
                      {ride.dropoff.name}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-300">
                      {ride.dropoff.description}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 dark:text-white">
                      {formatDateTimeFromFirestore(ride.updated_at as any).date}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-300">
                      {formatDateTimeFromFirestore(ride.updated_at as any).time}
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
          <p className="text-xs flex flex-row gap-1 whitespace-nowrap">
            Mostrando
            <strong>{rides?.length ? currentPage * docsPerPage + 1 : 0}</strong>
            a<strong>{currentPage * docsPerPage + (rides?.length ?? 0)}</strong>
            de
            <strong>{pagination?.count ?? 0}</strong> {namePageLowercase}
          </p>
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
            <Pagination
              currentPage={currentPage}
              totalDocs={pagination?.count ?? 0}
              docsPerPage={docsPerPage}
              onPageChange={setCurrentPage}
            />
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
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {/* <Polyline positions={selectedRide.path as any} color="blue" /> */}

              {/* Pickup */}
              <Marker
                position={[
                  selectedRide.pickup.latitude,
                  selectedRide.pickup.longitude
                ]}
                icon={customPickupIcon}
              >
                <Popup>Pickup</Popup>
              </Marker>

              {/* Dropoff color green */}
              <Marker
                position={[
                  selectedRide.dropoff.latitude,
                  selectedRide.dropoff.longitude
                ]}
                icon={customDropoffIcon}
              >
                <Popup>Dropoff</Popup>
              </Marker>

              {/* Path do tracking */}
              {selectedRideTracking && (
                <>
                  <Polyline
                    positions={coords.map(p => [p.latitude, p.longitude])}
                    color="gray"
                  />
                  {routeCoords && (
                    <Polyline
                      positions={routeCoords.map(coord => [
                        coord.latitude,
                        coord.longitude
                      ])}
                      color="#0096FF"
                    />
                  )}
                  {/* Última posição = veículo atual */}
                  {coords.length > 0 && (
                    <Marker
                      position={[
                        coords[coords.length - 1].latitude,
                        coords[coords.length - 1].longitude
                      ]}
                      icon={customCarIcon}
                    >
                      <Popup>Veículo em tempo real</Popup>
                    </Marker>
                  )}
                </>
              )}
            </MapContainer>
          )}
        </div>

        {/* Painel Detalhes */}
        {selectedRide && (
          <div className="fixed z-[2] right-4 top-28 xl:right-24 xl:top-48 lg:right-8 lg:top-36 md:right-8 md:top-36 sm:right-6 sm:top-32">
            <div className="flex flex-col justify-center items-start">
              {/* Motorista */}
              <div className="w-72 bg-white dark:bg-dark p-4 flex flex-col gap-4 rounded-xl">
                <div className="flex flex-row justify-start items-center gap-2">
                  <div className="relative w-9 h-9 overflow-hidden">
                    <img
                      className="w-full h-full object-cover rounded-full"
                      src={selectedRide.driver?.photo || '/default-avatar.png'}
                      alt={selectedRide.driver?.name}
                    />
                  </div>
                  <div className="flex flex-col justify-center items-start">
                    <span className="text-dark dark:text-light font-semibold text-sm">
                      {selectedRide.driver?.name}
                    </span>
                    <div>
                      <span className="text-xs">
                        {selectedRide.driver?.entity_code}
                      </span>{' '}
                      -{' '}
                      <span className="text-xs">
                        {selectedRide.driver?.rating}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <CopyField
                    icon={<Mail size={16} />}
                    value={selectedRide.driver?.email as string}
                  />
                  <CopyField
                    icon={<Phone size={16} />}
                    value={selectedRide.driver?.phone as string}
                  />
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
