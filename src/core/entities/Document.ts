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
  feedback?: string
  vehicle_id?: string

  created_at?: Date
  updated_at?: Date

  constructor(params: DocumentInterface) {
    this.id = params.id

    this.user = params.user
    this.type = params.type
    this.url = params.url
    this.status = params.status
    this.feedback = params.feedback
    this.vehicle_id = params.vehicle_id

    this.created_at = params.created_at
    this.updated_at = params.updated_at
  }
}
