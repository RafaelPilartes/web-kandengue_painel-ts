/*
 * As classes vivem agora em `@rafaelpilartes/kandengue-shared/entities`.
 *
 * Fica aqui o que nao e partilhavel: o converter, que depende do SDK do
 * Firestore deste repositorio.
 */
import type { FirestoreDataConverter, Timestamp } from 'firebase/firestore'
import type { DocumentInterface } from '@/interfaces/IDocument'
import type { UserInterface } from '@/interfaces/IUser'
import type { DocumentType } from '@/types/document'
import type { DocumentStatus } from '@/types/enum'
import { toDate } from '@/helpers/firestore'
import { DocumentEntity } from '@rafaelpilartes/kandengue-shared/entities'

export { DocumentEntity }

/**
 * Forma CRUA do documento em `documents`, tal como o Firestore o devolve.
 * Difere de `DocumentInterface` nas datas: aqui são `Timestamp`.
 * Só o converter deve tocar neste tipo.
 */
export interface DocumentDoc {
  id?: string
  user?: UserInterface
  type?: DocumentType
  url?: string
  status?: DocumentStatus
  feedback?: string
  vehicle_id?: string
  /**
   * Quando o documento deixa de valer. Opcional: só os que caducam o têm.
   *
   * ⚠️ **Chega como `Timestamp`, e tem de sair como `Date`.** É o campo que a
   * API escreve ao aprovar (3.7) e o que distingue um aprovado de um aprovado
   * **caducado** — e um caducado parece aprovado em qualquer listagem.
   */
  expires_at?: Timestamp | null
  created_at?: Timestamp | null
  updated_at?: Timestamp | null
}

/** Fronteira única entre o documento Firestore e a aplicação. */
export const documentConverter: FirestoreDataConverter<DocumentEntity> = {
  toFirestore(document) {
    return { ...document }
  },
  fromFirestore(snapshot, options) {
    const d = snapshot.data(options) as DocumentDoc
    const validade = toDate(d.expires_at) ?? undefined
    const entity = new DocumentEntity({
      ...d,
      id: snapshot.id,
      expires_at: validade,
      created_at: toDate(d.created_at) ?? undefined,
      updated_at: toDate(d.updated_at) ?? undefined
    } as DocumentInterface)

    /*
     * ⚠️ **A validade atribui-se outra vez, à mão, e sem isto ela não chega
     * ao ecrã.** Achado pela revisão independente da Fase 4.
     *
     * A `DocumentEntity` da lib **2.11.0** — a que o painel fixa — não declara
     * `expires_at`, e uma classe só copia o que declara: o campo entrava no
     * construtor e desaparecia. Resultado: a coluna de validade dizia "sem
     * validade" para **todos** os documentos, mesmo os aprovados com data, e a
     * acção "Renovar validade" nunca aparecia.
     *
     * Com a 3.0.0 instalada o construtor já o guarda, e esta linha passa a ser
     * uma reatribuição do mesmo valor **já convertido** — que é a outra metade
     * do defeito: sem a conversão, o que a classe nova guardava era o
     * `Timestamp` cru, e o `estaCaducado` chamava `.getTime()` num objecto que
     * não o tem. Rebentava o render da tabela.
     *
     * Fica depois da subida da lib (não é muleta): é ela que garante que o
     * campo é um `Date`, venha de que versão vier.
     */
    ;(entity as DocumentInterface & { expires_at?: Date }).expires_at = validade

    return entity
  }
}
