import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'
import { driverUseCase } from '@/domain/usecases/driverUseCase'
import type { DriverEntity } from '@/core/entities/Driver'
import { firebaseCollections } from '@/constants/firebaseCollections'

/**
 * Resolve motoristas por id, para listagens que só guardam o `user_id`.
 *
 * A fila de carregamentos mostra quem é o motorista, mas os documentos de
 * `topupRequests` só têm o id — era por isso que a fila mostrava o id da
 * carteira. Uma query por id, em cache do React Query, partilhada entre
 * ecrãs e estável ao mudar de página.
 *
 * O `in` do Firestore resolvia isto numa leitura só, mas está limitado a 30
 * valores e a listagem deixa escolher 100 registos por página — partia em
 * silêncio na página mais larga.
 */
export function useDriversByIds(ids: (string | undefined)[]) {
  // Ordenado para a chave não mudar só porque a ordem da página mudou, e
  // sem vazios nem repetidos. O `join` é o que torna a dependência estável:
  // o array chega novo a cada render.
  const key = [...new Set(ids.filter((id): id is string => !!id))]
    .sort()
    .join(',')

  const uniqueIds = useMemo(() => (key ? key.split(',') : []), [key])

  // O `combine` existe para isto: devolve um valor estável enquanto os
  // resultados não mudam, em vez de um array novo a cada render.
  return useQueries({
    queries: uniqueIds.map(id => ({
      queryKey: [firebaseCollections.drivers.root, 'by-id', id],
      queryFn: () => driverUseCase.executeGetById(id),
      // Nome e telefone não mudam durante uma sessão de revisão.
      staleTime: 1000 * 60 * 5
    })),
    combine: results => {
      const driversById = new Map<string, DriverEntity>()
      results.forEach((result, index) => {
        if (result.data) driversById.set(uniqueIds[index], result.data)
      })
      return {
        driversById,
        isLoadingDrivers: results.some(result => result.isLoading)
      }
    }
  })
}
