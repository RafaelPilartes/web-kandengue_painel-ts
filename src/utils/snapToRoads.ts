import axios from 'axios'

export type LiveLocationType = {
  latitude: number
  longitude: number
  timestamp: Date
}

export async function snapToRoads(points: LiveLocationType[]) {
  try {
    const key = import.meta.env.VITE_GOOGLE_API_KEY

    const chunkSize = 100 // limite da API
    const snappedCoords: { latitude: number; longitude: number }[] = []

    for (let i = 0; i < points.length; i += chunkSize) {
      const chunk = points.slice(i, i + chunkSize)
      const path = chunk.map(p => `${p.latitude},${p.longitude}`).join('|')

      const url = `https://roads.googleapis.com/v1/snapToRoads?path=${path}&interpolate=false&key=${key}`

      const res = await axios.get(url)

      if (res.data.snappedPoints) {
        snappedCoords.push(
          ...res.data.snappedPoints.map((p: any) => ({
            latitude: p.location.latitude,
            longitude: p.location.longitude
          }))
        )
      }
    }

    return snappedCoords
  } catch (err) {
    console.error('Erro ao snapToRoads:', err)
    return []
  }
}
