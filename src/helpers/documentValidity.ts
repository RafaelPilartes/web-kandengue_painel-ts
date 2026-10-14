import { ANGOLA_UTC_OFFSET_MINUTES } from '@rafaelpilartes/kandengue-shared/constants'
import type { DocumentInterface } from '@/interfaces/IDocument'

/**
 * Um documento com a validade que a lib 2.12.0 acrescentou.
 *
 * Declarado aqui como intersecção em vez de se esperar pela subida da lib: a
 * forma é **a mesma** (`expires_at?: Date` em `DocumentInterface` e em
 * `DocumentEntity`), por isso isto compila contra a 2.11.0 que o painel tem
 * hoje e continua a compilar depois de ele subir. Sem isto, metade desta
 * sub-fase ficava à espera de uma instalação.
 */
export type DocumentoComValidade = DocumentInterface & { expires_at?: Date }

/**
 * A validade de um documento, gravada como **o fim do dia escolhido, na hora
 * de Luanda**.
 *
 * ── Porque não a meia-noite ──
 * Um `<input type='date'>` devolve `'2027-03-31'`, e quem o converte com
 * `new Date(valor)` fica com a **meia-noite UTC**. A lib compara instantes
 * (`isDocumentValidFor`: `expires_at > now`), logo uma apólice "válida até
 * 31/03" gravada assim caduca às 00:00:01 do dia 31 — e o motorista perde o
 * dia que ela ainda cobre. Decidido a 2026-10-14: quem grava converte; a lib
 * não muda.
 *
 * Angola é UTC+1 todo o ano (não há horário de verão), e o offset vem da lib
 * — não se escreve `+1` à mão num ficheiro de ecrã.
 *
 * Recebe a **string** do campo de data de propósito: `'YYYY-MM-DD'` não tem
 * fuso nenhum, e é por isso que não há aqui ambiguidade para resolver. Um
 * `Date` à entrada obrigava a decidir se o dia era o local ou o UTC.
 */
export function fimDoDiaEmLuanda(data: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data.trim())
  if (!m) return null

  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const fimLocal = Date.UTC(ano, mes - 1, dia, 23, 59, 59, 999)
  const instante = new Date(fimLocal - ANGOLA_UTC_OFFSET_MINUTES * 60_000)

  // `Date.UTC` aceita 2026-02-31 e desloca para Março: uma data que o
  // calendário não tem não é uma validade.
  const voltou = new Date(fimLocal)
  if (voltou.getUTCMonth() !== mes - 1 || voltou.getUTCDate() !== dia)
    return null

  return instante
}

/** O dia (em Luanda) que uma validade gravada representa — para a mostrar. */
export function diaEmLuanda(expiresAt: Date): string {
  const local = new Date(
    expiresAt.getTime() + ANGOLA_UTC_OFFSET_MINUTES * 60_000
  )
  return local.toISOString().slice(0, 10)
}

/**
 * Este documento está caducado?
 *
 * **A mesma comparação da lib** (`expires_at > now`), de propósito: um ecrã
 * que dissesse 'válido' sobre um documento que o servidor considera caducado
 * era pior do que não dizer nada — o admin aprovava um serviço e a API
 * recusava-o sem ele entender porquê.
 */
export function estaCaducado(
  doc: Pick<DocumentoComValidade, 'expires_at'>,
  agora: Date = new Date()
): boolean {
  if (!doc.expires_at) return false
  return doc.expires_at.getTime() <= agora.getTime()
}

/** O que se mostra na coluna da validade. */
export function rotuloValidade(
  doc: Pick<DocumentoComValidade, 'expires_at'>,
  agora: Date = new Date()
): { texto: string; caducado: boolean } {
  if (!doc.expires_at) return { texto: 'sem validade', caducado: false }
  const caducado = estaCaducado(doc, agora)
  return {
    texto: `${caducado ? 'caducou' : 'válido até'} ${diaEmLuanda(doc.expires_at)}`,
    caducado
  }
}
