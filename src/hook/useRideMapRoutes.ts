import { useState, useEffect, useRef } from 'react'
import type { RideInterface } from '@/interfaces/IRide'
import type { RideStatusType } from '@/types/enum'
import { RideService } from '@/services/ride.service'
import { useRideTrackingRealtime } from '@/viewModels/RideTrackingViewModel'
import useDirections from '@/hook/useDirections'
import { snapToRoads } from '@/utils/snapToRoads'

export type PolylineConfig = {
  id: string
  coords: { latitude: number; longitude: number }[]
  color: string
  weight: number
  dashArray?: string
  opacity?: number
}

type RideMapRoutesReturn = {
  polylines: PolylineConfig[]
  driverPosition: { latitude: number; longitude: number } | null
  liveStatus: RideStatusType
  liveRide: RideInterface | null
}

const MOVEMENT_STATUSES: RideStatusType[] = ['driver_on_the_way', 'picked_up']

const ROUTE_STYLES: Partial<
  Record<RideStatusType, { color: string; weight: number }>
> = {
  idle: { color: '#86efac', weight: 5 }, // green-300 — preview
  driver_on_the_way: { color: '#3b82f6', weight: 5 }, // blue-500 — to pickup
  picked_up: { color: '#22c55e', weight: 5 } // green-500 — to dropoff
}

const rideService = new RideService()

export function useRideMapRoutes(
  selectedRide: RideInterface | null
): RideMapRoutesReturn {
  const [liveRide, setLiveRide] = useState<RideInterface | null>(null)
  const { tracking } = useRideTrackingRealtime(selectedRide?.id)
  const { routeCoords, fetchRoute, clearRoute } = useDirections()
  const [trackingCoords, setTrackingCoords] = useState<
    { latitude: number; longitude: number }[]
  >([])

  const hasFetchedForStatusRef = useRef<string | null>(null)

  const liveStatus: RideStatusType =
    liveRide?.status ?? selectedRide?.status ?? 'idle'

  // ─── Listen to ride status in realtime ──────────────────────────
  useEffect(() => {
    if (!selectedRide?.id) {
      setLiveRide(null)
      return
    }

    const unsub = rideService.listenRideRealtime(
      selectedRide.id,
      updatedRide => setLiveRide(updatedRide as RideInterface),
      err => console.error('Ride realtime listener error:', err)
    )

    return () => unsub()
  }, [selectedRide?.id])

  // ─── Snap tracking path to roads ──────────────────────────────
  useEffect(() => {
    if (tracking?.path && tracking.path.length > 0) {
      snapToRoads(tracking.path).then(setTrackingCoords)
    } else if (!selectedRide) {
      setTrackingCoords([])
    }
  }, [tracking, selectedRide])

  // ─── Driver current position ──────────────────────────────────
  const driverPosition =
    trackingCoords.length > 0 ? trackingCoords[trackingCoords.length - 1] : null

  // ─── Reset when ride changes ──────────────────────────────────
  useEffect(() => {
    hasFetchedForStatusRef.current = null
    clearRoute()
    setTrackingCoords([])
  }, [selectedRide?.id])

  // ─── Fetch route ONCE per status transition ───────────────────
  useEffect(() => {
    if (!selectedRide) return
    if (hasFetchedForStatusRef.current === liveStatus) return

    switch (liveStatus) {
      case 'idle':
        fetchRoute(selectedRide.pickup, selectedRide.dropoff)
        hasFetchedForStatusRef.current = liveStatus
        break

      case 'driver_on_the_way':
        if (driverPosition) {
          fetchRoute(driverPosition, selectedRide.pickup)
          hasFetchedForStatusRef.current = liveStatus
        }
        break

      case 'picked_up':
        if (driverPosition) {
          fetchRoute(driverPosition, selectedRide.dropoff)
          hasFetchedForStatusRef.current = liveStatus
        }
        break

      default:
        // Stationary states — clear any leftover route
        clearRoute()
        hasFetchedForStatusRef.current = liveStatus
        break
    }
  }, [liveStatus, driverPosition, selectedRide])

  // ─── Build polylines array ────────────────────────────────────
  const polylines: PolylineConfig[] = []

  // 1) Tracking path (gray dashed) — only during movement
  if (MOVEMENT_STATUSES.includes(liveStatus) && trackingCoords.length > 1) {
    polylines.push({
      id: 'tracking-path',
      coords: trackingCoords,
      color: '#9ca3af', // gray-400
      weight: 3,
      dashArray: '5, 10',
      opacity: 0.5
    })
  }

  // 2) Future route — only for statuses with a route style
  const style = ROUTE_STYLES[liveStatus]
  if (style && routeCoords.length > 2) {
    polylines.push({
      id: 'future-route',
      coords: routeCoords,
      color: style.color,
      weight: style.weight
    })
  }

  return {
    polylines,
    driverPosition,
    liveStatus,
    liveRide: liveRide ?? selectedRide
  }
}
