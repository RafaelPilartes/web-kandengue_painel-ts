import { useMemo } from 'react'
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet'
import { partitionTrackPath } from '@rafaelpilartes/kandengue-shared/functions'
import type { LiveLocationType } from '@rafaelpilartes/kandengue-shared/types'
import type { RideEntity } from '@/core/entities/Ride'
import { useRideTrackingRealtime } from '@/viewModels/RideTrackingViewModel'
import { formatDateTimeFromFirestore } from '@/utils/date'

/**
 * O percurso da corrida, com os pontos descartados a outra cor.
 *
 * Os descartados **não estão gravados** em lado nenhum: o
 * `fare.distance` guarda só as contagens. Recalculam-se aqui com a mesma
 * função que o servidor usou ao fechar a tarifa —
 * `partitionTrackPath`, da lib, que o `evaluateTrackPath` também chama.
 * É por isso que o mapa não pode divergir da decisão que foi cobrada: há um
 * só filtro.
 *
 * A alternativa era o servidor gravar os índices descartados na corrida.
 * Ficou de fora: acrescentava um campo a documentos que já estão em produção
 * para guardar uma coisa que se recalcula a partir do que já lá está.
 */
export function FareReviewMap({ ride }: { ride: RideEntity }) {
  // O hook de um só documento, por `ride_id`, em vez da listagem: uma
  // corrida tem um percurso, e não se vai paginar nada aqui.
  const { tracking, isLoading } = useRideTrackingRealtime(ride.id)

  const { kept, discarded } = useMemo(
    () => partitionTrackPath(tracking?.path ?? []),
    [tracking?.path]
  )

  if (isLoading) {
    return (
      <div className="w-full h-64 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        A carregar o percurso…
      </div>
    )
  }

  if (!tracking || kept.length === 0) {
    return (
      <div className="w-full p-4 rounded-md bg-gray-100 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400">
        Sem percurso gravado para esta corrida — é, por si, parte do motivo
        da revisão.
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="w-full h-72 rounded-md overflow-hidden">
        <MapContainer
          center={[kept[0].latitude, kept[0].longitude]}
          zoom={13}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* O percurso que contou para a distância cobrada */}
          <Polyline
            positions={kept.map((p: LiveLocationType) => [p.latitude, p.longitude])}
            color="#0096FF"
            weight={4}
          />

          {/* Recolha e destino pedidos, para se ver o que ficou longe de quê */}
          <Marker position={[ride.pickup.latitude, ride.pickup.longitude]}>
            <Popup>Recolha pedida</Popup>
          </Marker>
          <Marker position={[ride.dropoff.latitude, ride.dropoff.longitude]}>
            <Popup>Destino pedido</Popup>
          </Marker>

          {/* Onde o motorista disse ter concluído, quando a app o gravou. É
              contra este ponto que o fim do percurso é medido. */}
          {ride.completed_location && (
            <CircleMarker
              center={[
                ride.completed_location.latitude,
                ride.completed_location.longitude
              ]}
              radius={8}
              pathOptions={{ color: '#16a34a', fillColor: '#16a34a', fillOpacity: 0.7 }}
            >
              <Popup>Posição de conclusão gravada pela app</Popup>
            </CircleMarker>
          )}

          {/* Os descartados: saltos de GPS acima de 150 km/h face ao último
              ponto aceite. Não entraram na distância cobrada. */}
          {discarded.map((point: LiveLocationType, index: number) => (
            <CircleMarker
              key={`${point.latitude},${point.longitude},${index}`}
              center={[point.latitude, point.longitude]}
              radius={6}
              pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.6 }}
            >
              <Popup>
                Ponto descartado — salto de GPS
                <br />
                {formatDateTimeFromFirestore(point.timestamp).time}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Legenda: sem ela as cores não querem dizer nada */}
      <div className="flex flex-row flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-300">
        <Legend color="#0096FF" label={`Percurso contado (${kept.length} pontos)`} />
        <Legend
          color="#dc2626"
          label={`Descartados por salto de GPS (${discarded.length})`}
        />
        {ride.completed_location && (
          <Legend color="#16a34a" label="Posição de conclusão" />
        )}
      </div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className="inline-block h-3 w-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  )
}
