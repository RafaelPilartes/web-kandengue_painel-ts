// viewModels/DocumentViewModel.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DocumentService } from '@/routes/services/document.service'
import { DocumentEntity } from '@/core/entities/Document'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { withAudit } from '@/routes/services/audit.service'

const documentService = new DocumentService()

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
    queryFn: () => documentService.getAll(limit, offset, searchTerm, filters),
    staleTime: 1000 * 60 // cache 1min
  })

  /** Buscar lista de documentos por field */
  const fetchAllDocumentsByField = async (
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ) => {
    try {
      return await documentService.getAllByField(field, value, limit, offset)
    } catch (err) {
      console.error('Erro ao buscar documentos por campo:', err)
      return null
    }
  }

  /** Criar documento */
  const createDocument = useMutation({
    mutationFn: (document: Omit<DocumentEntity, 'id'>) =>
      withAudit(() => documentService.create(document), {
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

  /** Atualizar documento */
  const updateDocument = useMutation({
    mutationFn: async ({
      id,
      document
    }: {
      id: string
      document: Partial<DocumentEntity>
    }) => {
      const previous_data = await documentService.getById(id).catch(() => null)
      return withAudit(() => documentService.update(id, document), {
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
      const previous_data = await documentService.getById(id).catch(() => null)
      return withAudit(() => documentService.delete(id), {
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
      return await documentService.getById(id)
    } catch (err) {
      console.error('Erro ao buscar documento:', err)
      return null
    }
  }

  /** Buscar document por field */
  const fetchOneDocumentsByField = async (
    field: keyof DocumentEntity,
    value: string
  ) => {
    try {
      return await documentService.getOneByField(field, value)
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
    updateDocument,
    deleteDocument
  }
}
