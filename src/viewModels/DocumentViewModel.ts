import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DocumentService } from '@/services/document.service'
import { DocumentEntity } from '@/core/entities/Document'
import type { ListResponseType } from '@/interfaces/IApiResponse'

const documentService = new DocumentService()

export function useDocumentsViewModel(limit?: number, offset?: number) {
  const queryClient = useQueryClient()

  /** 🔹 Buscar lista de documents */
  const {
    data: documentsResponse,
    isLoading: loading,
    error,
    refetch
  } = useQuery<ListResponseType<DocumentEntity[]>>({
    queryKey: ['documents', limit, offset],
    queryFn: () => documentService.getAll(limit, offset),
    staleTime: 1000 * 60 // cache 1min
  })

  /** 🔹 Buscar lista de documents por field */
  const fetchAllDocumentSByField = async (
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ) => {
    try {
      const response = await documentService.getAllByField(
        field,
        value,
        limit,
        offset
      )

      return response
    } catch (err) {
      console.error('Erro ao buscar documents por campo:', err)
      return null
    }
  }

  /** 🔹 Criar document */
  const createDocument = useMutation({
    mutationFn: (document: Omit<DocumentEntity, 'id'>) =>
      documentService.create(document),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    }
  })

  /** 🔹 Atualizar document */
  const updateDocument = useMutation({
    mutationFn: ({
      id,
      document
    }: {
      id: string
      document: Partial<DocumentEntity>
    }) => documentService.update(id, document),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    }
  })

  /** 🔹 Deletar document */
  const deleteDocument = useMutation({
    mutationFn: (id: string) => documentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    }
  })

  /** 🔹 Buscar document único (on-demand) */
  const fetchDocumentById = async (id: string) => {
    try {
      return await documentService.getById(id)
    } catch (err) {
      console.error('Erro ao buscar document:', err)
      return null
    }
  }

  return {
    documents: documentsResponse?.data ?? [],
    pagination: documentsResponse?.pagination,
    loading,
    error,
    refresh: refetch,

    fetchAllDocumentSByField,

    createDocument,
    updateDocument,
    deleteDocument,
    fetchDocumentById
  }
}
