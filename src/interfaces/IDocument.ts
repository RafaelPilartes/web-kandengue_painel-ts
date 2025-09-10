import type { DocumentType } from '@/types/document'
import type { UserInterface } from './IUser'
import type { DocumentStatus } from '@/types/enum'

export interface DocumentInterface {
  id: string
  user: UserInterface
  type: DocumentType
  url: string
  status: DocumentStatus
  uploaded_at: string
  reviewed_at?: string
  feedback?: string
  created_at: string
  updated_at?: Date
}
