import { useState } from 'react'
import polyline from '@mapbox/polyline' // mesmo que já usas

type GeoLocationType = {
  latitude: number
  longitude: number
}

export default function useDirections() {
  const [routeCoords, setRouteCoords] = useState<
    { latitude: number; longitude: number }[]
  >([])

  const fetchRoute = async (
    pickup: GeoLocationType,
    dropoff: GeoLocationType
  ) => {
    try {
      const directionsService = new google.maps.DirectionsService()

      directionsService.route(
        {
          origin: { lat: pickup.latitude, lng: pickup.longitude },
          destination: { lat: dropoff.latitude, lng: dropoff.longitude },
          travelMode: google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            const route = result.routes[0]
            const leg = route.legs[0]

            // Decodifica polyline
            const points = polyline.decode(route.overview_polyline as string)
            const coords = points.map((p: [number, number]) => ({
              latitude: p[0],
              longitude: p[1]
            }))

            // Distância e duração
            const distanceKmValue = leg.distance?.value
              ? leg.distance.value / 1000
              : 0
            const durationMinutesValue = leg.duration?.value
              ? Math.round(leg.duration.value / 60)
              : 0

            setRouteCoords(coords)

            console.log('Distância km:', distanceKmValue)
            console.log('Duração min:', durationMinutesValue)
          } else {
            console.error('Erro no DirectionsService:', status)
          }
        }
      )
    } catch (err) {
      console.error('Erro ao buscar rota:', err)
    }
  }

  const clearRoute = () => setRouteCoords([])

  return { routeCoords, fetchRoute, clearRoute }
}
