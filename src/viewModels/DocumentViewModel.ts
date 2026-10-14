// viewModels/DocumentViewModel.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentUseCase } from '@/domain/usecases/documentUseCase'
import { DocumentEntity } from '@/core/entities/Document'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { withAudit } from '@/observability/audit'
import type { FieldPath } from '@/core/interfaces/IBaseRepository'

export function useDocumentsViewModel(
  limit?: number,
  offset?: number,
  searchTerm?: string,
  filters?: Partial<DocumentEntity>
) {
  const queryClient = useQueryClient()

  const filtersKey = filters ? JSON.stringify(filters) : ''

  /** Buscar lista de documentos */
  const {
    data: documentsResponse,
    isLoading: loading,
    error,
    refetch
  } = useQuery<ListResponseType<DocumentEntity[]>>({
    queryKey: [
      firebaseCollections.documents.root,
      limit,
      offset,
      searchTerm,
      filtersKey
    ],
    queryFn: () => documentUseCase.executeGetAll(limit, offset, searchTerm, filters),
    staleTime: 1000 * 60 // cache 1min
  })

  /** Buscar lista de documentos por field */
  const fetchAllDocumentsByField = async (
    field: FieldPath<DocumentEntity>,
    value: any,
    limit?: number,
    offset?: number
  ) => {
    try {
      return await documentUseCase.executeGetAllByField(field, value, limit, offset)
    } catch (err) {
      console.error('Erro ao buscar documentos por campo:', err)
      return null
    }
  }

  /** Criar documento */
  const createDocument = useMutation({
    mutationFn: (document: Omit<DocumentEntity, 'id'>) =>
      withAudit(() => documentUseCase.executeCreate(document), {
        action: 'create',
        module: 'documents',
        description: `Criou documento: ${document.type}`,
        target_type: 'document',
        target_label: document.type,
        new_data: document
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.documents.root]
      })
    }
  })

  /**
   * The two decisions on a document, **through the API** (3.7).
   *
   * ⚠️ **No `withAudit`:** the routes write their own line in `auditLogs`, on
   * the server — with the document's owner, its type, the expiry and the
   * reason. `withAudit` from here gave a second entry for the same decision.
   *
   * ⚠️ **And a rejection requires a reason**, which goes to `feedback` — the
   * field the **driver** sees. The panel used to write
   * `{status: 'rejected'}` and never `feedback`: the driver got a "rejected"
   * with no idea what to fix.
   */
  const approveDocument = useMutation({
    mutationFn: ({ id, expiresAt }: { id: string; expiresAt?: Date }) =>
      documentUseCase.executeApprove(id, expiresAt),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.documents.root]
      })
    }
  })

  const rejectDocument = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      documentUseCase.executeReject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.documents.root]
      })
    }
  })

  /** Atualizar documento */
  const updateDocument = useMutation({
    mutationFn: async ({
      id,
      document
    }: {
      id: string
      document: Partial<DocumentEntity>
    }) => {
      const previous_data = await documentUseCase.executeGetById(id).catch(() => null)
      return withAudit(() => documentUseCase.executeUpdate(id, document), {
        action: 'update',
        module: 'documents',
        description: `Atualizou documento - ID: ${id}`,
        target_id: id,
        target_type: 'document',
        previous_data: previous_data || undefined,
        new_data: document
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.documents.root]
      })
    }
  })

  /** Deletar documento */
  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      const previous_data = await documentUseCase.executeGetById(id).catch(() => null)
      return withAudit(() => documentUseCase.executeDelete(id), {
        action: 'delete',
        module: 'documents',
        description: `Excluiu documento - ID: ${id}`,
        target_id: id,
        target_type: 'document',
        previous_data: previous_data || undefined,
        severity: 'critical'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.documents.root]
      })
    }
  })

  /** Buscar documento único (on-demand) */
  const fetchDocumentById = async (id: string) => {
    try {
      return await documentUseCase.executeGetById(id)
    } catch (err) {
      console.error('Erro ao buscar documento:', err)
      return null
    }
  }

  /** Buscar document por field */
  const fetchOneDocumentsByField = async (
    field: FieldPath<DocumentEntity>,
    value: string
  ) => {
    try {
      return await documentUseCase.executeGetOneByField(field, value)
    } catch (err) {
      console.error('Erro ao buscar documento por campo:', err)
      return null
    }
  }

  // Calculate Driver Earnings
  function filterDocsBy(
    documents: DocumentEntity[],
    key: keyof DocumentEntity,
    prop: string
  ): DocumentEntity[] {
    return documents.filter(document => document?.[key] === prop)
  }

  return {
    documents: documentsResponse?.data ?? [],
    pagination: documentsResponse?.pagination,
    loading,
    error,
    refresh: refetch,

    fetchAllDocumentsByField,
    fetchOneDocumentsByField,
    fetchDocumentById,
    filterDocsBy,

    createDocument,
    approveDocument,
    rejectDocument,
    updateDocument,
    deleteDocument
  }
}
