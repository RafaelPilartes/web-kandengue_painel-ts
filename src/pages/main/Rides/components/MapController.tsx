// src/components/map/MapController.tsx
import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import type { GeoLocationType } from '@/types/geoLocation'

interface MapControllerProps {
  center?: {
    latitude: number
    longitude: number
  }
  zoom?: number
  bounds?: {
    pickup: GeoLocationType
    dropoff: GeoLocationType
    padding?: [number, number]
  }
}

export function MapController({
  center,
  zoom = 13,
  bounds
}: MapControllerProps) {
  const map = useMap()

  useEffect(() => {
    if (bounds) {
      // Ajustar o mapa para mostrar todos os pontos (pickup e dropoff)
      const pickupLatLng = [
        bounds.pickup.latitude,
        bounds.pickup.longitude
      ] as [number, number]
      const dropoffLatLng = [
        bounds.dropoff.latitude,
        bounds.dropoff.longitude
      ] as [number, number]

      map.fitBounds([pickupLatLng, dropoffLatLng], {
        padding: bounds.padding || [50, 50], // padding em pixels
        maxZoom: 16
      })
    } else if (center) {
      // Centralizar em um ponto específico
      map.setView([center.latitude, center.longitude], zoom, {
        animate: true,
        duration: 1 // duração da animação em segundos
      })
    }
  }, [center, zoom, bounds, map])

  return null
}
