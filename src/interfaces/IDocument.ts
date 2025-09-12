import type { DocumentType } from '@/types/document'
import type { UserInterface } from './IUser'
import type { DocumentStatus } from '@/types/enum'

export interface DocumentInterface {
  id: string
  user: UserInterface
  type: DocumentType
  url: string
  status: DocumentStatus
  uploaded_at: Date
  reviewed_at?: Date
  feedback?: string
  created_at: Date
  updated_at?: Date
}
