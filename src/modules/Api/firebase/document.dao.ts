// modules/Api/firebase/document.dao.ts
import type { IDocumentRepository } from '@/core/interfaces/IDocumentRepository'
import { DocumentEntity, documentConverter } from '@/core/entities/Document'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { BaseFirebaseDAO } from './BaseFirebaseDAO'

export class FirebaseDocumentDAO
  extends BaseFirebaseDAO<DocumentEntity>
  implements IDocumentRepository
{
  constructor() {
    // `type` é o único campo de texto de topo — o antigo pesquisava por
    // `email`, que a entidade não tem, e devolvia sempre vazio.
    super(firebaseCollections.documents.root, documentConverter, 'doc', 'type')
  }
}
