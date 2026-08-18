export interface ApiResponse<T> {
  error: boolean
  msg: string
  data?: T
  chats?: T
  id?: number
  url?: T
  count?: number
  pagination?: {
    limit: number | null
    offset: number
    count: number
  }
}

export type paginationType = {
  limit: number | null
  offset?: any | null
  /** Nº de itens NESTA página — não o total da colecção. Para o total, pedir
   *  `withTotal: true` e ler `total`. */
  count: number
  total?: number | undefined
  /** ID do último documento devolvido — passar em `after` para a página seguinte. */
  cursor?: string | null
  /** `true` se existe pelo menos mais um documento para lá desta página. */
  hasMore?: boolean
} | null

export interface ListResponseType<T> {
  data: T
  message?: string
  pagination?: paginationType
}
