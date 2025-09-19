// viewModels/DocumentViewModel.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DocumentService } from '@/services/document.service'
import { DocumentEntity } from '@/core/entities/Document'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { firebaseCollections } from '@/constants/firebaseCollections'

const documentService = new DocumentService()

export function useDocumentsViewModel(
  limit?: number,
  offset?: number,
  searchTerm?: string,
  filters?: Partial<DocumentEntity>
) {
  const queryClient = useQueryClient()

  const filtersKey = filters ? JSON.stringify(filters) : ''

  /** 🔹 Buscar lista de documentos */
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

  /** 🔹 Buscar lista de documentos por field */
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

  /** 🔹 Criar documento */
  const createDocument = useMutation({
    mutationFn: (document: Omit<DocumentEntity, 'id'>) =>
      documentService.create(document),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.documents.root]
      })
    }
  })

  /** 🔹 Atualizar documento */
  const updateDocument = useMutation({
    mutationFn: ({
      id,
      document
    }: {
      id: string
      document: Partial<DocumentEntity>
    }) => documentService.update(id, document),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.documents.root]
      })
    }
  })

  /** 🔹 Deletar documento */
  const deleteDocument = useMutation({
    mutationFn: (id: string) => documentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.documents.root]
      })
    }
  })

  /** 🔹 Buscar documento único (on-demand) */
  const fetchDocumentById = async (id: string) => {
    try {
      return await documentService.getById(id)
    } catch (err) {
      console.error('Erro ao buscar documento:', err)
      return null
    }
  }

  /** 🔹 Buscar document por field */
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
