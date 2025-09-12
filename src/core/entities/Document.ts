// core/entities/Document.ts

import type { DocumentInterface } from '@/interfaces/IDocument'
import type { UserInterface } from '@/interfaces/IUser'
import type { DocumentType } from '@/types/document'
import type { DocumentStatus } from '@/types/enum'

export class DocumentEntity implements DocumentInterface {
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

  constructor(params: DocumentInterface) {
    this.id = params.id

    this.user = params.user
    this.type = params.type
    this.url = params.url
    this.status = params.status
    this.uploaded_at = params.uploaded_at
    this.reviewed_at = params.reviewed_at
    this.feedback = params.feedback

    this.created_at = params.created_at
    this.updated_at = params.updated_at
  }
}
