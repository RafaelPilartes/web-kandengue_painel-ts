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
   * As duas decisões sobre um documento, **pela API** (3.7).
   *
   * ⚠️ **Sem `withAudit`:** as rotas escrevem a sua própria linha em
   * `auditLogs`, no servidor — com o dono do documento, o tipo, a validade e
   * o motivo. O `withAudit` daqui dava uma segunda entrada para a mesma
   * decisão.
   *
   * ⚠️ **E a recusa exige motivo**, que vai para o `feedback` — o campo que o
   * **motorista** vê. O painel escrevia `{status: 'rejected'}` e nunca
   * `feedback`: o motorista recebia um "rejeitado" sem saber o que corrigir.
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
