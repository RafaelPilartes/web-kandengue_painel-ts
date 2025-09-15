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
  offset: any | null
  count: number
  total?: number | undefined // total de registros na base
} | null

export interface ListResponseType<T> {
  data: T
  message?: string
  pagination?: paginationType
}
