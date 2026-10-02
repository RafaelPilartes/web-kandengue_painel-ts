import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'
import { documentUseCase } from '@/domain/usecases/documentUseCase'
import type { DocumentEntity } from '@/core/entities/Document'
import { firebaseCollections } from '@/constants/firebaseCollections'

/**
 * Os documentos de cada viatura, para a fila de validação.
 *
 * `documents.vehicle_id` é opcional: um documento do motorista (carta,
 * identificação) não tem viatura, e um da viatura (livrete, propriedade)
 * tem. A fila só mostra os que pertencem à viatura que está a ser decidida —
 * mostrar a carta de condução em cada cartão de viatura era repetir a mesma
 * imagem tantas vezes quantas viaturas o motorista tivesse.
 */
export function useDocumentsByVehicleIds(vehicleIds: (string | undefined)[]) {
  // O `join` é o que torna a dependência estável: o array chega novo a cada
  // render. Mesmo padrão do `useDriversByIds`.
  const key = [...new Set(vehicleIds.filter((id): id is string => !!id))]
    .sort()
    .join(',')

  const uniqueIds = useMemo(() => (key ? key.split(',') : []), [key])

  return useQueries({
    queries: uniqueIds.map(id => ({
      queryKey: [firebaseCollections.documents.root, 'by-vehicle', id],
      queryFn: () =>
        documentUseCase.executeGetAllByField('vehicle_id', id, 20),
      staleTime: 1000 * 60
    })),
    combine: results => {
      const documentsByVehicleId = new Map<string, DocumentEntity[]>()
      results.forEach((result, index) => {
        if (result.data?.data) {
          documentsByVehicleId.set(uniqueIds[index], result.data.data)
        }
      })
      return {
        documentsByVehicleId,
        isLoadingDocuments: results.some(result => result.isLoading)
      }
    }
  })
}
